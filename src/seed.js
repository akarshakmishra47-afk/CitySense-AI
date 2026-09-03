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
      localBodyType: "Nagar Nigam",
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
      localBodyType: "Nagar Nigam",
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
      localBodyType: "Nagar Nigam",
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
      localBodyType: "Nagar Nigam",
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
      localBodyType: "Nagar Nigam",
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
      localBodyType: "Nagar Nigam",
      ward: "7"
    });

    // Generate 5 mock clusters for all 17 Nagar Nigams
    const allNigams = [
      { corp: "Agra", lat: 27.1767, lng: 78.0081 },
      { corp: "Aligarh", lat: 27.8974, lng: 78.0880 },
      { corp: "Ayodhya", lat: 26.7922, lng: 82.1998 },
      { corp: "Bareilly", lat: 28.3670, lng: 79.4304 },
      { corp: "Firozabad", lat: 27.1590, lng: 78.3957 },
      { corp: "Ghaziabad", lat: 28.6692, lng: 77.4538 },
      { corp: "Gorakhpur", lat: 26.7606, lng: 83.3732 },
      { corp: "Jhansi", lat: 25.4484, lng: 78.5685 },
      { corp: "Kanpur", lat: 26.4499, lng: 80.3319 },
      { corp: "Lucknow", lat: 26.8467, lng: 80.9462 },
      { corp: "Meerut", lat: 28.9845, lng: 77.7064 },
      { corp: "Moradabad", lat: 28.8386, lng: 78.7733 },
      { corp: "Prayagraj", lat: 25.4358, lng: 81.8463 },
      { corp: "Saharanpur", lat: 29.9640, lng: 77.5460 },
      { corp: "Shahjahanpur", lat: 27.8804, lng: 79.9126 },
      { corp: "Varanasi", lat: 25.3176, lng: 82.9739 },
      { corp: "Mathura-Vrindavan", lat: 27.4924, lng: 77.6737 }
    ];

    const problemTemplates = [
      { title: "Severe Water Contamination", cat: "Water", root: "Broken municipal pipeline crossing sewer lines." },
      { title: "Major Streetlight Outage", cat: "Streetlights", root: "Main transformer failure in the zone." },
      { title: "Widespread Pothole Clusters", cat: "Roads", root: "Poor quality asphalt washed away by monsoon." },
      { title: "Illegal Waste Dumping", cat: "Garbage", root: "Lack of designated waste bins in commercial area." },
      { title: "Sewer Line Blockage", cat: "Drainage", root: "Plastic waste accumulation in primary drainage." }
    ];

    for (const n of allNigams) {
      for (let j = 0; j < problemTemplates.length; j++) {
        const pt = problemTemplates[j];
        // Add some jitter to coords so they aren't all exactly on top of each other
        const jLat = n.lat + (Math.random() * 0.04 - 0.02);
        const jLng = n.lng + (Math.random() * 0.04 - 0.02);
        
        const statuses = ["investigating", "assigned", "in_progress", "resolved", "escalated"];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        await ComplaintCluster.create({
          title: pt.title,
          category: pt.cat,
          probableRootCause: pt.root,
          latitude: jLat,
          longitude: jLng,
          priorityScore: Math.floor(Math.random() * 50) + 40, // 40 to 90
          status: randomStatus,
          complaints: [],
          state: "Uttar Pradesh",
          municipalCorp: n.corp,
          localBodyType: "Nagar Nigam",
          ward: (Math.floor(Math.random() * 50) + 1).toString()
        });
      }
    }

    
    // --- Nagar Palika Parishad ---
    const allPalikas = [
  { corp: "Achhnera", lat: 27.8048, lng: 78.7423 },
  { corp: "Afzalgarh", lat: 28.8075, lng: 81.2096 },
  { corp: "Ahraura", lat: 26.1663, lng: 80.7394 },
  { corp: "Akbarpur", lat: 27.2243, lng: 77.8442 },
  { corp: "Aliganj", lat: 28.9468, lng: 77.7296 },
  { corp: "Amroha", lat: 28.9013, lng: 82.4222 },
  { corp: "Anupshahr", lat: 27.2736, lng: 83.1851 },
  { corp: "Aonla", lat: 28.7331, lng: 83.0946 },
  { corp: "Atarra", lat: 25.2577, lng: 80.7004 },
  { corp: "Atrauli", lat: 24.7627, lng: 80.4168 },
  { corp: "Auraiya", lat: 29.3552, lng: 82.5679 },
  { corp: "Awagarh", lat: 26.9991, lng: 82.6939 },
  { corp: "Azamgarh", lat: 24.7745, lng: 81.0759 },
  { corp: "Bachhraon", lat: 29.3778, lng: 83.7982 },
  { corp: "Baghpat", lat: 28.1887, lng: 81.4074 },
  { corp: "Bah", lat: 29.9890, lng: 83.4749 },
  { corp: "Baheri", lat: 24.5081, lng: 80.2394 },
  { corp: "Bahjoi", lat: 28.3611, lng: 78.3715 },
  { corp: "Bahraich", lat: 24.9935, lng: 83.5556 },
  { corp: "Ballia", lat: 24.1269, lng: 79.8381 },
  { corp: "Balrampur", lat: 26.7411, lng: 83.9269 },
  { corp: "Banda", lat: 24.6693, lng: 82.8963 },
  { corp: "Bangarmau", lat: 29.4748, lng: 80.6213 },
  { corp: "Bansi", lat: 29.2756, lng: 83.1183 },
  { corp: "Baraut", lat: 29.2629, lng: 80.4606 },
  { corp: "Barua Sagar", lat: 24.2336, lng: 83.5467 },
  { corp: "Basti", lat: 28.2104, lng: 82.6993 },
  { corp: "Bela Pratapgarh", lat: 24.0281, lng: 83.6829 },
  { corp: "Bhadohi", lat: 29.0109, lng: 83.9377 },
  { corp: "Bharthana", lat: 29.0205, lng: 83.5867 },
  { corp: "Bharwari", lat: 24.6976, lng: 80.3110 },
  { corp: "Bhinga", lat: 24.6095, lng: 77.8754 },
  { corp: "Bijnor", lat: 29.3203, lng: 77.5153 },
  { corp: "Bilari", lat: 26.8999, lng: 78.6386 },
  { corp: "Bilariaganj", lat: 25.6872, lng: 81.5501 },
  { corp: "Bilaspur", lat: 26.0363, lng: 81.9732 },
  { corp: "Bilgram", lat: 26.0084, lng: 83.0474 },
  { corp: "Bilhaur", lat: 26.9751, lng: 79.8558 },
  { corp: "Bilsi", lat: 25.2406, lng: 80.9683 },
  { corp: "Bindki", lat: 25.4550, lng: 82.8924 },
  { corp: "Bisalpur", lat: 24.4990, lng: 79.1240 },
  { corp: "Bisauli", lat: 24.4221, lng: 80.9282 },
  { corp: "Biswan", lat: 26.2627, lng: 83.7745 },
  { corp: "Budaun", lat: 27.1496, lng: 83.3736 },
  { corp: "Bulandshahr", lat: 25.9895, lng: 81.5982 },
  { corp: "Chandausi", lat: 26.5060, lng: 80.6039 },
  { corp: "Chandpur", lat: 25.3301, lng: 79.6447 },
  { corp: "Charkhari", lat: 26.0123, lng: 80.2226 },
  { corp: "Chhibramau", lat: 24.1041, lng: 79.4926 },
  { corp: "Chirgaon", lat: 28.5355, lng: 79.8230 },
  { corp: "Chitrakoot Dham Karwi", lat: 29.2271, lng: 83.7174 },
  { corp: "Chunar", lat: 29.5988, lng: 80.8873 },
  { corp: "Colonelganj", lat: 27.3329, lng: 82.2314 },
  { corp: "Dadri", lat: 24.8971, lng: 80.7841 },
  { corp: "Dataganj", lat: 25.4770, lng: 82.6710 },
  { corp: "Deoband", lat: 24.2693, lng: 77.8238 },
  { corp: "Deoria", lat: 24.6133, lng: 80.1057 },
  { corp: "Dhampur", lat: 27.1678, lng: 79.7268 },
  { corp: "Dhanaura", lat: 28.4848, lng: 80.5363 },
  { corp: "Dibai", lat: 28.0071, lng: 79.7502 },
  { corp: "Etah", lat: 24.0610, lng: 79.1897 },
  { corp: "Etawah", lat: 24.2884, lng: 83.9872 },
  { corp: "Etmadpur", lat: 24.8693, lng: 79.8391 },
  { corp: "Faridpur", lat: 28.2603, lng: 79.6069 },
  { corp: "Farrukhabad", lat: 24.5364, lng: 79.7900 },
  { corp: "Fatehpur", lat: 29.8095, lng: 81.7485 },
  { corp: "Fatehpur Sikri", lat: 28.5064, lng: 79.0328 },
  { corp: "Gajraula", lat: 25.2928, lng: 81.9480 },
  { corp: "Gangaghat", lat: 26.9259, lng: 77.8350 },
  { corp: "Gangoh", lat: 26.2600, lng: 80.5558 },
  { corp: "Ganj Dundawara", lat: 28.6263, lng: 82.1189 },
  { corp: "Garhmukteshwar", lat: 27.7960, lng: 81.7025 },
  { corp: "Gaura Barhaj", lat: 25.1787, lng: 82.5980 },
  { corp: "Gauriganj", lat: 25.4740, lng: 81.9163 },
  { corp: "Ghatampur", lat: 28.2002, lng: 82.1661 },
  { corp: "Ghazipur", lat: 29.6410, lng: 83.2435 },
  { corp: "Gola Gokarannath", lat: 28.6208, lng: 80.6166 },
  { corp: "Gonda", lat: 26.2641, lng: 78.6134 },
  { corp: "Gopiganj", lat: 26.9001, lng: 78.7624 },
  { corp: "Gulaothi", lat: 27.0477, lng: 80.6525 },
  { corp: "Gursahaiganj", lat: 26.2111, lng: 81.6409 },
  { corp: "Gursarai", lat: 29.3256, lng: 83.7040 },
  { corp: "Haldaur", lat: 25.3759, lng: 81.0870 },
  { corp: "Hamirpur", lat: 27.0052, lng: 81.2781 },
  { corp: "Hapur", lat: 27.5379, lng: 81.4044 },
  { corp: "Hardoi", lat: 25.7536, lng: 82.5073 },
  { corp: "Hasanpur", lat: 27.0340, lng: 82.9795 },
  { corp: "Hata", lat: 24.1460, lng: 81.3025 },
  { corp: "Hathras", lat: 25.7918, lng: 78.0984 },
  { corp: "Jahangirabad", lat: 28.8124, lng: 81.3229 },
  { corp: "Jais", lat: 28.6747, lng: 78.8816 },
  { corp: "Jalalabad", lat: 27.2019, lng: 81.1345 },
  { corp: "Jalalpur", lat: 25.5915, lng: 81.8045 },
  { corp: "Jalaun", lat: 28.6068, lng: 78.5506 },
  { corp: "Jalesar", lat: 29.3266, lng: 83.5655 },
  { corp: "Jaswantnagar", lat: 25.1913, lng: 78.7349 },
  { corp: "Jaunpur", lat: 26.2573, lng: 80.1600 },
  { corp: "Jhinjhak", lat: 25.8498, lng: 81.9861 },
  { corp: "Kaimganj", lat: 29.0063, lng: 78.3261 },
  { corp: "Kairana", lat: 27.9077, lng: 83.2216 },
  { corp: "Kakrala", lat: 25.4637, lng: 77.7286 },
  { corp: "Kalpi", lat: 28.6180, lng: 83.7446 },
  { corp: "Kandhla", lat: 28.9544, lng: 78.6549 },
  { corp: "Kannauj", lat: 27.4525, lng: 82.1936 },
  { corp: "Kasganj", lat: 29.8494, lng: 82.3656 },
  { corp: "Khair", lat: 25.3116, lng: 78.7477 },
  { corp: "Khairabad", lat: 26.4842, lng: 83.3966 },
  { corp: "Khalilabad", lat: 29.1024, lng: 80.1957 },
  { corp: "Khatauli", lat: 27.2304, lng: 83.8719 },
  { corp: "Khekada", lat: 25.7095, lng: 77.5961 },
  { corp: "Khoda", lat: 29.2099, lng: 78.6336 },
  { corp: "Khurja", lat: 26.2476, lng: 81.9120 },
  { corp: "Kiratpur", lat: 26.0951, lng: 77.9434 },
  { corp: "Konch", lat: 25.8054, lng: 77.5470 },
  { corp: "Kosi Kalan", lat: 25.2897, lng: 80.8433 },
  { corp: "Kushinagar", lat: 24.4579, lng: 80.6620 },
  { corp: "Laharpur", lat: 27.3469, lng: 77.5823 },
  { corp: "Lakhimpur", lat: 25.3342, lng: 82.7683 },
  { corp: "Lalitpur", lat: 24.4431, lng: 80.3127 },
  { corp: "Loni", lat: 26.5834, lng: 81.0473 },
  { corp: "Maharajganj", lat: 27.0979, lng: 78.7983 },
  { corp: "Mahmoodabad", lat: 26.1442, lng: 79.0800 },
  { corp: "Mahoba", lat: 25.8915, lng: 82.1018 },
  { corp: "Mainpuri", lat: 26.6816, lng: 83.2826 },
  { corp: "Mallawan", lat: 27.8020, lng: 79.1850 },
  { corp: "Manjhanpur", lat: 28.1418, lng: 79.3252 },
  { corp: "Marhara", lat: 24.4343, lng: 82.7341 },
  { corp: "Mau", lat: 29.4920, lng: 78.4984 },
  { corp: "Maudaha", lat: 25.7974, lng: 79.2616 },
  { corp: "Mauranipur", lat: 28.4348, lng: 81.9214 },
  { corp: "Mawana", lat: 26.2110, lng: 78.8728 },
  { corp: "Milak", lat: 25.1977, lng: 80.8660 },
  { corp: "Mirzapur", lat: 24.5316, lng: 79.0917 },
  { corp: "Misrikh Neemsar", lat: 29.5578, lng: 79.5285 },
  { corp: "Modinagar", lat: 29.1869, lng: 81.3336 },
  { corp: "Mohammadabad", lat: 24.6914, lng: 81.7401 },
  { corp: "Mohammadi", lat: 27.2537, lng: 78.0155 },
  { corp: "Mubarakpur", lat: 25.8501, lng: 81.4256 },
  { corp: "Mungra Badshahpur", lat: 25.5159, lng: 77.7641 },
  { corp: "Muradnagar", lat: 27.0968, lng: 81.6200 },
  { corp: "Muzaffarnagar", lat: 28.4472, lng: 81.6187 },
  { corp: "Nagina", lat: 28.1384, lng: 78.6022 },
  { corp: "Najibabad", lat: 26.7864, lng: 81.0042 },
  { corp: "Nakur", lat: 29.5380, lng: 82.0069 },
  { corp: "Nanpara", lat: 26.7103, lng: 82.4526 },
  { corp: "Nautanwa", lat: 28.5859, lng: 78.3696 },
  { corp: "Nawabganj", lat: 26.7709, lng: 80.3060 },
  { corp: "Nehtaur", lat: 28.6636, lng: 79.0544 },
  { corp: "Noorpur", lat: 27.3961, lng: 77.9010 },
  { corp: "Orai", lat: 26.5167, lng: 77.9470 },
  { corp: "Padrauna", lat: 24.3266, lng: 82.9127 },
  { corp: "Paliya Kalan", lat: 25.4995, lng: 79.5636 },
  { corp: "Pihani", lat: 28.1329, lng: 83.0019 },
  { corp: "Pilibhit", lat: 24.0419, lng: 83.0669 },
  { corp: "Pilkhuwa", lat: 27.4055, lng: 77.8081 },
  { corp: "Powayan", lat: 26.6383, lng: 79.6673 },
  { corp: "Pt. Deen Dayal Upadhyaya Nagar", lat: 26.4165, lng: 81.8819 },
  { corp: "Pukhrayan", lat: 27.9779, lng: 80.5439 },
  { corp: "Puranpur", lat: 25.7725, lng: 81.1348 },
  { corp: "Raebareli", lat: 26.7932, lng: 82.6469 },
  { corp: "Rampur", lat: 29.5247, lng: 82.1592 },
  { corp: "Rasara", lat: 24.0742, lng: 81.7243 },
  { corp: "Rath", lat: 26.5017, lng: 79.6499 },
  { corp: "Robertsganj", lat: 24.5816, lng: 80.3292 },
  { corp: "Rudauli", lat: 26.2949, lng: 82.6727 },
  { corp: "Sahaswan", lat: 26.9021, lng: 80.6358 },
  { corp: "Sambhal", lat: 26.9886, lng: 83.2284 },
  { corp: "Samthar", lat: 25.0218, lng: 80.5870 },
  { corp: "Sandi", lat: 28.9136, lng: 80.9249 },
  { corp: "Sandila", lat: 24.7052, lng: 81.6131 },
  { corp: "Sardhana", lat: 24.7475, lng: 78.2380 },
  { corp: "Sarsawa", lat: 24.7403, lng: 79.0314 },
  { corp: "Seohara", lat: 27.5294, lng: 82.6636 },
  { corp: "Shahabad", lat: 25.2641, lng: 81.0022 },
  { corp: "Shahganj", lat: 25.3667, lng: 79.8526 },
  { corp: "Shamli", lat: 27.0316, lng: 80.6681 },
  { corp: "Shamsabad", lat: 29.7152, lng: 81.8140 },
  { corp: "Sherkot", lat: 24.8493, lng: 82.6266 },
  { corp: "Shikarpur", lat: 25.2727, lng: 79.3396 },
  { corp: "Shikohabad", lat: 28.7359, lng: 78.4782 },
  { corp: "Siddharthanagar", lat: 29.1132, lng: 81.0161 },
  { corp: "Sikandra Rao", lat: 28.0049, lng: 81.7973 },
  { corp: "Sikandrabad", lat: 27.1289, lng: 78.2228 },
  { corp: "Sirsaganj", lat: 27.8360, lng: 80.3756 },
  { corp: "Siswa Bazar", lat: 27.0042, lng: 82.2150 },
  { corp: "Sitapur", lat: 25.7792, lng: 80.8734 },
  { corp: "Soron", lat: 28.9987, lng: 83.6624 },
  { corp: "Suar", lat: 28.2393, lng: 83.3405 },
  { corp: "Sultanpur", lat: 27.1358, lng: 78.9305 },
  { corp: "Syana", lat: 27.5908, lng: 79.6225 },
  { corp: "Tanda", lat: 27.9621, lng: 81.8269 },
  { corp: "Thakurdwara", lat: 24.0103, lng: 80.3552 },
  { corp: "Tilhar", lat: 24.1269, lng: 78.1131 },
  { corp: "Tundla", lat: 27.6627, lng: 82.0987 },
  { corp: "Ujhani", lat: 28.7304, lng: 83.2737 },
  { corp: "Unnao", lat: 29.0315, lng: 83.7483 },
  { corp: "Utraula", lat: 24.4680, lng: 79.3996 },
  { corp: "Zamania", lat: 26.4495, lng: 83.4226 },
];

    
    for (const p of allPalikas) {
      for (let j = 0; j < problemTemplates.length; j++) {
        const pt = problemTemplates[j];
        const jLat = parseFloat(p.lat) + (Math.random() * 0.04 - 0.02);
        const jLng = parseFloat(p.lng) + (Math.random() * 0.04 - 0.02);
        
        const statuses = ["investigating", "assigned", "in_progress", "resolved", "escalated"];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        await ComplaintCluster.create({
          title: pt.title,
          category: pt.cat,
          probableRootCause: pt.root,
          latitude: jLat,
          longitude: jLng,
          priorityScore: Math.floor(Math.random() * 50) + 30, // 30 to 80
          status: randomStatus,
          complaints: [],
          state: "Uttar Pradesh",
          municipalCorp: p.corp,
          localBodyType: "Nagar Palika Parishad",
          ward: (Math.floor(Math.random() * 20) + 1).toString()
        });
      }
    }

// --- Nagar Panchayat ---
const allPanchayats = [{"name":"Dayalbagh","lat":29.8344,"lng":81.5694},{"name":"Fatehabad","lat":26.3092,"lng":79.135},{"name":"Jagner","lat":24.8808,"lng":84.0729},{"name":"Kheragarh","lat":29.4198,"lng":83.171},{"name":"Kuraoli","lat":25.8557,"lng":84.4103},{"name":"Pinahat","lat":24.3107,"lng":80.6927},{"name":"Swamibagh","lat":24.5394,"lng":83.9095},{"name":"Barauli","lat":26.1368,"lng":79.9034},{"name":"Beswan","lat":27.5177,"lng":82.6453},{"name":"Chandaus","lat":28.7288,"lng":79.6143},{"name":"Chharra","lat":29.1544,"lng":79.377},{"name":"Gabhana","lat":26.4777,"lng":84.5995},{"name":"Harduaganj","lat":25.4733,"lng":84.0314},{"name":"Iglas","lat":27.717,"lng":81.1962},{"name":"Jalali","lat":26.8834,"lng":78.7551},{"name":"Jattari","lat":30.0123,"lng":78.6369},{"name":"Jawan Sikandarpur","lat":25.9652,"lng":77.2519},{"name":"Kauriaganj","lat":28.0395,"lng":83.3836},{"name":"Madrak","lat":29.6684,"lng":81.5609},{"name":"Pilkhana","lat":23.8899,"lng":81.9789},{"name":"Pisawa","lat":29.4052,"lng":79.4424},{"name":"Tappal","lat":24.2696,"lng":81.8421},{"name":"Vijaigarh","lat":24.0457,"lng":84.3949},{"name":"Ashrafpur Kichhauchha","lat":25.0596,"lng":78.4803},{"name":"Iltifatganj","lat":24.0854,"lng":80.7584},{"name":"Jahangirganj","lat":29.3382,"lng":81.4109},{"name":"Rajesultanpur","lat":23.9992,"lng":82.8536},{"name":"Musafirkhana","lat":28.0345,"lng":77.6093},{"name":"Joya","lat":26.5208,"lng":81.9036},{"name":"Naugawan Sadat","lat":25.5606,"lng":83.5825},{"name":"Saidangali","lat":25.088,"lng":84.1556},{"name":"Ujhari","lat":24.2266,"lng":78.9137},{"name":"Achhalda","lat":27.2126,"lng":81.4631},{"name":"Atasu","lat":26.1366,"lng":83.6675},{"name":"Babarpur Ajitmal","lat":28.3145,"lng":77.9626},{"name":"Bidhuna","lat":26.1923,"lng":81.0347},{"name":"Dibiyapur","lat":25.89,"lng":80.7725},{"name":"Phaphund","lat":27.0238,"lng":82.6825},{"name":"Bhadarsa","lat":26.5919,"lng":82.5616},{"name":"Bikapur","lat":29.04,"lng":81.3467},{"name":"Goshainganj","lat":27.5124,"lng":82.6113},{"name":"Khirauni Suchittaganj","lat":24.2692,"lng":84.3047},{"name":"Kumarganj","lat":28.1191,"lng":84.32},{"name":"Maa Kamakhya","lat":24.4448,"lng":77.3904},{"name":"Atraulia","lat":30.0713,"lng":81.1202},{"name":"Azmatgarh","lat":25.8167,"lng":77.0801},{"name":"Budhanpur","lat":28.3944,"lng":77.3077},{"name":"Jahanaganj Bazar","lat":28.3287,"lng":82.558},{"name":"Jiyanpur","lat":25.8183,"lng":84.0016},{"name":"Katghar Lalganj","lat":27.8534,"lng":83.9933},{"name":"Mahul","lat":26.7344,"lng":80.6767},{"name":"Martinganj","lat":26.0825,"lng":78.9045},{"name":"Mehnagar","lat":28.2854,"lng":83.223},{"name":"Nizamabad","lat":25.4287,"lng":80.0095},{"name":"Phulpur","lat":25.9544,"lng":80.5294},{"name":"Sarai Mir","lat":29.0685,"lng":77.6349},{"name":"Aminagar Sarai","lat":26.7691,"lng":83.4577},{"name":"Chhaprauli","lat":28.0855,"lng":81.0234},{"name":"Doghat","lat":29.1367,"lng":78.1799},{"name":"Rataul","lat":28.6236,"lng":79.6251},{"name":"Tatiri","lat":27.3153,"lng":77.1334},{"name":"Tikri","lat":25.3882,"lng":83.5565},{"name":"Jarwal","lat":29.693,"lng":82.8647},{"name":"Kaiserganj","lat":28.5874,"lng":79.4263},{"name":"Mihipurwa","lat":26.4403,"lng":77.6977},{"name":"Payagpur","lat":26.9869,"lng":79.0264},{"name":"Risia","lat":25.2081,"lng":81.4735},{"name":"Rupaidiha","lat":24.8269,"lng":77.0525},{"name":"Bairia","lat":25.3952,"lng":81.9937},{"name":"Bansdih","lat":27.8444,"lng":78.4443},{"name":"Belthara Road","lat":29.1291,"lng":83.9964},{"name":"Chitbara Gaon","lat":24.59,"lng":81.0286},{"name":"Maniyar","lat":27.3342,"lng":77.0223},{"name":"Nagra","lat":24.3759,"lng":79.4878},{"name":"Ratsar Kalan","lat":29.9646,"lng":78.098},{"name":"Reoti","lat":29.9711,"lng":77.9383},{"name":"Sahatwar","lat":28.3927,"lng":82.666},{"name":"Sikanderpur","lat":30.1305,"lng":77.8506},{"name":"Gainsari","lat":28.466,"lng":78.4302},{"name":"Pachperwa","lat":26.0401,"lng":83.4584},{"name":"Tulsipur","lat":24.9586,"lng":77.5863},{"name":"Baberu","lat":25.1444,"lng":81.1999},{"name":"Bisanda","lat":26.2357,"lng":83.4021},{"name":"Mataundh","lat":28.9575,"lng":79.7359},{"name":"Naraini","lat":27.0098,"lng":79.6661},{"name":"Oran","lat":25.1925,"lng":78.4201},{"name":"Tindwari","lat":29.823,"lng":78.5128},{"name":"Banki","lat":25.8135,"lng":78.6696},{"name":"Belahra","lat":29.6457,"lng":80.2535},{"name":"Dariyabad","lat":26.8343,"lng":83.922},{"name":"Dewa","lat":24.3335,"lng":78.7122},{"name":"Haidergarh","lat":28.6982,"lng":83.1764},{"name":"Ramnagar","lat":29.4605,"lng":80.2297},{"name":"Ram Sanehi Ghat","lat":25.7275,"lng":80.0622},{"name":"Satrikh","lat":26.9434,"lng":81.1437},{"name":"Siddhaur","lat":23.9559,"lng":81.5724},{"name":"Subeha","lat":24.1393,"lng":81.5445},{"name":"Tikait Nagar","lat":28.7518,"lng":83.6205},{"name":"Zaidpur","lat":26.6939,"lng":82.0882},{"name":"Bisharatganj","lat":29.5707,"lng":83.1654},{"name":"Deoranian","lat":24.7106,"lng":84.3969},{"name":"Dhaura Tanda","lat":26.2051,"lng":77.2153},{"name":"Fatehganj Pashchimi","lat":23.8815,"lng":82.201},{"name":"Fatehganj Purvi","lat":28.1081,"lng":80.1493},{"name":"Mirganj","lat":27.4454,"lng":84.2957},{"name":"Rathaura","lat":25.8313,"lng":78.1099},{"name":"Richha","lat":23.8037,"lng":80.9484},{"name":"Sainthal","lat":27.3212,"lng":84.1214},{"name":"Shahi","lat":24.5518,"lng":78.1348},{"name":"Shergarh","lat":27.2779,"lng":78.3751},{"name":"Shishgarh","lat":25.1164,"lng":79.2118},{"name":"Sirauli","lat":28.253,"lng":82.0337},{"name":"Thiriya Nizamat Khan","lat":27.7156,"lng":81.0968},{"name":"Babhnan Bazar","lat":24.307,"lng":84.3388},{"name":"Bankati","lat":24.3483,"lng":77.3882},{"name":"Bhanpur","lat":29.8499,"lng":80.3033},{"name":"Ganeshpur","lat":28.6035,"lng":83.5177},{"name":"Gayghat","lat":25.1773,"lng":83.2776},{"name":"Harraiya","lat":27.6216,"lng":78.0935},{"name":"Kaptanganj","lat":25.9304,"lng":81.9983},{"name":"Munderwa","lat":24.8581,"lng":84.3802},{"name":"Nagar Bazar","lat":24.6582,"lng":77.2552},{"name":"Rudhauli Bazar","lat":24.8997,"lng":82.6637},{"name":"Ghosia","lat":29.1948,"lng":78.7055},{"name":"Gyanpur","lat":24.1751,"lng":77.3944},{"name":"Khamaria","lat":29.6075,"lng":84.3261},{"name":"Nai Bazar","lat":25.3916,"lng":83.0727},{"name":"Suriyawan","lat":28.5359,"lng":80.0975},{"name":"Barhapur","lat":29.5796,"lng":80.3296},{"name":"Jhalu","lat":25.6184,"lng":82.613},{"name":"Mandawar","lat":28.0013,"lng":79.5622},{"name":"Sahanpur","lat":29.2699,"lng":78.0307},{"name":"Sahaspur","lat":28.946,"lng":80.9969},{"name":"Alapur","lat":30.1983,"lng":83.5186},{"name":"Dahgawan","lat":27.3937,"lng":78.9055},{"name":"Faizganj","lat":30.1629,"lng":78.1563},{"name":"Gulariya","lat":26.0214,"lng":83.8975},{"name":"Islamnagar","lat":27.4832,"lng":83.1534},{"name":"Kachhla","lat":30.1705,"lng":80.9755},{"name":"Kunwargaon","lat":26.1403,"lng":80.099},{"name":"Mudiya","lat":25.8117,"lng":82.0505},{"name":"Rudayan","lat":25.2847,"lng":79.6217},{"name":"Saidpur","lat":25.5162,"lng":79.6785},{"name":"Sakhanu","lat":27.1691,"lng":77.6643},{"name":"Usawan","lat":25.4947,"lng":79.4916},{"name":"Usehat","lat":28.7157,"lng":80.9863},{"name":"Wazirganj","lat":27.4902,"lng":81.0299},{"name":"Aurangabad","lat":24.2781,"lng":78.0524},{"name":"Bhawan Bahadur Nagar","lat":25.7469,"lng":80.4619},{"name":"Bugrasi","lat":28.0763,"lng":78.438},{"name":"Chhatari","lat":26.943,"lng":78.908},{"name":"Kakod","lat":26.651,"lng":80.3787},{"name":"Khanpur","lat":28.8969,"lng":84.004},{"name":"Narora","lat":28.4389,"lng":79.9559},{"name":"Pahasu","lat":29.2876,"lng":81.6567},{"name":"Chakia","lat":25.8734,"lng":78.9476},{"name":"Saiyad Raja","lat":25.9816,"lng":78.6821},{"name":"Manikpur","lat":26.0498,"lng":80.6365},{"name":"Rajapur","lat":27.8356,"lng":81.2635},{"name":"Baitalpur","lat":26.1104,"lng":79.2378},{"name":"Bariyarpur","lat":27.5929,"lng":82.2957},{"name":"Bhaluani","lat":27.4496,"lng":77.8087},{"name":"Bhatni","lat":24.743,"lng":79.3599},{"name":"Bhatpar Rani","lat":26.4098,"lng":81.0172},{"name":"Gauri Bazar","lat":24.5812,"lng":81.9644},{"name":"Hetimpur","lat":28.6879,"lng":84.0843},{"name":"Lar","lat":24.5899,"lng":83.5413},{"name":"Madanpur","lat":28.3639,"lng":81.2096},{"name":"Majhauli Raj","lat":24.051,"lng":78.9551},{"name":"Pathardeva","lat":25.1046,"lng":79.8489},{"name":"Rampur Karkhana","lat":29.5691,"lng":81.4233},{"name":"Rudrapur","lat":25.991,"lng":82.8271},{"name":"Salempur","lat":29.5133,"lng":81.3976},{"name":"Tarkulwa","lat":27.2984,"lng":80.4059},{"name":"Jaithara","lat":24.09,"lng":78.6001},{"name":"Mirehachi","lat":27.5804,"lng":83.4059},{"name":"Nidhauli Kalan","lat":26.9333,"lng":80.8485},{"name":"Raja Ka Rampur","lat":24.4301,"lng":78.2349},{"name":"Sakit","lat":29.4068,"lng":81.7563},{"name":"Bakewar","lat":28.0051,"lng":80.687},{"name":"Ekdil","lat":29.345,"lng":81.6271},{"name":"Lakhna","lat":25.9307,"lng":81.6509},{"name":"Kamalganj","lat":29.6784,"lng":78.169},{"name":"Kampil","lat":25.1416,"lng":84.5287},{"name":"Khimsepur","lat":26.4682,"lng":82.007},{"name":"Sankisa Basantpur","lat":29.3228,"lng":80.5471},{"name":"Asothar","lat":23.8711,"lng":78.6687},{"name":"Bahuwa","lat":24.9217,"lng":79.9008},{"name":"Hathgaon","lat":26.8043,"lng":78.0274},{"name":"Karikan Dhata","lat":29.2603,"lng":83.6883},{"name":"Khaga","lat":25.9351,"lng":80.9357},{"name":"Khakhreru","lat":29.6414,"lng":84.3747},{"name":"Kishunpur","lat":24.1749,"lng":78.2855},{"name":"Kora Jahanabad","lat":26.8935,"lng":79.4675},{"name":"Eka","lat":25.4786,"lng":77.4008},{"name":"Fariha","lat":24.8117,"lng":80.3742},{"name":"Jasrana","lat":26.1259,"lng":80.5935},{"name":"Makkhanpur","lat":24.1048,"lng":81.4644},{"name":"Dankaur","lat":26.9537,"lng":83.7865},{"name":"Jahangirpur","lat":29.5916,"lng":77.1911},{"name":"Jewar","lat":29.6942,"lng":84.2285},{"name":"Rabupura","lat":25.0954,"lng":82.4872},{"name":"Khoda-Makanpur","lat":24.8933,"lng":81.2254},{"name":"Dasna","lat":24.1458,"lng":82.5497},{"name":"Faridnagar","lat":29.3093,"lng":78.3252},{"name":"Niwari","lat":28.8526,"lng":78.7837},{"name":"Patala","lat":27.4451,"lng":77.4889},{"name":"Bahadurganj","lat":27.1741,"lng":80.3631},{"name":"Dildarnagar","lat":28.6661,"lng":78.943},{"name":"Jangipur","lat":26.4198,"lng":84.0753},{"name":"Sadat","lat":25.8698,"lng":83.6177},{"name":"Saidpur","lat":25.157,"lng":80.753},{"name":"Belsar","lat":28.0191,"lng":77.1995},{"name":"Dhanepur","lat":23.9204,"lng":84.1601},{"name":"Katra","lat":28.8117,"lng":77.464},{"name":"Khargupur","lat":27.1466,"lng":81.9175},{"name":"Mankapur","lat":24.6769,"lng":77.7731},{"name":"Paraspur","lat":25.3269,"lng":83.7032},{"name":"Tarabganj","lat":28.7138,"lng":78.1564},{"name":"Bansgaon","lat":28.933,"lng":83.6926},{"name":"Barhalganj","lat":24.4562,"lng":78.9168},{"name":"Campierganj","lat":30.098,"lng":81.9399},{"name":"Ghaghsara Bazar","lat":25.9891,"lng":83.475},{"name":"Gola Bazar","lat":25.5519,"lng":79.5174},{"name":"Kasba Sangrampur Unwal","lat":29.5608,"lng":84.0321},{"name":"Mundera Bazar","lat":26.0312,"lng":83.536},{"name":"Pipiganj","lat":29.3221,"lng":78.0969},{"name":"Pipraich","lat":29.3254,"lng":81.429},{"name":"Sahjanwan","lat":29.3678,"lng":81.7724},{"name":"Uruwa Bazar","lat":28.2943,"lng":77.9596},{"name":"Gohand","lat":29.8904,"lng":77.401},{"name":"Kurara","lat":27.6329,"lng":84.5629},{"name":"Sarila","lat":28.6476,"lng":83.1977},{"name":"Sumerpur","lat":27.9088,"lng":82.9969},{"name":"Babugarh","lat":29.1133,"lng":82.7749},{"name":"Beniganj","lat":27.0479,"lng":83.0552},{"name":"Gopamau","lat":29.1695,"lng":80.29},{"name":"Kachhauna Patseni","lat":27.0201,"lng":84.4938},{"name":"Kursath","lat":25.0333,"lng":78.3651},{"name":"Madhoganj","lat":27.8265,"lng":78.7818},{"name":"Pali","lat":25.3631,"lng":84.2676},{"name":"Hasayan","lat":26.142,"lng":84.3514},{"name":"Mendu","lat":30.1494,"lng":80.9834},{"name":"Mursan","lat":25.5873,"lng":79.6071},{"name":"Purdilnagar","lat":28.2771,"lng":78.3693},{"name":"Sadabad","lat":29.88,"lng":77.4721},{"name":"Sahpau","lat":27.4191,"lng":81.1441},{"name":"Sasni","lat":24.0957,"lng":82.048},{"name":"Ait","lat":25.0992,"lng":79.8539},{"name":"Kadaura","lat":26.5135,"lng":80.7518},{"name":"Kotra","lat":26.1945,"lng":77.0647},{"name":"Madhogarh","lat":26.0487,"lng":79.4188},{"name":"Nadigaon","lat":29.1736,"lng":78.2212},{"name":"Rampura","lat":28.6604,"lng":81.6506},{"name":"Umri","lat":24.4514,"lng":77.2149},{"name":"Badlapur","lat":25.6362,"lng":83.9769},{"name":"Gaurabadshahpur","lat":23.961,"lng":79.4254},{"name":"Jafarabad","lat":28.4226,"lng":79.0943},{"name":"Kajgaon","lat":30.122,"lng":82.8046},{"name":"Kerakat","lat":26.061,"lng":82.7401},{"name":"Kheta Sarai","lat":28.2325,"lng":81.1114},{"name":"Machhlishahr","lat":28.7169,"lng":77.5395},{"name":"Mariahu","lat":29.2285,"lng":78.8088},{"name":"Bada Gaon","lat":25.2741,"lng":79.9989},{"name":"Erich","lat":28.0791,"lng":77.7726},{"name":"Garautha","lat":24.0558,"lng":84.3698},{"name":"Kathera","lat":30.1896,"lng":78.3822},{"name":"Moth","lat":30.0613,"lng":83.9871},{"name":"Ranipur","lat":26.0201,"lng":81.3302},{"name":"Tondi Fatehpur","lat":29.2566,"lng":84.3732},{"name":"Samdhan","lat":26.2478,"lng":79.5704},{"name":"Saurikh","lat":28.2123,"lng":81.4056},{"name":"Sikanderpur","lat":26.6094,"lng":78.4718},{"name":"Talgram","lat":28.6346,"lng":77.0533},{"name":"Tirwaganj","lat":27.1574,"lng":80.2341},{"name":"Amraudha","lat":28.871,"lng":82.5382},{"name":"Derapur","lat":29.9655,"lng":78.1801},{"name":"Kanchausi","lat":25.5905,"lng":81.0491},{"name":"Musanagar","lat":26.0898,"lng":79.603},{"name":"Rajpur","lat":25.9307,"lng":81.3131},{"name":"Rania","lat":27.0368,"lng":79.2134},{"name":"Rasulabad","lat":25.6792,"lng":83.8591},{"name":"Rura","lat":29.9082,"lng":77.7757},{"name":"Shivli","lat":24.8718,"lng":83.3661},{"name":"Sikandara","lat":26.9234,"lng":77.3368},{"name":"Bithoor","lat":27.6272,"lng":78.5282},{"name":"Shivrajpur","lat":25.9762,"lng":80.4692},{"name":"Amanpur","lat":24.72,"lng":78.3414},{"name":"Bhargain","lat":25.6458,"lng":77.2188},{"name":"Bilram","lat":30.0838,"lng":83.2227},{"name":"Mohanpur","lat":27.4986,"lng":81.5561},{"name":"Patiyali","lat":24.1644,"lng":82.7383},{"name":"Sahawar","lat":25.501,"lng":77.7493},{"name":"Sidhpura","lat":29.8835,"lng":83.7994},{"name":"Ajhuwa","lat":25.1541,"lng":78.5376},{"name":"Chail","lat":29.2176,"lng":81.9377},{"name":"Charwa","lat":27.4871,"lng":83.2205},{"name":"Karari","lat":27.8318,"lng":80.3222},{"name":"Purab-Pashchim Sharira","lat":30.1692,"lng":78.573},{"name":"Sarai Aquil","lat":27.0115,"lng":77.0708},{"name":"Sirathu","lat":27.9148,"lng":83.7223},{"name":"Chhitauni","lat":28.3841,"lng":83.5011},{"name":"Dudahi","lat":26.8729,"lng":83.3257},{"name":"Kaptanganj","lat":29.8608,"lng":79.486},{"name":"Khadda","lat":25.5806,"lng":79.3488},{"name":"Fazilnagar","lat":24.6846,"lng":78.2008},{"name":"Mathauli","lat":29.4906,"lng":80.7062},{"name":"Ramkola","lat":25.8963,"lng":82.3095},{"name":"Sewarhi","lat":24.7416,"lng":80.0262},{"name":"Sukrauli","lat":29.3795,"lng":80.4611},{"name":"Tamkuhi Raj","lat":29.4205,"lng":81.9544},{"name":"Palia Kalan","lat":26.1648,"lng":77.4012},{"name":"Bardar","lat":26.4417,"lng":80.7215},{"name":"Bhira","lat":27.8738,"lng":81.216},{"name":"Dhaurahra","lat":27.6824,"lng":81.1778},{"name":"Kheri","lat":29.0311,"lng":78.9115},{"name":"Mailani","lat":24.0186,"lng":82.7821},{"name":"Nighasan","lat":28.7591,"lng":78.6433},{"name":"Oel Dhakwa","lat":28.8722,"lng":77.0716},{"name":"Singahi Bhiraura","lat":27.3255,"lng":80.3666},{"name":"Mahroni","lat":29.2156,"lng":79.5129},{"name":"Pali","lat":29.3545,"lng":78.2331},{"name":"Talbehat","lat":26.062,"lng":79.4128},{"name":"Bakshi Ka Talab","lat":24.8613,"lng":79.1356},{"name":"Banthra","lat":26.0711,"lng":81.5871},{"name":"Gosainganj","lat":24.1944,"lng":80.8417},{"name":"Itaunja","lat":27.8367,"lng":81.0159},{"name":"Kakori","lat":27.8059,"lng":81.0628},{"name":"Mahona","lat":23.9635,"lng":78.4128},{"name":"Malihabad","lat":24.2802,"lng":82.7251},{"name":"Mohanlalganj","lat":29.0611,"lng":78.0601},{"name":"Nagram","lat":28.2763,"lng":83.0128},{"name":"Anandnagar","lat":26.8145,"lng":78.8028},{"name":"Brijmanganj","lat":25.8375,"lng":83.0518},{"name":"Chowk","lat":27.0337,"lng":84.2151},{"name":"Ghughali","lat":27.6465,"lng":83.0059},{"name":"Nichlaul","lat":28.0889,"lng":81.5543},{"name":"Paniyara","lat":27.2539,"lng":77.9522},{"name":"Partawal","lat":27.0692,"lng":82.8753},{"name":"Sonauli","lat":29.7241,"lng":79.9643},{"name":"Kabrai","lat":28.6741,"lng":81.0297},{"name":"Kharela","lat":30.0419,"lng":82.5034},{"name":"Kulpahar","lat":28.6994,"lng":81.2016},{"name":"Barnahal","lat":29.1065,"lng":77.6781},{"name":"Bewar","lat":29.183,"lng":83.3426},{"name":"Bhogaon","lat":25.277,"lng":81.6546},{"name":"Ghiraur","lat":28.2363,"lng":77.4296},{"name":"Jyoti Khuria","lat":30.0418,"lng":79.3569},{"name":"Karhal","lat":23.985,"lng":78.4199},{"name":"Kishni","lat":28.4474,"lng":84.203},{"name":"Kuraoli","lat":29.746,"lng":80.7782},{"name":"Kusmara","lat":24.9643,"lng":82.4588},{"name":"Bajna","lat":29.8809,"lng":77.1815},{"name":"Baldev","lat":27.7566,"lng":80.8719},{"name":"Barsana","lat":25.9249,"lng":84.4566},{"name":"Chaumuhan","lat":24.1211,"lng":83.2432},{"name":"Chhata","lat":24.0611,"lng":78.0923},{"name":"Farah","lat":25.0235,"lng":78.196},{"name":"Gokul","lat":28.0248,"lng":80.5152},{"name":"Goverdhan","lat":27.6391,"lng":77.4419},{"name":"Mahaban","lat":23.9302,"lng":83.0479},{"name":"Nandgaon","lat":24.9209,"lng":82.8938},{"name":"Radha Kund","lat":28.5093,"lng":81.7819},{"name":"Raya","lat":27.6715,"lng":79.042},{"name":"Saunkh","lat":26.965,"lng":78.1735},{"name":"Adari","lat":29.2949,"lng":78.9199},{"name":"Amila","lat":26.1139,"lng":77.8413},{"name":"Chiraiyakot","lat":25.8096,"lng":80.3432},{"name":"Dohrighat","lat":26.6728,"lng":78.5688},{"name":"Ghosi","lat":25.9823,"lng":78.9775},{"name":"Kopaganj","lat":24.104,"lng":80.3257},{"name":"Kurthi Jafarpur","lat":26.3364,"lng":77.435},{"name":"Madhuban","lat":27.7678,"lng":83.8966},{"name":"Mohammadabad Gohna","lat":29.0057,"lng":82.3534},{"name":"Walidpur","lat":26.2559,"lng":82.824},{"name":"Bahsuma","lat":28.0818,"lng":77.5919},{"name":"Daurala","lat":26.8448,"lng":82.6464},{"name":"Harra","lat":27.3567,"lng":77.7788},{"name":"Hastinapur","lat":27.9717,"lng":80.2769},{"name":"Karnawal","lat":25.1417,"lng":77.2424},{"name":"Kharkhauda","lat":26.0225,"lng":81.8268},{"name":"Khiwai","lat":24.4075,"lng":81.1053},{"name":"Lawar","lat":27.4973,"lng":78.2962},{"name":"Parikshitgarh","lat":27.6229,"lng":81.829},{"name":"Sewalkhas","lat":27.8166,"lng":84.0224},{"name":"Kachhwa","lat":26.9288,"lng":78.4494},{"name":"Agwanpur","lat":29.1266,"lng":77.8245},{"name":"Bhojpur Dharampur","lat":24.1993,"lng":81.9732},{"name":"Dhakia","lat":27.1763,"lng":79.8926},{"name":"Kanth","lat":28.1063,"lng":81.2051},{"name":"Kundarki","lat":25.1991,"lng":81.7659},{"name":"Mehmoodpur Maafi","lat":24.2751,"lng":80.5298},{"name":"Pakbara","lat":25.9325,"lng":81.5849},{"name":"Umri Kalan","lat":26.0371,"lng":79.2197},{"name":"Bhokarhedi","lat":27.5478,"lng":77.7294},{"name":"Budhana","lat":24.271,"lng":77.7632},{"name":"Charthaval","lat":24.5306,"lng":80.5116},{"name":"Jansath","lat":30.1179,"lng":78.552},{"name":"Miranpur","lat":24.1032,"lng":84.1609},{"name":"Purkazi","lat":29.2999,"lng":79.8933},{"name":"Shahpur","lat":30.1894,"lng":81.1107},{"name":"Sisauli","lat":26.235,"lng":81.8148},{"name":"Barkhera","lat":26.345,"lng":83.9506},{"name":"Bilsanda","lat":27.8208,"lng":82.7404},{"name":"Gularia Bhindara","lat":29.1781,"lng":77.8284},{"name":"Jahanabad","lat":28.0681,"lng":79.9229},{"name":"Kalinagar","lat":24.2709,"lng":77.6482},{"name":"Nyoria Husainpur","lat":29.6277,"lng":79.9361},{"name":"Pakariya Naugawan","lat":27.623,"lng":77.4809},{"name":"Antu","lat":29.5384,"lng":82.3259},{"name":"Dhakwa","lat":23.9441,"lng":80.8407},{"name":"Garwara Bazar","lat":28.9858,"lng":83.8894},{"name":"Hiraganj Bazar","lat":26.1347,"lng":79.8044},{"name":"Katra Gulab Singh","lat":25.1815,"lng":77.5115},{"name":"Katra Medniganj","lat":26.503,"lng":84.0691},{"name":"Kohdaur","lat":29.9163,"lng":82.655},{"name":"Kunda","lat":24.4074,"lng":84.3063},{"name":"Lalganj Ajhara","lat":24.3124,"lng":77.7471},{"name":"Manikpur","lat":24.8838,"lng":78.1427},{"name":"Patti","lat":29.7598,"lng":83.7204},{"name":"Pratapgarh City","lat":26.6214,"lng":82.146},{"name":"Prithviganj","lat":26.4035,"lng":81.6987},{"name":"Ramganj","lat":27.7954,"lng":80.9777},{"name":"Raniganj","lat":26.4528,"lng":81.7365},{"name":"Suwansa Bazar","lat":27.7495,"lng":77.1879},{"name":"Bharatganj","lat":24.1134,"lng":82.9913},{"name":"Handia","lat":25.3265,"lng":80.0491},{"name":"Jhusi","lat":28.8406,"lng":80.6176},{"name":"Koraon","lat":29.4184,"lng":83.4147},{"name":"Lal Gopalganj","lat":23.9635,"lng":84.0487},{"name":"Mau Aima","lat":27.5771,"lng":84.1326},{"name":"Phulpur","lat":28.1035,"lng":83.0696},{"name":"Shankargarh","lat":25.0672,"lng":80.4209},{"name":"Sirsa","lat":29.7994,"lng":78.3721},{"name":"Bachhrawan","lat":25.1896,"lng":77.7971},{"name":"Dalmau","lat":25.4819,"lng":83.4423},{"name":"Lalganj","lat":25.9734,"lng":79.9343},{"name":"Nasirabad","lat":30.0077,"lng":83.3247},{"name":"Parsadepur","lat":24.503,"lng":83.2},{"name":"Salon","lat":27.2883,"lng":81.5874},{"name":"Shivgarh","lat":24.9997,"lng":81.7695},{"name":"Unchahar","lat":24.5994,"lng":78.3762},{"name":"Dadhiyal","lat":29.3983,"lng":84.4371},{"name":"Kemri","lat":26.1884,"lng":83.9401},{"name":"Maswasi","lat":28.8637,"lng":80.5387},{"name":"Narpatnagar Dundawala","lat":24.3955,"lng":79.2514},{"name":"Saifni","lat":29.1535,"lng":77.2982},{"name":"Ambehta","lat":24.172,"lng":84.4715},{"name":"Behat","lat":28.76,"lng":82.1316},{"name":"Chhutmalpur","lat":28.535,"lng":83.5676},{"name":"Chilkana Sultanpur","lat":24.0107,"lng":83.1479},{"name":"Nanauta","lat":29.2826,"lng":78.4163},{"name":"Rampur Maniharan","lat":23.8007,"lng":83.9148},{"name":"Titron","lat":28.2444,"lng":84.5221},{"name":"Babrala","lat":29.2877,"lng":83.7152},{"name":"Gawan","lat":23.8893,"lng":83.4721},{"name":"Gunnaur","lat":24.6169,"lng":83.2339},{"name":"Narauli","lat":25.1212,"lng":79.0477},{"name":"Sirsi","lat":26.0716,"lng":80.1135},{"name":"Baghnagar","lat":27.8584,"lng":78.0957},{"name":"Belhar Kalan","lat":26.1157,"lng":78.2205},{"name":"Hainsar Bazar Dhanghata","lat":24.4649,"lng":79.5298},{"name":"Dharmsinghwa","lat":29.1367,"lng":77.4589},{"name":"Hariharpur","lat":30.1278,"lng":83.2563},{"name":"Maghar","lat":29.4428,"lng":82.9035},{"name":"Menhdawal","lat":28.5732,"lng":80.9707},{"name":"Allahganj","lat":27.8386,"lng":78.9588},{"name":"Kalan","lat":24.6766,"lng":78.678},{"name":"Kant","lat":26.53,"lng":77.5916},{"name":"Katra","lat":28.5697,"lng":83.7337},{"name":"Khudaganj","lat":25.5782,"lng":80.8971},{"name":"Khutar","lat":28.8745,"lng":77.8429},{"name":"Nigohi","lat":29.1061,"lng":79.5661},{"name":"Roza","lat":24.2689,"lng":84.0443},{"name":"Ailam","lat":25.6673,"lng":81.3794},{"name":"Banat","lat":28.9421,"lng":83.8028},{"name":"Garhi Pukhta","lat":28.4776,"lng":80.6605},{"name":"Jhinjhana","lat":29.0398,"lng":78.9362},{"name":"Thana Bhawan","lat":26.4364,"lng":77.2041},{"name":"Un","lat":27.9725,"lng":82.7246},{"name":"Ikauna","lat":28.2371,"lng":82.2584},{"name":"Barhani Bazar","lat":26.6606,"lng":78.4157},{"name":"Barhni Chafa","lat":29.2792,"lng":77.3635},{"name":"Bharat Bhari","lat":29.1115,"lng":83.0122},{"name":"Biskohar","lat":27.3731,"lng":80.7114},{"name":"Domariaganj","lat":24.8783,"lng":81.54},{"name":"Itwa","lat":25.6176,"lng":80.8304},{"name":"Kapilvastu","lat":28.161,"lng":80.8996},{"name":"Shohratgarh","lat":29.4237,"lng":82.6724},{"name":"Uska Bazar","lat":27.8655,"lng":80.337},{"name":"Hargaon","lat":24.4464,"lng":83.9076},{"name":"Maholi","lat":28.3932,"lng":81.1351},{"name":"Patepur","lat":24.0628,"lng":80.3604},{"name":"Sidhauli","lat":30.1827,"lng":81.0861},{"name":"Tambaur Ahmadabad","lat":29.8079,"lng":79.4121},{"name":"Anpara","lat":25.5338,"lng":78.5137},{"name":"Chopan","lat":27.325,"lng":77.1733},{"name":"Churk Ghurma","lat":24.6307,"lng":80.6859},{"name":"Dala Bazar","lat":28.7976,"lng":84.3131},{"name":"Duddhi","lat":27.7009,"lng":80.5679},{"name":"Ghorawal","lat":23.8115,"lng":77.6288},{"name":"Obra","lat":24.6655,"lng":77.8259},{"name":"Pipri","lat":23.9525,"lng":79.3636},{"name":"Renukoot","lat":29.3672,"lng":82.8106},{"name":"Dostpur","lat":29.3173,"lng":81.4734},{"name":"Kadipur","lat":28.6962,"lng":82.1325},{"name":"Koeripur","lat":25.8735,"lng":81.2251},{"name":"Lambhua","lat":27.3458,"lng":80.3747},{"name":"Achalganj","lat":26.7624,"lng":82.5126},{"name":"Auras","lat":26.4061,"lng":79.0781},{"name":"Bhagwant Nagar","lat":28.2693,"lng":80.466},{"name":"Bighapur","lat":26.8837,"lng":81.4849},{"name":"Fatehpur Chaurasi","lat":25.3308,"lng":83.1768},{"name":"Ganj Muradabad","lat":26.9091,"lng":78.4402},{"name":"Hyderabad","lat":28.9967,"lng":80.7318},{"name":"Kursath","lat":28.3716,"lng":79.1093},{"name":"Maurawan","lat":29.4478,"lng":80.0042},{"name":"Mohan","lat":25.3366,"lng":81.9765},{"name":"Nyotini","lat":29.9038,"lng":79.6237},{"name":"Purwa","lat":26.9782,"lng":82.6199},{"name":"Rasulabad","lat":29.2898,"lng":83.0979},{"name":"Safipur","lat":24.402,"lng":84.4962},{"name":"Ugu","lat":25.9829,"lng":83.3535},{"name":"Gangapur","lat":29.1571,"lng":80.6342}];
for (const p of allPanchayats) {
  for (let j = 0; j < problemTemplates.length; j++) {
    const pt = problemTemplates[j];
    const jLat = parseFloat(p.lat) + (Math.random() * 0.04 - 0.02);
    const jLng = parseFloat(p.lng) + (Math.random() * 0.04 - 0.02);
    
    const statuses = ["investigating", "assigned", "in_progress", "resolved", "escalated"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    await ComplaintCluster.create({
      title: pt.title,
      category: pt.cat,
      probableRootCause: pt.root,
      latitude: jLat,
      longitude: jLng,
      priorityScore: Math.floor(Math.random() * 50) + 20, // 20 to 70
      status: randomStatus,
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: p.name,
      localBodyType: "Nagar Panchayat",
      ward: (Math.floor(Math.random() * 10) + 1).toString()
    });
  }
}
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
