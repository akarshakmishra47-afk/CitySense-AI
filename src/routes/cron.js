const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateMockComplaints } = require('../services/ai');
const { processNewComplaint } = require('../services/complaint-processor');

// GET /api/cron/generate
router.get('/generate', async (req, res, next) => {
  try {
    // Basic security for Vercel Cron. Vercel sends an authorization header.
    // If CRON_SECRET is set in environment, we enforce it.
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized cron access' });
      }
    }

    // Identify the demo user to attach these reports to
    const demoUser = await User.findOne({ email: 'demo@citysense.ai' });
    if (!demoUser) {
      return res.status(500).json({ error: 'Demo user not found. Cannot attach automated complaints.' });
    }

    // 1. Generate 5 realistic fake complaints in India
    console.log("CRON: Generating 5 automated mock complaints via AI...");
    const mockComplaints = await generateMockComplaints(5);
    
    if (!mockComplaints || mockComplaints.length === 0) {
      return res.status(500).json({ error: 'Failed to generate mock complaints from AI' });
    }

    const results = [];
    // 2. Process and store each one via the same exact pipeline as real users
    for (const mockData of mockComplaints) {
      try {
        const result = await processNewComplaint(mockData, demoUser._id, null);
        results.push({ id: result.complaint._id, status: 'Success' });
      } catch (err) {
        console.error("CRON: Failed to process a mock complaint:", err.message);
        results.push({ status: 'Error', error: err.message });
      }
    }

    res.json({
      message: `Successfully generated and processed ${results.length} automated complaints.`,
      results
    });
  } catch (error) {
    console.error("CRON route failed:", error);
    res.status(500).json({ error: 'Internal server error in cron job' });
  }
});

module.exports = router;
