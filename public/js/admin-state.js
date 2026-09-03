let currentCorpData = null;
let mapInstance = null;
let hierarchyData = [];

// Hardcoded coordinates for UP Municipal Corporations for Hackathon Demo
const corpCoords = {
  "Lucknow": [26.8467, 80.9462],
  "Kanpur": [26.4499, 80.3319],
  "Varanasi": [25.3176, 82.9739]
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
        else mapInstance.invalidateSize(); // Fix Leaflet render bug when map is hidden
      }
    });
  });

  // Load Data
  await loadHierarchyData();
});

async function loadHierarchyData() {
  try {
    const res = await fetch('/api/analytics/hierarchy');
    hierarchyData = await res.json();
    renderCorpList();
  } catch (err) {
    console.error("Failed to load hierarchy data", err);
  }
}

function renderCorpList() {
  const listEl = document.getElementById('corp-list');
  
  hierarchyData.forEach(corp => {
    const card = document.createElement('div');
    card.className = 'corp-card';
    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xl font-bold text-white">${corp._id}</h3>
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
  
  document.getElementById('detail-empty').style.display = 'none';
  document.getElementById('detail-content').style.display = 'block';
  
  // Set KPIs
  document.getElementById('detail-title').textContent = corp._id;
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
  feedEl.innerHTML = '<p class="text-slate-400">Loading clusters...</p>';
  
  try {
    const res = await fetch(`/api/clusters?corp=${encodeURIComponent(corp._id)}`);
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
        <p class="text-sm text-slate-400 mb-2">Status: <strong class="uppercase">${c.status.replace('_', ' ')}</strong> &bull; Reports: ${c._count.complaints}</p>
        ${c.probableRootCause ? `
          <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 4px; border-left: 2px solid #8b5cf6;">
            <div class="text-xs font-bold text-purple-400 uppercase mb-1">AI Root Cause</div>
            <div class="text-sm text-slate-300">${c.probableRootCause}</div>
          </div>
        ` : ''}
      `;
      feedEl.appendChild(el);
    });
    
  } catch (err) {
    feedEl.innerHTML = '<p class="text-red-500">Failed to load clusters.</p>';
  }
}

// AI Button Logic
document.getElementById('generate-ai-btn').addEventListener('click', async () => {
  if (!currentCorpData) return;
  const btn = document.getElementById('generate-ai-btn');
  const reviewBox = document.getElementById('ai-review-box');
  const reviewText = document.getElementById('ai-review-text');
  
  btn.disabled = true;
  btn.innerHTML = 'Analyzing performance...';
  reviewBox.style.display = 'block';
  reviewText.textContent = 'Contacting Groq AI...';
  
  try {
    const res = await fetch(`/api/analytics/recommendation/${currentCorpData._id}`);
    const data = await res.json();
    reviewText.textContent = data.recommendation || "No recommendation available.";
  } catch (err) {
    reviewText.textContent = "AI generation failed. Please try again later.";
  }
  
  btn.disabled = false;
  btn.innerHTML = 'Refresh AI Recommendation';
});


// Map Initialization
function initMap() {
  mapInstance = L.map('state-map', { zoomControl: false }).setView([26.8467, 80.9462], 7);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);

  const tilePane = mapInstance.getPane('tilePane');
  tilePane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
  
  const bounds = L.latLngBounds();
  
  hierarchyData.forEach(corp => {
    const name = corp._id;
    const coords = corpCoords[name] || [26.8467, 80.9462];
    
    // Choose color based on pending/critical clusters to represent "area of work"
    let areaColor = '#3b82f6'; // Good (Blue)
    if (corp.criticalClusters > 0) areaColor = '#ef4444'; // Bad (Red)
    else if (corp.pendingClusters > corp.resolvedClusters) areaColor = '#f59e0b'; // Moderate (Orange)
    
    L.circle(coords, {
      color: areaColor,
      fillColor: areaColor,
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 10',
      radius: 20000 // 20km area
    }).addTo(mapInstance);
    
    L.circleMarker(coords, {
      radius: 8,
      color: '#fff',
      weight: 2,
      fillColor: areaColor,
      fillOpacity: 1
    }).addTo(mapInstance).bindTooltip(`${name}<br>Pending: ${corp.pendingClusters}`, { permanent: true, direction: 'top', className: 'bg-slate-800 text-white border-slate-700' });
    
    bounds.extend(coords);
  });
  
  if (hierarchyData.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [50, 50] });
  }
}
