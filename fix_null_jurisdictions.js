require('dotenv').config();
const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({}, { strict: false });
const ClusterSchema = new mongoose.Schema({}, { strict: false });
const Complaint = mongoose.model('Complaint', ComplaintSchema);
const ComplaintCluster = mongoose.model('ComplaintCluster', ClusterSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
  console.log('Connected to MongoDB');

  // Fix clusters with null jurisdiction by inferring from their complaints
  const nullClusters = await ComplaintCluster.find({
    $or: [{ district: null }, { municipalCorp: null }, { state: null }]
  });

  console.log(`Found ${nullClusters.length} clusters with null jurisdiction`);

  for (const cluster of nullClusters) {
    if (!cluster.complaints || cluster.complaints.length === 0) continue;

    // Fetch associated complaints
    const complaints = await Complaint.find({
      _id: { $in: cluster.complaints }
    }).select('district municipalCorp localBodyType state');

    // Find best jurisdiction from complaints
    let district = null, municipalCorp = null, localBodyType = null, state = null;
    for (const c of complaints) {
      if (!district && c.district) district = c.district;
      if (!municipalCorp && c.municipalCorp) municipalCorp = c.municipalCorp;
      if (!localBodyType && c.localBodyType) localBodyType = c.localBodyType;
      if (!state && c.state) state = c.state;
    }

    // Normalize state
    if (state === 'UP') state = 'Uttar Pradesh';
    // Default to UP if complaints were in UP context
    if (!state && district) state = 'Uttar Pradesh';

    const update = {};
    if (district && !cluster.district) update.district = district;
    if (municipalCorp && !cluster.municipalCorp) update.municipalCorp = municipalCorp;
    if (localBodyType && !cluster.localBodyType) update.localBodyType = localBodyType;
    if (state && !cluster.state) update.state = state;

    if (Object.keys(update).length > 0) {
      await ComplaintCluster.updateOne({ _id: cluster._id }, { $set: update });
      console.log(`Fixed cluster "${cluster.title}" (${cluster._id}):`, update);
    }
  }

  // Fix complaints with null state that have a district
  const nullStateComplaints = await Complaint.find({
    $or: [{ state: null }, { state: 'UP' }],
    district: { $ne: null }
  });

  console.log(`\nFound ${nullStateComplaints.length} complaints with null/wrong state`);
  for (const c of nullStateComplaints) {
    await Complaint.updateOne({ _id: c._id }, { $set: { state: 'Uttar Pradesh' } });
    console.log(`Fixed complaint ${c._id} state`);
  }

  console.log('\nDone! Verifying clusters...');
  const clusters = await ComplaintCluster.find({}).sort({ updatedAt: -1 }).limit(10)
    .select('title district municipalCorp localBodyType state status');
  clusters.forEach(c => console.log(JSON.stringify({
    title: c.title, district: c.district, municipalCorp: c.municipalCorp,
    localBodyType: c.localBodyType, state: c.state, status: c.status
  })));

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
