document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const res = await fetch('/api/clusters');
    if (!res.ok) throw new Error('Failed to load clusters');
    const allClusters = await res.json();
    const clusters = allClusters.filter(c => c.status !== 'resolved');
    
    // Calculate stats
    let totalReports = 0;
    let criticalCount = 0;
    let totalAffected = 0;
    
    clusters.forEach(c => {
      totalReports += c._count.complaints;
      if (c.priorityScore >= 90) criticalCount++;
      totalAffected += c.estimatedAffectedPeople;
    });
    
    // Update stats UI
    document.getElementById('stat-reports').textContent = totalReports;
    document.getElementById('stat-problems').textContent = clusters.length;
    document.getElementById('stat-critical').textContent = criticalCount;
    document.getElementById('stat-affected').textContent = totalAffected > 1000 ? (totalAffected/1000).toFixed(1) + 'K' : totalAffected;
    
    // Fetch and update System Intelligence
    try {
      const analyticsRes = await fetch('/api/analytics');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        
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
      console.error("Failed to load analytics for sidebar", err);
    }
    
    // Render priority list
    const list = document.getElementById('priority-list');
    list.innerHTML = '';
    
    clusters.slice(0, 10).forEach(c => {
      const card = document.createElement('div');
      card.className = 'card problem-card animate-fade-up';
      
      const priorityClass = appUtils.getPriorityBadgeClass(c.priorityScore);
      const priorityLabel = appUtils.getPriorityLabel(c.priorityScore);
      const colorVar = priorityClass.replace('badge-', '');
      
      card.style.setProperty('--critical', `var(--${colorVar})`); // Override for the left border
      
      // Calculate SVG dash offset
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
      
      // Small delay for staggered entrance
      setTimeout(() => {
        const circle = card.querySelector('.priority-ring-progress');
        if(circle) circle.style.strokeDashoffset = offset;
      }, 100);
    });
    
  } catch (error) {
    document.getElementById('priority-list').innerHTML = `<p style="color:var(--critical)">${error.message}</p>`;
  }
}

