require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const ComplaintCluster = require('./models/ComplaintCluster');

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB Connected');

    // Clear existing data for a fresh demo
    await Complaint.deleteMany({});
    await ComplaintCluster.deleteMany({});
    
    // Create demo user
    let demoUser = await User.findOne({ email: "demo@citysense.ai" });
    if (!demoUser) {
      demoUser = await User.create({
        name: "Demo Citizen",
        email: "demo@citysense.ai",
        password: "password123",
        role: "citizen",
        state: "Uttar Pradesh",
        municipalCorp: "Lucknow",
        ward: "1"
      });
    }

    console.log('Creating Hackathon MVP Demo Data...');

    // Demo Data Definitions for Lucknow, UP
    const demoLat = 26.8467; // Lucknow coordinates
    const demoLng = 80.9462;

    const complaints = [
      "Water flowing onto road",
      "Road flooding",
      "Underground pipe suspected",
      "Continuous water flow",
      "Standing water",
      "Bad smell"
    ];

    const savedComplaints = [];

    // Create 6 complaints
    for (let i = 0; i < complaints.length; i++) {
      const c = await Complaint.create({
        user: demoUser._id,
        description: complaints[i],
        category: "Water",
        subcategory: "Leakage",
        severity: 85 + (i * 2), // varied severity
        urgency: "High",
        durationDays: 4,
        latitude: demoLat + (Math.random() * 0.002 - 0.001), 
        longitude: demoLng + (Math.random() * 0.002 - 0.001),
        address: "XYZ Colony",
        status: "submitted",
        imageUrl: "",
        clusters: [],
        state: "Uttar Pradesh",
        municipalCorp: "Lucknow",
        ward: "1"
      });
      savedComplaints.push(c);
    }
    
    // Create 1 complaint for a different ward (Ward 2)
    const otherWardComplaint = await Complaint.create({
      user: demoUser._id,
      description: "Huge pothole causing accidents",
      category: "Roads",
      subcategory: "Pothole",
      severity: 90,
      urgency: "High",
      durationDays: 2,
      latitude: 26.8500,
      longitude: 80.9500,
      address: "Hazratganj Market",
      status: "submitted",
      imageUrl: "",
      clusters: [],
      state: "Uttar Pradesh",
      municipalCorp: "Lucknow",
      ward: "2"
    });

    // Create 1 consolidated issue cluster (Ward 64)
    const cluster = await ComplaintCluster.create({
      title: "Potential Water Infrastructure Failure",
      category: "Water Infrastructure",
      latitude: demoLat,
      longitude: demoLng,
      priorityScore: 88,
      severityScore: 92,
      impactScore: 85,
      frequencyScore: 90,
      durationScore: 80,
      estimatedAffectedPeople: 450,
      probableRootCause: "Pipeline leakage / drainage failure",
      rootCauseConfidence: 82,
      recommendedAction: "Inspect local pipeline and drainage network.",
      status: "investigating",
      complaints: savedComplaints.map(c => c._id),
      state: "Uttar Pradesh",
      municipalCorp: "Lucknow",
      ward: "1"
    });

    // Create 1 cluster for Ward 2
    const cluster65 = await ComplaintCluster.create({
      title: "Severe Road Degradation",
      category: "Roads",
      latitude: 26.8500,
      longitude: 80.9500,
      priorityScore: 94,
      severityScore: 90,
      impactScore: 60,
      frequencyScore: 40,
      durationScore: 30,
      estimatedAffectedPeople: 200,
      probableRootCause: "Monsoon damage to asphalt",
      rootCauseConfidence: 90,
      recommendedAction: "Dispatch patching crew.",
      status: "investigating",
      complaints: [otherWardComplaint._id],
      state: "Uttar Pradesh",
      municipalCorp: "Lucknow",
      ward: "2"
    });

    // Update complaints to point to cluster
    for (let c of savedComplaints) {
      c.clusters.push(cluster._id);
      await c.save();
    }
    otherWardComplaint.clusters.push(cluster65._id);
    await otherWardComplaint.save();

    // --- NEW STATE DEMO DATA ---
    // Kanpur (Poor Performance / Many Pending)
    await ComplaintCluster.create({
      title: "Industrial Effluent Overflow",
      category: "Drainage",
      latitude: 26.4499,
      longitude: 80.3319,
      priorityScore: 88,
      severityScore: 95,
      impactScore: 80,
      frequencyScore: 70,
      durationScore: 90,
      estimatedAffectedPeople: 850,
      probableRootCause: "Blockage in main industrial sewer line",
      rootCauseConfidence: 85,
      recommendedAction: "Deploy high-capacity vacuum trucks immediately.",
      status: "in_progress",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Kanpur",
      ward: "10"
    });

    await ComplaintCluster.create({
      title: "Uncollected Garbage Pileup",
      category: "Garbage",
      latitude: 26.4550,
      longitude: 80.3400,
      priorityScore: 65,
      status: "investigating",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Kanpur",
      ward: "11"
    });

    // Varanasi (Good Performance / Many Resolved)
    await ComplaintCluster.create({
      title: "Ghat Lighting Malfunction",
      category: "Streetlights",
      latitude: 25.3176,
      longitude: 82.9739,
      priorityScore: 70,
      status: "resolved",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Varanasi",
      ward: "5"
    });

    await ComplaintCluster.create({
      title: "Potholes on Ring Road",
      category: "Roads",
      latitude: 25.3200,
      longitude: 82.9800,
      priorityScore: 50,
      status: "resolved",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Varanasi",
      ward: "6"
    });
    
    await ComplaintCluster.create({
      title: "Minor Water Leak",
      category: "Water",
      latitude: 25.3150,
      longitude: 82.9700,
      priorityScore: 40,
      status: "in_progress",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Varanasi",
      ward: "7"
    });

    console.log('o. Hackathon Demo Data seeded successfully!');
    console.log('o. 6 Citizen Complaints generated.');
    console.log('o. 1 Issue Cluster formed with AI analysis.');
    
    process.exit(0);
  } catch (err) {
    console.error('?O Database seeding failed:', err);
    process.exit(1);
  }
}

seed();
