const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log("Seeding operational database with users and sample complaints...");

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Base Users
  await prisma.user.upsert({
    where: { email: "citizen@example.com" },
    update: { password: hashedPassword },
    create: {
      name: "Citizen Demo",
      email: "citizen@example.com",
      password: hashedPassword,
      role: "citizen"
    }
  });

  await prisma.user.upsert({
    where: { email: "Admin123@" },
    update: { password: await bcrypt.hash('123456', 10) },
    create: {
      name: "System Admin",
      email: "Admin123@",
      password: await bcrypt.hash('123456', 10),
      role: "admin"
    }
  });

  console.log("Base users seeded.");

  // 2. Create Sample Clusters & Complaints (if none exist)
  const existingClusters = await prisma.complaintCluster.count();
  
  if (existingClusters === 0) {
    console.log("Creating sample clusters and complaints...");
    
    // Sample Cluster 1: Water Leakage (Critical)
    const waterCluster = await prisma.complaintCluster.create({
      data: {
        title: "Water — Andheri East, Mumbai",
        category: "Water",
        probableRootCause: "Underground pipeline rupture near metro construction.",
        rootCauseConfidence: 89,
        priorityScore: 92,
        severityScore: 85,
        impactScore: 95,
        frequencyScore: 80,
        durationScore: 100,
        estimatedAffectedPeople: 1200,
        latitude: 19.1136,
        longitude: 72.8697,
        radius: 0.5,
        recommendedAction: "Dispatch BMC emergency water main repair crew immediately.",
        evidence: JSON.stringify([
          "3 reports of severe flooding in the same 0.5km radius in Andheri.",
          "Keywords mention 'burst pipe' and 'water pressure drop'.",
          "Issue has persisted for over 2 days."
        ]),
        status: "investigating"
      }
    });

    // Sample Complaints for Cluster 1
    const waterComplaint1 = await prisma.complaint.create({
      data: {
        userId: null,
        description: "There is a massive water leak flooding the main road near Andheri Kurla Road.",
        category: "Water",
        subcategory: "Flooding",
        severity: 90,
        urgency: "critical",
        durationDays: 2,
        latitude: 19.1135,
        longitude: 72.8695,
        address: "Andheri Kurla Road, Mumbai",
        aiSummary: "Massive street flooding due to water leak near metro",
        status: "investigating"
      }
    });
    
    const waterComplaint2 = await prisma.complaint.create({
      data: {
        userId: null,
        description: "We have no water supply in our society and the road outside is completely flooded.",
        category: "Water",
        subcategory: "Pressure/Leak",
        severity: 85,
        urgency: "high",
        durationDays: 1,
        latitude: 19.1137,
        longitude: 72.8694,
        address: "Sahar Road, Andheri East",
        aiSummary: "No water supply and street flooding",
        status: "investigating"
      }
    });
    
    const waterComplaint3 = await prisma.complaint.create({
      data: {
        userId: null,
        description: "Water main looks broken near the station, water everywhere causing heavy traffic.",
        category: "Water",
        subcategory: "Broken Main",
        severity: 95,
        urgency: "critical",
        durationDays: 0,
        latitude: 19.1136,
        longitude: 72.8699,
        address: "Near Andheri East Station",
        aiSummary: "Broken water main flooding road causing traffic",
        status: "investigating"
      }
    });

    await prisma.clusterComplaint.createMany({
      data: [
        { clusterId: waterCluster.id, complaintId: waterComplaint1.id },
        { clusterId: waterCluster.id, complaintId: waterComplaint2.id },
        { clusterId: waterCluster.id, complaintId: waterComplaint3.id }
      ]
    });

    // Sample Cluster 2: Garbage (Medium Priority)
    const garbageCluster = await prisma.complaintCluster.create({
      data: {
        title: "Garbage — Koramangala 80ft Road",
        category: "Garbage",
        probableRootCause: "Missed scheduled BBMP collection route.",
        rootCauseConfidence: 75,
        priorityScore: 65,
        severityScore: 40,
        impactScore: 50,
        frequencyScore: 60,
        durationScore: 80,
        estimatedAffectedPeople: 300,
        latitude: 12.9345,
        longitude: 77.6265,
        radius: 0.8,
        recommendedAction: "Schedule priority BBMP garbage truck for the missed zone.",
        evidence: JSON.stringify([
          "2 reports of uncollected trash.",
          "Both reports indicate it has been sitting for over a week."
        ]),
        status: "submitted"
      }
    });

    const garbageComp1 = await prisma.complaint.create({
      data: {
        userId: null,
        description: "BBMP hasn't picked up trash in over a week. It smells terrible and there are stray dogs gathering.",
        category: "Garbage",
        subcategory: "Missed Pickup",
        severity: 45,
        urgency: "medium",
        durationDays: 8,
        latitude: 12.9346,
        longitude: 77.6266,
        address: "Koramangala 80ft Road, Bangalore",
        aiSummary: "Uncollected trash attracting dogs for over a week",
        status: "submitted"
      }
    });

    const garbageComp2 = await prisma.complaint.create({
      data: {
        userId: null,
        description: "Dumpsters are overflowing, garbage is spilling onto the footpath near the eateries.",
        category: "Garbage",
        subcategory: "Overflowing",
        severity: 50,
        urgency: "medium",
        durationDays: 6,
        latitude: 12.9344,
        longitude: 77.6264,
        address: "Koramangala 4th Block",
        aiSummary: "Overflowing dumpsters spilling onto footpath",
        status: "submitted"
      }
    });

    await prisma.clusterComplaint.createMany({
      data: [
        { clusterId: garbageCluster.id, complaintId: garbageComp1.id },
        { clusterId: garbageCluster.id, complaintId: garbageComp2.id }
      ]
    });

    console.log("Sample complaints and clusters seeded successfully.");
  } else {
    console.log("Sample data already exists. Skipping complaint creation.");
  }

  console.log("The system is ready for live operational data.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
