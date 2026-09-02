const express = require('express');
const router = express.Router();
const ComplaintCluster = require('../models/ComplaintCluster');

// GET /api/clusters
router.get('/', async (req, res, next) => {
  try {
    const clusters = await ComplaintCluster.find()
      .sort({ priorityScore: -1 })
      .populate('complaints'); // We populate if we need the count, or we can just return array length

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
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['submitted', 'investigating', 'assigned', 'in_progress', 'resolved'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const cluster = await ComplaintCluster.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(cluster);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
