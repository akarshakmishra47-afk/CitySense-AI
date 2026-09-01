const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runQA() {
  console.log("--- Starting QA Tests ---");
  
  // 1. Endpoints
  console.log("\\n1. Testing Endpoints");
  let res = await request('/api/complaints');
  console.log(`GET /api/complaints - Status: ${res.status}, Count: ${res.data.length}`);
  const sampleComplaintId = res.data[0]?.id;

  if (sampleComplaintId) {
    res = await request(`/api/complaints/${sampleComplaintId}`);
    console.log(`GET /api/complaints/:id - Status: ${res.status}`);
  }

  res = await request('/api/clusters');
  console.log(`GET /api/clusters - Status: ${res.status}, Count: ${res.data.length}`);
  
  const pipelineCluster = res.data.find(c => c.title.includes('Pipeline Leakage'));
  console.log(`Pipeline Cluster Found: ${!!pipelineCluster}`);
  if (pipelineCluster) {
    console.log(`- Priority: ${pipelineCluster.priorityScore}`);
    console.log(`- Complaints: ${pipelineCluster._count.complaints}`);
    console.log(`- Confidence: ${pipelineCluster.rootCauseConfidence}`);
    console.log(`- Affected: ${pipelineCluster.estimatedAffectedPeople}`);
    
    res = await request(`/api/clusters/${pipelineCluster.id}`);
    console.log(`GET /api/clusters/:id - Status: ${res.status}`);
    
    // Status update
    res = await request(`/api/clusters/${pipelineCluster.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'investigating' })
    });
    console.log(`PATCH /api/clusters/:id - Status: ${res.status}, New Status: ${res.data.status}`);
  }

  res = await request('/api/analytics');
  console.log(`GET /api/analytics - Status: ${res.status}`);
  
  res = await request('/api/demo', { method: 'POST' });
  console.log(`POST /api/demo - Status: ${res.status}`);

}

runQA().catch(console.error);
