const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const { analyzeComplaint, generateRootCause } = require('./ai');
const { calculateCombinedSimilarity } = require('./clustering');
const { calculatePriority } = require('./priority-engine');

async function processNewComplaint(complaintData, userId, imageUrl = null) {
  const { description, duration, latitude, longitude, address, affectedPeople } = complaintData;
  
  const durationDays = parseInt(duration, 10) || 1;
  const lat = parseFloat(latitude) || 0;
  const lng = parseFloat(longitude) || 0;

  // 1. Analyze with AI
  const analysis = await analyzeComplaint(description, durationDays);

  // 2. Store Complaint
  const complaint = await Complaint.create({
    user: userId,
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
    aiSummary: analysis.summary,
    // Jurisdiction routing fields from Citizen Portal
    district: complaintData.district || null,
    localBodyId: complaintData.localBodyId || null,
    localBodyName: complaintData.localBodyName || complaintData.bodyName || null,
    bodyType: complaintData.bodyType || null,
    bodyName: complaintData.bodyName || null,
    localBodyType: complaintData.localBodyType || null,
    municipalCorp: complaintData.municipalCorp || null
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

  return {
    complaint,
    analysis,
    clusterId: finalCluster._id
  };
}

module.exports = { processNewComplaint };
