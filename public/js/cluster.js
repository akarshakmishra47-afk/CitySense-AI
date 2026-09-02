document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const content = document.getElementById('content');

  if (!id) {
    content.innerHTML = '<p class="text-muted">No problem ID provided.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/clusters/${id}`);
    if (!res.ok) throw new Error('Problem not found');
    const c = await res.json();

    const colorVar = appUtils.getPriorityBadgeClass(c.priorityScore).replace('badge-', '');
    const priorityLabel = appUtils.getPriorityLabel(c.priorityScore);
    
    // Status select options
    const statuses = ['submitted', 'investigating', 'assigned', 'in_progress', 'resolved'];
    const statusOptions = statuses.map(s => 
      `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s.replace('_', ' ').toUpperCase()}</option>`
    ).join('');

    content.innerHTML = `
      <div style="border-left: 4px solid var(--${colorVar}); padding-left: 1.5rem; margin-bottom: 2rem;">
        <div class="mb-2 flex items-center gap-2">
          <span class="badge badge-${colorVar}">${priorityLabel}</span>
          ${c.probableRootCause ? `<span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.2);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; display: inline-block; vertical-align: text-top;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            AI Analyzed
          </span>` : ''}
        </div>
        <h1 style="font-size: 2.5rem; line-height: 1.1; margin-bottom: 0.5rem;">${c.title}</h1>
        <div class="flex items-end gap-4">
          <div style="font-size: 3.5rem; font-weight: 800; line-height: 1; color: var(--${colorVar});">${c.priorityScore}<span style="font-size: 1.5rem; color: var(--text-tertiary); font-weight: 600;">/100</span></div>
          <div class="text-sm text-tertiary pb-2 uppercase tracking-wider font-bold">Priority Score</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <!-- Main Column -->
        <div>
          ${c.probableRootCause ? `
            <div class="panel" style="border-color: var(--${colorVar}-border); background: var(--bg-surface);">
              <div class="panel-header flex justify-between items-center" style="color: var(--${colorVar}); border-color: var(--${colorVar}-border);">
                <span>AI Hypothesis</span>
                <span class="badge" style="background:var(--${colorVar}-light); color:var(--${colorVar});">${c.rootCauseConfidence}% Confidence</span>
              </div>
              <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 2rem;">${c.probableRootCause}</h2>
              
              <div class="text-xs uppercase tracking-wider font-bold text-muted mb-4">Why CivicPulse Thinks This</div>
              <div class="grid grid-cols-2 gap-4 mb-6">
                ${c.evidence.map(e => `
                  <div class="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary-brand); flex-shrink:0; margin-top:2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span class="text-sm text-secondary">${e}</span>
                  </div>
                `).join('')}
              </div>
              
              <div class="p-4" style="background: var(--bg-page); border-radius: var(--radius); border: 1px solid var(--border-color);">
                <div class="text-xs uppercase tracking-wider font-bold text-primary-brand mb-2">Recommended Action</div>
                <div class="font-semibold">${c.recommendedAction || 'Investigate further'}</div>
              </div>
              <p class="text-xs text-secondary mt-4">AI-generated insight intended to support investigation. Physical conditions should be verified by authorized personnel.</p>
            </div>
          ` : ''}
          
          <div class="panel">
            <div class="panel-header">Timeline</div>
            <div style="height: 250px;">
              <canvas id="timelineChart"></canvas>
            </div>
          </div>
          
          <div class="panel">
            <div class="panel-header flex justify-between">
              <span>Citizen Reports</span>
              <span class="badge" style="background: var(--bg-page); border: 1px solid var(--border-color); color: var(--text-secondary);">${c.complaints.length} Total</span>
            </div>
            <div style="max-height: 400px; overflow-y: auto; padding-right: 1rem;">
              ${c.complaints.map(cc => {
                const sColor = appUtils.getPriorityBadgeClass(cc.severity).replace('badge-', '');
                return `
                <div class="report-card">
                  <div class="flex justify-between items-start mb-2">
                    <div class="text-xs text-tertiary">${appUtils.formatDate(cc.createdAt)}</div>
                    <div class="text-xs font-bold px-2 py-1 rounded" style="background: var(--${sColor}-light); color: var(--${sColor}); border: 1px solid var(--${sColor}-border);">${cc.severity}/100 Severity</div>
                  </div>
                  <p class="text-sm text-primary mb-2">${cc.summary}</p>
                  <div class="text-xs text-secondary flex gap-4">
                    <span><strong>Cat:</strong> ${cc.category}</span>
                    <span><strong>Loc:</strong> ${cc.latitude.toFixed(4)}, ${cc.longitude.toFixed(4)}</span>
                  </div>
                </div>
              `}).join('')}
            </div>
          </div>
        </div>
        
        <!-- Right Column -->
        <div>
          <div class="panel">
            <div class="panel-header">Impact</div>
            <div class="grid grid-cols-2 gap-4 mb-2">
              <div>
                <div class="text-3xl font-bold" style="color: var(--text-primary); line-height: 1;">${c._count.complaints}</div>
                <div class="text-xs text-muted uppercase font-bold tracking-wider mt-1">Reports</div>
              </div>
              <div>
                <div class="text-3xl font-bold" style="color: var(--text-primary); line-height: 1;">${c.estimatedAffectedPeople}+</div>
                <div class="text-xs text-muted uppercase font-bold tracking-wider mt-1">Affected</div>
              </div>
            </div>
          </div>
          
          <div class="panel">
            <div class="panel-header">Priority Breakdown</div>
            
            <div class="bar-container">
              <div class="bar-label-wrap">
                <span>Severity</span>
                <span>${c.severityScore}/100</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: ${c.severityScore}%; background: var(--critical);"></div></div>
            </div>
            
            <div class="bar-container">
              <div class="bar-label-wrap">
                <span>Impact</span>
                <span>${c.impactScore}/100</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: ${c.impactScore}%; background: var(--high);"></div></div>
            </div>
            
            <div class="bar-container">
              <div class="bar-label-wrap">
                <span>Frequency</span>
                <span>${c.frequencyScore}/100</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: ${c.frequencyScore}%; background: var(--medium);"></div></div>
            </div>
            
            <div class="bar-container">
              <div class="bar-label-wrap">
                <span>Duration</span>
                <span>${c.durationScore}/100</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: ${c.durationScore}%; background: var(--low);"></div></div>
            </div>
          </div>
          
          <div class="panel">
            <div class="panel-header">Status</div>
            <div class="form-group mb-2">
              <label for="status-select" class="text-xs text-muted uppercase tracking-wider">Update Status</label>
              <select id="status-select" class="mb-4">${statusOptions}</select>
              <button id="btn-update-status" class="btn btn-primary w-full" style="width: 100%;">Save Status</button>
              <p id="status-msg" class="text-xs mt-2 text-center"></p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Status Update Logic
    const btnUpdate = document.getElementById('btn-update-status');
    const statusMsg = document.getElementById('status-msg');
    btnUpdate.addEventListener('click', async () => {
      const newStatus = document.getElementById('status-select').value;
      btnUpdate.disabled = true;
      btnUpdate.textContent = 'Saving...';
      
      try {
        const updateRes = await fetch(`/api/clusters/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        
        if (!updateRes.ok) throw new Error('Failed to update');
        
        statusMsg.textContent = 'Status updated successfully.';
        statusMsg.style.color = 'var(--success)';
      } catch (err) {
        statusMsg.textContent = err.message;
        statusMsg.style.color = 'var(--critical)';
      } finally {
        btnUpdate.disabled = false;
        btnUpdate.textContent = 'Save Status';
        setTimeout(() => statusMsg.textContent = '', 3000);
      }
    });

    // Chart logic
    renderTimelineChart(c.complaints);

  } catch (error) {
    content.innerHTML = `<p style="color:var(--critical);">${error.message}</p>`;
  }
});

function renderTimelineChart(complaintsData) {
  // Sort complaints by date
  const sorted = [...complaintsData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  if (sorted.length === 0) return;

  const ctx = document.getElementById('timelineChart');
  if (!ctx) return;
  
  // Group by day for simple timeline
  const countsByDay = {};
  
  sorted.forEach(c => {
    const date = new Date(c.createdAt).toLocaleDateString();
    countsByDay[date] = (countsByDay[date] || 0) + 1;
  });
  
  const labels = Object.keys(countsByDay);
  const data = Object.values(countsByDay);

  const styleConfig = getComputedStyle(document.body);
  const textColor = styleConfig.getPropertyValue('--text-secondary').trim() || '#94a3b8';
  const gridColor = styleConfig.getPropertyValue('--border-color').trim() || '#334155';
  const primaryColor = styleConfig.getPropertyValue('--primary-brand').trim() || '#3b82f6';

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Reports per Day',
        data: data,
        borderColor: primaryColor,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: primaryColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          ticks: { stepSize: 1, color: textColor },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      }
    }
  });
}
