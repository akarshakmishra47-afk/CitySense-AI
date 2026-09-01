const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { analyzeComplaint, generateRootCause } = require('../services/ai');
const { calculateCombinedSimilarity } = require('../services/clustering');
const { calculatePriority } = require('../services/priority-engine');

const JWT_SECRET = process.env.JWT_SECRET || 'civicpulse_secret_key_123!';

// Setup Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Middleware to parse auth token
const authMiddleware = (req, res, next) => {
  const token = req.cookies.civicpulse_token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// GET /api/complaints
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const whereClause = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { clusters: { include: { cluster: true } } }
    });
    res.json(complaints);
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: { clusters: { include: { cluster: true } } }
    });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    
    if (req.user.role !== 'admin' && complaint.userId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden. Not your report." });
    }
    
    res.json(complaint);
  } catch (error) {
    next(error);
  }
});

// POST /api/complaints
router.post('/', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    const { description, duration, latitude, longitude, address, affectedPeople } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const durationDays = parseInt(duration, 10) || 1;
    const lat = parseFloat(latitude) || 0;
    const lng = parseFloat(longitude) || 0;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // 1. Analyze with AI
    const analysis = await analyzeComplaint(description, durationDays);

    // 2. Store Complaint
    const complaint = await prisma.complaint.create({
      data: {
        userId: req.user.id,
        description,
        category: analysis.category,
        subcategory: analysis.subcategory,
        severity: analysis.severity,
        urgency: analysis.urgency,
        durationDays,
        latitude: lat,
        longitude: lng,
        address,
        imageUrl,
        aiSummary: analysis.summary
      }
    });

    // 3. Find Matching Cluster
    // Get all clusters created recently within 2km (simplification for MVP: get all and filter in memory)
    const existingClusters = await prisma.complaintCluster.findMany({
      include: { _count: { select: { complaints: true } } }
    });

    let bestCluster = null;
    let highestSimilarity = 0.4; // Threshold

    for (const cluster of existingClusters) {
      const { combinedScore } = calculateCombinedSimilarity(complaint, cluster);
      if (combinedScore > highestSimilarity) {
        highestSimilarity = combinedScore;
        bestCluster = cluster;
      }
    }

    let finalCluster;

    if (bestCluster) {
      // 4a. Attach to existing cluster
      await prisma.clusterComplaint.create({
        data: {
          clusterId: bestCluster.id,
          complaintId: complaint.id
        }
      });
      finalCluster = bestCluster;
    } else {
      // 4b. Create new cluster
      finalCluster = await prisma.complaintCluster.create({
        data: {
          title: `${analysis.category} — ${address || 'Unknown Location'}`,
          category: analysis.category,
          latitude: lat,
          longitude: lng,
          priorityScore: calculatePriority(analysis.severity, 10, 10, durationDays).score
        }
      });
      await prisma.clusterComplaint.create({
        data: {
          clusterId: finalCluster.id,
          complaintId: complaint.id
        }
      });
    }

    // 5. Recalculate Priority & Root Cause for the cluster
    const clusterComplaints = await prisma.clusterComplaint.findMany({
      where: { clusterId: finalCluster.id },
      include: { complaint: true }
    });

    const count = clusterComplaints.length;
    const totalSeverity = clusterComplaints.reduce((acc, cc) => acc + (cc.complaint.severity || 50), 0);
    const avgSeverity = totalSeverity / count;
    
    // Simple heuristics for priority components
    const impact = Math.min(100, count * 15 + (parseInt(affectedPeople) || 0) / 10);
    const frequency = Math.min(100, count * 20);
    const maxDuration = Math.max(...clusterComplaints.map(cc => cc.complaint.durationDays || 1));
    const durationScore = Math.min(100, maxDuration * 5);

    const priority = calculatePriority(avgSeverity, impact, frequency, durationScore);
    
    // Check root cause
    let rootCauseData = {};
    if (count >= 3) {
      const descriptions = clusterComplaints.map(c => c.complaint.description);
      const aiInsights = await generateRootCause(finalCluster.category, descriptions);
      
      rootCauseData = {
        probableRootCause: aiInsights.probableRootCause,
        rootCauseConfidence: aiInsights.confidence,
        evidence: JSON.stringify(aiInsights.evidence),
        recommendedAction: aiInsights.recommendedAction
      };
    }

    await prisma.complaintCluster.update({
      where: { id: finalCluster.id },
      data: {
        priorityScore: priority.score,
        severityScore: priority.breakdown.severity,
        impactScore: priority.breakdown.impact,
        frequencyScore: priority.breakdown.frequency,
        durationScore: priority.breakdown.duration,
        estimatedAffectedPeople: Math.min(count * 30 + (parseInt(affectedPeople) || 0), 10000),
        ...rootCauseData
      }
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
      analysis,
      clusterId: finalCluster.id
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
