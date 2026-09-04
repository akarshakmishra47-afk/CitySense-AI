document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlDistrict = urlParams.get('district');
    const urlCorp = urlParams.get('corp');

    // Fetch auth to determine role
    const authRes = await fetch('/api/auth/me');
    const authData = await authRes.json();
    const role = authData?.user?.role || 'admin_ward';
    const state = authData?.user?.state || 'Uttar Pradesh';

    const isStateAdmin = role === 'admin_state';
    const isDistrictAdmin = role === 'admin_district';
    
    // Determine the current view mode
    const isStateView = isStateAdmin && !urlDistrict && !urlCorp;
    const isDistrictView = ((isStateAdmin && urlDistrict) || isDistrictAdmin) && !urlCorp;
    const isLocalBodyView = urlCorp || role === 'admin_city' || role === 'admin_ward';

    const currentDistrict = urlDistrict || authData?.user?.district;
    const currentCorp = urlCorp || authData?.user?.municipalCorp;

    // Update Breadcrumbs & Titles
    const breadcrumbEl = document.getElementById('breadcrumb-nav');
    const titleEl = document.getElementById('main-dashboard-title');
    const subtitleEl = document.getElementById('main-dashboard-subtitle');

    if (isStateView) {
      breadcrumbEl.innerHTML = `<span>${state}</span> &gt; <span class="text-white">State Command Center</span>`;
      titleEl.textContent = 'Command Center';
      subtitleEl.textContent = 'Real-time intelligence and resource allocation dashboard';
    } else if (isDistrictView) {
      breadcrumbEl.innerHTML = `<a href="/admin.html" style="color:var(--primary-brand); text-decoration:none;">${state}</a> &gt; <span class="text-white">${currentDistrict} District</span>`;
      titleEl.textContent = `${currentDistrict} District Command Center`;
      subtitleEl.textContent = 'District-level problem monitoring and urban/rural management';
    } else if (isLocalBodyView) {
      let bNav = `<span>${state}</span>`;
      if (currentDistrict) {
        bNav += ` &gt; <a href="/admin.html?district=${currentDistrict}" style="color:var(--primary-brand); text-decoration:none;">${currentDistrict}</a>`;
      }
      bNav += ` &gt; <span class="text-white">${currentCorp}</span>`;
      breadcrumbEl.innerHTML = bNav;
      
      titleEl.textContent = `${currentCorp} Operations`;
      subtitleEl.textContent = 'Local problem clusters and complaints';
    }

    // Determine query suffix for fetching data
    let querySuffix = '';
    const params = new URLSearchParams();
    if (urlDistrict && isStateAdmin) params.append('district', urlDistrict);
    if (urlCorp && (isStateAdmin || isDistrictAdmin)) params.append('corp', urlCorp);
    if (params.toString()) querySuffix = `?${params.toString()}`;

    // Fetch Analytics Data
    let analyticsData = null;
    try {
      const analyticsRes = await fetch(`/api/analytics${querySuffix}`);
      if (analyticsRes.ok) {
        analyticsData = await analyticsRes.json();
        
        // Update Insight Text (Safe check if element exists)
        const insightEl = document.getElementById('system-insight-text');
        if (insightEl && analyticsData.emergingInsight) {
          insightEl.textContent = analyticsData.emergingInsight;
        }
        
        // Find most common category for "Current Focus"
        const focusEl = document.getElementById('current-focus-text');
        if (focusEl && analyticsData.categoryData && analyticsData.categoryData.length > 0) {
          const topCategory = analyticsData.categoryData.reduce((prev, current) => (prev.count > current.count) ? prev : current);
          focusEl.textContent = topCategory.category + " Management";
        }
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    }

    // Fetch Clusters Data for Stats & Map
    const res = await fetch(`/api/clusters${querySuffix}`);
    if (!res.ok) throw new Error('Failed to load clusters');
    const allClusters = await res.json();
    const clusters = allClusters.filter(c => c.status !== 'resolved');
    
    // Calculate global stats for KPI header
    let totalReports = 0;
    let criticalCount = 0;
    let totalAffected = 0;
    let resolvedCount = allClusters.filter(c => c.status === 'resolved').length;
    let totalClusters = allClusters.length;
    
    clusters.forEach(c => {
      totalReports += c._count.complaints;
      if (c.priorityScore >= 90) criticalCount++;
      totalAffected += c.estimatedAffectedPeople;
    });
    
    // Update KPI UI
    document.getElementById('stat-reports').textContent = totalReports;
    document.getElementById('stat-problems').textContent = clusters.length;
    document.getElementById('stat-critical').textContent = criticalCount;
    
    const resolutionRate = totalClusters === 0 ? 100 : Math.round((resolvedCount / totalClusters) * 100);
    document.getElementById('stat-resolution').textContent = `${resolutionRate}%`;

    // Fetch Hotspot Predictions
    try {
      const predRes = await fetch(`/api/analytics/predictions${querySuffix}`);
      if (predRes.ok) {
        const predictions = await predRes.json();
        const container = document.getElementById('forecast-container');
        if (container) {
          container.innerHTML = '';
          if (predictions.length === 0) {
            container.innerHTML = '<p class="text-sm text-tertiary">No critical forecasts at this time.</p>';
          } else {
            predictions.forEach(p => {
              const riskColor = p.riskLevel === 'Critical' ? 'color: var(--critical);' : 'color: var(--primary-brand);';
              container.innerHTML += `
                <div class="p-3 mb-2" style="background: var(--bg-surface); border-radius: var(--radius); border: 1px solid var(--border-color);">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-muted uppercase">Ward ${p.ward || 'Unknown'}</span>
                    <span class="text-xs font-bold" style="${riskColor}">${p.riskLevel} Risk</span>
                  </div>
                  <p class="text-sm font-semibold mb-1">${p.prediction}</p>
                  <p class="text-xs text-tertiary">Action: ${p.recommendation}</p>
                </div>
              `;
            });
          }
        }
      }
    } catch(err) {
      console.error("Failed to load predictions", err);
    }

    // View Switching Logic
    if (isStateView || isDistrictView) {
      // 1. Show Visualizations
      document.getElementById('priority-list').style.display = 'none';
      document.getElementById('hierarchy-list').style.display = 'block';
      document.getElementById('advanced-visualizations').style.display = 'block';
      // 2. Fetch Hierarchy Data
      let hierarchyData = [];
      try {
        const hierarchyRes = await fetch(`/api/analytics/hierarchy${querySuffix}`);
        hierarchyData = await hierarchyRes.json();

        if (isStateView) {
          renderStateView(hierarchyData);
        } else if (isDistrictView) {
          renderDistrictView(hierarchyData);
        }

      } catch(err) {
        console.error(err);
        document.getElementById('hierarchy-grid').innerHTML = '<p style="color:var(--critical)">Failed to load hierarchy data</p>';
      }

      initVisualizations(analyticsData, clusters, urlDistrict, hierarchyData);

    } else if (isLocalBodyView) {
      // Local Body Dashboard: Show full cluster+complaint details
      document.getElementById('priority-list').style.display = 'none';
      document.getElementById('hierarchy-list').style.display = 'block';
      document.getElementById('urban-rural-split').style.display = 'block';
      document.getElementById('hierarchy-grid').style.display = 'none';
      document.getElementById('advanced-visualizations').style.display = 'none'; // LB has its own charts inside urban-rural-split
      
      renderLocalBodyView(allClusters, currentCorp, currentDistrict, analyticsData);

    } else {
      // Ward/City View: Priority Problems list
      renderPriorityProblems(clusters);
    }
    
  } catch (error) {
    console.error(error);
  }
}

function renderStateView(hierarchyData) {
  const grid = document.getElementById('hierarchy-grid');
  grid.innerHTML = '';
  document.getElementById('urban-rural-split').style.display = 'none';

  if (hierarchyData.length === 0) {
     grid.innerHTML = '<p class="text-muted">No data available for this jurisdiction.</p>';
     return;
  }

  hierarchyData.forEach(h => {
     const name = h._id || 'Unknown';
     const total = h.totalClusters;
     const active = h.activeClusters;
     const resolved = h.resolvedClusters;
     const pending = h.pendingClusters;
     const critical = h.criticalClusters;
     const progressPercent = total === 0 ? 0 : Math.round((resolved / total) * 100);

     const card = document.createElement('div');
     card.className = 'card animate-fade-up mb-4';
     card.style.padding = '1.5rem';
     card.style.borderLeft = critical > 0 ? '4px solid var(--critical)' : (total > 0 ? '4px solid var(--primary-brand)' : '4px solid var(--border-color)');

     if (total === 0) {
       // Empty State
       card.innerHTML = `
         <div class="flex justify-between items-center mb-4">
           <h3 class="text-2xl font-bold text-white">${name}</h3>
         </div>
         <div class="py-6 text-center text-tertiary">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mx-auto mb-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
           <p>No operational data available yet</p>
         </div>
         <div class="mt-4 pt-4" style="border-top: 1px solid var(--border-color); text-align:right;">
           <button class="btn btn-secondary text-sm">View District →</button>
         </div>
       `;
     } else {
       // Data State
       card.innerHTML = `
         <div class="flex justify-between items-center mb-4">
           <h3 class="text-2xl font-bold text-white">${name}</h3>
           <span class="badge ${critical > 0 ? 'badge-critical' : 'badge-high'}">${critical} Critical</span>
         </div>
         <div class="text-sm mb-4">
           <p class="mb-1 text-slate-300">Complaints: <span class="font-bold">${h.totalComplaints}</span></p>
           <p class="mb-1 text-emerald-400">Resolved: <span class="font-bold">${resolved}</span></p>
           <p class="mb-1 text-amber-400">Pending: <span class="font-bold">${pending}</span></p>
         </div>
         <div class="mb-2">
           <div class="flex justify-between text-xs font-bold uppercase text-secondary mb-1">
             <span>Resolution Progress</span>
             <span>${progressPercent}%</span>
           </div>
           <div style="width: 100%; height: 6px; background: var(--bg-page); border-radius: 4px; overflow: hidden;">
             <div style="width: ${progressPercent}%; height: 100%; background: ${critical > 0 ? 'var(--critical)' : 'var(--primary-brand)'};"></div>
           </div>
         </div>
         <div class="mt-4 pt-4 flex justify-between items-center" style="border-top: 1px solid var(--border-color);">
           <span class="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1">
             <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--emerald-500);"></span> Live Data
           </span>
           <button class="btn btn-secondary text-sm">View District →</button>
         </div>
       `;
     }
     
     card.onclick = () => {
       window.location.href = `/admin.html?district=${name}`;
     };
     card.style.cursor = 'pointer';
     grid.appendChild(card);
  });

  // Attach Search Logic
  const searchInput = document.getElementById('district-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const cards = grid.querySelectorAll('.card');
      cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        if (title.includes(term)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}

function renderDistrictView(hierarchyData) {
  document.getElementById('hierarchy-grid').style.display = 'none'; // Hide master grid
  document.getElementById('urban-rural-split').style.display = 'block';

  // Containers
  const nigamGrid = document.getElementById('urban-nigam-grid');
  const palikaGrid = document.getElementById('urban-palika-grid');
  const panchayatGrid = document.getElementById('urban-panchayat-grid');
  const blocksGrid = document.getElementById('rural-blocks-grid');

  // Sections
  const secNigam = document.getElementById('urban-nigam-section');
  const secPalika = document.getElementById('urban-palika-section');
  const secPanchayat = document.getElementById('urban-panchayat-section');
  const secBlocks = document.getElementById('rural-blocks-section');

  nigamGrid.innerHTML = ''; palikaGrid.innerHTML = ''; panchayatGrid.innerHTML = ''; blocksGrid.innerHTML = '';

  if (hierarchyData.length === 0) {
    document.getElementById('urban-rural-split').innerHTML = `
      <div class="py-12 text-center">
        <h3 class="text-2xl font-bold text-white mb-2">No operational data</h3>
        <p class="text-tertiary">No complaint or problem data is currently available for this district.</p>
      </div>
    `;
    return;
  }

  const mapInitQueue = [];
  const chartInitQueue = [];

  hierarchyData.forEach(h => {
     if(!h._id || !h._id.type) return; // Malformed data
     
     const type = h._id.type;
     const name = h._id.name || 'Unknown';
     const total = h.totalClusters;
     const resolved = h.resolvedClusters;
     const pending = h.pendingClusters;
     const progressPercent = total === 0 ? 0 : Math.round((resolved / total) * 100);
     
     const safeNameId = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
     const mapId = `mini-map-${safeNameId}`;
     const chartId = `mini-chart-${safeNameId}`;

     const cardHTML = `
       <div class="card p-5 hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between h-full" style="border: 1px solid var(--border-color); display: flex;" onclick="window.location.href = window.location.href + (window.location.search ? '&' : '?') + 'corp=' + encodeURIComponent('${name}')">
         
         <div class="flex justify-between items-start mb-4">
           <div>
             <h4 class="text-lg font-bold" style="color: var(--text-primary); margin-bottom: 2px;">${name}</h4>
             <span class="badge badge-medium">${type}</span>
           </div>
           <div class="text-right">
             <div class="text-2xl font-bold" style="color: var(--text-primary);">${total}</div>
             <div class="text-xs font-semibold text-tertiary uppercase">Problems</div>
           </div>
         </div>

         <div class="mb-4">
           <div class="flex justify-between text-xs font-bold uppercase mb-1" style="color: var(--text-secondary);">
             <span>Resolution Progress</span>
             <span>${progressPercent}%</span>
           </div>
           <div style="width: 100%; height: 6px; background: var(--bg-page); border-radius: 4px; overflow: hidden;">
             <div style="width: ${progressPercent}%; height: 100%; background: var(--success);"></div>
           </div>
           <div class="flex justify-between mt-2 text-sm font-semibold">
             <span style="color: var(--success);">${resolved} Resolved</span>
             <span style="color: var(--high);">${pending} Pending</span>
           </div>
         </div>

         <div class="mb-4" style="height: 60px;">
           <canvas id="${chartId}"></canvas>
         </div>

         <div id="${mapId}" style="height: 120px; border-radius: 6px; background: var(--bg-surface); z-index: 0; pointer-events: none;" class="mb-3"></div>

         <div class="text-right mt-auto pt-3" style="border-top: 1px solid var(--border-color);">
           <span class="text-sm font-bold" style="color: var(--primary-brand);">VIEW DASHBOARD &rarr;</span>
         </div>
       </div>
     `;

     if (type === 'Nagar Nigam') { nigamGrid.innerHTML += cardHTML; secNigam.style.display = 'block'; }
     else if (type === 'Nagar Palika Parishad') { palikaGrid.innerHTML += cardHTML; secPalika.style.display = 'block'; }
     else if (type === 'Nagar Panchayat') { panchayatGrid.innerHTML += cardHTML; secPanchayat.style.display = 'block'; }
     else if (type === 'Development Block') { blocksGrid.innerHTML += cardHTML; secBlocks.style.display = 'block'; }
     else if (type === 'Gram Panchayat') { blocksGrid.innerHTML += cardHTML; secBlocks.style.display = 'block'; } 

     // Queue initializations because they must run after DOM insertion
     mapInitQueue.push(mapId);
     chartInitQueue.push({ id: chartId, total, resolved, pending });
  });

  // Initialize Maps & Charts after a brief timeout to ensure DOM paints
  setTimeout(() => {
    chartInitQueue.forEach(q => {
      const ctx = document.getElementById(q.id);
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Resolved', 'Pending'],
            datasets: [{
              data: [q.resolved, q.pending],
              backgroundColor: ['#10B981', '#FF9100'],
              borderRadius: 3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
              x: { display: false },
              y: { display: false, grid: { display: false } }
            }
          }
        });
      }
    });

    mapInitQueue.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('leaflet-container')) {
        const map = L.map(id, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false }).setView([26.8467, 80.9462], 10);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}').addTo(map);
        // We will leave the map centered on Lucknow generally for the mini-map to keep it fast, 
        // unless we have specific coordinates for the local body, which we don't right now.
      }
    });
  }, 100);
}

function initVisualizations(analyticsData, clusters, urlDistrict, hierarchyData) {
  if (!analyticsData) return;

  // 1. Problems Over Time (Timeline)
  if (analyticsData.timelineData && analyticsData.timelineData.length > 0) {
    const ctxTime = document.getElementById('timeline-chart');
    if(ctxTime) {
      new Chart(ctxTime, {
        type: 'line',
        data: {
          labels: analyticsData.timelineData.map(d => {
            const dt = new Date(d.date);
            return dt.toLocaleDateString('en-US', { weekday: 'short' });
          }),
          datasets: [{
            label: 'Complaints',
            data: analyticsData.timelineData.map(d => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }, x: { grid: { display: false }, ticks: { color: '#9ca3af' } } }
        }
      });
    }
  }

  // 2. Severity Distribution
  if (analyticsData.priorityDist) {
    const ctxSeverity = document.getElementById('severity-chart');
    if (ctxSeverity) {
      new Chart(ctxSeverity, {
        type: 'doughnut',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            data: [
              analyticsData.priorityDist.Critical,
              analyticsData.priorityDist.High,
              analyticsData.priorityDist.Medium,
              analyticsData.priorityDist.Low
            ],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } } }
      });
    }
  }

  // 3. Complaints By Jurisdiction (Fetch hierarchy again or pass it)
  // We'll fetch hierarchy without strict formatting to populate the bar chart
  const urlParams = new URLSearchParams(window.location.search);
  const querySuffix = urlParams.get('district') ? `?district=${urlParams.get('district')}` : '';
  
  fetch(`/api/analytics/hierarchy${querySuffix}`).then(r=>r.json()).then(data => {
    const ctxBar = document.getElementById('jurisdiction-bar-chart');
    if (ctxBar && data && data.length > 0) {
      // Sort by TOTAL clusters descending so districts with ANY data appear first
      const sortedData = data.sort((a, b) => b.totalClusters - a.totalClusters);
      
      // Take the top 15 most active jurisdictions to avoid crowding the chart
      const chartData = sortedData.slice(0, 15); 
      
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: chartData.map(d => typeof d._id === 'object' ? d._id.name : d._id),
          datasets: [
            {
              label: 'Resolved',
              data: chartData.map(d => d.resolvedClusters),
              backgroundColor: '#10b981', // Emerald green
              borderRadius: 4
            },
            {
              label: 'Active',
              data: chartData.map(d => d.activeClusters),
              backgroundColor: '#3b82f6', // Blue
              borderRadius: 4
            }
          ]
        },
          options: {
            responsive: true,
            plugins: { 
              legend: { 
                  display: true,
                  labels: { color: '#9ca3af' }
              } 
            },
            scales: {
              y: { 
                  stacked: true, 
                  beginAtZero: true, 
                  grid: { color: 'rgba(255,255,255,0.05)' },
                  ticks: { color: '#9ca3af' }
              },
              x: { 
                  stacked: true, 
                  grid: { display: false }, 
                  ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 45 } 
              }
            }
          }
      });
    }
  });


  // 4. Leaflet Map
  const mapEl = document.getElementById('dashboard-map');
  if (mapEl && !mapEl.classList.contains('leaflet-container')) {
    const map = L.map('dashboard-map').setView([26.8467, 80.9462], 7); // Center UP
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    }).addTo(map);
    
    // Fetch GeoJSON and render map logic
    fetch('/data/up_districts.geojson').then(r => r.json()).then(geoData => {
       if (urlDistrict) {
           // District View: filter and show only the specific district
           const districtFeature = geoData.features.filter(f => f.properties.district_name === urlDistrict);
           if (districtFeature.length > 0) {
               const districtLayer = L.geoJSON(districtFeature, {
                   style: {
                       color: '#3b82f6',
                       weight: 2,
                       fillOpacity: 0.1
                   }
               }).addTo(map);
               map.fitBounds(districtLayer.getBounds().pad(0.1));
           }
           
           // Overlay the specific clusters as dots
           clusters.forEach(c => {
              if (c.latitude && c.longitude) {
                const color = c.priorityScore >= 90 ? '#ef4444' : (c.priorityScore >= 75 ? '#f59e0b' : '#3b82f6');
                const circle = L.circleMarker([c.latitude, c.longitude], {
                  radius: 6, fillColor: color, color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.8
                }).addTo(map);
                circle.bindPopup(`<b>${c.title}</b><br>Score: ${c.priorityScore}`);
              }
           });
       } else {
           // State View: Choropleth Map of all districts
           const geoLayer = L.geoJSON(geoData, {
               style: function(feature) {
                   const dName = feature.properties.district_name;
                   const hInfo = hierarchyData.find(h => h._id === dName);
                   let fillColor = '#111827'; // default empty
                   let weight = 1;
                   let fillOpacity = 0.5;
                   
                   if (hInfo && hInfo.totalClusters > 0) {
                       if (hInfo.criticalClusters > 0) {
                           fillColor = '#FF3366'; // Red for critical
                           fillOpacity = 0.7;
                       } else {
                           fillColor = '#00E5FF'; // Cyan for normal
                           fillOpacity = 0.6;
                       }
                   }
                   
                   return {
                       fillColor: fillColor,
                       weight: 1,
                       opacity: 1,
                       color: '#374151', // border color
                       fillOpacity: fillOpacity
                   };
               },
               onEachFeature: function(feature, layer) {
                   const dName = feature.properties.district_name;
                   const hInfo = hierarchyData.find(h => h._id === dName);
                   
                   let tooltipContent = `<div style="text-align:center;"><b>${dName}</b>`;
                   if (hInfo && hInfo.totalClusters > 0) {
                       tooltipContent += `<br/><span style="color:#10b981;">Active: ${hInfo.activeClusters}</span><br/><span style="color:#ef4444;">Critical: ${hInfo.criticalClusters}</span></div>`;
                   } else {
                       tooltipContent += `<br/><span style="color:#64748b;">No operational data</span></div>`;
                   }
                   layer.bindTooltip(tooltipContent, { className: 'custom-tooltip' });
                   
                   layer.on({
                       mouseover: function(e) {
                           var layer = e.target;
                           layer.setStyle({ weight: 2, color: '#fff', fillOpacity: 0.9 });
                           if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                               layer.bringToFront();
                           }
                       },
                       mouseout: function(e) {
                           geoLayer.resetStyle(e.target);
                       },
                       click: function(e) {
                           window.location.href = '?district=' + encodeURIComponent(dName);
                       }
                   });
               }
           }).addTo(map);
           
           map.fitBounds(geoLayer.getBounds());
       }
    }).catch(err => {
        console.error("Failed to load geojson", err);
    });
  }
}

function renderLocalBodyView(clusters, corpName, districtName, analyticsData) {
  // Replace the urban-rural-split container with a full Local Body dashboard
  const container = document.getElementById('urban-rural-split');
  container.innerHTML = '';

  const statusColors = {
    submitted: '#64748b',
    investigating: '#3b82f6',
    assigned: '#8b5cf6',
    in_progress: '#f59e0b',
    resolved: '#10b981',
    escalated: '#ef4444'
  };

  const severityColor = (s) => {
    if (!s) return '#64748b';
    if (s >= 85) return '#ef4444';
    if (s >= 70) return '#f59e0b';
    if (s >= 50) return '#3b82f6';
    return '#10b981';
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

  const total = clusters.length;
  const resolved = clusters.filter(c => c.status === 'resolved').length;
  const pending = total - resolved;
  const rate = total === 0 ? 0 : Math.round((resolved / total) * 100);

  // --- Build HTML ---
  container.innerHTML = `
    <!-- Local Body KPIs -->
    <div class="grid grid-cols-4 gap-6 mb-10" style="margin-bottom: 2rem;">
      <div class="card kpi-card animate-fade-up" style="animation-delay:0.1s;">
        <div class="kpi-label">Total Problems</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-insight">All reported clusters</div>
      </div>
      <div class="card kpi-card animate-fade-up" style="animation-delay:0.2s;">
        <div class="kpi-label">Resolved</div>
        <div class="kpi-value" style="color:var(--success);">${resolved}</div>
        <div class="kpi-insight">Successfully closed</div>
      </div>
      <div class="card kpi-card animate-fade-up" style="animation-delay:0.3s;">
        <div class="kpi-label">Pending</div>
        <div class="kpi-value" style="color:var(--high);">${pending}</div>
        <div class="kpi-insight">Awaiting resolution</div>
      </div>
      <div class="card kpi-card animate-fade-up" style="animation-delay:0.4s;">
        <div class="kpi-label">Resolution Rate</div>
        <div class="kpi-value">${rate}%</div>
        <div class="kpi-insight">Efficiency score</div>
      </div>
    </div>

    <!-- Charts + Map Row -->
    <div class="grid mb-8" style="grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
      <div class="card p-4">
        <h3 class="text-lg font-bold mb-4">Status Distribution</h3>
        <canvas id="lb-status-chart" height="200"></canvas>
      </div>
      <div class="card p-4">
        <h3 class="text-lg font-bold mb-4">Complaint Locations</h3>
        <div id="lb-map" style="height: 220px; border-radius:6px; background: var(--bg-page);"></div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-6 flex-wrap" style="margin-bottom:1.5rem;">
      <select id="lb-filter-status" style="background:var(--bg-surface);border:1px solid var(--border-color);color:var(--text-primary);padding:0.4rem 0.8rem;border-radius:4px;outline:none;">
        <option value="">All Statuses</option>
        <option value="submitted">Submitted</option>
        <option value="investigating">Investigating</option>
        <option value="assigned">Assigned</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="escalated">Escalated</option>
      </select>
      <select id="lb-filter-cat" style="background:var(--bg-surface);border:1px solid var(--border-color);color:var(--text-primary);padding:0.4rem 0.8rem;border-radius:4px;outline:none;">
        <option value="">All Categories</option>
      </select>
      <input id="lb-search" type="text" placeholder="Search problems..." style="background:var(--bg-surface);border:1px solid var(--border-color);color:var(--text-primary);padding:0.4rem 0.8rem;border-radius:4px;outline:none;flex:1;min-width:180px;">
    </div>

    <!-- Citizen Complaint Cards -->
    <div class="mb-3" style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);">
      Citizen Problem Reports &amp; Clusters
    </div>
    <div id="lb-complaints-container"></div>
  `;

  // Populate category filter
  const catFilter = document.getElementById('lb-filter-cat');
  const cats = [...new Set(clusters.map(c => c.category).filter(Boolean))];
  cats.forEach(cat => { catFilter.innerHTML += `<option value="${cat}">${cat}</option>`; });

  // Render complaint cards function
  function renderCards(data) {
    const cont = document.getElementById('lb-complaints-container');
    if (!cont) return;
    if (data.length === 0) {
      cont.innerHTML = `<div class="card p-8 text-center"><p class="text-tertiary">No problems match your current filters.</p></div>`;
      return;
    }
    cont.innerHTML = data.map(c => {
      const complaints = c.complaints || [];
      const statusCol = statusColors[c.status] || '#64748b';
      const sCol = severityColor(c.priorityScore);
      const statusLabel = (c.status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const complaintsHTML = complaints.length > 0 ? complaints.map(complaint => `
        <div style="background: var(--bg-page); border-radius:6px; padding:1rem; margin-top:0.75rem; border-left:3px solid ${severityColor(complaint.severity)};">
          <div class="flex justify-between items-start mb-2">
            <div>
              <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);">
                Complaint #${(complaint.id || complaint._id || '').toString().slice(-6).toUpperCase()}
              </span>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">${complaint.category || 'General'} ${complaint.subcategory ? `→ ${complaint.subcategory}` : ''}</div>
            </div>
            <div class="text-right">
              ${complaint.severity ? `<div style="font-size:1.2rem;font-weight:800;color:${severityColor(complaint.severity)};">${complaint.severity}</div><div style="font-size:0.65rem;color:var(--text-tertiary);">Severity</div>` : ''}
            </div>
          </div>
          <p style="font-size:0.9rem;color:var(--text-primary);margin-bottom:0.5rem;">"${complaint.description}"</p>
          <div class="flex flex-wrap gap-3 text-xs" style="color:var(--text-tertiary);">
            ${complaint.address ? `<span>📍 ${complaint.address}</span>` : ''}
            ${complaint.ward ? `<span>🏘️ ${complaint.ward}</span>` : ''}
            ${complaint.urgency ? `<span>⚡ ${complaint.urgency}</span>` : ''}
            ${complaint.durationDays ? `<span>⏱️ ${complaint.durationDays} days ongoing</span>` : ''}
            ${complaint.createdAt ? `<span>📅 ${fmtDate(complaint.createdAt)}</span>` : ''}
          </div>
          ${complaint.imageUrl ? `
            <div class="mt-2">
              <img src="${complaint.imageUrl}" alt="Complaint Photo" style="max-height:120px;border-radius:4px;object-fit:cover;cursor:pointer;" onclick="window.open('${complaint.imageUrl}','_blank')">
            </div>` : ''}
          ${complaint.aiSummary ? `<div style="margin-top:0.5rem;padding:0.5rem;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:4px;font-size:0.8rem;color:#93c5fd;">🤖 ${complaint.aiSummary}</div>` : ''}
        </div>`).join('') : '<div style="font-size:0.85rem;color:var(--text-tertiary);margin-top:0.5rem;">No individual complaint details available.</div>';

      return `
        <div class="card mb-5" style="padding:1.5rem;border-left:4px solid ${statusCol};margin-bottom:1.25rem;">
          <!-- Cluster Header -->
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 style="font-size:1.2rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">${c.title}</h3>
              <div class="flex gap-2 flex-wrap" style="gap:0.4rem;">
                <span class="badge" style="background:${statusCol}22;color:${statusCol};border:1px solid ${statusCol}44;">${statusLabel}</span>
                ${c.category ? `<span class="badge badge-medium">${c.category}</span>` : ''}
                ${c.ward ? `<span class="badge" style="background:rgba(139,92,246,0.1);color:#a78bfa;border:1px solid rgba(139,92,246,0.2);">🏘️ ${c.ward}</span>` : ''}
              </div>
            </div>
            <div class="text-right">
              <div style="font-size:2rem;font-weight:800;color:${sCol};line-height:1;">${c.priorityScore || 0}</div>
              <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);">Priority Score</div>
            </div>
          </div>

          <!-- Cluster Details -->
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div>
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">Root Cause Analysis</div>
              <p style="font-size:0.85rem;color:var(--text-secondary);">${c.probableRootCause || 'Under investigation'}</p>
              ${c.rootCauseConfidence ? `<span style="font-size:0.75rem;color:#60a5fa;">${c.rootCauseConfidence}% confidence</span>` : ''}
            </div>
            <div>
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">Recommended Action</div>
              <p style="font-size:0.85rem;color:var(--text-secondary);">${c.recommendedAction || 'Pending assessment'}</p>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="flex gap-6 mb-3" style="font-size:0.82rem;color:var(--text-secondary);">
            <span>👥 <strong>${c.estimatedAffectedPeople || 0}</strong> Affected</span>
            <span>📋 <strong>${complaints.length}</strong> Report${complaints.length !== 1 ? 's' : ''}</span>
            ${c.latitude && c.longitude ? `<span>📍 <strong>${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}</strong></span>` : ''}
            <span>📅 <strong>${fmtDate(c.createdAt)}</strong></span>
          </div>

          <!-- Collapsible Citizen Reports -->
          <div>
            <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';" 
              style="font-size:0.8rem;font-weight:700;color:var(--primary-brand);background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;">
              ▶ View ${complaints.length} Citizen Report${complaints.length !== 1 ? 's' : ''}
            </button>
            <div style="display:none;">${complaintsHTML}</div>
          </div>

          <div class="mt-3 pt-3 flex justify-between" style="border-top:1px solid var(--border-color);">
            <span style="font-size:0.75rem;color:var(--text-tertiary);">ID: ${(c.id || '').toString().slice(-8).toUpperCase()}</span>
            <a href="/cluster-detail.html?id=${c.id}" class="btn btn-secondary" style="font-size:0.8rem;padding:0.3rem 0.8rem;">Full Detail →</a>
          </div>
        </div>`;
    }).join('');
  }

  // Filter Logic
  function applyFilters() {
    const status = document.getElementById('lb-filter-status').value;
    const cat = document.getElementById('lb-filter-cat').value;
    const search = document.getElementById('lb-search').value.toLowerCase();
    const filtered = clusters.filter(c => {
      const matchStatus = !status || c.status === status;
      const matchCat = !cat || c.category === cat;
      const matchSearch = !search || c.title.toLowerCase().includes(search) || (c.description || '').toLowerCase().includes(search);
      return matchStatus && matchCat && matchSearch;
    });
    renderCards(filtered);
  }

  ['lb-filter-status', 'lb-filter-cat'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  document.getElementById('lb-search')?.addEventListener('input', applyFilters);

  renderCards(clusters);

  // Status chart
  setTimeout(() => {
    const ctxStatus = document.getElementById('lb-status-chart');
    if (ctxStatus) {
      const statusCounts = {};
      clusters.forEach(c => { statusCounts[c.status] = (statusCounts[c.status] || 0) + 1; });
      new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts).map(s => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
          datasets: [{ data: Object.values(statusCounts), backgroundColor: Object.keys(statusCounts).map(s => statusColors[s] || '#64748b'), borderWidth: 0 }]
        },
        options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'right', labels: { color: '#9ca3af', padding: 12 } } } }
      });
    }

    // Leaflet mini map for local body
    const mapEl = document.getElementById('lb-map');
    if (mapEl && !mapEl.classList.contains('leaflet-container')) {
      const validClusters = clusters.filter(c => c.latitude && c.longitude);
      const center = validClusters.length > 0 ? [validClusters[0].latitude, validClusters[0].longitude] : [26.8467, 80.9462];
      const map = L.map('lb-map', { zoomControl: true, attributionControl: false }).setView(center, 13);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}').addTo(map);
      validClusters.forEach(c => {
        const col = c.priorityScore >= 85 ? '#ef4444' : c.priorityScore >= 70 ? '#f59e0b' : '#3b82f6';
        L.circleMarker([c.latitude, c.longitude], { radius: 8, fillColor: col, color: '#fff', weight: 1.5, fillOpacity: 0.9 })
          .bindPopup(`<b>${c.title}</b><br>Score: ${c.priorityScore}<br>Status: ${c.status}`)
          .addTo(map);
      });
      if (validClusters.length > 1) {
        const bounds = L.latLngBounds(validClusters.map(c => [c.latitude, c.longitude]));
        map.fitBounds(bounds.pad(0.2));
      }
    }
  }, 100);
}

function renderPriorityProblems(clusters) {

  const list = document.getElementById('priority-list');
  list.innerHTML = '';
  document.getElementById('hierarchy-list').style.display = 'none';
  document.getElementById('advanced-visualizations').style.display = 'none';
  
  clusters.slice(0, 10).forEach(c => {
    const card = document.createElement('div');
    card.className = 'card problem-card animate-fade-up';
    
    const priorityClass = appUtils.getPriorityBadgeClass(c.priorityScore);
    const priorityLabel = appUtils.getPriorityLabel(c.priorityScore);
    const colorVar = priorityClass.replace('badge-', '');
    
    card.style.setProperty('--critical', `var(--${colorVar})`);
    
    const circumference = 251.2;
    const offset = circumference - (c.priorityScore / 100) * circumference;
    
    card.innerHTML = `
      <div>
        <div class="mb-2 flex items-center gap-2">
          <span class="badge ${priorityClass}">${priorityLabel}</span>
          ${c.probableRootCause ? `<span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.2);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; display: inline-block; vertical-align: text-top;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            AI Analyzed
          </span>` : ''}
        </div>
        <h3 class="text-2xl mb-1">${c.title}</h3>
        <p class="text-sm text-tertiary mb-6">${c._count.complaints} reports &bull; ${c.estimatedAffectedPeople}+ affected</p>
        
        ${c.probableRootCause ? `
          <div class="ai-insight-panel mb-6">
            <div class="header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Probable Underlying Issue
            </div>
            <h4 class="text-xl mb-1" style="color:var(--${colorVar});">${c.probableRootCause}</h4>
            <p class="text-sm font-semibold mb-4" style="color:var(--text-secondary);">${c.rootCauseConfidence}% confidence</p>
            
            <div class="text-sm text-muted mb-2 font-bold uppercase tracking-wider">Evidence</div>
            <ul class="text-sm text-secondary ml-4 mb-4" style="list-style-type:disc;">
              ${c.evidence.slice(0, 3).map(e => `<li class="mb-1">${e}</li>`).join('')}
            </ul>
            
            <div class="text-sm text-muted mb-1 font-bold uppercase tracking-wider">Recommended Action</div>
            <p class="text-sm font-medium text-primary-brand mb-4">${c.recommendedAction || 'Investigate further'}</p>
          </div>
        ` : ''}
        
        <a href="/cluster-detail.html?id=${c.id}" class="btn btn-primary w-full">Investigate Problem</a>
      </div>
      
      <div class="flex justify-center items-start pt-2">
        <div class="priority-ring-wrapper">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle class="priority-ring-bg" cx="50" cy="50" r="40"></circle>
            <circle class="priority-ring-progress" cx="50" cy="50" r="40" style="stroke: var(--${colorVar}); stroke-dashoffset: ${offset};"></circle>
          </svg>
          <div class="priority-ring-text">
            <div class="priority-ring-score" style="color: var(--${colorVar});">${c.priorityScore}</div>
            <div class="priority-ring-max">/ 100</div>
          </div>
        </div>
      </div>
    `;
    
    list.appendChild(card);
    
    setTimeout(() => {
      const circle = card.querySelector('.priority-ring-progress');
      if(circle) circle.style.strokeDashoffset = offset;
    }, 100);
  });
}
