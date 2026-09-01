document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to load analytics');
    const data = await res.json();
    
    // Insight Banner
    if (data.emergingInsight) {
      document.getElementById('emerging-insight').textContent = data.emergingInsight;
      document.getElementById('insight-banner').classList.remove('hidden');
    }

    // Timeline Chart
    if (data.timelineData) {
      const ctx = document.getElementById('timelineChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.timelineData.map(d => d.date),
          datasets: [{
            label: 'New Reports',
            data: data.timelineData.map(d => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }

    // Category Chart
    if (data.categoryData) {
      const ctx = document.getElementById('categoryChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.categoryData.map(d => d.category),
          datasets: [{
            label: 'Total Reports',
            data: data.categoryData.map(d => d.count),
            backgroundColor: [
              '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }

    // Priority Chart
    if (data.priorityDist) {
      const ctx = document.getElementById('priorityChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            data: [
              data.priorityDist.Critical,
              data.priorityDist.High,
              data.priorityDist.Medium,
              data.priorityDist.Low
            ],
            backgroundColor: [
              '#ef4444', // Critical
              '#f97316', // High
              '#eab308', // Medium
              '#3b82f6'  // Low
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // System Status
    if (data.systemStatus) {
      document.getElementById('system-status-container').innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-tertiary); margin:0 auto 1rem auto;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 12 17.19 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        <h3 class="text-xl mb-2">${data.systemStatus.uptime} AI Pipeline Uptime</h3>
        <p class="text-sm text-tertiary">Currently connected to <span style="color:var(--primary-brand); font-weight:700;">${data.systemStatus.model}</span>.<br/>Processed ${data.systemStatus.processed} unique reports.</p>
      `;
    }

  } catch (error) {
    console.error('Error loading analytics:', error);
  }
});
