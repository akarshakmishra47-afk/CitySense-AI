document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('reports-list');
  
  try {
    const res = await fetch('/api/complaints');
    if (!res.ok) throw new Error('Failed to load reports');
    const complaints = await res.json();
    
    if (complaints.length === 0) {
      container.innerHTML = '<p class="text-muted">You have not submitted any reports yet.</p>';
      return;
    }
    
    container.innerHTML = '';
    
    // Only show citizen's complaints in a real app, but here we just show all or a subset
    complaints.slice(0, 10).forEach(c => {
      const card = document.createElement('a');
      card.href = `/report-detail.html?id=${c.id}`;
      card.className = 'card';
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      
      const isClustered = c.clusters && c.clusters.length > 0;
      
      card.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center gap-2">
            <span class="badge ${appUtils.getPriorityBadgeClass(c.severity)}">${c.category || 'Issue'}</span>
            ${c.aiSummary ? `<span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.2); font-size: 0.65rem; padding: 0.1rem 0.4rem;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 2px; display: inline-block;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              AI Analyzed
            </span>` : ''}
          </div>
          <span class="text-xs text-muted">${appUtils.formatDate(c.createdAt)}</span>
        </div>
        <h4 class="mb-2" style="font-size:1.1rem">${c.aiSummary || 'Civic Issue'}</h4>
        <p class="text-sm text-muted mb-4" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${c.description}</p>
        <div class="flex justify-between items-center text-sm">
          <span style="color:var(--primary-brand)">${isClustered ? 'Linked to Civic Problem' : 'Under Review'}</span>
          <span class="badge" style="background:#e2e8f0; border:none;">${c.status.replace('_', ' ')}</span>
        </div>
      `;
      container.appendChild(card);
    });
    
  } catch (error) {
    container.innerHTML = `<p style="color:var(--critical)">${error.message}</p>`;
  }
});
