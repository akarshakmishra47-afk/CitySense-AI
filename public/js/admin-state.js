let currentCorpData = null;
let mapInstance = null;
let hierarchyData = [];
let activeTier = 'Nagar Nigam';
let mapMarkers = [];
let mapCircles = [];

// Hardcoded coordinates for UP Municipal Corporations for Hackathon Demo
const corpCoords = {
  // 17 Nagar Nigams (Municipal Corporations)
  "Agra": [27.1767, 78.0081],
  "Aligarh": [27.8974, 78.0880],
  "Ayodhya": [26.7922, 82.1998],
  "Bareilly": [28.3670, 79.4304],
  "Firozabad": [27.1590, 78.3957],
  "Ghaziabad": [28.6692, 77.4538],
  "Gorakhpur": [26.7606, 83.3732],
  "Jhansi": [25.4484, 78.5685],
  "Kanpur": [26.4499, 80.3319],
  "Lucknow": [26.8467, 80.9462],
  "Meerut": [28.9845, 77.7064],
  "Moradabad": [28.8386, 78.7733],
  "Prayagraj": [25.4358, 81.8463],
  "Saharanpur": [29.9640, 77.5460],
  "Shahjahanpur": [27.8804, 79.9126],
  "Varanasi": [25.3176, 82.9739],
  "Mathura-Vrindavan": [27.4924, 77.6737],
  
  // Nagar Palika Parishads
  "Loni": [28.7500, 77.2833],
  "Modinagar": [28.8333, 77.5833],
  
  // Nagar Panchayats
  "Phalauda": [29.1833, 77.8167],
  "Kithaur": [28.8667, 77.9333]
};

document.addEventListener('DOMContentLoaded', async () => {
  // Setup Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      
      if (tabId === 'map') {
        if (!mapInstance) initMap();
        else {
          mapInstance.invalidateSize();
          renderMapData(document.getElementById('map-tier-select').value);
        }
      }
    });
  });

  // Setup Tier Selector in Overview
  document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active-tier'));
      e.currentTarget.classList.add('active-tier');
      
      activeTier = e.currentTarget.getAttribute('data-tier');
      renderCorpList();
      
      // Clear detail panel
      document.getElementById('detail-empty').style.display = 'block';
      document.getElementById('detail-content').style.display = 'none';
    });
  });
  
  // Setup Map Filter
  const mapSelect = document.getElementById('map-tier-select');
  if (mapSelect) {
    mapSelect.addEventListener('change', (e) => {
      renderMapData(e.target.value);
    });
  }

  // Load Data
  await loadHierarchyData();
});

async function loadHierarchyData() {
  try {
    const res = await fetch('/api/analytics/hierarchy');
    hierarchyData = await res.json();
    
    // Calculate counts for the tier buttons
    let counts = { 'Nagar Nigam': 0, 'Nagar Palika Parishad': 0, 'Nagar Panchayat': 0 };
    hierarchyData.forEach(d => {
      if (d._id && d._id.type) counts[d._id.type]++;
    });
    
    document.getElementById('count-nigam').textContent = counts['Nagar Nigam'];
    document.getElementById('count-palika').textContent = counts['Nagar Palika Parishad'];
    document.getElementById('count-panchayat').textContent = counts['Nagar Panchayat'];
    
    renderCorpList();
  } catch (err) {
    console.error("Failed to load hierarchy data", err);
  }
}

function renderCorpList() {
  const listEl = document.getElementById('corp-list');
  listEl.innerHTML = ''; // clear
  
  // Filter by activeTier
  const filteredData = hierarchyData.filter(d => d._id && d._id.type === activeTier);
  
  if (filteredData.length === 0) {
    listEl.innerHTML = `<p class="text-slate-500 text-sm italic">No data available for ${activeTier}.</p>`;
    return;
  }
  
  filteredData.forEach(corp => {
    const name = corp._id.corp;
    const card = document.createElement('div');
    card.className = 'corp-card';
    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xl font-bold text-white">${name}</h3>
        ${corp.criticalClusters > 0 ? `<span class="badge badge-critical">${corp.criticalClusters} Critical</span>` : ''}
      </div>
      <div class="flex justify-between text-sm text-slate-400">
        <span>Total: ${corp.totalComplaints}</span>
        <span>Pending: ${corp.pendingClusters}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // Manage active state
      document.querySelectorAll('.corp-card').forEach(c => c.classList.remove('active-corp'));
      card.classList.add('active-corp');
      
      openCorpDetails(corp);
    });
    
    listEl.appendChild(card);
  });
}

async function openCorpDetails(corp) {
  currentCorpData = corp;
  const name = corp._id.corp;
  
  document.getElementById('detail-empty').style.display = 'none';
  document.getElementById('detail-content').style.display = 'block';
  
  // Set KPIs
  document.getElementById('detail-tier').textContent = activeTier;
  document.getElementById('detail-title').textContent = name;
  document.getElementById('kpi-total').textContent = corp.totalComplaints;
  document.getElementById('kpi-resolved').textContent = corp.resolvedClusters || 0;
  document.getElementById('kpi-pending').textContent = corp.pendingClusters || 0;
  
  // Reset AI Box
  document.getElementById('ai-review-box').style.display = 'none';
  document.getElementById('generate-ai-btn').disabled = false;
  document.getElementById('generate-ai-btn').innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    How can we make this better?
  `;

  // Fetch specific clusters for this corp
  const feedEl = document.getElementById('problem-feed');
  feedEl.innerHTML = '<p class="text-slate-400">Loading active problem clusters...</p>';
  
  try {
    const res = await fetch(`/api/clusters?corp=${encodeURIComponent(name)}`);
    const clusters = await res.json();
    
    feedEl.innerHTML = '';
    
    if (clusters.length === 0) {
      feedEl.innerHTML = '<p class="text-slate-400">No active clusters found for this jurisdiction.</p>';
      return;
    }
    
    clusters.forEach(c => {
      let color = '#3b82f6';
      if (c.priorityScore >= 90) color = '#ef4444';
      else if (c.priorityScore >= 75) color = '#f97316';
      else if (c.priorityScore >= 50) color = '#eab308';
      
      const el = document.createElement('div');
      el.className = 'problem-card';
      el.style.borderLeftColor = color;
      
      el.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="text-lg font-bold text-white">${c.title}</h4>
          <span class="badge" style="background: rgba(255,255,255,0.1); color: ${color}; border: 1px solid ${color};">${c.priorityScore} Priority</span>
        </div>
        <p class="text-sm text-slate-400 mb-2">Status: <strong class="uppercase">${c.status.replace('_', ' ')}</strong> &bull; Citizen Reports: ${c._count.complaints}</p>
        ${c.probableRootCause ? `
          <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 4px; border-left: 2px solid #8b5cf6;">
            <div class="text-xs font-bold text-purple-400 uppercase mb-1">AI Root Cause Prediction</div>
            <div class="text-sm text-slate-300">${c.probableRootCause}</div>
          </div>
        ` : ''}
      `;
      feedEl.appendChild(el);
    });
    
  } catch (err) {
    feedEl.innerHTML = '<p class="text-red-500">Failed to load problem clusters.</p>';
  }
}

// AI Button Logic
document.getElementById('generate-ai-btn').addEventListener('click', async () => {
  if (!currentCorpData) return;
  const name = currentCorpData._id.corp;
  
  const btn = document.getElementById('generate-ai-btn');
  const reviewBox = document.getElementById('ai-review-box');
  const reviewText = document.getElementById('ai-review-text');
  
  btn.disabled = true;
  btn.innerHTML = 'Analyzing performance metrics...';
  reviewBox.style.display = 'block';
  reviewText.textContent = 'Contacting Groq AI...';
  
  try {
    const res = await fetch(`/api/analytics/recommendation/${encodeURIComponent(name)}`);
    const data = await res.json();
    reviewText.textContent = data.recommendation || "No recommendation available.";
  } catch (err) {
    reviewText.textContent = "AI generation failed. Please try again later.";
  }
  
  btn.disabled = false;
  btn.innerHTML = 'Refresh AI Recommendation';
});


// --- MAP LOGIC ---

function initMap() {
  mapInstance = L.map('state-map', { zoomControl: false }).setView([26.8467, 80.9462], 7);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);

  const tilePane = mapInstance.getPane('tilePane');
  tilePane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
  
  // Initial render for 'All'
  renderMapData('All');
}

function renderMapData(filterTier) {
  if (!mapInstance) return;
  
  // Clear existing
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapCircles.forEach(c => mapInstance.removeLayer(c));
  mapMarkers = [];
  mapCircles = [];
  
  const bounds = L.latLngBounds();
  let addedPoints = 0;
  
  hierarchyData.forEach(corp => {
    if (!corp._id || !corp._id.type || !corp._id.corp) return;
    const type = corp._id.type;
    const name = corp._id.corp;
    
    if (filterTier !== 'All' && type !== filterTier) return;
    
    const coords = corpCoords[name] || [26.8467, 80.9462]; // fallback to Lucknow if unknown
    
    // Color logic
    let areaColor = '#3b82f6'; // Good
    if (corp.criticalClusters > 0) areaColor = '#ef4444'; // Critical
    else if (corp.pendingClusters > corp.resolvedClusters) areaColor = '#f59e0b'; // Needs attention
    
    // Radius logic based on tier
    let radius = 5000; // default
    if (type === 'Nagar Nigam') radius = 15000;
    else if (type === 'Nagar Palika Parishad') radius = 8000;
    else if (type === 'Nagar Panchayat') radius = 3000;
    
    const circle = L.circle(coords, {
      color: areaColor,
      fillColor: areaColor,
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 10',
      radius: radius
    }).addTo(mapInstance);
    
    const marker = L.circleMarker(coords, {
      radius: type === 'Nagar Nigam' ? 8 : (type === 'Nagar Palika Parishad' ? 6 : 4),
      color: '#fff',
      weight: 2,
      fillColor: areaColor,
      fillOpacity: 1
    }).addTo(mapInstance).bindTooltip(`<b>${name}</b><br><span style="font-size:10px; color:#94a3b8">${type}</span><br>Pending: ${corp.pendingClusters}`, { direction: 'top', className: 'bg-slate-800 text-white border-slate-700' });
    
    mapCircles.push(circle);
    mapMarkers.push(marker);
    bounds.extend(coords);
    addedPoints++;
  });
  
  if (addedPoints > 0) {
    mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
}
