const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const { verifyResolution } = require('../services/ai');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all AI engine routes
router.use(authMiddleware);

/**
 * Helper to enforce RBAC rules on a query object
 */
function applyJurisdictionFilter(req, query = {}) {
    const { role, jurisdiction } = req.user;
    
    if (role === 'citizen') {
        throw new Error('Unauthorized');
    }
    if (role === 'admin_state') {
        // State admin can see everything, or filter by requested district if passed in query
        if (req.query.district) query.district = req.query.district;
    } else if (role === 'admin_district') {
        query.district = jurisdiction.district;
    } else if (['admin_municipal_corp', 'admin_municipal_council', 'admin_town_council', 'admin_city', 'admin_ward'].includes(role)) {
        query.district = jurisdiction.district;
        query.localBodyId = jurisdiction.localBodyId;
    }
    return query;
}

/**
 * Feature 2, 3, 5: AI Command Center (Action Queue, Emerging Risks, Resolution Risks)
 * Returns the top critical actions, emerging problems, and resolution risks.
 */
router.get('/command-center', async (req, res) => {
    try {
        let clusterQuery = { status: { $ne: 'resolved' } };
        let complaintQuery = { status: { $ne: 'resolved' } };
        
        try {
            clusterQuery = applyJurisdictionFilter(req, clusterQuery);
            complaintQuery = applyJurisdictionFilter(req, complaintQuery);
        } catch (err) {
            return res.status(403).json({ error: 'Unauthorized jurisdiction' });
        }

        // 1. AI Action Queue (Top Actions)
        // Sort clusters by priorityScore DESC
        const actionQueue = await ComplaintCluster.find(clusterQuery)
            .sort({ priorityScore: -1, severityScore: -1 })
            .limit(5)
            .lean();

        // 2. Emerging Problems
        // Detect problems increasing rapidly. We'll look at recent complaints (last 72h) vs previous 72h
        const now = new Date();
        const past72h = new Date(now.getTime() - (72 * 60 * 60 * 1000));
        
        const recentComplaints = await Complaint.aggregate([
            { $match: { ...complaintQuery, createdAt: { $gte: past72h } } },
            { $group: { _id: { category: "$category", district: "$district" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        const emergingRisks = recentComplaints.map(rc => ({
            problemType: rc._id.category || 'General',
            area: rc._id.district || 'Unknown Area',
            recentReports: rc.count,
            growthRate: (rc.count / 2).toFixed(1), // Mock growth rate calculation based on recent volume
            riskScore: Math.min(100, 60 + (rc.count * 5)),
            explanation: `Reports increased sharply over the last 72 hours (${rc.count} new reports).`
        })).filter(r => r.recentReports > 1);

        // 3. Resolution Risks
        // Find unresolved complaints assigned > 24 hours ago
        const past24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const resolutionRisks = await Complaint.find({
            ...complaintQuery,
            status: { $in: ['assigned', 'in_progress'] },
            updatedAt: { $lt: past24h },
            severity: { $gte: 50 }
        }).sort({ severity: -1 }).limit(3).lean();

        const formattedResolutionRisks = resolutionRisks.map(c => {
            const hoursSinceUpdate = Math.floor((now - new Date(c.updatedAt)) / (1000 * 60 * 60));
            return {
                id: c._id,
                title: c.category || 'Issue',
                risk: c.severity > 80 ? 'HIGH' : 'MEDIUM',
                riskScore: Math.min(100, c.severity + Math.floor(hoursSinceUpdate / 2)),
                reasons: [
                    `No activity for ${hoursSinceUpdate} hours`,
                    c.severity > 80 ? 'Critical priority' : 'High priority'
                ],
                recommendedAction: "Escalate for immediate inspection"
            };
        });

        res.json({
            actionQueue: actionQueue.map(c => ({
                rank: 0, // Assigned on frontend
                problemId: c._id,
                title: c.title,
                priorityScore: c.priorityScore,
                affectedComplaints: c.complaints ? c.complaints.length : 0,
                reason: c.probableRootCause ? c.probableRootCause : "High priority cluster",
                recommendedAction: c.recommendedAction || "Inspect and resolve"
            })),
            emergingRisks,
            resolutionRisks: formattedResolutionRisks
        });
    } catch (error) {
        console.error("Error generating Command Center data:", error);
        res.status(500).json({ error: "Failed to generate AI command center data" });
    }
});

/**
 * Feature 4 & 5: Resolution Verification
 */
router.post('/verify-resolution/:clusterId', async (req, res) => {
    try {
        const { resolutionNote, afterPhotoUrl } = req.body;
        const clusterId = req.params.clusterId;
        
        const cluster = await ComplaintCluster.findById(clusterId);
        if (!cluster) return res.status(404).json({ error: 'Cluster not found' });
        
        // RBAC check
        try {
            applyJurisdictionFilter(req, { district: cluster.district, localBodyId: cluster.localBodyId });
            if (req.user.role === 'admin_district' || req.user.role === 'admin_state') {
                return res.status(403).json({ error: 'Read-only access. Cannot resolve.' });
            }
        } catch(e) {
            return res.status(403).json({ error: 'Unauthorized to resolve this cluster' });
        }
        
        const afterImageBase64 = afterPhotoUrl ? afterPhotoUrl.split(',')[1] : null;
        const verification = await verifyResolution(null, afterImageBase64, cluster.title + " " + (cluster.probableRootCause || ''), resolutionNote);
        
        cluster.resolutionNote = resolutionNote;
        if(afterPhotoUrl) cluster.verificationPhotoUrl = afterPhotoUrl;
        cluster.resolutionAiVerification = verification.verificationStatus;
        cluster.resolutionAiConfidence = verification.confidence;
        
        await cluster.save();
        
        res.json({
            success: true,
            verification
        });
        
    } catch(err) {
        console.error("Resolution verification error:", err);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

module.exports = router;
