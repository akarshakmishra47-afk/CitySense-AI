const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
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
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads/');
    cb(null, uploadDir);
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
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('clusters'); // Replace Prisma include
    res.json(complaints);
  } catch (error) {
    next(error);
  }
});

// GET /api/complaints/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('clusters');
      
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    
    // Convert ObjectIds to strings for comparison
    if (req.user.role !== 'admin' && complaint.user?.toString() !== req.user.id) {
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
    const complaint = await Complaint.create({
      user: req.user.id,
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
    });

    // 3. Find Matching Cluster
    const existingClusters = await ComplaintCluster.find().populate('complaints');

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
      finalCluster = bestCluster;
      finalCluster.complaints.push(complaint._id);
      await finalCluster.save();
      
      complaint.clusters.push(finalCluster._id);
      await complaint.save();
    } else {
      // 4b. Create new cluster
      finalCluster = await ComplaintCluster.create({
        title: `${analysis.category} — ${address || 'Unknown Location'}`,
        category: analysis.category,
        latitude: lat,
        longitude: lng,
        priorityScore: calculatePriority(analysis.severity, 10, 10, durationDays).score,
        complaints: [complaint._id]
      });
      
      complaint.clusters.push(finalCluster._id);
      await complaint.save();
    }

    // 5. Recalculate Priority & Root Cause for the cluster
    const updatedCluster = await ComplaintCluster.findById(finalCluster._id).populate('complaints');
    
    const count = updatedCluster.complaints.length;
    const totalSeverity = updatedCluster.complaints.reduce((acc, c) => acc + (c.severity || 50), 0);
    const avgSeverity = totalSeverity / count;
    
    // Simple heuristics for priority components
    const impact = Math.min(100, count * 15 + (parseInt(affectedPeople) || 0) / 10);
    const frequency = Math.min(100, count * 20);
    const maxDuration = Math.max(...updatedCluster.complaints.map(c => c.durationDays || 1));
    const durationScore = Math.min(100, maxDuration * 5);

    const priority = calculatePriority(avgSeverity, impact, frequency, durationScore);
    
    // Check root cause
    let rootCauseData = {};
    if (count >= 3) {
      const descriptions = updatedCluster.complaints.map(c => c.description);
      const aiInsights = await generateRootCause(updatedCluster.category, descriptions);
      
      rootCauseData = {
        probableRootCause: aiInsights.probableRootCause,
        rootCauseConfidence: aiInsights.confidence,
        evidence: JSON.stringify(aiInsights.evidence),
        recommendedAction: aiInsights.recommendedAction
      };
    }

    await ComplaintCluster.findByIdAndUpdate(finalCluster._id, {
      priorityScore: priority.score,
      severityScore: priority.breakdown.severity,
      impactScore: priority.breakdown.impact,
      frequencyScore: priority.breakdown.frequency,
      durationScore: priority.breakdown.duration,
      estimatedAffectedPeople: Math.min(count * 30 + (parseInt(affectedPeople) || 0), 10000),
      ...rootCauseData
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
      analysis,
      clusterId: finalCluster._id
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
