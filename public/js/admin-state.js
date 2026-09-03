let chartInstance = null;
let currentCorpData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize map centered on Uttar Pradesh
  const map = L.map('state-map', { zoomControl: false }).setView([26.8467, 80.9462], 7);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap' }).addTo(map);

  const tilePane = map.getPane('tilePane');
  tilePane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';

  // Hardcoded coordinates for UP Municipal Corporations for Hackathon Demo
  const corpCoords = {
    "Lucknow": [26.8467, 80.9462],
    "Kanpur": [26.4499, 80.3319],
    "Varanasi": [25.3176, 82.9739]
  };

  try {
    const res = await fetch('/api/analytics/hierarchy');
    const data = await res.json();
    const bounds = L.latLngBounds();

    data.forEach(corp => {
      const name = corp._id;
      const coords = corpCoords[name] || [26.8467, 80.9462];
      
      // Draw a dotted circle to represent Municipal Boundary
      const circle = L.circle(coords, {
        color: corp.criticalClusters > 0 ? '#ef4444' : '#3b82f6',
        fillColor: corp.criticalClusters > 0 ? '#ef4444' : '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 10',
        radius: 15000 // 15km radius approx
      }).addTo(map);
      
      bounds.extend(coords);

      circle.on('click', () => loadCorpDetails(corp));
      
      // Also add a marker in the center
      L.circleMarker(coords, {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: corp.criticalClusters > 0 ? '#ef4444' : '#3b82f6',
        fillOpacity: 1
      }).addTo(map).bindTooltip(name, { permanent: true, direction: 'top', className: 'bg-slate-800 text-white border-slate-700' });
    });

    if (data.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  } catch (err) {
    console.error("Failed to load hierarchy data on state map", err);
  }
});

function loadCorpDetails(corp) {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('corp-panel').style.display = 'block';
  
  currentCorpData = corp;
  const name = corp._id;
  
  document.getElementById('corp-title').textContent = name;
  document.getElementById('corp-total').textContent = corp.totalComplaints;
  document.getElementById('corp-critical').textContent = corp.criticalClusters;
  
  // Hide AI review box initially
  document.getElementById('ai-review-box').style.display = 'none';
  document.getElementById('ai-review-text').textContent = 'Generating...';
  
  renderChart(corp);
}

function renderChart(corp) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  const resolved = corp.resolvedClusters || 0;
  const pending = corp.pendingClusters || 0;
  
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Resolved', 'Pending'],
      datasets: [{
        data: [resolved, pending],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94a3b8' }
        }
      }
    }
  });
}

document.getElementById('generate-ai-btn').addEventListener('click', async () => {
  if (!currentCorpData) return;
  const btn = document.getElementById('generate-ai-btn');
  const reviewBox = document.getElementById('ai-review-box');
  const reviewText = document.getElementById('ai-review-text');
  
  btn.disabled = true;
  btn.innerHTML = 'Analyzing performance...';
  reviewBox.style.display = 'block';
  reviewText.textContent = 'Contacting AI...';
  
  try {
    const res = await fetch(`/api/analytics/recommendation/${currentCorpData._id}`);
    const data = await res.json();
    reviewText.textContent = data.recommendation || "No recommendation available.";
  } catch (err) {
    reviewText.textContent = "AI generation failed. Please try again later.";
  }
  
  btn.disabled = false;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; margin-right:6px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Refresh AI Performance Review';
});
