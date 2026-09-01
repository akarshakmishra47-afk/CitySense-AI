const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/clusters
router.get('/', async (req, res, next) => {
  try {
    const clusters = await prisma.complaintCluster.findMany({
      orderBy: { priorityScore: 'desc' },
      include: {
        _count: {
          select: { complaints: true }
        }
      }
    });
    const parsedClusters = clusters.map(c => {
      let evidence = [];
      if (c.evidence) {
        try {
          evidence = typeof c.evidence === 'string' ? JSON.parse(c.evidence) : c.evidence;
        } catch (e) {
          evidence = [c.evidence];
        }
      }
      return { ...c, evidence };
    });

    res.json(parsedClusters);
  } catch (error) {
    next(error);
  }
});

// GET /api/clusters/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cluster = await prisma.complaintCluster.findUnique({
      where: { id: req.params.id },
      include: {
        complaints: {
          include: { complaint: true }
        },
        _count: {
          select: { complaints: true }
        }
      }
    });
    
    if (!cluster) return res.status(404).json({ error: "Cluster not found" });

    // Format the timeline (simplified: group complaints by days ago)
    const now = new Date();
    const timelineObj = {};
    cluster.complaints.forEach(cc => {
      const c = cc.complaint;
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
      ...cluster,
      timeline,
      evidence
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

    const cluster = await prisma.complaintCluster.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(cluster);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
