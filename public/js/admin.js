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
        
        // Update Insight Text
        if (analyticsData.emergingInsight) {
          document.getElementById('system-insight-text').textContent = analyticsData.emergingInsight;
        }
        
        // Find most common category for "Current Focus"
        if (analyticsData.categoryData && analyticsData.categoryData.length > 0) {
          const topCategory = analyticsData.categoryData.reduce((prev, current) => (prev.count > current.count) ? prev : current);
          document.getElementById('current-focus-text').textContent = topCategory.category + " Management";
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
      
      initVisualizations(analyticsData, allClusters);

      // 2. Fetch Hierarchy Data
      try {
        const hierarchyRes = await fetch(`/api/analytics/hierarchy${querySuffix}`);
        const hierarchyData = await hierarchyRes.json();

        if (isStateView) {
          renderStateView(hierarchyData);
        } else if (isDistrictView) {
          renderDistrictView(hierarchyData);
        }

      } catch(err) {
        console.error(err);
        document.getElementById('hierarchy-grid').innerHTML = '<p style="color:var(--critical)">Failed to load hierarchy data</p>';
      }

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

  hierarchyData.forEach(h => {
     if(!h._id || !h._id.type) return; // Malformed data
     
     const type = h._id.type;
     const name = h._id.name || 'Unknown';
     const total = h.totalClusters;
     const resolved = h.resolvedClusters;

     const cardHTML = `
       <div class="card p-4 hover:border-blue-500 transition-colors cursor-pointer" onclick="window.location.href = window.location.href + (window.location.search ? '&' : '?') + 'corp=' + encodeURIComponent('${name}')">
         <h4 class="text-lg font-bold text-white mb-2">${name}</h4>
         <p class="text-sm text-slate-300">Complaints: <span class="font-bold">${h.totalComplaints}</span></p>
         <p class="text-sm text-emerald-400">Resolved: <span class="font-bold">${resolved}</span></p>
         <div class="text-right mt-2"><span class="text-xs font-bold text-blue-400">VIEW →</span></div>
       </div>
     `;

     if (type === 'Nagar Nigam') { nigamGrid.innerHTML += cardHTML; secNigam.style.display = 'block'; }
     else if (type === 'Nagar Palika Parishad') { palikaGrid.innerHTML += cardHTML; secPalika.style.display = 'block'; }
     else if (type === 'Nagar Panchayat') { panchayatGrid.innerHTML += cardHTML; secPanchayat.style.display = 'block'; }
     else if (type === 'Development Block') { blocksGrid.innerHTML += cardHTML; secBlocks.style.display = 'block'; }
     else if (type === 'Gram Panchayat') { blocksGrid.innerHTML += cardHTML; secBlocks.style.display = 'block'; } // Simplify rendering for MVP
  });
}

function initVisualizations(analyticsData, clusters) {
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
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
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
        options: { responsive: true, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } }
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
      // Filter out zero-data for cleaner bar chart, or keep them if State View
      const chartData = data.slice(0, 20); // Top 20 max to avoid crowding
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: chartData.map(d => typeof d._id === 'object' ? d._id.name : d._id),
          datasets: [{
            label: 'Active Clusters',
            data: chartData.map(d => d.activeClusters),
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } }
          }
        }
      });
    }
  });

  // 4. Leaflet Map
  const mapEl = document.getElementById('dashboard-map');
  if (mapEl && !mapEl.classList.contains('leaflet-container')) {
    const map = L.map('dashboard-map').setView([26.8467, 80.9462], 7); // Center UP
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
    
    // Add markers for active clusters
    const markers = [];
    clusters.forEach(c => {
      if (c.latitude && c.longitude) {
        const color = c.priorityScore >= 90 ? 'red' : (c.priorityScore >= 75 ? 'orange' : 'blue');
        const circle = L.circleMarker([c.latitude, c.longitude], {
          radius: 6,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);
        circle.bindPopup(`<b>${c.title}</b><br>Score: ${c.priorityScore}`);
        markers.push(circle);
      }
    });

    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }
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
