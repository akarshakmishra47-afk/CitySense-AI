document.addEventListener('DOMContentLoaded', async () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  const errorState = document.getElementById('error-state');
  const emptyState = document.getElementById('empty-state');
  const dashboardContent = document.getElementById('dashboard-content');
  const errorMessage = document.getElementById('error-message');

  let complaints = [];
  let map;
  let markers = [];
  let statusChartInstance;
  let trendChartInstance;

  async function checkAuthAndLoad() {
    try {
      // 1. Verify Role
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authData.authenticated || authData.user.role !== 'admin_municipal_corp') {
        throw new Error('Unauthorized. Only Municipal Corporation Admins can access this dashboard.');
      }

      const user = authData.user;
      document.getElementById('header-corp-name').textContent = user.localBodyName || user.municipalCorp || 'Municipal Corporation';
      document.getElementById('header-district').textContent = user.district || 'District';
      document.getElementById('admin-name').textContent = `Welcome, ${user.name}`;

      // 2. Fetch Complaints (Server-side filtering via JWT localBodyId)
      await loadComplaints();
      
      // 3. Fetch Analytics
      await loadAnalytics();
      
      loadingOverlay.classList.add('hidden');
      
    } catch (err) {
      console.error(err);
      loadingOverlay.classList.add('hidden');
      errorState.classList.remove('hidden');
      errorMessage.textContent = err.message;
    }
  }

  async function loadComplaints() {
    const statusFilter = document.getElementById('filter-status').value;
    const searchFilter = document.getElementById('search-input').value;
    
    let url = '/api/local-body/complaints?';
    if (statusFilter) url += `status=${statusFilter}&`;
    if (searchFilter) url += `search=${encodeURIComponent(searchFilter)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load complaints');
    
    complaints = await res.json();
    
    if (complaints.length === 0 && !statusFilter && !searchFilter) {
      emptyState.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      dashboardContent.classList.remove('hidden');
      renderTable();
      initMap();
    }
  }

  async function loadAnalytics() {
    const res = await fetch('/api/local-body/analytics');
    if (!res.ok) return;
    
    const data = await res.json();
    
    // Update KPIs
    document.getElementById('kpi-total').textContent = data.total;
    document.getElementById('kpi-new').textContent = data.newCount;
    document.getElementById('kpi-progress').textContent = data.inProgressCount;
    document.getElementById('kpi-resolved').textContent = data.resolvedCount;
    document.getElementById('kpi-high').textContent = data.highPriority;

    renderCharts(data);
  }

  function getPriorityColor(severity) {
    if (severity >= 90) return 'critical';
    if (severity >= 75) return 'high';
    if (severity >= 50) return 'medium';
    return 'low';
  }

  function renderTable() {
    const tbody = document.getElementById('complaints-table-body');
    tbody.innerHTML = '';
    
    if (complaints.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-tertiary">No complaints found.</td></tr>';
      return;
    }

    complaints.forEach(c => {
      const priorityColor = getPriorityColor(c.severity || 50);
      const date = new Date(c.createdAt).toLocaleDateString();
      
      const photoHtml = c.imageUrl 
        ? `<img src="${c.imageUrl}" class="thumbnail-img" alt="Thumbnail">`
        : `<div class="thumbnail-placeholder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></div>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="flex items-center gap-3">
            ${photoHtml}
            <div class="text-xs font-mono text-muted">${c._id.substring(c._id.length - 6).toUpperCase()}</div>
          </div>
        </td>
        <td>
          <div class="font-semibold text-sm mb-1">${c.category || 'General'}</div>
          <div class="text-xs text-secondary truncate" style="max-width: 200px;">${c.description}</div>
        </td>
        <td>
          <div class="text-sm">${c.user ? c.user.name : 'Anonymous'}</div>
          <div class="text-xs text-muted">${date}</div>
        </td>
        <td>
          <span class="badge badge-${priorityColor}">${c.severity || 50}/100</span>
        </td>
        <td>
          <div class="text-sm uppercase font-semibold text-muted">${c.status.replace('_', ' ')}</div>
        </td>
        <td class="text-right">
          <button class="btn btn-secondary text-xs px-2 py-1 view-btn" data-id="${c._id}">View</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => openModal(e.target.dataset.id));
    });
  }

  function initMap() {
    if (!map) {
      map = L.map('map').setView([26.8467, 80.9462], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      
      // Dark mode filter
      map.getPane('tilePane').style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
    }

    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    const bounds = L.latLngBounds();
    let hasValidCoords = false;

    complaints.forEach(c => {
      if (c.latitude && c.longitude && c.latitude !== 0 && c.longitude !== 0) {
        hasValidCoords = true;
        const color = `var(--${getPriorityColor(c.severity || 50)})`;
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width:12px; height:12px; border-radius:50%; border:2px solid white;"></div>`,
          iconSize: [12, 12]
        });
        
        const m = L.marker([c.latitude, c.longitude], {icon}).addTo(map);
        m.bindPopup(`<b>${c.category || 'Issue'}</b><br>${c.status}`);
        markers.push(m);
        bounds.extend([c.latitude, c.longitude]);
      }
    });

    if (hasValidCoords) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }

  function renderCharts(data) {
    const statusCtx = document.getElementById('status-chart').getContext('2d');
    const trendCtx = document.getElementById('trend-chart').getContext('2d');

    if (statusChartInstance) statusChartInstance.destroy();
    if (trendChartInstance) trendChartInstance.destroy();

    // Setup dark theme text color
    Chart.defaults.color = '#9CA3AF';

    statusChartInstance = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['New', 'In Progress', 'Resolved', 'Escalated'],
        datasets: [{
          data: [
            data.statusCounts.submitted + data.statusCounts.investigating,
            data.statusCounts.assigned + data.statusCounts.in_progress,
            data.statusCounts.resolved,
            data.statusCounts.escalated
          ],
          backgroundColor: ['#00E5FF', '#FBBF24', '#10B981', '#FF3366'],
          borderWidth: 0
        }]
      },
      options: { cutout: '70%', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });

    trendChartInstance = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: data.trend.map(t => t.date.split('-').slice(1).join('/')),
        datasets: [{
          label: 'Complaints',
          data: data.trend.map(t => t.count),
          borderColor: '#00E5FF',
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#374151' } }, x: { grid: { display: false } } }
      }
    });
  }

  // --- Modal Logic ---
  const modal = document.getElementById('detail-modal');
  let currentComplaintId = null;

  async function openModal(id) {
    currentComplaintId = id;
    const c = complaints.find(comp => comp._id === id);
    if (!c) return;

    document.getElementById('modal-title').textContent = `Issue #${c._id.substring(c._id.length-6).toUpperCase()}`;
    document.getElementById('modal-desc').textContent = c.description;
    document.getElementById('modal-category').textContent = c.category || 'General';
    document.getElementById('modal-date').textContent = new Date(c.createdAt).toLocaleString();
    document.getElementById('modal-status-select').value = c.status;
    document.getElementById('modal-citizen').textContent = c.user ? `${c.user.name} (${c.user.email})` : 'Anonymous';
    
    if (c.latitude && c.longitude && c.latitude !== 0) {
      document.getElementById('modal-location').textContent = `${c.address || 'Unknown Address'} (${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})`;
    } else {
      document.getElementById('modal-location').textContent = c.address || 'Location not available';
    }

    const photoImg = document.getElementById('modal-photo');
    const noPhoto = document.getElementById('modal-no-photo');
    if (c.imageUrl) {
      photoImg.src = c.imageUrl;
      photoImg.classList.remove('hidden');
      noPhoto.classList.add('hidden');
    } else {
      photoImg.src = '';
      photoImg.classList.add('hidden');
      noPhoto.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
  }

  document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // --- Update Status ---
  document.getElementById('btn-update-status').addEventListener('click', async () => {
    if (!currentComplaintId) return;
    const newStatus = document.getElementById('modal-status-select').value;
    const btn = document.getElementById('btn-update-status');
    
    try {
      btn.textContent = 'Updating...';
      btn.disabled = true;
      
      const res = await fetch(`/api/local-body/complaints/${currentComplaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      // Refresh data
      await loadComplaints();
      await loadAnalytics();
      
      alert('Status updated successfully');
      modal.classList.add('hidden');
    } catch (err) {
      alert(err.message);
    } finally {
      btn.textContent = 'Update';
      btn.disabled = false;
    }
  });

  // --- Search & Filter Events ---
  document.getElementById('filter-status').addEventListener('change', loadComplaints);
  let debounceTimer;
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadComplaints, 300);
  });
  document.getElementById('retry-btn').addEventListener('click', () => {
    errorState.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    checkAuthAndLoad();
  });
  
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login-admin.html';
  });

  // Initialize
  checkAuthAndLoad();
});
