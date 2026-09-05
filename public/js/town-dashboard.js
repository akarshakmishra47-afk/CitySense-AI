/* ============================================================
 * Town / Local Body Dashboard JS
 * Dynamic dashboard for Nagar Nigam, Palika Parishad, Panchayat
 * ============================================================ */

(async () => {
  const $ = id => document.getElementById(id);
  
  let townMap = null;
  let modalMap = null;
  let mapMarkers = [];
  let currentComplaints = [];
  let currentClusters = [];
  
  let authData = null;
  let isReadOnly = false;
  let localBodyIdParam = null;

  const overlay = $('loading-overlay');

  // ── 1. Auth & Mode Setup ───────────────────────────────────
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

  const { role, localBodyId: jwtLocalBodyId } = authData.user;
  const isStateAdmin = role === 'admin_state';
  const isDistrictAdmin = role === 'admin_district';
  const localBodyRoles = ['admin_municipal_corp', 'admin_municipal_council', 'admin_town_council'];
  
  const params = new URLSearchParams(window.location.search);
  localBodyIdParam = params.get('localBodyId');

  // Determine access mode
  let targetLocalBodyId = null;
  let endpointPrefix = '';

  if (localBodyRoles.includes(role)) {
    // Mode A: Local body admin — strictly use JWT, read-write
    targetLocalBodyId = jwtLocalBodyId;
    endpointPrefix = '/api/local-body';
    isReadOnly = false;
  } else if (isDistrictAdmin || isStateAdmin) {
    // Mode B & C: State/District admin — use query param, read-only via district router
    if (!localBodyIdParam) {
      showError('Local Body ID missing from URL.');
      return;
    }
    targetLocalBodyId = localBodyIdParam;
    endpointPrefix = `/api/district/local-body/${encodeURIComponent(targetLocalBodyId)}`;
    isReadOnly = true;
    $('readonly-badge-header').style.display = 'inline-flex';
  } else {
    showError('Unauthorized access.');
    return;
  }

  // Display user info
  $('user-name-display').textContent = authData.user.name || 'Admin';
  if (isStateAdmin) $('user-role-display').textContent = 'State Admin';
  else if (isDistrictAdmin) $('user-role-display').textContent = 'District Admin';
  else $('user-role-display').textContent = 'Local Body Admin';

  // ── 2. Fetch Data ──────────────────────────────────────────
  let overview = null;
  try {
    // Both existing /api/local-body/analytics and new /api/district/local-body/:id/overview 
    // should return compatible data. We may need to adapt if the old local-body API 
    // doesn't return districtName or localBodyName.
    const r = await fetch(`${endpointPrefix}/${isReadOnly ? 'overview' : 'analytics'}`);
    if (!r.ok) {
      const err = await r.json();
      showError(err.error || 'Failed to load local body data');
      return;
    }
    overview = await r.json();
  } catch (e) {
    showError('Network error loading data');
    return;
  }

  // Handle differences between old local-body/analytics and new overview format
  const total = overview.total !== undefined ? overview.total : (overview.statusCounts ? Object.values(overview.statusCounts).reduce((a,b)=>a+b,0) : 0);
  const resolved = overview.resolved !== undefined ? overview.resolved : (overview.statusCounts?.resolved || 0);
  const pending = total - resolved;
  const critical = overview.critical !== undefined ? overview.critical : 0;
  const high = overview.highPriority !== undefined ? overview.highPriority : 0;
  const rate = total === 0 ? 0 : Math.round((resolved/total)*100);

  // If local-body API doesn't return metadata, use fallback or JWT
  const lbName = overview.localBodyName || authData.user.municipalCorp || targetLocalBodyId;
  const lbType = overview.localBodyType || 'Local Body';
  const dName = overview.districtName || authData.user.district || 'District';

  // Update Header & Breadcrumb
  document.title = `${lbName} | Command Center`;
  $('header-lb-name').textContent = lbName;
  $('lb-title').textContent = lbName;
  $('lb-type-badge').textContent = lbType;
  $('bc-district-link').textContent = dName;
  $('bc-district-link').href = isStateAdmin ? `/district-dashboard.html?district=${encodeURIComponent(dName)}` : '/district-dashboard.html';
  $('bc-lb-name').textContent = lbName;
  
  // KPIs
  $('kpi-total').textContent = total;
  $('kpi-pending').textContent = pending;
  $('kpi-resolved').textContent = resolved;
  $('kpi-critical').textContent = critical;
  $('kpi-high').textContent = high;
  $('kpi-rate').textContent = rate + '%';

  // Charts
  renderCharts(overview);

  // Remove loading overlay
  overlay.style.display = 'none';

  // ── 3. Tabs Setup ──────────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      $(`panel-${tabId}`).classList.add('active');

      if (tabId === 'complaints' && currentComplaints.length === 0) {
        await loadComplaints();
      } else if (tabId === 'ai' && currentClusters.length === 0) {
        await loadClusters();
      } else if (tabId === 'ai-command' && typeof window.loadAiCommandCenter === 'function') {
        await window.loadAiCommandCenter();
      } else if (tabId === 'map') {
        if (currentComplaints.length === 0) await loadComplaints();
        initMap();
      }
    });
  });

  // ── 4. Complaints Logic ────────────────────────────────────
  async function loadComplaints() {
    $('complaints-container').innerHTML = '<div class="spinner" style="margin:2rem auto;"></div>';
    try {
      const r = await fetch(`${endpointPrefix}/complaints`);
      if (r.ok) {
        currentComplaints = await r.json();
        $('complaint-count-badge').textContent = currentComplaints.length;
        renderComplaints(currentComplaints);
      }
    } catch (e) {
      $('complaints-container').innerHTML = '<div style="color:#ef4444;text-align:center;">Failed to load complaints</div>';
    }
  }

  function renderComplaints(data) {
    const cont = $('complaints-container');
    if (!data.length) {
      cont.innerHTML = `<div class="empty-state">No complaints found.</div>`;
      return;
    }

    cont.innerHTML = data.map(c => {
      const sev = c.severity || 50;
      let sevCol = sev >= 85 ? 'badge-critical' : sev >= 70 ? 'badge-high' : sev >= 40 ? 'badge-medium' : 'badge-low';
      let sevText = sev >= 85 ? 'Critical' : sev >= 70 ? 'High' : 'Normal';
      
      let img = c.imageUrl 
        ? `<img src="${c.imageUrl}" class="complaint-photo" alt="Complaint">`
        : `<div class="complaint-photo-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      
      return `
        <div class="complaint-card">
          <div class="complaint-card-header">
            <div>
              <div class="complaint-id">#${c._id.slice(-6).toUpperCase()}</div>
              <h3 style="font-size:1.1rem;font-weight:700;color:#f3f4f6;margin-bottom:0.4rem;">${c.category || 'General Issue'}</h3>
              <div class="complaint-meta">
                <span>📅 ${new Date(c.createdAt).toLocaleDateString()}</span>
                ${c.address ? `<span>📍 ${c.address}</span>` : ''}
              </div>
              <p class="complaint-desc">${(c.description || '').substring(0, 150)}${c.description?.length > 150 ? '...' : ''}</p>
              
              <div style="display:flex;gap:0.5rem;align-items:center;">
                <span class="severity-badge ${sevCol}">${sevText} (${sev})</span>
                <span style="font-size:0.75rem;font-weight:700;color:#9ca3af;text-transform:uppercase;border:1px solid #374151;border-radius:999px;padding:0.2rem 0.6rem;">
                  ${(c.status || '').replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div style="width:160px;border-radius:0.5rem;overflow:hidden;border:1px solid #1f2937;">
              ${img}
            </div>
          </div>
          <div style="background:rgba(15,23,42,0.5);border-top:1px solid rgba(255,255,255,0.05);padding:0.75rem 1.25rem;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:0.75rem;color:#6b7280;">Reporter: ${c.user?.name || 'Citizen'}</div>
            <button class="btn btn-secondary view-btn" data-id="${c._id}" style="padding:0.3rem 0.8rem;font-size:0.75rem;">View Details</button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.view-btn').forEach(b => {
      b.addEventListener('click', e => openModal(e.target.dataset.id));
    });
  }

  $('filter-status').addEventListener('change', filterComplaints);
  $('filter-search').addEventListener('input', filterComplaints);
  
  function filterComplaints() {
    const stat = $('filter-status').value;
    const q = $('filter-search').value.toLowerCase();
    const filtered = currentComplaints.filter(c => {
      const matchStat = !stat || c.status === stat;
      const matchQ = !q || (c.description || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q) || c._id.toLowerCase().includes(q);
      return matchStat && matchQ;
    });
    renderComplaints(filtered);
  }

  // ── 5. AI Clusters ─────────────────────────────────────────
  async function loadClusters() {
    $('ai-container').innerHTML = '<div class="spinner" style="margin:2rem auto;"></div>';
    try {
      // Use district endpoint for read-only, otherwise standard clusters api
      let cUrl = isReadOnly ? `/api/district/local-body/${encodeURIComponent(targetLocalBodyId)}/clusters` : '/api/clusters';
      const r = await fetch(cUrl);
      if (r.ok) {
        currentClusters = await r.json();
        renderClusters(currentClusters);
      }
    } catch (e) {
      $('ai-container').innerHTML = '<div style="color:#ef4444;text-align:center;">Failed to load AI Insights</div>';
    }
  }

  function renderClusters(data) {
    const cont = $('ai-container');
    if (!data || data.length === 0) {
      cont.innerHTML = `<div class="empty-state">No AI clusters detected for this local body yet.</div>`;
      return;
    }

    cont.innerHTML = data.map(c => {
      const pScore = c.priorityScore || 0;
      const badgeCol = pScore >= 85 ? 'background:rgba(255,51,102,0.15);color:#FF3366;border:1px solid rgba(255,51,102,0.3);' 
                     : pScore >= 70 ? 'background:rgba(255,145,0,0.15);color:#FF9100;border:1px solid rgba(255,145,0,0.3);'
                     : 'background:rgba(0,229,255,0.15);color:#00e5ff;border:1px solid rgba(0,229,255,0.3);';

      return `
        <div class="cluster-card">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;">
            <div>
              <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">
                <span class="cluster-priority-badge" style="${badgeCol}">Priority Score: ${pScore}</span>
                <span style="font-size:0.7rem;font-weight:700;color:#9ca3af;text-transform:uppercase;border:1px solid #374151;border-radius:999px;padding:0.25rem 0.75rem;">${c._count?.complaints || c.complaints?.length || 0} Reports</span>
              </div>
              <h3 style="font-size:1.25rem;font-weight:800;color:#f3f4f6;margin-bottom:0.25rem;">${c.title || 'Identified Pattern'}</h3>
              <p style="font-size:0.9rem;color:#9ca3af;">${c.description || 'Multiple similar reports grouped by AI analysis.'}</p>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:0.5rem;">
            <div>
              <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:0.4rem;">Probable Root Cause</div>
              <p style="font-size:0.85rem;color:#d1d5db;">${c.probableRootCause || 'Under investigation'}</p>
            </div>
            <div>
              <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;margin-bottom:0.4rem;">AI Evidence</div>
              <ul style="font-size:0.8rem;color:#9ca3af;padding-left:1rem;">
                ${(c.evidence || []).slice(0,3).map(e => `<li>${e}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="ai-recommendation">
            <div class="ai-rec-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              AI Recommended Action
            </div>
            <p style="font-size:0.9rem;font-weight:600;color:#f3f4f6;">${c.recommendedAction || 'Monitor situation closely.'}</p>
          </div>
          <button class="btn-resolve-cluster" data-cluster-id="${c._id}" style="margin-top:0.75rem;padding:0.4rem 0.8rem;background:#10b981;color:#f3f4f6;border:none;border-radius:0.375rem;cursor:pointer;">Resolve Cluster</button>
        </div>
      `;
    }).join('');
   }

   // ── 6. Map ─────────────────────────────────────────────────
   // Attach resolve handlers after rendering clusters
   function attachClusterResolveHandlers() {
     document.querySelectorAll('.btn-resolve-cluster').forEach(btn => {
       btn.addEventListener('click', async (e) => {
         const clusterId = e.currentTarget.dataset.clusterId;
         const note = prompt('Enter resolution note for this cluster:');
         if (!note) return;
         const afterPhotoInput = document.createElement('input');
         afterPhotoInput.type = 'file';
         afterPhotoInput.accept = 'image/*';
         afterPhotoInput.onchange = async () => {
           const file = afterPhotoInput.files[0];
           const reader = new FileReader();
           reader.onload = async () => {
             const base64 = reader.result;
             await sendResolutionVerification(clusterId, note, base64);
           };
           reader.readAsDataURL(file);
         };
         afterPhotoInput.click();
       });
     });
   }

   async function sendResolutionVerification(clusterId, note, afterPhotoUrl) {
     try {
       const res = await fetch(`/api/ai/verify-resolution/${clusterId}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ resolutionNote: note, afterPhotoUrl })
       });
       const data = await res.json();
       if (data.success) {
         alert(`Resolution verification: ${data.verification.verificationStatus} (confidence ${Math.round(data.verification.confidence * 100)}%)`);
       } else {
         alert('Verification failed');
       }
     } catch (err) { alert('Error during verification'); }
   }

   // Wrap original renderClusters to attach handlers
   const originalRenderClusters = renderClusters;
   renderClusters = function(data) {
     originalRenderClusters(data);
     attachClusterResolveHandlers();
   };

   function initMap() {
    if (townMap) { townMap.invalidateSize(); return; }
    
    townMap = L.map('town-map').setView([26.8467, 80.9462], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(townMap);
    townMap.getPane('tilePane').style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';

    const bounds = L.latLngBounds();
    let hasCoords = false;

    currentComplaints.forEach(c => {
      if (!c.latitude || !c.longitude || c.latitude === 0) return;
      hasCoords = true;
      const sev = c.severity || 50;
      const col = sev >= 85 ? '#FF3366' : sev >= 70 ? '#f59e0b' : '#3b82f6';
      const icon = L.divIcon({ html: `<div style="width:12px;height:12px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.8);"></div>`, className: '' });
      L.marker([c.latitude, c.longitude], { icon })
       .bindPopup(`<b>${c.category}</b><br>${(c.status||'').replace(/_/g,' ')}`)
       .addTo(townMap);
      bounds.extend([c.latitude, c.longitude]);
    });

    if (hasCoords) townMap.fitBounds(bounds, { padding: [30,30], maxZoom: 15 });
  }

  // ── 7. Charts ──────────────────────────────────────────────
  function renderCharts(data) {
    Chart.defaults.color = '#9ca3af';

    // Trend
    if (data.trend && data.trend.length) {
      new Chart($('chart-trend'), {
        type: 'line',
        data: {
          labels: data.trend.map(t => new Date(t.date || t._id).toLocaleDateString('en-IN', { month:'short', day:'numeric' })),
          datasets: [{ data: data.trend.map(t => t.count), borderColor: '#00e5ff', backgroundColor: 'rgba(0,229,255,0.08)', fill: true, tension: 0.4, pointRadius: 1 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
      });
    }

    // Status
    if (data.statusDistribution || data.statusCounts) {
      const dist = data.statusDistribution || Object.entries(data.statusCounts).map(([k,v]) => ({status:k, count:v}));
      const cols = { submitted: '#64748b', investigating: '#3b82f6', assigned: '#8b5cf6', in_progress: '#f59e0b', resolved: '#10b981', escalated: '#FF3366' };
      new Chart($('chart-status'), {
        type: 'doughnut',
        data: {
          labels: dist.map(s => s.status.replace(/_/g, ' ')),
          datasets: [{ data: dist.map(s => s.count), backgroundColor: dist.map(s => cols[s.status] || '#6b7280'), borderWidth:0 }]
        },
        options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'right', labels: { padding:10, font:{size:10} } } } }
      });
    }
  }

  // ── 8. Modal & Status Update ───────────────────────────────
  let activeComplaintId = null;
  const modal = $('detail-modal');

  function openModal(id) {
    const c = currentComplaints.find(x => x._id === id);
    if (!c) return;
    activeComplaintId = id;

    $('modal-title').textContent = `Issue #${c._id.slice(-6).toUpperCase()}`;
    $('modal-desc').textContent = c.description || 'No description provided.';
    $('modal-category').textContent = c.category || 'General';
    $('modal-date').textContent = new Date(c.createdAt).toLocaleString();
    $('modal-severity').textContent = c.severity || 50;
    $('modal-severity').style.color = (c.severity >= 85) ? '#FF3366' : (c.severity >= 70) ? '#f59e0b' : '#00e5ff';
    $('modal-location').textContent = c.address || 'Location unavailable';

    const durationDays = Math.max(1, Math.floor((new Date() - new Date(c.createdAt)) / (1000*60*60*24)));
    $('modal-duration').textContent = `${durationDays} Days`;

    if (c.imageUrl) {
      $('modal-photo').src = c.imageUrl;
      $('modal-photo').style.display = 'block';
      $('modal-no-photo').style.display = 'none';
    } else {
      $('modal-photo').style.display = 'none';
      $('modal-no-photo').style.display = 'block';
    }

    if (c.aiSummary) {
      $('modal-ai-box').style.display = 'block';
      $('modal-ai-text').textContent = c.aiSummary;
    } else {
      $('modal-ai-box').style.display = 'none';
    }

    // Status Update UI
    if (isReadOnly) {
      $('modal-status-section').style.display = 'none';
    } else {
      $('modal-status-section').style.display = 'flex';
      $('modal-status-select').value = c.status || 'submitted';
    }

    modal.style.display = 'flex';

    // Mini Map
    if (c.latitude && c.longitude && c.latitude !== 0) {
      if (!modalMap) {
        modalMap = L.map('modal-map', { zoomControl:false, attributionControl:false }).setView([c.latitude, c.longitude], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(modalMap);
        modalMap.getPane('tilePane').style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
      } else {
        modalMap.setView([c.latitude, c.longitude], 14);
      }
      L.marker([c.latitude, c.longitude]).addTo(modalMap);
      setTimeout(() => modalMap.invalidateSize(), 100);
    }
  }

  $('modal-close').addEventListener('click', () => modal.style.display = 'none');

  $('modal-status-btn').addEventListener('click', async () => {
    if (isReadOnly || !activeComplaintId) return;
    const newStatus = $('modal-status-select').value;
    const btn = $('modal-status-btn');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      // Must use original local-body API which enforces local body auth
      const r = await fetch(`/api/local-body/complaints/${activeComplaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!r.ok) throw new Error('Update failed');
      
      // Update local data
      const c = currentComplaints.find(x => x._id === activeComplaintId);
      if (c) c.status = newStatus;
      filterComplaints();
      
      // Flash success
      btn.textContent = 'Success';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Update';
        btn.style.background = '';
        modal.style.display = 'none';
      }, 1000);
    } catch (e) {
      alert(e.message);
      btn.disabled = false;
      btn.textContent = 'Update';
    }
  });

  // Logout
  $('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login-admin.html';
  });

})();
