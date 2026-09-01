document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('report-form');
  const btnLocation = document.getElementById('btn-location');
  
  // Geolocation
  btnLocation.addEventListener('click', () => {
    const status = document.getElementById('location-status');
    status.textContent = 'Locating...';
    
    if (!navigator.geolocation) {
      status.textContent = 'Geolocation is not supported by your browser';
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lon;
        
        status.textContent = 'Converting coordinates to address...';
        
        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          
          if (data && data.display_name) {
            // Only keep the first 3 parts of the address for readability (e.g., Street, City, State)
            const shortAddress = data.display_name.split(',').slice(0, 3).join(',');
            document.getElementById('address').value = shortAddress;
            status.textContent = 'Location successfully captured!';
          } else {
            status.textContent = `Coordinates captured: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          status.textContent = `Coordinates captured: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
      },
      () => {
        status.textContent = 'Unable to retrieve your location. Please enter address manually.';
      }
    );
  });

  // Image Upload Preview
  const imageInput = document.getElementById('image');
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      const placeholder = document.getElementById('photo-placeholder');
      const previewContainer = document.getElementById('photo-preview-container');
      const previewImg = document.getElementById('photo-preview');
      
      if (file) {
        // Create an object URL for the preview image
        const objectUrl = URL.createObjectURL(file);
        previewImg.src = objectUrl;
        
        // Swap visibility
        placeholder.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      } else {
        // Reset if no file
        previewImg.src = '';
        placeholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
      }
    });
  }
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    const loading = document.getElementById('loading');
    const loadingSubtext = document.getElementById('loading-subtext');
    loading.classList.remove('hidden');
    
    try {
      loadingSubtext.textContent = 'Extracting keywords and location data...';
      
      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }
      
      loadingSubtext.textContent = 'Comparing against existing cluster models...';
      await new Promise(r => setTimeout(r, 1200)); // UI pacing for demo effect
      
      loadingSubtext.textContent = 'Generating civic intelligence score...';
      await new Promise(r => setTimeout(r, 1200));
      
      // Success
      document.getElementById('form-container').classList.add('hidden');
      const resultContainer = document.getElementById('result-container');
      const analysisContent = document.getElementById('analysis-content');
      
      const a = result.analysis;
      const colorVar = appUtils.getPriorityBadgeClass(a.severity).replace('badge-', '');
      
      analysisContent.innerHTML = `
        <div class="grid grid-cols-2 gap-8">
          <div>
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Classification</div>
            <div class="text-lg font-semibold mb-4 text-primary flex items-center gap-2">
              ${a.category} &gt; ${a.subcategory}
              <span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.2); font-size: 0.65rem; padding: 0.1rem 0.4rem;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 2px; display: inline-block;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                AI Analyzed
              </span>
            </div>
            
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">AI Summary</div>
            <div class="text-sm text-secondary">${a.summary}</div>
          </div>
          <div style="border-left: 1px solid var(--border-color); padding-left: 2rem;">
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Calculated Severity</div>
            <div class="text-4xl font-bold mb-4" style="color: var(--${colorVar});">${a.severity}<span class="text-lg text-tertiary">/100</span></div>
            
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Required Urgency</div>
            <div class="text-sm font-semibold capitalize">${a.urgency} Response</div>
          </div>
        </div>
      `;
      
      resultContainer.classList.remove('hidden');
      
    } catch (error) {
      alert(error.message);
    } finally {
      loading.classList.add('hidden');
    }
  });
});
