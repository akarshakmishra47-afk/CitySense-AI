document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('report-form');
  const btnLocation = document.getElementById('btn-location');
  const btnRecord = document.getElementById('btn-record');
  const recordStatus = document.getElementById('record-status');
  const descriptionField = document.getElementById('description');

  // Jurisdiction DOM elements
  const districtSelect = document.getElementById('district-select');
  const localBodySelect = document.getElementById('local-body-select');
  const selectedBodyTypeInput = document.getElementById('selected-body-type');
  const jurisdictionError = document.getElementById('jurisdiction-error');
  const confirmCard = document.getElementById('routing-confirmation-card');
  const confirmDistrict = document.getElementById('confirm-district');
  const confirmBodyType = document.getElementById('confirm-body-type');
  const confirmBodyName = document.getElementById('confirm-body-name');

  const typeRadios = {
    municipalCorporations: {
      radio: document.getElementById('type-corp'),
      label: document.getElementById('lbl-type-corp'),
      badge: document.getElementById('badge-corp'),
      name: 'Municipal Corporation',
      canonical: 'Nagar Nigam'
    },
    municipalCouncils: {
      radio: document.getElementById('type-council'),
      label: document.getElementById('lbl-type-council'),
      badge: document.getElementById('badge-council'),
      name: 'Municipal Council',
      canonical: 'Nagar Palika Parishad'
    },
    townCouncils: {
      radio: document.getElementById('type-town'),
      label: document.getElementById('lbl-type-town'),
      badge: document.getElementById('badge-town'),
      name: 'Town Council',
      canonical: 'Nagar Panchayat'
    }
  };

  // Populate 75 UP Districts
  if (districtSelect && window.UpJurisdiction) {
    const districts = window.UpJurisdiction.getDistricts();
    districts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      districtSelect.appendChild(opt);
    });
  }

  function showJurisdictionError(msg) {
    if (!jurisdictionError) return;
    jurisdictionError.textContent = msg;
    jurisdictionError.classList.remove('hidden');
  }

  function clearJurisdictionError() {
    if (!jurisdictionError) return;
    jurisdictionError.textContent = '';
    jurisdictionError.classList.add('hidden');
  }

  function updateConfirmationCard() {
    const dist = districtSelect ? districtSelect.value : '';
    const typeKey = selectedBodyTypeInput ? selectedBodyTypeInput.value : '';
    const bodyVal = localBodySelect ? localBodySelect.value : '';

    if (dist && typeKey && bodyVal && window.UpJurisdiction && window.UpJurisdiction.validateCombination(dist, typeKey, bodyVal)) {
      const typeInfo = typeRadios[typeKey];
      if (confirmDistrict) confirmDistrict.textContent = dist;
      if (confirmBodyType) confirmBodyType.textContent = typeInfo ? typeInfo.name : typeKey;
      if (confirmBodyName) confirmBodyName.textContent = bodyVal;
      if (confirmCard) confirmCard.classList.remove('hidden');
    } else {
      if (confirmCard) confirmCard.classList.add('hidden');
    }
  }

  function resetLocalBodyDropdown(placeholder = '[ Select district and body type first ]', disabled = true) {
    if (!localBodySelect) return;
    localBodySelect.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = placeholder;
    localBodySelect.appendChild(defaultOpt);
    localBodySelect.disabled = disabled;
    localBodySelect.style.background = disabled ? '#f1f5f9' : 'white';
    localBodySelect.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  function updateBodyTypeStates(district) {
    clearJurisdictionError();

    // Reset selected radio and hidden input
    if (selectedBodyTypeInput) selectedBodyTypeInput.value = '';
    Object.keys(typeRadios).forEach(key => {
      const { radio, label, badge, name } = typeRadios[key];
      if (radio) {
        radio.checked = false;
      }

      if (!district || !window.UpJurisdiction) {
        // No district selected - all disabled
        if (radio) radio.disabled = true;
        if (label) {
          label.style.background = '#f1f5f9';
          label.style.borderColor = 'var(--border-color, #e2e8f0)';
          label.style.cursor = 'not-allowed';
          label.classList.add('disabled');
        }
        if (badge) {
          badge.textContent = 'Not Available';
          badge.style.background = '#e2e8f0';
          badge.style.color = '#64748b';
        }
      } else {
        const isAvailable = window.UpJurisdiction.isTypeAvailable(district, key);
        if (radio) radio.disabled = !isAvailable;

        if (isAvailable) {
          if (label) {
            label.style.background = 'white';
            label.style.borderColor = 'var(--border-color, #cbd5e1)';
            label.style.cursor = 'pointer';
            label.classList.remove('disabled');
          }
          if (badge) {
            badge.textContent = 'Available';
            badge.style.background = '#dcfce7';
            badge.style.color = '#15803d';
          }
        } else {
          if (label) {
            label.style.background = '#f1f5f9';
            label.style.borderColor = 'var(--border-color, #e2e8f0)';
            label.style.cursor = 'not-allowed';
            label.classList.add('disabled');
          }
          if (badge) {
            badge.textContent = 'Disabled — Not Available';
            badge.style.background = '#e2e8f0';
            badge.style.color = '#64748b';
          }
        }
      }
    });

    resetLocalBodyDropdown('[ Select district and body type first ]', true);
    updateConfirmationCard();
  }

  // District Change Event
  if (districtSelect) {
    districtSelect.addEventListener('change', () => {
      const selectedDistrict = districtSelect.value.trim();
      updateBodyTypeStates(selectedDistrict);
    });
  }

  // Local Body Type Selection Event
  Object.keys(typeRadios).forEach(key => {
    const { radio, name } = typeRadios[key];
    if (radio) {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;

        const district = districtSelect ? districtSelect.value.trim() : '';
        if (!district) {
          radio.checked = false;
          showJurisdictionError('Please select a district first.');
          return;
        }

        if (!window.UpJurisdiction.isTypeAvailable(district, key)) {
          radio.checked = false;
          showJurisdictionError(`${name} is not available in ${district}.`);
          return;
        }

        clearJurisdictionError();
        if (selectedBodyTypeInput) selectedBodyTypeInput.value = key;

        // Highlight selected label style
        Object.keys(typeRadios).forEach(k => {
          const l = typeRadios[k].label;
          const isAvail = window.UpJurisdiction.isTypeAvailable(district, k);
          if (k === key) {
            l.style.borderColor = 'var(--primary-brand, #2563eb)';
            l.style.background = '#eff6ff';
          } else if (isAvail) {
            l.style.borderColor = 'var(--border-color, #cbd5e1)';
            l.style.background = 'white';
          } else {
            l.style.borderColor = 'var(--border-color, #e2e8f0)';
            l.style.background = '#f1f5f9';
          }
        });

        // Populate Local Body Dropdown
        const bodies = window.UpJurisdiction.getLocalBodies(district, key);
        if (bodies && bodies.length > 0) {
          resetLocalBodyDropdown('[ Select Local Body ▼ ]', false);
          bodies.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            localBodySelect.appendChild(opt);
          });
        } else {
          resetLocalBodyDropdown('No local body available for this selection.', true);
        }

        updateConfirmationCard();
      });
    }
  });

  // Local Body Select Change Event
  if (localBodySelect) {
    localBodySelect.addEventListener('change', () => {
      clearJurisdictionError();
      updateConfirmationCard();
    });
  }

  // Voice Recording
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  if (btnRecord) {
    btnRecord.addEventListener('click', async () => {
      if (isRecording) {
        mediaRecorder.stop();
        btnRecord.style.backgroundColor = 'var(--primary-brand)';
        btnRecord.style.animation = 'none';
        recordStatus.textContent = 'Processing audio...';
        isRecording = false;
        return;
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Audio recording is not supported by this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const response = await fetch('/api/complaints/transcribe', {
              method: 'POST',
              body: formData
            });
            const data = await response.json();
            
            if (response.ok) {
              const currentText = descriptionField.value.trim();
              descriptionField.value = currentText ? currentText + ' ' + data.text : data.text;
              recordStatus.textContent = 'Transcription complete!';
              setTimeout(() => recordStatus.classList.add('hidden'), 3000);
            } else {
              throw new Error(data.error || 'Failed to transcribe');
            }
          } catch (err) {
            recordStatus.textContent = 'Failed to transcribe: ' + err.message;
            setTimeout(() => recordStatus.classList.add('hidden'), 4000);
          }
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        btnRecord.style.backgroundColor = 'var(--critical)';
        btnRecord.style.animation = 'pulse 2s infinite';
        recordStatus.textContent = '🔴 Recording... (Tap mic again to stop)';
        recordStatus.classList.remove('hidden');
      } catch (err) {
        console.error("Microphone Error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser settings to use this feature.');
        } else {
          alert('Microphone access is not available on this device or browser (' + err.message + ').');
        }
      }
    });
  }
  
  // Geolocation
  if (btnLocation) {
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
  }

  // Image Upload Preview
  const imageInput = document.getElementById('image');
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      const placeholder = document.getElementById('photo-placeholder');
      const previewContainer = document.getElementById('photo-preview-container');
      const previewImg = document.getElementById('photo-preview');
      
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        previewImg.src = objectUrl;
        placeholder.classList.add('hidden');
        previewContainer.classList.remove('hidden');
      } else {
        previewImg.src = '';
        placeholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
      }
    });
  }
  
  // Form submission with strict jurisdiction validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearJurisdictionError();
    
    const desc = descriptionField ? descriptionField.value.trim() : '';
    if (!desc) {
      alert('Please enter a description for what is happening.');
      if (descriptionField) descriptionField.focus();
      return;
    }

    const district = districtSelect ? districtSelect.value.trim() : '';
    if (!district) {
      showJurisdictionError('Please select a district.');
      if (districtSelect) districtSelect.focus();
      return;
    }

    const bodyTypeKey = selectedBodyTypeInput ? selectedBodyTypeInput.value.trim() : '';
    if (!bodyTypeKey) {
      showJurisdictionError('Please select a local body type.');
      return;
    }

    const typeInfo = typeRadios[bodyTypeKey];
    if (!typeInfo || !window.UpJurisdiction.isTypeAvailable(district, bodyTypeKey)) {
      showJurisdictionError(`${typeInfo ? typeInfo.name : 'Selected body type'} is not available in ${district}.`);
      return;
    }

    const bodyName = localBodySelect ? localBodySelect.value.trim() : '';
    if (!bodyName) {
      showJurisdictionError('Please select a local body.');
      if (localBodySelect) localBodySelect.focus();
      return;
    }

    // Cross-district combination verification
    if (!window.UpJurisdiction.validateCombination(district, bodyTypeKey, bodyName)) {
      showJurisdictionError(`Invalid combination: "${bodyName}" does not belong to ${district} ${typeInfo.name}.`);
      return;
    }

    const formData = new FormData(form);

    // Canonical & compatible payload mapping
    const localBodyId = `UP_${district.toUpperCase().replace(/\s+/g, '_')}_${bodyName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    formData.set('district', district);
    formData.set('localBodyType', typeInfo.canonical); // 'Nagar Nigam', 'Nagar Palika Parishad', 'Nagar Panchayat'
    formData.set('bodyType', typeInfo.name); // 'Municipal Corporation', 'Municipal Council', 'Town Council'
    formData.set('localBodyId', localBodyId);
    formData.set('localBodyName', bodyName);
    formData.set('bodyName', bodyName);
    formData.set('municipalCorp', bodyName); // Preserves existing backend model municipalCorp field

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
      await new Promise(r => setTimeout(r, 1000));
      
      loadingSubtext.textContent = 'Generating civic intelligence score...';
      await new Promise(r => setTimeout(r, 1000));
      
      // Success
      document.getElementById('form-container').classList.add('hidden');
      const resultContainer = document.getElementById('result-container');
      const analysisContent = document.getElementById('analysis-content');
      
      const a = result.analysis || {};
      const severity = a.severity || 50;
      const colorVar = (window.appUtils && window.appUtils.getPriorityBadgeClass) 
        ? window.appUtils.getPriorityBadgeClass(severity).replace('badge-', '')
        : 'warning';
      
      analysisContent.innerHTML = `
        <div class="grid grid-cols-2 gap-8">
          <div>
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Classification</div>
            <div class="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
              ${a.category || 'General Civic'} &gt; ${a.subcategory || 'Issue'}
              <span class="badge" style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.2); font-size: 0.65rem; padding: 0.1rem 0.4rem;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 2px; display: inline-block;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                AI Analyzed
              </span>
            </div>
            
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">AI Summary</div>
            <div class="text-sm text-secondary mb-4">${a.summary || desc}</div>

            <div style="background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.15); border-radius: 6px; padding: 0.75rem;">
              <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Routed Authority</div>
              <div class="text-sm font-semibold text-primary">${bodyName} (${district})</div>
              <div class="text-xs text-secondary">${typeInfo.name} &bull; ${typeInfo.canonical}</div>
            </div>
          </div>
          <div style="border-left: 1px solid var(--border-color); padding-left: 2rem;">
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Calculated Severity</div>
            <div class="text-4xl font-bold mb-4" style="color: var(--${colorVar});">${severity}<span class="text-lg text-tertiary">/100</span></div>
            
            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Required Urgency</div>
            <div class="text-sm font-semibold capitalize mb-4">${a.urgency || 'Standard'} Response</div>

            <div class="text-xs uppercase font-bold tracking-wider text-muted mb-1">Routing Status</div>
            <div class="text-sm font-semibold text-green-600 flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Assigned to Local Authority
            </div>
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
