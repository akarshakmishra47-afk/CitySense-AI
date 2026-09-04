const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const authMiddleware = require('../middleware/auth');

// Allowed local-body admin roles
const LOCAL_BODY_ROLES = ['admin_municipal_corp', 'admin_municipal_council', 'admin_town_council'];

// Middleware: Verify user is a local-body admin with a valid localBodyId
function requireLocalBodyAdmin(req, res, next) {
  if (!LOCAL_BODY_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Local body admin role required.' });
  }
  if (!req.user.localBodyId) {
    return res.status(403).json({ error: 'Access denied. No local body assignment found.' });
  }
  next();
}

// GET /api/local-body/complaints
// Returns ONLY complaints belonging to the authenticated admin's localBodyId
router.get('/complaints', authMiddleware, requireLocalBodyAdmin, async (req, res, next) => {
  try {
    const query = { localBodyId: req.user.localBodyId };

    // Optional filters from query params
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { description: searchRegex },
        { address: searchRegex },
        { aiSummary: searchRegex },
        { category: searchRegex },
        { localBodyName: searchRegex }
      ];
    }

    // Date filter
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const endDate = new Date(req.query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();

    res.json(complaints);
  } catch (error) {
    next(error);
  }
});

// GET /api/local-body/complaints/:id
// Returns a single complaint ONLY if it belongs to the admin's localBodyId
router.get('/complaints/:id', authMiddleware, requireLocalBodyAdmin, async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      localBodyId: req.user.localBodyId
    })
    .populate('user', 'name email')
    .lean();

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found or access denied.' });
    }

    res.json(complaint);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/local-body/complaints/:id/status
// Update complaint status — ONLY if the complaint belongs to the admin's localBodyId
router.patch('/complaints/:id/status', authMiddleware, requireLocalBodyAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['submitted', 'investigating', 'assigned', 'in_progress', 'resolved', 'escalated'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    // CRITICAL: Filter by BOTH _id AND localBodyId to prevent cross-dashboard manipulation
    const complaint = await Complaint.findOneAndUpdate(
      {
        _id: req.params.id,
        localBodyId: req.user.localBodyId
      },
      { status },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found or access denied.' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
});

// GET /api/local-body/analytics
// Returns analytics calculated ONLY from complaints belonging to the admin's localBodyId
router.get('/analytics', authMiddleware, requireLocalBodyAdmin, async (req, res, next) => {
  try {
    const localBodyId = req.user.localBodyId;
    const baseQuery = { localBodyId };

    // Total counts by status
    const [total, submitted, investigating, assigned, inProgress, resolved, escalated] = await Promise.all([
      Complaint.countDocuments(baseQuery),
      Complaint.countDocuments({ ...baseQuery, status: 'submitted' }),
      Complaint.countDocuments({ ...baseQuery, status: 'investigating' }),
      Complaint.countDocuments({ ...baseQuery, status: 'assigned' }),
      Complaint.countDocuments({ ...baseQuery, status: 'in_progress' }),
      Complaint.countDocuments({ ...baseQuery, status: 'resolved' }),
      Complaint.countDocuments({ ...baseQuery, status: 'escalated' })
    ]);

    // Category distribution
    const categoryDistribution = await Complaint.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority/severity distribution
    const severityDistribution = await Complaint.aggregate([
      { $match: baseQuery },
      {
        $bucket: {
          groupBy: '$severity',
          boundaries: [0, 30, 60, 80, 101],
          default: 'Unknown',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Complaints trend — last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await Complaint.aggregate([
      { $match: { ...baseQuery, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with zero
    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = trendData.find(t => t._id === dateStr);
      trend.push({ date: dateStr, count: found ? found.count : 0 });
    }

    // High priority count (severity >= 70)
    const highPriority = await Complaint.countDocuments({ ...baseQuery, severity: { $gte: 70 } });

    res.json({
      total,
      statusCounts: {
        submitted,
        investigating,
        assigned,
        in_progress: inProgress,
        resolved,
        escalated
      },
      newCount: submitted + investigating,
      inProgressCount: assigned + inProgress,
      resolvedCount: resolved,
      highPriority,
      categoryDistribution: categoryDistribution.map(c => ({
        category: c._id || 'Uncategorized',
        count: c.count
      })),
      severityDistribution: severityDistribution.map(s => ({
        range: s._id === 'Unknown' ? 'Unknown' : s._id,
        count: s.count
      })),
      trend
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
