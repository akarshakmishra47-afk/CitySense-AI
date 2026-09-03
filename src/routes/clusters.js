const express = require('express');
const router = express.Router();
const ComplaintCluster = require('../models/ComplaintCluster');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const { verifyResolutionPhoto } = require('../services/ai');

// Setup Multer to use memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// GET /api/clusters
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'admin_ward') {
      query.ward = req.user.ward;
    } else if (req.user.role === 'admin_city') {
      query.municipalCorp = req.user.municipalCorp;
    } else if (req.user.role === 'admin_state') {
      query.state = req.user.state;
      if (req.query.corp) {
        query.municipalCorp = req.query.corp;
      }
    }

    let clusters = await ComplaintCluster.find(query)
      .sort({ priorityScore: -1 })
      .populate('complaints'); // We populate if we need the count, or we can just return array length

    // -- SLA ESCALATION LOGIC (Phase 2) --
    // If a cluster is severe (> 80) and older than 1 day, and not resolved, escalate it
    const now = new Date();
    let hasUpdates = false;
    
    for (let c of clusters) {
      if (c.status !== 'resolved' && c.status !== 'escalated' && c.severityScore > 80) {
        const diffHours = Math.abs(now - new Date(c.createdAt)) / 36e5;
        // In a real app, SLA is usually 24h. For hackathon demo, we escalate if older than 5 mins
        if (diffHours > 24 || process.env.DEMO_MODE) {
          c.status = 'escalated';
          await c.save();
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
       // Re-fetch to ensure updated status is returned
       clusters = await ComplaintCluster.find(query)
          .sort({ priorityScore: -1 })
          .populate('complaints');
    }

    const parsedClusters = clusters.map(c => {
      let evidence = [];
      if (c.evidence) {
        try {
          evidence = typeof c.evidence === 'string' ? JSON.parse(c.evidence) : c.evidence;
        } catch (e) {
          evidence = [c.evidence];
        }
      }
      return { 
        ...c.toJSON(), 
        evidence,
        _count: { complaints: c.complaints.length }
      };
    });

    res.json(parsedClusters);
  } catch (error) {
    next(error);
  }
});

// GET /api/clusters/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cluster = await ComplaintCluster.findById(req.params.id)
      .populate('complaints');
    
    if (!cluster) return res.status(404).json({ error: "Cluster not found" });

    // Format the timeline (simplified: group complaints by days ago)
    const now = new Date();
    const timelineObj = {};
    cluster.complaints.forEach(c => {
      const diffTime = Math.abs(now - new Date(c.createdAt));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const dayLabel = diffDays === 0 ? "Today" : `${diffDays} days ago`;
      if (!timelineObj[dayLabel]) timelineObj[dayLabel] = 0;
      timelineObj[dayLabel]++;
    });

    const timeline = Object.keys(timelineObj).map(day => ({
      day,
      reports: timelineObj[day]
    })).reverse(); // Order from oldest to newest roughly

    // Parse evidence from database or fallback for old/demo clusters
    let evidence = [];
    if (cluster.evidence) {
      try {
        evidence = JSON.parse(cluster.evidence);
      } catch (e) {
        evidence = [cluster.evidence];
      }
    } else {
      evidence = [
        `Multiple (${cluster.complaints.length}) related reports received.`,
        `Reports are geographically concentrated within ${cluster.radius}km.`,
        `Complaint frequency indicates an escalating issue.`
      ];
      if (cluster.title.includes("Water") || cluster.category === "Water") {
        evidence.push("Several citizens mention pipeline failure or leaking water.");
      }
    }

    res.json({
      ...cluster.toJSON(),
      timeline,
      evidence,
      _count: { complaints: cluster.complaints.length }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/clusters/:id
router.patch('/:id', upload.single('verificationPhoto'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['submitted', 'investigating', 'assigned', 'in_progress', 'resolved', 'escalated'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const cluster = await ComplaintCluster.findById(req.params.id);
    if (!cluster) return res.status(404).json({ error: "Cluster not found" });

    // -- AI PHOTO VERIFICATION (Phase 3) --
    if (status === 'resolved' && req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const verificationResult = await verifyResolutionPhoto(base64Image, cluster.title);
      
      if (!verificationResult.isResolved) {
        return res.status(400).json({ 
          error: "Verification Failed", 
          reason: verificationResult.reason 
        });
      }
      
      // If valid, we would upload to S3/Cloudinary here. 
      // For hackathon MVP, we just save a mock URL or the base64 string
      cluster.verificationPhotoUrl = `data:image/jpeg;base64,${base64Image}`;
    }

    cluster.status = status;
    await cluster.save();

    // Sync the status to all individual citizen complaints in this cluster
    if (cluster && cluster.complaints && cluster.complaints.length > 0) {
      const Complaint = require('../models/Complaint');
      await Complaint.updateMany(
        { _id: { $in: cluster.complaints } },
        { status }
      );
    }

    res.json(cluster);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
