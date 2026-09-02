require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const ComplaintCluster = require('./models/ComplaintCluster');

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB Connected');

    // Create Admin User
    const existingAdmin = await User.findOne({ email: "Admin123@" });
    if (!existingAdmin) {
      await User.create({
        name: "System Admin",
        email: "Admin123@",
        password: await bcrypt.hash('123456', 10),
        role: "admin"
      });
      console.log('Admin user seeded.');
    } else {
      existingAdmin.password = await bcrypt.hash('123456', 10);
      await existingAdmin.save();
      console.log('Admin password reset.');
    }

    // Creating sample data
    const existingComplaints = await Complaint.countDocuments();
    if (existingComplaints === 0) {
      console.log('Creating sample data...');
      
      const admin = await User.findOne({ email: "Admin123@" });
      
      const sampleCluster = await ComplaintCluster.create({
        title: "Water - Main St",
        category: "Water",
        latitude: 34.0522,
        longitude: -118.2437,
        priorityScore: 85,
        severityScore: 90,
        impactScore: 80,
        frequencyScore: 70,
        durationScore: 100,
        estimatedAffectedPeople: 500,
        status: "investigating"
      });

      const sampleComplaint = await Complaint.create({
        user: admin._id,
        description: "Water pipe burst on Main St, flooding the intersection.",
        category: "Water",
        subcategory: "Leak",
        severity: 90,
        urgency: "High",
        durationDays: 1,
        latitude: 34.0522,
        longitude: -118.2437,
        address: "Main St",
        status: "submitted",
        clusters: [sampleCluster._id]
      });

      sampleCluster.complaints.push(sampleComplaint._id);
      await sampleCluster.save();
      
      console.log('Sample data seeded successfully.');
    } else {
      console.log('Sample data already exists. Skipping.');
    }

    console.log('The system is ready for live operational data.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
