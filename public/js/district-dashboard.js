/* ============================================================
 * District Dashboard JS
 * Supports:
 *   admin_district — uses JWT district (query param ignored)
 *   admin_state    — uses ?district= query param (read-only)
 * ============================================================ */

(async () => {
  const $ = id => document.getElementById(id);
  let districtMap = null;
  let trendChart = null, statusChart = null, categoryChart = null;

  const overlay = $('loading-overlay');

  // ── 1. Auth Check ──────────────────────────────────────────
  let authData;
  try {
    const r = await fetch('/api/auth/me');
    authData = await r.json();
  } catch {
    window.location.href = '/login-admin.html';
    return;
  }

  if (!authData.authenticated) {
    window.location.href = '/login-admin.html';
    return;
  }

  const { role, name } = authData.user;
  const isStateAdmin = role === 'admin_state';
  const isDistrictAdmin = role === 'admin_district';
  const localBodyRoles = ['admin_municipal_corp', 'admin_municipal_council', 'admin_town_council'];

  // Redirect local-body admins to town dashboard
  if (localBodyRoles.includes(role)) {
    window.location.href = '/town-dashboard.html';
    return;
  }

  if (!isStateAdmin && !isDistrictAdmin) {
    window.location.href = '/login-admin.html';
    return;
  }

  // ── 2. Determine district param ────────────────────────────
  // For admin_district: district is taken from JWT (never from URL)
  // For admin_state:    district comes from ?district= URL param
  const params = new URLSearchParams(window.location.search);
  const urlDistrict = params.get('district'); // only used for state admin

  // Display user info
  $('user-name-display').textContent = name || 'Admin';
  $('user-role-display').textContent = isStateAdmin ? 'State Admin (View Only)' : 'District Admin';
  if (isStateAdmin) {
    $('readonly-indicator').style.display = 'inline-flex';
  }

  // ── 3. Fetch Overview ──────────────────────────────────────
  let overviewUrl = '/api/district/overview';
  if (isStateAdmin && urlDistrict) {
    overviewUrl += `?district=${encodeURIComponent(urlDistrict)}`;
  }

  let overview;
  try {
    const r = await fetch(overviewUrl);
    if (!r.ok) {
      const err = await r.json();
      showError(err.error || 'Failed to load district data');
      return;
    }
    overview = await r.json();
  } catch (e) {
    showError('Network error loading overview');
    return;
  }

  const district = overview.districtName;

  // ── 4. Update Header / Breadcrumb ─────────────────────────
  document.title = `${district} | CitySense AI`;
  $('district-title').textContent = `${district} District`;
  $('bc-district').textContent = district;
  $('district-subtitle').textContent = isStateAdmin
    ? `Viewing district data as State Admin (read-only)`
    : `District Admin Command Center`;

  // Show pilot badge if district has data
  if (overview.total > 0) {
    $('pilot-badge').style.display = 'inline-flex';
  }

  // ── 5. KPIs ────────────────────────────────────────────────
  $('kpi-total').textContent = overview.total;
  $('kpi-pending').textContent = overview.pending;
  $('kpi-resolved').textContent = overview.resolved;
  $('kpi-critical').textContent = overview.critical;
  $('kpi-rate').textContent = overview.resolutionRate + '%';

  // ── 6. Charts ──────────────────────────────────────────────
  Chart.defaults.color = '#9ca3af';

  // Trend
  const ctxTrend = $('chart-trend');
  if (ctxTrend && overview.trend?.length) {
    trendChart = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: overview.trend.map(t => {
          const d = new Date(t.date);
          return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Problems',
          data: overview.trend.map(t => t.count),
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0,229,255,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
          x: { grid: { display: false }, ticks: { color: '#6b7280', maxTicksLimit: 8 } }
        }
      }
    });
  }

  // Status Distribution
  const ctxStatus = $('chart-status');
  if (ctxStatus && overview.statusDistribution?.length) {
    const statusColors = {
      submitted: '#64748b', investigating: '#3b82f6', assigned: '#8b5cf6',
      in_progress: '#f59e0b', resolved: '#10b981', escalated: '#FF3366'
    };
    statusChart = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: overview.statusDistribution.map(s => s.status.replace(/_/g, ' ')),
        datasets: [{
          data: overview.statusDistribution.map(s => s.count),
          backgroundColor: overview.statusDistribution.map(s => statusColors[s.status] || '#6b7280'),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: { legend: { position: 'right', labels: { padding: 10, font: { size: 11 } } } }
      }
    });
  }

  // Category chart
  const ctxCat = $('chart-category');
  if (ctxCat && overview.categoryDistribution?.length) {
    const top = overview.categoryDistribution.slice(0, 7);
    categoryChart = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: top.map(c => c.category),
        datasets: [{
          data: top.map(c => c.count),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
          y: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } }
        }
      }
    });
  }

  // ── 7. Map ─────────────────────────────────────────────────
  let mapUrl = '/api/district/complaints';
  if (isStateAdmin && urlDistrict) mapUrl += `?district=${encodeURIComponent(urlDistrict)}`;

  let mapComplaints = [];
  try {
    const r = await fetch(mapUrl);
    if (r.ok) mapComplaints = await r.json();
  } catch { /* non-fatal */ }

  $('map-count').textContent = mapComplaints.length;

  if (districtMap === null) {
    districtMap = L.map('district-map').setView([26.8467, 80.9462], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(districtMap);
    districtMap.getPane('tilePane').style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
  }

  const bounds = L.latLngBounds();
  let hasCoords = false;

  mapComplaints.forEach(c => {
    if (!c.latitude || !c.longitude || c.latitude === 0) return;
    hasCoords = true;
    const sev = c.severity || 50;
    const col = sev >= 85 ? '#FF3366' : sev >= 70 ? '#f59e0b' : '#3b82f6';
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.8);"></div>`,
      iconSize: [10, 10]
    });
    const m = L.marker([c.latitude, c.longitude], { icon }).addTo(districtMap);
    m.bindPopup(`
      <b>${c.category || 'Issue'}</b><br>
      Status: ${(c.status || '').replace(/_/g, ' ')}<br>
      ${c.address ? `📍 ${c.address}` : ''}
    `);
    bounds.extend([c.latitude, c.longitude]);
  });

  if (hasCoords) {
    districtMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }

  // ── 8. Local Bodies ────────────────────────────────────────
  let lbUrl = '/api/district/local-bodies';
  if (isStateAdmin && urlDistrict) lbUrl += `?district=${encodeURIComponent(urlDistrict)}`;

  let localBodies = [];
  try {
    const r = await fetch(lbUrl);
    if (r.ok) localBodies = await r.json();
  } catch { /* non-fatal */ }

  renderLocalBodies(localBodies);

  // ── 9. Done ────────────────────────────────────────────────
  overlay.style.display = 'none';

  // ── Logout ─────────────────────────────────────────────────
  $('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login-admin.html';
  });

  // ── Render local bodies grouped by type ───────────────────
  function renderLocalBodies(bodies) {
    const container = $('local-bodies-container');

    if (!bodies || bodies.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.5" style="margin:0 auto 1rem;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 style="color:#9ca3af; font-size:1rem; margin-bottom:0.5rem;">Pilot Coverage Not Available</h3>
          <p style="color:#6b7280; font-size:0.85rem;">No complaint data has been onboarded for local bodies in this district yet.</p>
        </div>
      `;
      return;
    }

    $('lb-count-badge').textContent = `${bodies.length} local bod${bodies.length === 1 ? 'y' : 'ies'} with data`;

    // Group by type
    const typeOrder = ['Nagar Nigam', 'Nagar Palika Parishad', 'Nagar Panchayat'];
    const typeColors = {
      'Nagar Nigam': '#00e5ff',
      'Nagar Palika Parishad': '#8b5cf6',
      'Nagar Panchayat': '#10b981'
    };
    const grouped = {};
    bodies.forEach(b => {
      const t = b.localBodyType || 'Other';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(b);
    });

    let html = '';
    const orderedTypes = [...typeOrder.filter(t => grouped[t]), ...Object.keys(grouped).filter(t => !typeOrder.includes(t))];

    orderedTypes.forEach(type => {
      const bods = grouped[type];
      const dotColor = typeColors[type] || '#6b7280';
      html += `
        <div class="lb-type-section">
          <div class="lb-type-label">
            <span class="lb-type-dot" style="background:${dotColor};"></span>
            ${type} (${bods.length})
          </div>
          <div class="lb-cards-grid">
            ${bods.map(b => buildLbCard(b, dotColor)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function buildLbCard(b, color) {
    const rate = b.resolutionRate;
    const rateColor = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#FF3366';
    // Navigate using only localBodyId — never name/type in URL
    const href = `/town-dashboard.html?localBodyId=${encodeURIComponent(b.localBodyId)}`;
    return `
      <a href="${href}" class="lb-card" style="border-left:3px solid ${color}22;">
        <div class="lb-card-name">${b.localBodyName}</div>
        <div class="lb-card-type">${b.localBodyType}</div>
        <div class="lb-stats">
          <div>
            <div class="lb-stat-val">${b.total}</div>
            <div class="lb-stat-label">Total</div>
          </div>
          <div>
            <div class="lb-stat-val" style="color:#f59e0b;">${b.pending}</div>
            <div class="lb-stat-label">Pending</div>
          </div>
          <div>
            <div class="lb-stat-val" style="color:#10b981;">${b.resolved}</div>
            <div class="lb-stat-label">Resolved</div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#6b7280;margin-bottom:4px;">
            <span>Resolution Rate</span><span style="color:${rateColor};font-weight:700;">${rate}%</span>
          </div>
          <div class="lb-progress-bar">
            <div class="lb-progress-fill" style="width:${rate}%;background:${rateColor};"></div>
          </div>
        </div>
      </a>
    `;
  }

  function showError(msg) {
    overlay.style.display = 'none';
    document.body.innerHTML += `
      <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0b0f19;z-index:999;">
        <div style="background:#111827;border:1px solid #374151;border-radius:1rem;padding:2.5rem;max-width:480px;text-align:center;">
          <div style="color:#FF3366;font-size:2rem;margin-bottom:1rem;">⚠</div>
          <h2 style="color:#f3f4f6;margin-bottom:0.75rem;">Access Error</h2>
          <p style="color:#9ca3af;">${msg}</p>
          <a href="/admin.html" style="display:inline-block;margin-top:1.5rem;padding:0.6rem 1.5rem;background:#3b82f6;color:white;border-radius:0.5rem;text-decoration:none;font-weight:700;">← Back to State Dashboard</a>
        </div>
      </div>
    `;
  }

})();
