require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../src/models/Complaint');
const ComplaintCluster = require('../src/models/ComplaintCluster');

async function resetDataset() {
  try {
    const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/civicpulse';
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB.');

    console.log('Deleting all existing complaints and clusters...');
    await Complaint.deleteMany({});
    await ComplaintCluster.deleteMany({});
    console.log('Data cleared.');

    console.log('Inserting 5 demo problems in Lucknow...');

    // 1. Pothole - Hazratganj
    const c1 = await Complaint.create({
      description: "Massive pothole near Hazratganj crossing causing accidents. Road surface completely broken after monsoon.",
      category: "Road & Traffic",
      subcategory: "Pothole",
      severity: 85,
      urgency: "immediate",
      latitude: 26.8500,
      longitude: 80.9413,
      address: "Hazratganj Crossing, Lucknow",
      imageUrl: "https://placehold.co/600x400/1e293b/ef4444?text=Pothole+Hazratganj",
      aiSummary: "Deep pothole (approx 1.5ft) causing vehicle damage and near-misses. High accident risk.",
      status: "submitted",
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Hazratganj Ward",
      state: "Uttar Pradesh"
    });

    // 2. Second pothole complaint - same area (will cluster with c1)
    const c2 = await Complaint.create({
      description: "Car tire burst due to huge crater at Hazratganj road. Very dangerous especially at night.",
      category: "Road & Traffic",
      subcategory: "Pothole",
      severity: 90,
      urgency: "urgent",
      latitude: 26.8502,
      longitude: 80.9415,
      address: "Near Hazratganj Square, Lucknow",
      aiSummary: "Secondary report confirming pothole. Citizens experiencing vehicle damage.",
      status: "investigating",
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Hazratganj Ward",
      state: "Uttar Pradesh"
    });

    // 3. Water outage - Gomti Nagar
    const c3 = await Complaint.create({
      description: "No drinking water supply in Gomti Nagar Phase 2 for the last 3 days. 2000+ residents affected.",
      category: "Water Supply",
      subcategory: "No Water Supply",
      severity: 95,
      urgency: "immediate",
      durationDays: 3,
      latitude: 26.8550,
      longitude: 81.0000,
      address: "Gomti Nagar Phase 2, Lucknow",
      aiSummary: "Complete water outage affecting large residential area. Pipeline breach suspected.",
      status: "assigned",
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Gomti Nagar Ward",
      state: "Uttar Pradesh"
    });

    // 4. Garbage - Aliganj (resolved)
    const c4 = await Complaint.create({
      description: "Garbage truck hasn't visited Aliganj Sector B in a week. Huge pile of waste accumulating.",
      category: "Sanitation",
      subcategory: "Garbage Collection",
      severity: 60,
      urgency: "normal",
      durationDays: 7,
      latitude: 26.8850,
      longitude: 80.9450,
      address: "Aliganj Sector B, Lucknow",
      imageUrl: "https://placehold.co/600x400/1e293b/f59e0b?text=Garbage+Pile",
      aiSummary: "Uncollected waste causing sanitation risk. Requires immediate garbage truck dispatch.",
      status: "resolved",
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Aliganj Ward",
      state: "Uttar Pradesh"
    });

    // 5. Streetlight - Malihabad (Nagar Panchayat - separate local body)
    const c5 = await Complaint.create({
      description: "All streetlights on the main market road in Malihabad are dead since last Monday.",
      category: "Electricity",
      subcategory: "Street Lighting",
      severity: 70,
      urgency: "urgent",
      durationDays: 5,
      latitude: 26.9383,
      longitude: 80.7589,
      address: "Malihabad Main Market Road",
      aiSummary: "Complete streetlight failure on busy market road. Safety risk after dark.",
      status: "in_progress",
      district: "Lucknow",
      municipalCorp: "Malihabad Nagar Panchayat",
      localBodyType: "Nagar Panchayat",
      ward: "Malihabad Ward 1",
      state: "Uttar Pradesh"
    });

    console.log('Creating Clusters...');

    await ComplaintCluster.create({
      title: "Dangerous Potholes at Hazratganj Crossing",
      category: "Road & Traffic",
      probableRootCause: "Monsoon damage and poor road material",
      rootCauseConfidence: 85,
      priorityScore: 92,
      severityScore: 88,
      estimatedAffectedPeople: 500,
      latitude: 26.8501,
      longitude: 80.9414,
      recommendedAction: "Emergency road patch required to prevent accidents. Deploy traffic warning signs immediately.",
      evidence: "Image showing deep pothole, Citizen reports tire burst, Multiple vehicles damaged",
      status: "investigating",
      complaints: [c1._id, c2._id],
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Hazratganj Ward",
      state: "Uttar Pradesh"
    });

    await ComplaintCluster.create({
      title: "Severe Water Outage — Gomti Nagar Phase 2",
      category: "Water Supply",
      probableRootCause: "Main pipeline burst near Phase 2 inlet",
      rootCauseConfidence: 75,
      priorityScore: 96,
      severityScore: 95,
      estimatedAffectedPeople: 2000,
      latitude: 26.8550,
      longitude: 81.0000,
      recommendedAction: "Dispatch emergency water tankers immediately and send pipeline repair team.",
      evidence: "Citizen reports 3-day outage, Pipeline pressure drop in sector readings",
      status: "assigned",
      complaints: [c3._id],
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Gomti Nagar Ward",
      state: "Uttar Pradesh"
    });

    await ComplaintCluster.create({
      title: "Uncollected Garbage — Aliganj Sector B",
      category: "Sanitation",
      probableRootCause: "Vehicle breakdown in sanitation department",
      rootCauseConfidence: 60,
      priorityScore: 65,
      severityScore: 60,
      estimatedAffectedPeople: 300,
      latitude: 26.8850,
      longitude: 80.9450,
      recommendedAction: "Assign replacement garbage vehicle. Ensure weekly collection resumes.",
      evidence: "Citizen image of waste pile, 7-day gap in collection log",
      status: "resolved",
      complaints: [c4._id],
      district: "Lucknow",
      municipalCorp: "Lucknow Nagar Nigam",
      localBodyType: "Nagar Nigam",
      ward: "Aliganj Ward",
      state: "Uttar Pradesh"
    });

    await ComplaintCluster.create({
      title: "Streetlight Failure — Malihabad Market Road",
      category: "Electricity",
      probableRootCause: "Transformer fault on the main distribution line",
      rootCauseConfidence: 70,
      priorityScore: 72,
      severityScore: 70,
      estimatedAffectedPeople: 800,
      latitude: 26.9383,
      longitude: 80.7589,
      recommendedAction: "Send electrical team to inspect transformer and replace faulty units.",
      evidence: "5-day outage reported, Main market road affected",
      status: "in_progress",
      complaints: [c5._id],
      district: "Lucknow",
      municipalCorp: "Malihabad Nagar Panchayat",
      localBodyType: "Nagar Panchayat",
      ward: "Malihabad Ward 1",
      state: "Uttar Pradesh"
    });

    console.log('\n✅ Demo dataset seeded successfully!');
    console.log('   5 complaints created across 2 local bodies:');
    console.log('   - Lucknow Nagar Nigam: 4 complaints (3 clusters)');
    console.log('   - Malihabad Nagar Panchayat: 1 complaint (1 cluster)');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

resetDataset();
