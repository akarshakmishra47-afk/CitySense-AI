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
    await ComplaintCluster.create({
      title: "Primary School Roof Leak",
      category: "Infrastructure",
      latitude: 29.1833,
      longitude: 77.8167,
      priorityScore: 85,
      status: "assigned",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Phalauda",
      localBodyType: "Nagar Panchayat",
      ward: "1"
    });

    await ComplaintCluster.create({
      title: "Handpump Malfunction",
      category: "Water",
      latitude: 28.8667,
      longitude: 77.9333,
      priorityScore: 92,
      status: "escalated",
      complaints: [],
      state: "Uttar Pradesh",
      municipalCorp: "Kithaur",
      localBodyType: "Nagar Panchayat",
      ward: "3"
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
