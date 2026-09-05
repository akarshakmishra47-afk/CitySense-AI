const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const authMiddleware = require('../middleware/auth');

const LOCAL_BODY_ROLES = ['admin_municipal_corp', 'admin_municipal_council', 'admin_town_council'];
const DISTRICT_ROLE = 'admin_district';
const STATE_ROLE = 'admin_state';

/**
 * Resolve the authoritative district for this request.
 * - admin_district: always uses JWT district. Query param is IGNORED.
 * - admin_state: uses ?district= query param (validated as non-empty string).
 */
function resolveDistrict(req) {
  const { role, district } = req.user;
  if (role === DISTRICT_ROLE) {
    if (!district) return { district: null, error: 'No district assigned to your account.' };
    return { district, error: null };
  }
  if (role === STATE_ROLE) {
    const qd = (req.query.district || '').trim();
    if (!qd) return { district: null, error: 'district query parameter is required for State Admin.' };
    return { district: qd, error: null };
  }
  return { district: null, error: 'Access denied. District or State admin role required.' };
}

/**
 * Verify a localBodyId belongs to the admin's district by checking at least one
 * complaint with that localBodyId exists for that district.
 */
async function verifyLocalBodyBelongsToDistrict(localBodyId, district) {
  const check = await Complaint.findOne(
    { localBodyId, district },
    { _id: 1 }
  ).lean();
  return !!check;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/district/overview
// ─────────────────────────────────────────────────────────────────
router.get('/overview', authMiddleware, async (req, res, next) => {
  try {
    const { district, error } = resolveDistrict(req);
    if (error) return res.status(403).json({ error });

    const baseQuery = { district };

    const [total, resolved] = await Promise.all([
      Complaint.countDocuments(baseQuery),
      Complaint.countDocuments({ ...baseQuery, status: 'resolved' }),
    ]);

    const pending = total - resolved;
    const [critical, highPriority] = await Promise.all([
      Complaint.countDocuments({ ...baseQuery, severity: { $gte: 85 } }),
      Complaint.countDocuments({ ...baseQuery, severity: { $gte: 70 } }),
    ]);
    const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);

    // 30-day trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendAgg = await Complaint.aggregate([
      { $match: { ...baseQuery, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = trendAgg.find(t => t._id === dateStr);
      trend.push({ date: dateStr, count: found ? found.count : 0 });
    }

    const [categoryDistribution, statusDistribution] = await Promise.all([
      Complaint.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      districtName: district,
      total,
      pending,
      resolved,
      critical,
      highPriority,
      resolutionRate,
      trend,
      categoryDistribution: categoryDistribution.map(c => ({
        category: c._id || 'Uncategorized',
        count: c.count
      })),
      statusDistribution: statusDistribution.map(s => ({
        status: s._id || 'unknown',
        count: s.count
      }))
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/district/local-bodies
// Returns complaint-based aggregation per local body in the district.
// ─────────────────────────────────────────────────────────────────
router.get('/local-bodies', authMiddleware, async (req, res, next) => {
  try {
    const { district, error } = resolveDistrict(req);
    if (error) return res.status(403).json({ error });

    const aggregated = await Complaint.aggregate([
      { $match: { district, localBodyId: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$localBodyId',
          localBodyName: { $first: '$localBodyName' },
          localBodyType: { $first: '$localBodyType' },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $gte: ['$severity', 85] }, 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const localBodies = aggregated.map(lb => ({
      localBodyId: lb._id,
      localBodyName: lb.localBodyName || lb._id,
      localBodyType: lb.localBodyType || 'Nagar Nigam',
      total: lb.total,
      pending: lb.total - lb.resolved,
      resolved: lb.resolved,
      critical: lb.critical,
      resolutionRate: lb.total === 0 ? 0 : Math.round((lb.resolved / lb.total) * 100)
    }));

    res.json(localBodies);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/district/complaints
// Minimal fields for map markers.
// ─────────────────────────────────────────────────────────────────
router.get('/complaints', authMiddleware, async (req, res, next) => {
  try {
    const { district, error } = resolveDistrict(req);
    if (error) return res.status(403).json({ error });

    const complaints = await Complaint.find(
      { district },
      { _id: 1, latitude: 1, longitude: 1, category: 1, status: 1, severity: 1, localBodyId: 1, address: 1, description: 1, createdAt: 1 }
    ).sort({ createdAt: -1 }).limit(500).lean();

    res.json(complaints);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/district/local-body/:localBodyId/overview
// Read-only for state/district admins. LocalBody admins should use
// existing /api/local-body/analytics instead.
// ─────────────────────────────────────────────────────────────────
router.get('/local-body/:localBodyId/overview', authMiddleware, async (req, res, next) => {
  try {
    const { localBodyId } = req.params;
    const { role } = req.user;

    if (role === DISTRICT_ROLE) {
      const belongs = await verifyLocalBodyBelongsToDistrict(localBodyId, req.user.district);
      if (!belongs) return res.status(403).json({ error: 'Access denied. This local body does not belong to your district.' });
    } else if (role === STATE_ROLE) {
      // State admin can view any local body — no extra check needed
    } else if (LOCAL_BODY_ROLES.includes(role)) {
      // Local body admins are directed to /api/local-body/* — enforce same-body rule
      if (req.user.localBodyId !== localBodyId) return res.status(403).json({ error: 'Access denied.' });
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const baseQuery = { localBodyId };
    const [total, resolved, critical, highPriority] = await Promise.all([
      Complaint.countDocuments(baseQuery),
      Complaint.countDocuments({ ...baseQuery, status: 'resolved' }),
      Complaint.countDocuments({ ...baseQuery, severity: { $gte: 85 } }),
      Complaint.countDocuments({ ...baseQuery, severity: { $gte: 70 } }),
    ]);
    const pending = total - resolved;
    const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);

    // Resolve metadata from DB — never from query params
    const sample = await Complaint.findOne(
      { localBodyId },
      { localBodyName: 1, localBodyType: 1, district: 1 }
    ).lean();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendAgg = await Complaint.aggregate([
      { $match: { localBodyId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = trendAgg.find(t => t._id === dateStr);
      trend.push({ date: dateStr, count: found ? found.count : 0 });
    }

    const [categoryDistribution, statusDistribution] = await Promise.all([
      Complaint.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Complaint.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      localBodyId,
      localBodyName: sample?.localBodyName || localBodyId,
      localBodyType: sample?.localBodyType || 'Nagar Nigam',
      districtName: sample?.district || req.user.district || '',
      total,
      pending,
      resolved,
      critical,
      highPriority,
      resolutionRate,
      trend,
      categoryDistribution: categoryDistribution.map(c => ({ category: c._id || 'Uncategorized', count: c.count })),
      statusDistribution: statusDistribution.map(s => ({ status: s._id || 'unknown', count: s.count }))
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/district/local-body/:localBodyId/complaints
// ─────────────────────────────────────────────────────────────────
router.get('/local-body/:localBodyId/complaints', authMiddleware, async (req, res, next) => {
  try {
    const { localBodyId } = req.params;
    const { role } = req.user;

    if (role === DISTRICT_ROLE) {
      const belongs = await verifyLocalBodyBelongsToDistrict(localBodyId, req.user.district);
      if (!belongs) return res.status(403).json({ error: 'Access denied.' });
    } else if (role === STATE_ROLE) {
      // OK
    } else if (LOCAL_BODY_ROLES.includes(role)) {
      if (req.user.localBodyId !== localBodyId) return res.status(403).json({ error: 'Access denied.' });
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const query = { localBodyId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();

    res.json(complaints);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/district/local-body/:localBodyId/clusters
// ─────────────────────────────────────────────────────────────────
router.get('/local-body/:localBodyId/clusters', authMiddleware, async (req, res, next) => {
  try {
    const { localBodyId } = req.params;
    const { role } = req.user;

    if (role === DISTRICT_ROLE) {
      const belongs = await verifyLocalBodyBelongsToDistrict(localBodyId, req.user.district);
      if (!belongs) return res.status(403).json({ error: 'Access denied.' });
    } else if (role === STATE_ROLE) {
      // OK
    } else if (LOCAL_BODY_ROLES.includes(role)) {
      if (req.user.localBodyId !== localBodyId) return res.status(403).json({ error: 'Access denied.' });
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Resolve district/municipalCorp from complaints since clusters don't store localBodyId
    const sample = await Complaint.findOne(
      { localBodyId },
      { district: 1, localBodyName: 1, municipalCorp: 1 }
    ).lean();

    const clusterQuery = {};
    if (sample?.district) clusterQuery.district = sample.district;
    // Also filter by municipalCorp if available, otherwise broader district-level clusters
    if (sample?.municipalCorp) {
      clusterQuery.municipalCorp = sample.municipalCorp;
    } else if (sample?.localBodyName) {
      clusterQuery.municipalCorp = sample.localBodyName;
    }

    const clusters = await ComplaintCluster.find(clusterQuery)
      .sort({ priorityScore: -1 })
      .populate('complaints')
      .lean();

    const parsed = clusters.map(c => {
      let evidence = [];
      if (c.evidence) {
        try { evidence = typeof c.evidence === 'string' ? JSON.parse(c.evidence) : c.evidence; }
        catch (e) { evidence = [c.evidence]; }
      }
      return { ...c, evidence, _count: { complaints: c.complaints?.length || 0 } };
    });

    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
