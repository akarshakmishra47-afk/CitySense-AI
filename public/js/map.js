document.addEventListener('DOMContentLoaded', async () => {
  // Initialize map centered roughly on India as default fallback
  const map = L.map('map', {
    zoomControl: false
  }).setView([20.5937, 78.9629], 5);
  
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Use standard OSM to guarantee no API key requirement
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    
  L.tileLayer(tileUrl, {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Apply CSS filter for dark theme instead of relying on external dark tiles
  if (document.body.classList.contains('admin-theme')) {
    const tilePane = map.getPane('tilePane');
    tilePane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
  }

  const panel = document.getElementById('problem-panel');

  try {
    const res = await fetch('/api/clusters');
    if (!res.ok) throw new Error('Failed to load clusters');
    const clusters = await res.json();
    const bounds = L.latLngBounds();

    clusters.forEach(c => {
      // Create circle for cluster radius
      const radiusMeters = (c.radius || 1) * 1000;
      
      let hexColor = '#3b82f6'; // default low
      let colorVar = 'low';
      if (c.priorityScore >= 90) { hexColor = '#ef4444'; colorVar = 'critical'; }
      else if (c.priorityScore >= 75) { hexColor = '#f97316'; colorVar = 'high'; }
      else if (c.priorityScore >= 50) { hexColor = '#eab308'; colorVar = 'medium'; }

      L.circle([c.latitude, c.longitude], {
        color: hexColor,
        fillColor: hexColor,
        fillOpacity: 0.15,
        weight: 1,
        radius: radiusMeters
      }).addTo(map);

      // Create custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pin" style="background-color: ${hexColor};"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker([c.latitude, c.longitude], { icon: customIcon }).addTo(map);
      bounds.extend([c.latitude, c.longitude]);
      
      // Click event to update intelligence panel
      marker.on('click', () => {
        panel.innerHTML = `
          <div class="mb-4">
            <div class="text-xs font-bold text-muted uppercase tracking-wider mb-2">Selected Problem</div>
            <h3 class="text-xl mb-1">${c.title}</h3>
            <span class="badge badge-${colorVar} mb-4">${appUtils.getPriorityLabel(c.priorityScore)}</span>
          </div>
          
          <div class="flex justify-between items-center mb-6 pb-4" style="border-bottom: 1px solid var(--border-color);">
            <div>
              <div class="text-xs text-muted uppercase tracking-wider">Priority Score</div>
              <div class="text-2xl font-bold" style="color: var(--${colorVar});">${c.priorityScore} <span class="text-sm text-tertiary">/100</span></div>
            </div>
            <div class="text-right">
              <div class="text-xs text-muted uppercase tracking-wider">Status</div>
              <div class="text-sm font-semibold uppercase">${c.status.replace('_', ' ')}</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div class="text-xs text-muted uppercase tracking-wider">Reports</div>
              <div class="font-semibold">${c._count.complaints}</div>
            </div>
            <div>
              <div class="text-xs text-muted uppercase tracking-wider">Est. Affected</div>
              <div class="font-semibold">${c.estimatedAffectedPeople}+</div>
            </div>
          </div>
          
          ${c.probableRootCause ? `
            <div class="ai-insight-panel mb-6" style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: var(--radius); padding: 1rem;">
              <div class="text-xs font-bold text-primary-brand uppercase tracking-wider mb-2 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                AI Hypothesis
              </div>
              <h4 class="text-lg mb-1" style="color:var(--text-primary);">${c.probableRootCause}</h4>
              <p class="text-xs font-semibold mb-4 text-tertiary">${c.rootCauseConfidence}% confidence</p>
              
              <div class="text-xs font-bold text-muted uppercase tracking-wider mb-1">Recommended Action</div>
              <p class="text-sm font-medium" style="color: var(--primary-brand);">${c.recommendedAction || 'Investigate further'}</p>
            </div>
          ` : ''}
          
          <a href="/cluster-detail.html?id=${c.id}" class="btn btn-primary w-full" style="width: 100%;">Open Investigation</a>
        `;
      });
    });

    if (clusters.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

  } catch (error) {
    console.error('Error loading map data:', error);
    panel.innerHTML = `<p style="color:var(--critical); padding: 1rem;">Error loading map data.</p>`;
  }
});
