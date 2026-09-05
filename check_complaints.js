require('dotenv').config();
const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({}, { strict: false });
const ClusterSchema = new mongoose.Schema({}, { strict: false });
const Complaint = mongoose.model('Complaint', ComplaintSchema);
const ComplaintCluster = mongoose.model('ComplaintCluster', ClusterSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
  console.log('Connected to MongoDB');

  const complaints = await Complaint.find({}).sort({ createdAt: -1 }).limit(10)
    .select('description district municipalCorp localBodyType state createdAt userId');
  console.log('\n--- RECENT COMPLAINTS ---');
  complaints.forEach(c => console.log(JSON.stringify({
    id: c._id, desc: (c.description || '').substring(0, 60),
    district: c.district, municipalCorp: c.municipalCorp,
    localBodyType: c.localBodyType, state: c.state, created: c.createdAt
  })));

  const clusters = await ComplaintCluster.find({}).sort({ updatedAt: -1 }).limit(10)
    .select('title district municipalCorp localBodyType state status complaints updatedAt');
  console.log('\n--- RECENT CLUSTERS ---');
  clusters.forEach(c => console.log(JSON.stringify({
    id: c._id, title: c.title, district: c.district, municipalCorp: c.municipalCorp,
    localBodyType: c.localBodyType, state: c.state, status: c.status,
    complaintCount: (c.complaints || []).length, updated: c.updatedAt
  })));

  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
