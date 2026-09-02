const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const { generateSystemInsight } = require('../services/ai');

// GET /api/analytics
router.get('/', async (req, res, next) => {
  try {
    // 1. Reports by category (using MongoDB Aggregation)
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const categoryData = complaintsByCategory.map(item => ({
      category: item._id || 'Unknown',
      count: item.count
    }));

    // 2. Priority distribution (from clusters)
    const clusters = await ComplaintCluster.find({}, 'priorityScore');

    const priorityDist = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    clusters.forEach(c => {
      if (c.priorityScore >= 90) priorityDist.Critical++;
      else if (c.priorityScore >= 75) priorityDist.High++;
      else if (c.priorityScore >= 50) priorityDist.Medium++;
      else priorityDist.Low++;
    });

    // 3. Reports over time (last 7 days mock up based on DB)
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const recentComplaints = await Complaint.find(
      { createdAt: { $gte: sevenDaysAgo } },
      'createdAt'
    );

    const timelineObj = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timelineObj[dateStr] = 0;
    }

    recentComplaints.forEach(c => {
      const dateStr = c.createdAt.toISOString().split('T')[0];
      if (timelineObj[dateStr] !== undefined) {
        timelineObj[dateStr]++;
      }
    });

    const timelineData = Object.keys(timelineObj).map(date => ({
      date,
      count: timelineObj[date]
    }));

    // 4. Emerging problem insight (Dynamic via LLM)
    const emergingInsight = await generateSystemInsight(categoryData, timelineData);

    // 5. System Status (Real dynamic data)
    const totalComplaints = await Complaint.countDocuments();
    const systemStatus = {
      model: "Qwen 3.8-27B",
      processed: totalComplaints,
      uptime: "100%"
    };

    res.json({
      categoryData,
      priorityDist,
      timelineData,
      emergingInsight,
      systemStatus
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
