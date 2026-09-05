const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const { generateSystemInsight, generateHotspotPredictions } = require('../services/ai');
const authMiddleware = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const upDistricts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/up_districts.json'), 'utf-8'));
const { UP_JURISDICTION_DATA } = require('../../public/js/up-jurisdiction');

// GET /api/analytics
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'admin_ward') {
      query.ward = req.user.ward;
      if (req.user.district) query.district = req.user.district;
    } else if (req.user.role === 'admin_city') {
      query.municipalCorp = req.user.municipalCorp;
      if (req.user.district) query.district = req.user.district;
    } else if (req.user.role === 'admin_district') {
      query.district = req.user.district;
    } else if (req.user.role === 'admin_state') {
      query.state = req.user.state;
      if (req.query.district) query.district = req.query.district; // Allow drill-down filtering
    }

    // 1. Reports by category (using MongoDB Aggregation)
    const complaintsByCategory = await Complaint.aggregate([
      { $match: query },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const categoryData = complaintsByCategory.map(item => ({
      category: item._id || 'Unknown',
      count: item.count
    }));

    // 2. Priority distribution (from clusters)
    const clusters = await ComplaintCluster.find(query, 'priorityScore');

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
      { ...query, createdAt: { $gte: sevenDaysAgo } },
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
    const totalComplaints = await Complaint.countDocuments(query);
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

// GET /api/analytics/predictions
router.get('/predictions', authMiddleware, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'admin_ward') {
      query.ward = req.user.ward;
      if (req.user.district) query.district = req.user.district;
    } else if (req.user.role === 'admin_city') {
      query.municipalCorp = req.user.municipalCorp;
      if (req.user.district) query.district = req.user.district;
    } else if (req.user.role === 'admin_district') {
      query.district = req.user.district;
    } else if (req.user.role === 'admin_state') {
      query.state = req.user.state;
      if (req.query.district) query.district = req.query.district;
    }

    const clusters = await ComplaintCluster.find(query).limit(10);
    const clusterData = clusters.map(c => ({ title: c.title, category: c.category, ward: c.ward, severityScore: c.severityScore }));
    
    const predictions = await generateHotspotPredictions(clusterData);
    res.json(predictions);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/hierarchy
router.get('/hierarchy', authMiddleware, async (req, res, next) => {
  try {
    const role = req.user.role;
    let query = {};
    let groupByField = '';
    let isDistrictDrilldown = false;

    if (role === 'admin_state') {
      query.state = req.user.state;
      if (req.query.district) {
        query.district = req.query.district;
        isDistrictDrilldown = true;
      } else {
        groupByField = '$district'; // State sees districts
      }
    } else if (role === 'admin_district') {
      query.district = req.user.district;
      isDistrictDrilldown = true;
    } else if (role === 'admin_city') {
      query.municipalCorp = req.user.municipalCorp;
      groupByField = '$ward';
    } else {
      return res.status(403).json({ error: "Hierarchy view not available for this role" });
    }

    const aggregated = await ComplaintCluster.aggregate([
      { $match: query },
      { 
        $group: {
          _id: isDistrictDrilldown ? { type: '$localBodyType', name: { $cond: [{ $in: ['$localBodyType', ['Development Block', 'Gram Panchayat']] }, '$block', '$municipalCorp'] } } : groupByField,
          totalClusters: { $sum: 1 },
          activeClusters: {
            $sum: { $cond: [{ $ne: ["$status", "resolved"] }, 1, 0] }
          },
          resolvedClusters: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          pendingClusters: {
            $sum: { $cond: [{ $in: ["$status", ["submitted", "investigating", "assigned", "in_progress", "escalated"]] }, 1, 0] }
          },
          criticalClusters: {
            $sum: { $cond: [{ $gte: ["$priorityScore", 90] }, 1, 0] }
          },
          avgPriority: { $avg: "$priorityScore" },
          totalAffected: { $sum: "$estimatedAffectedPeople" },
          totalComplaints: { $sum: { $size: "$complaints" } }
        }
      },
      { $sort: { criticalClusters: -1, avgPriority: -1 } }
    ]);

    // Apply the "Left Join" for State Admin looking at all districts
    if (role === 'admin_state' && !req.query.district) {
      const allDistrictsData = upDistricts.map(districtName => {
        const found = aggregated.find(a => a._id === districtName);
        if (found) return found;
        
        // Return zero-data state
        return {
          _id: districtName,
          totalClusters: 0,
          activeClusters: 0,
          resolvedClusters: 0,
          pendingClusters: 0,
          criticalClusters: 0,
          avgPriority: 0,
          totalAffected: 0,
          totalComplaints: 0
        };
      });
      // Sort: active districts first, then alphabetically
      allDistrictsData.sort((a, b) => {
        if (b.totalClusters !== a.totalClusters) return b.totalClusters - a.totalClusters;
        return String(a._id).localeCompare(String(b._id));
      });
      
      return res.json(allDistrictsData);
    }

    // Apply the "Left Join" for District Admin or State Admin drilling down
    if (isDistrictDrilldown && query.district && UP_JURISDICTION_DATA[query.district]) {
      const dData = UP_JURISDICTION_DATA[query.district];
      const allBodies = [];
      dData.municipalCorporations.forEach(name => allBodies.push({ type: 'Nagar Nigam', name }));
      dData.municipalCouncils.forEach(name => allBodies.push({ type: 'Nagar Palika Parishad', name }));
      dData.townCouncils.forEach(name => allBodies.push({ type: 'Nagar Panchayat', name }));
      
      const completeDistrictData = allBodies.map(body => {
        const found = aggregated.find(a => a._id && a._id.name === body.name && a._id.type === body.type);
        if (found) return found;
        return {
          _id: body,
          totalClusters: 0,
          activeClusters: 0,
          resolvedClusters: 0,
          pendingClusters: 0,
          criticalClusters: 0,
          avgPriority: 0,
          totalAffected: 0,
          totalComplaints: 0
        };
      });

      // Preserve any DB entities that weren't in the static list
      aggregated.forEach(a => {
        if (!completeDistrictData.find(c => c._id && c._id.name === a._id.name && c._id.type === a._id.type)) {
          completeDistrictData.push(a);
        }
      });
      
      return res.json(completeDistrictData);
    }

    res.json(aggregated);
  } catch (error) {
    next(error);
  }
});

const { evaluateMunicipalPerformance } = require('../services/ai');

// GET /api/analytics/recommendation/:municipalCorp
router.get('/recommendation/:municipalCorp', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin_state') return res.status(403).json({ error: "Unauthorized" });
    
    const corp = req.params.municipalCorp;
    
    const aggregated = await ComplaintCluster.aggregate([
      { $match: { municipalCorp: corp, state: req.user.state } },
      { 
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $ne: ["$status", "resolved"] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $gte: ["$priorityScore", 90] }, 1, 0] } }
        }
      }
    ]);
    
    if (aggregated.length === 0) return res.json({ recommendation: "No data available." });
    
    const data = aggregated[0];
    const recommendation = await evaluateMunicipalPerformance(corp, data);
    res.json({ recommendation });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
