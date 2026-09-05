const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const HOST = '127.0.0.1';
  const PORT = 3000;

  // Login as citizen
  console.log('=== Login as citizen ===');
  const loginBody = JSON.stringify({ email: 'citizen@123', password: '123456' });
  const loginRes = await request({
    hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);
  const citizenCookie = loginRes.headers['set-cookie'][0].split(';')[0];
  console.log('Logged in OK');

  // Submit to Shivrajpur Town Council
  console.log('\n=== Submit complaint to Shivrajpur Town Council ===');
  const boundary = 'Boundary' + Date.now();
  const fields = {
    description: 'Broken streetlight near main chowk causing safety issues at night',
    duration: '5',
    latitude: '26.4499',
    longitude: '80.3319',
    address: 'Main Chowk, Shivrajpur, Kanpur',
    affectedPeople: '100',
    district: 'Kanpur Nagar',
    localBodyType: 'Nagar Panchayat',
    bodyType: 'Town Council',
    localBodyId: 'UP_KANPUR_NAGAR_SHIVRAJPUR_TOWN_COUNCIL',
    localBodyName: 'Shivrajpur Town Council',
    bodyName: 'Shivrajpur Town Council',
    municipalCorp: 'Shivrajpur Town Council'
  };

  let payload = '';
  for (const [key, value] of Object.entries(fields)) {
    payload += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
  }
  payload += `--${boundary}--\r\n`;

  const complaintRes = await request({
    hostname: HOST, port: PORT, path: '/api/complaints', method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(payload),
      'Cookie': citizenCookie
    }
  }, payload);

  console.log('Status:', complaintRes.status);
  if (complaintRes.status === 201) {
    const result = JSON.parse(complaintRes.body);
    console.log('Complaint ID:', result.complaint?.id);
    console.log('Cluster ID:', result.clusterId);
    console.log('Category:', result.analysis?.category);
  } else {
    console.log('FAILED:', complaintRes.body);
    process.exit(1);
  }

  // Login as admin and check
  console.log('\n=== Check admin dashboard ===');
  const adminBody = JSON.stringify({ email: 'state@123', password: '123456' });
  const adminRes = await request({
    hostname: HOST, port: PORT, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(adminBody) }
  }, adminBody);
  const adminCookie = adminRes.headers['set-cookie'][0].split(';')[0];

  const hierRes = await request({
    hostname: HOST, port: PORT, path: '/api/analytics/hierarchy?district=Kanpur%20Nagar',
    method: 'GET', headers: { 'Cookie': adminCookie }
  });
  const hierarchy = JSON.parse(hierRes.body);
  const shivrajpur = hierarchy.find(h => h._id && h._id.name === 'Shivrajpur Town Council');
  const bithoor = hierarchy.find(h => h._id && h._id.name === 'Bithoor Town Council');

  console.log('\nShivrajpur Town Council:', shivrajpur ? `${shivrajpur.totalClusters} clusters, ${shivrajpur.pendingClusters} pending` : 'NOT FOUND');
  console.log('Bithoor Town Council:', bithoor ? `${bithoor.totalClusters} clusters, ${bithoor.pendingClusters} pending` : 'NOT FOUND');

  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
