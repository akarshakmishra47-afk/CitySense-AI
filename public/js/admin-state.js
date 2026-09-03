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
  "Achhnera": [27.8048, 78.7423],
  "Afzalgarh": [28.8075, 81.2096],
  "Ahraura": [26.1663, 80.7394],
  "Akbarpur": [27.2243, 77.8442],
  "Aliganj": [28.9468, 77.7296],
  "Amroha": [28.9013, 82.4222],
  "Anupshahr": [27.2736, 83.1851],
  "Aonla": [28.7331, 83.0946],
  "Atarra": [25.2577, 80.7004],
  "Atrauli": [24.7627, 80.4168],
  "Auraiya": [29.3552, 82.5679],
  "Awagarh": [26.9991, 82.6939],
  "Azamgarh": [24.7745, 81.0759],
  "Bachhraon": [29.3778, 83.7982],
  "Baghpat": [28.1887, 81.4074],
  "Bah": [29.9890, 83.4749],
  "Baheri": [24.5081, 80.2394],
  "Bahjoi": [28.3611, 78.3715],
  "Bahraich": [24.9935, 83.5556],
  "Ballia": [24.1269, 79.8381],
  "Balrampur": [26.7411, 83.9269],
  "Banda": [24.6693, 82.8963],
  "Bangarmau": [29.4748, 80.6213],
  "Bansi": [29.2756, 83.1183],
  "Baraut": [29.2629, 80.4606],
  "Barua Sagar": [24.2336, 83.5467],
  "Basti": [28.2104, 82.6993],
  "Bela Pratapgarh": [24.0281, 83.6829],
  "Bhadohi": [29.0109, 83.9377],
  "Bharthana": [29.0205, 83.5867],
  "Bharwari": [24.6976, 80.3110],
  "Bhinga": [24.6095, 77.8754],
  "Bijnor": [29.3203, 77.5153],
  "Bilari": [26.8999, 78.6386],
  "Bilariaganj": [25.6872, 81.5501],
  "Bilaspur": [26.0363, 81.9732],
  "Bilgram": [26.0084, 83.0474],
  "Bilhaur": [26.9751, 79.8558],
  "Bilsi": [25.2406, 80.9683],
  "Bindki": [25.4550, 82.8924],
  "Bisalpur": [24.4990, 79.1240],
  "Bisauli": [24.4221, 80.9282],
  "Biswan": [26.2627, 83.7745],
  "Budaun": [27.1496, 83.3736],
  "Bulandshahr": [25.9895, 81.5982],
  "Chandausi": [26.5060, 80.6039],
  "Chandpur": [25.3301, 79.6447],
  "Charkhari": [26.0123, 80.2226],
  "Chhibramau": [24.1041, 79.4926],
  "Chirgaon": [28.5355, 79.8230],
  "Chitrakoot Dham Karwi": [29.2271, 83.7174],
  "Chunar": [29.5988, 80.8873],
  "Colonelganj": [27.3329, 82.2314],
  "Dadri": [24.8971, 80.7841],
  "Dataganj": [25.4770, 82.6710],
  "Deoband": [24.2693, 77.8238],
  "Deoria": [24.6133, 80.1057],
  "Dhampur": [27.1678, 79.7268],
  "Dhanaura": [28.4848, 80.5363],
  "Dibai": [28.0071, 79.7502],
  "Etah": [24.0610, 79.1897],
  "Etawah": [24.2884, 83.9872],
  "Etmadpur": [24.8693, 79.8391],
  "Faridpur": [28.2603, 79.6069],
  "Farrukhabad": [24.5364, 79.7900],
  "Fatehpur": [29.8095, 81.7485],
  "Fatehpur Sikri": [28.5064, 79.0328],
  "Gajraula": [25.2928, 81.9480],
  "Gangaghat": [26.9259, 77.8350],
  "Gangoh": [26.2600, 80.5558],
  "Ganj Dundawara": [28.6263, 82.1189],
  "Garhmukteshwar": [27.7960, 81.7025],
  "Gaura Barhaj": [25.1787, 82.5980],
  "Gauriganj": [25.4740, 81.9163],
  "Ghatampur": [28.2002, 82.1661],
  "Ghazipur": [29.6410, 83.2435],
  "Gola Gokarannath": [28.6208, 80.6166],
  "Gonda": [26.2641, 78.6134],
  "Gopiganj": [26.9001, 78.7624],
  "Gulaothi": [27.0477, 80.6525],
  "Gursahaiganj": [26.2111, 81.6409],
  "Gursarai": [29.3256, 83.7040],
  "Haldaur": [25.3759, 81.0870],
  "Hamirpur": [27.0052, 81.2781],
  "Hapur": [27.5379, 81.4044],
  "Hardoi": [25.7536, 82.5073],
  "Hasanpur": [27.0340, 82.9795],
  "Hata": [24.1460, 81.3025],
  "Hathras": [25.7918, 78.0984],
  "Jahangirabad": [28.8124, 81.3229],
  "Jais": [28.6747, 78.8816],
  "Jalalabad": [27.2019, 81.1345],
  "Jalalpur": [25.5915, 81.8045],
  "Jalaun": [28.6068, 78.5506],
  "Jalesar": [29.3266, 83.5655],
  "Jaswantnagar": [25.1913, 78.7349],
  "Jaunpur": [26.2573, 80.1600],
  "Jhinjhak": [25.8498, 81.9861],
  "Kaimganj": [29.0063, 78.3261],
  "Kairana": [27.9077, 83.2216],
  "Kakrala": [25.4637, 77.7286],
  "Kalpi": [28.6180, 83.7446],
  "Kandhla": [28.9544, 78.6549],
  "Kannauj": [27.4525, 82.1936],
  "Kasganj": [29.8494, 82.3656],
  "Khair": [25.3116, 78.7477],
  "Khairabad": [26.4842, 83.3966],
  "Khalilabad": [29.1024, 80.1957],
  "Khatauli": [27.2304, 83.8719],
  "Khekada": [25.7095, 77.5961],
  "Khoda": [29.2099, 78.6336],
  "Khurja": [26.2476, 81.9120],
  "Kiratpur": [26.0951, 77.9434],
  "Konch": [25.8054, 77.5470],
  "Kosi Kalan": [25.2897, 80.8433],
  "Kushinagar": [24.4579, 80.6620],
  "Laharpur": [27.3469, 77.5823],
  "Lakhimpur": [25.3342, 82.7683],
  "Lalitpur": [24.4431, 80.3127],
  "Loni": [26.5834, 81.0473],
  "Maharajganj": [27.0979, 78.7983],
  "Mahmoodabad": [26.1442, 79.0800],
  "Mahoba": [25.8915, 82.1018],
  "Mainpuri": [26.6816, 83.2826],
  "Mallawan": [27.8020, 79.1850],
  "Manjhanpur": [28.1418, 79.3252],
  "Marhara": [24.4343, 82.7341],
  "Mau": [29.4920, 78.4984],
  "Maudaha": [25.7974, 79.2616],
  "Mauranipur": [28.4348, 81.9214],
  "Mawana": [26.2110, 78.8728],
  "Milak": [25.1977, 80.8660],
  "Mirzapur": [24.5316, 79.0917],
  "Misrikh Neemsar": [29.5578, 79.5285],
  "Modinagar": [29.1869, 81.3336],
  "Mohammadabad": [24.6914, 81.7401],
  "Mohammadi": [27.2537, 78.0155],
  "Mubarakpur": [25.8501, 81.4256],
  "Mungra Badshahpur": [25.5159, 77.7641],
  "Muradnagar": [27.0968, 81.6200],
  "Muzaffarnagar": [28.4472, 81.6187],
  "Nagina": [28.1384, 78.6022],
  "Najibabad": [26.7864, 81.0042],
  "Nakur": [29.5380, 82.0069],
  "Nanpara": [26.7103, 82.4526],
  "Nautanwa": [28.5859, 78.3696],
  "Nawabganj": [26.7709, 80.3060],
  "Nehtaur": [28.6636, 79.0544],
  "Noorpur": [27.3961, 77.9010],
  "Orai": [26.5167, 77.9470],
  "Padrauna": [24.3266, 82.9127],
  "Paliya Kalan": [25.4995, 79.5636],
  "Pihani": [28.1329, 83.0019],
  "Pilibhit": [24.0419, 83.0669],
  "Pilkhuwa": [27.4055, 77.8081],
  "Powayan": [26.6383, 79.6673],
  "Pt. Deen Dayal Upadhyaya Nagar": [26.4165, 81.8819],
  "Pukhrayan": [27.9779, 80.5439],
  "Puranpur": [25.7725, 81.1348],
  "Raebareli": [26.7932, 82.6469],
  "Rampur": [29.5247, 82.1592],
  "Rasara": [24.0742, 81.7243],
  "Rath": [26.5017, 79.6499],
  "Robertsganj": [24.5816, 80.3292],
  "Rudauli": [26.2949, 82.6727],
  "Sahaswan": [26.9021, 80.6358],
  "Sambhal": [26.9886, 83.2284],
  "Samthar": [25.0218, 80.5870],
  "Sandi": [28.9136, 80.9249],
  "Sandila": [24.7052, 81.6131],
  "Sardhana": [24.7475, 78.2380],
  "Sarsawa": [24.7403, 79.0314],
  "Seohara": [27.5294, 82.6636],
  "Shahabad": [25.2641, 81.0022],
  "Shahganj": [25.3667, 79.8526],
  "Shamli": [27.0316, 80.6681],
  "Shamsabad": [29.7152, 81.8140],
  "Sherkot": [24.8493, 82.6266],
  "Shikarpur": [25.2727, 79.3396],
  "Shikohabad": [28.7359, 78.4782],
  "Siddharthanagar": [29.1132, 81.0161],
  "Sikandra Rao": [28.0049, 81.7973],
  "Sikandrabad": [27.1289, 78.2228],
  "Sirsaganj": [27.8360, 80.3756],
  "Siswa Bazar": [27.0042, 82.2150],
  "Sitapur": [25.7792, 80.8734],
  "Soron": [28.9987, 83.6624],
  "Suar": [28.2393, 83.3405],
  "Sultanpur": [27.1358, 78.9305],
  "Syana": [27.5908, 79.6225],
  "Tanda": [27.9621, 81.8269],
  "Thakurdwara": [24.0103, 80.3552],
  "Tilhar": [24.1269, 78.1131],
  "Tundla": [27.6627, 82.0987],
  "Ujhani": [28.7304, 83.2737],
  "Unnao": [29.0315, 83.7483],
  "Utraula": [24.4680, 79.3996],
  "Zamania": [26.4495, 83.4226],

  
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
