pages['goals'] = {
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Goal Setting</h2>
        <p class="page-desc">Define your profile, health goals and medical records.</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Physical Profile</h3>
          </div>
          <form id="goalForm" style="display:flex;flex-direction:column;gap:16px">
            <div class="form-row-2">
              <div class="form-group"><label>Age (years)</label><input type="number" id="gAge" class="input-wrap" style="width:100%" required></div>
              <div class="form-group"><label>Gender</label>
                <select id="gGender" class="input-wrap" style="width:100%">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group"><label>Height (cm)</label><input type="number" id="gHeight" class="input-wrap" style="width:100%" step="any" required></div>
              <div class="form-group"><label>Current Weight (kg)</label><input type="number" id="gWeight" class="input-wrap" style="width:100%" step="any" required></div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Primary Goal</label>
                <select id="gGoal" class="input-wrap" style="width:100%">
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                </select>
              </div>
              <div class="form-group">
                <label style="display:flex;justify-content:space-between">Target Weight (kg) <a href="#" onclick="pages.goals.suggestWeight(event)" style="color:var(--teal);text-decoration:none;font-size:11px">Auto-Suggest</a></label>
                <input type="number" id="gTarget" class="input-wrap" style="width:100%" step="any" required>
              </div>
            </div>
            <div class="form-group">
              <label>Activity Level</label>
              <select id="gAct" class="input-wrap" style="width:100%">
                <option value="1.2">Sedentary (little to no exercise)</option>
                <option value="1.375">Lightly active (light exercise 1-3 days/week)</option>
                <option value="1.55">Moderately active (moderate exercise 3-5 days/week)</option>
                <option value="1.725">Very active (hard exercise 6-7 days/week)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Medical Condition</label>
              <select id="gConds" class="input-wrap" style="width:100%" onchange="pages.goals.onCondChange()">
                <!-- Loaded from backend -->
              </select>
            </div>
            <!-- Add Record Form (hidden by default, triggered by gConds) -->
            <div id="addRecordForm" style="display:none;background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:20px;margin-bottom:20px">
              <h4 style="margin:0 0 16px;color:var(--text)"><i class="fas fa-plus-circle" style="color:var(--teal);margin-right:6px"></i>Condition Details</h4>
              <div style="display:flex;flex-direction:column;gap:14px">
                <div class="form-row-2" id="recNameTypeRow">
                  <div class="form-group" style="margin:0">
                    <label>Condition / Disease Name *</label>
                    <div class="input-wrap"><i class="fas fa-heartbeat"></i><input type="text" id="recName" placeholder="e.g. Type 2 Diabetes, Hypertension..."></div>
                  </div>
                  <div class="form-group" style="margin:0">
                    <label>Condition Type</label>
                    <div class="input-wrap"><i class="fas fa-tag"></i>
                      <select id="recType" style="padding-left:38px;width:100%">
                        <option value="diabetes">Diabetes</option>
                        <option value="heart">Heart Disease</option>
                        <option value="kidney">Kidney Disease</option>
                        <option value="hypertension">Hypertension</option>
                        <option value="thyroid">Thyroid Disorder</option>
                        <option value="allergy">Allergy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div class="form-group" style="margin:0">
                  <label>Extra Information / Notes</label>
                  <textarea id="recInfo" rows="3" style="width:100%;background:var(--navy-dark);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text);font-size:13px;resize:vertical;outline:none" placeholder="e.g. Diagnosed in 2020, on metformin 500mg, HbA1c 7.2%, blood sugar ranges 120-180 mg/dL..."></textarea>
                </div>
                <div class="form-group" style="margin:0">
                  <label>Medical Record File (optional) <span style="font-size:11px;color:var(--sub)">PDF or Image, max 10MB</span></label>
                  <div id="fileDropZone" style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;cursor:pointer;transition:all 0.2s"
                    onclick="document.getElementById('recFile').click()"
                    ondragover="event.preventDefault();this.style.borderColor='var(--teal)'"
                    ondragleave="this.style.borderColor='var(--border)'"
                    ondrop="pages.goals.handleFileDrop(event)">
                    <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:var(--sub);margin-bottom:8px;display:block"></i>
                    <div id="fileDropLabel" style="font-size:13px;color:var(--sub)">Click to upload or drag & drop<br><span style="font-size:11px">PDF, JPG, PNG, WEBP</span></div>
                  </div>
                  <input type="file" id="recFile" accept="image/*,application/pdf" style="display:none" onchange="pages.goals.onFileSelected(this)">
                </div>
              </div>
            </div>
            <button type="submit" class="btn-primary" id="gSaveBtn">Save Goals & Records</button>
          </form>
        </div>

        <div class="card" style="background:var(--navy-dark)">
          <div class="card-header">
            <h3 class="card-title">Daily Targets</h3>
            <span class="badge badge-teal">Calculated</span>
          </div>
          <p style="font-size:13px;color:var(--sub);margin-bottom:20px;line-height:1.5">Based on your profile, here are your estimated daily targets to achieve your goal.</p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="stat-card" style="background:rgba(255,255,255,0.03);border:none;flex-direction:row;align-items:center;justify-content:space-between">
              <div><div class="stat-label">Calories</div><div class="stat-val" id="tCal" style="color:var(--orange);font-size:20px">-- kcal</div></div>
              <i class="fas fa-fire" style="color:var(--orange);font-size:24px;opacity:0.5"></i>
            </div>
            <div class="stat-card" style="background:rgba(255,255,255,0.03);border:none;flex-direction:row;align-items:center;justify-content:space-between">
              <div><div class="stat-label">Protein</div><div class="stat-val" id="tPro" style="color:#EF4444;font-size:20px">-- g</div></div>
              <i class="fas fa-drumstick-bite" style="color:#EF4444;font-size:24px;opacity:0.5"></i>
            </div>
            <div class="stat-card" style="background:rgba(255,255,255,0.03);border:none;flex-direction:row;align-items:center;justify-content:space-between">
              <div><div class="stat-label">Carbs</div><div class="stat-val" id="tCar" style="color:#1A7AD4;font-size:20px">-- g</div></div>
              <i class="fas fa-wheat-awn" style="color:#1A7AD4;font-size:24px;opacity:0.5"></i>
            </div>
            <div class="stat-card" style="background:rgba(255,255,255,0.03);border:none;flex-direction:row;align-items:center;justify-content:space-between">
              <div><div class="stat-label">Fats</div><div class="stat-val" id="tFat" style="color:#F59E0B;font-size:20px">-- g</div></div>
              <i class="fas fa-cheese" style="color:#F59E0B;font-size:24px;opacity:0.5"></i>
            </div>
            <div class="stat-card" style="background:rgba(255,255,255,0.03);border:none;flex-direction:row;align-items:center;justify-content:space-between">
              <div><div class="stat-label">Sleep Target</div><div class="stat-val" id="tSleep" style="color:#9B59B6;font-size:20px">-- hrs</div></div>
              <i class="fas fa-moon" style="color:#9B59B6;font-size:24px;opacity:0.5"></i>
            </div>
            <div class="stat-card" style="background:rgba(255,255,255,0.03);border:none;flex-direction:row;align-items:center;justify-content:space-between">
              <div><div class="stat-label">Water Target</div><div class="stat-val" id="tWater" style="color:#4DC3E8;font-size:20px">-- cups</div></div>
              <i class="fas fa-droplet" style="color:#4DC3E8;font-size:24px;opacity:0.5"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Medical Records Section ─────────────────────────────────────────── -->
      <div class="card" style="margin-top:24px">
        <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:20px">
          <div>
            <h3 class="card-title" style="margin:0"><i class="fas fa-file-medical" style="color:#EF4444;margin-right:8px"></i>Medical Records</h3>
            <p style="font-size:13px;color:var(--sub);margin:4px 0 0">Upload your medical records, diabetes information, or any health documents. These help your doctor and AI assistant give better recommendations.</p>
          </div>
        </div>

        <!-- Existing Records -->
        <div id="recordsList"><div style="text-align:center;padding:30px;color:var(--sub)"><i class="fas fa-spinner fa-spin"></i> Loading records...</div></div>
      </div>
    `;
  },

  init: async () => {
    // Load Conditions
    const condRes = await apiFetch('/users/conditions');
    if (condRes.ok) {
      const select = document.getElementById('gConds');
      select.innerHTML = `<option value="0">None / No medical condition</option>` +
                         condRes.data.data.map(c => `<option value="${c.condition_id}" data-name="${c.name}">${c.name}</option>`).join('') +
                         `<option value="other">Other</option>`;
      if (currentUser && currentUser.conditions) {
        const myCondIds = currentUser.conditions.map(c => c.condition_id.toString());
        Array.from(select.options).forEach(opt => { if (myCondIds.includes(opt.value)) opt.selected = true; });
      }
      pages.goals.onCondChange();
    }

    if (currentUser) {
      document.getElementById('gGender').value = currentUser.gender ? currentUser.gender.toLowerCase() : 'male';
      if (currentUser.dob) {
        const birthDate = new Date(currentUser.dob);
        const ageDiffMs = Date.now() - birthDate.getTime();
        document.getElementById('gAge').value = Math.abs(new Date(ageDiffMs).getUTCFullYear() - 1970);
      } else {
        document.getElementById('gAge').value = currentUser.age || 25;
      }
    }

    if (currentReqs) {
      document.getElementById('gHeight').value = currentReqs.height_cm || '';
      document.getElementById('gWeight').value = currentReqs.weight_kg || '';
      document.getElementById('gTarget').value = currentReqs.target_weight_kg || '';
      if (currentReqs.goal) document.getElementById('gGoal').value = currentReqs.goal;
      if (currentReqs.activity_rate) document.getElementById('gAct').value = currentReqs.activity_rate;
      pages.goals.updateTargets(currentReqs);
    }

    document.getElementById('goalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('gSaveBtn');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;

      const selectedConds = Array.from(document.getElementById('gConds').selectedOptions).map(o => parseInt(o.value));
      const validConds = selectedConds.filter(c => c > 0);
      const data = {
        height_cm: document.getElementById('gHeight').value,
        weight_kg: document.getElementById('gWeight').value,
        target_weight_kg: document.getElementById('gTarget').value,
        goal: document.getElementById('gGoal').value,
        activity_rate: document.getElementById('gAct').value
      };
      const age = Number(document.getElementById('gAge').value) || 25;
      const gender = document.getElementById('gGender').value;

      await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify({ ...currentUser, conditions: validConds, gender, age }) });

      const w = Number(data.weight_kg), h = Number(data.height_cm), act = Number(data.activity_rate);
      let bmr = (10 * w) + (6.25 * h) - (5 * age); bmr += (gender === 'male' ? 5 : -161);
      let tdee = bmr * act, targetCals = tdee, proPerKg = 1.8;
      if (data.goal === 'Weight Loss') { targetCals -= 500; proPerKg = 2.0; }
      else if (data.goal === 'Muscle Gain') { targetCals += 500; proPerKg = 2.2; }

      data.target_calories = Math.round(targetCals);
      const fatCals = targetCals * 0.25;
      data.target_fat_g = Math.round(fatCals / 9);
      data.target_protein_g = Math.round(w * proPerKg);
      const carbCals = targetCals - fatCals - (data.target_protein_g * 4);
      data.target_carbs_g = Math.max(0, Math.round(carbCals / 4));

      // If the medical record form is visible, submit it too
      const condSelect = document.getElementById('gConds');
      if (condSelect.value !== '0' && (document.getElementById('recInfo').value || document.getElementById('recFile').files.length > 0)) {
        const fd = new FormData();
        fd.append('condition_name', document.getElementById('recName').value.trim() || condSelect.options[condSelect.selectedIndex].text);
        fd.append('condition_type', document.getElementById('recType').value || 'other');
        fd.append('extra_info', document.getElementById('recInfo').value);
        const file = document.getElementById('recFile').files[0];
        if (file) fd.append('file', file);
        await MedicalRecords.create(fd);
        // Clear form after save
        document.getElementById('recName').value = '';
        document.getElementById('recInfo').value = '';
        document.getElementById('recFile').value = '';
        document.getElementById('fileDropLabel').innerHTML = 'Click to upload or drag & drop<br><span style="font-size:11px">PDF, JPG, PNG, WEBP</span>';
      }

      const res = await Requirements.upsert(data);
      btn.innerHTML = 'Save Goals & Records'; btn.disabled = false;
      if (res.ok) {
        toast('Goals and Medical Records updated!', 'success');
        // Use the server-returned row (authoritative DB state) so currentReqs is always in sync
        currentReqs = res.data.data || data;
        pages.goals.updateTargets(currentReqs);
        pages.goals.loadRecords();
      } else { toast('Failed to save', 'error'); }
    });

    // Load medical records
    pages.goals.loadRecords();
  },

  // ── Medical Records ──────────────────────────────────────────────────────────
  onCondChange: () => {
    const sel = document.getElementById('gConds');
    const f = document.getElementById('addRecordForm');
    const row = document.getElementById('recNameTypeRow');
    if (sel.value === '0') {
      f.style.display = 'none';
    } else if (sel.value === 'other') {
      f.style.display = 'block';
      row.style.display = 'flex';
    } else {
      f.style.display = 'block';
      row.style.display = 'none'; // hide name/type, use the selected one
      document.getElementById('recName').value = sel.options[sel.selectedIndex].text;
      document.getElementById('recType').value = 'other'; // default to other or map if needed
    }
  },

  handleFileDrop: (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('recFile').files = e.dataTransfer.files;
      pages.goals.onFileSelected({ files: [file] });
    }
    document.getElementById('fileDropZone').style.borderColor = 'var(--border)';
  },

  onFileSelected: (inp) => {
    const file = inp.files[0];
    if (!file) return;
    const label = document.getElementById('fileDropLabel');
    const icon = file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-image';
    const color = file.type === 'application/pdf' ? '#EF4444' : '#4DC3E8';
    label.innerHTML = `<i class="fas ${icon}" style="color:${color};font-size:20px;display:block;margin-bottom:4px"></i><strong>${file.name}</strong><br><span style="font-size:11px;color:var(--sub)">${(file.size/1024).toFixed(1)} KB</span>`;
  },

  // submitRecord removed since it is handled by Save Goals button

  loadRecords: async () => {
    const box = document.getElementById('recordsList');
    if (!box) return;
    const res = await MedicalRecords.list();
    if (!res.ok) { box.innerHTML = '<div style="color:var(--sub);font-size:13px;padding:16px">Failed to load records.</div>'; return; }
    const records = res.data.data || [];
    if (!records.length) {
      box.innerHTML = '<div style="text-align:center;padding:30px;color:var(--sub)"><i class="fas fa-folder-open" style="font-size:28px;margin-bottom:8px;display:block;opacity:0.5"></i>No medical records yet. Add your first record above.</div>';
      return;
    }
    box.innerHTML = records.map(r => {
      const typeColors = { diabetes:'#F59E0B', heart:'#EF4444', kidney:'#1A7AD4', hypertension:'#9B59B6', thyroid:'#4DC3E8', allergy:'#4CAF50', other:'#8BA3B4' };
      const color = typeColors[r.condition_type] || '#8BA3B4';
      const fileBtn = r.file_name ? `
        <a href="${MedicalRecords.fileUrl(r.file_path ? r.file_path.replace(/\\/g,'/') : '')}" target="_blank"
           style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:12px;background:rgba(77,195,232,0.1);color:var(--teal);font-size:11px;text-decoration:none;font-weight:600">
          <i class="fas ${r.file_type === 'pdf' ? 'fa-file-pdf' : 'fa-image'}"></i> ${r.file_name}
        </a>` : '';
      return `
        <div style="background:var(--card2);border:1px solid var(--border);border-left:3px solid ${color};border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-weight:700;color:var(--text);margin-bottom:4px">${r.condition_name}
                <span style="font-size:10px;font-weight:600;color:${color};background:${color}22;padding:2px 8px;border-radius:10px;margin-left:6px">${r.condition_type || 'other'}</span>
              </div>
              ${r.extra_info ? `<div style="font-size:12px;color:var(--sub);margin-bottom:6px;line-height:1.5">${r.extra_info}</div>` : ''}
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                ${fileBtn}
                <span style="font-size:11px;color:var(--sub)">${new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button onclick="pages.goals.deleteRecord(${r.record_id})"
              style="background:none;border:none;color:var(--sub);cursor:pointer;padding:4px 6px;border-radius:6px;transition:color 0.2s"
              onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='var(--sub)'" title="Delete">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  },

  deleteRecord: async (id) => {
    if (!confirm('Delete this medical record?')) return;
    const res = await MedicalRecords.delete(id);
    if (res.ok) { toast('Record deleted', 'success'); pages.goals.loadRecords(); }
    else toast('Failed to delete', 'error');
  },

  suggestWeight: (e) => {
    e.preventDefault();
    const h = Number(document.getElementById('gHeight').value);
    if (!h) return alert('Please enter your height first');
    const hm = h / 100;
    const suggested = 22.0 * (hm * hm);
    if (confirm(`Based on your height, a healthy target weight is approx ${suggested.toFixed(1)} kg. Apply this target?`)) {
      document.getElementById('gTarget').value = suggested.toFixed(1);
    }
  },

  updateTargets: (reqs) => {
    if (!reqs || !reqs.weight_kg || !reqs.height_cm) {
      ['tCal','tPro','tCar','tFat'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '--' + (id === 'tCal' ? ' kcal' : ' g'); });
      return;
    }
    const w = Number(reqs.weight_kg), h = Number(reqs.height_cm);
    const act = Number(reqs.activity_rate) || 1.2, goal = reqs.goal || 'Maintenance';
    const age = Number(document.getElementById('gAge')?.value) || 25;
    const gender = document.getElementById('gGender')?.value || 'male';
    let bmr = (10 * w) + (6.25 * h) - (5 * age); bmr += (gender === 'male' ? 5 : -161);
    let tdee = bmr * act, targetCals = tdee, proPerKg = 1.8;
    if (goal === 'Weight Loss') { targetCals -= 500; proPerKg = 2.0; }
    else if (goal === 'Muscle Gain') { targetCals += 500; proPerKg = 2.2; }
    const fatCals = targetCals * 0.25;
    const tFat = Math.round(fatCals / 9), tPro = Math.round(w * proPerKg);
    const tCar = Math.max(0, Math.round((targetCals - fatCals - tPro * 4) / 4));

    document.getElementById('tCal').textContent = Math.round(targetCals) + ' kcal';
    document.getElementById('tPro').textContent = tPro + ' g';
    document.getElementById('tCar').textContent = tCar + ' g';
    document.getElementById('tFat').textContent = tFat + ' g';

    // Show doctor/AI overridden values if present
    const sleep = reqs.sleep_hours_target;
    const water = reqs.water_cups_target;
    const sleepEl = document.getElementById('tSleep');
    const waterEl = document.getElementById('tWater');
    if (sleepEl) sleepEl.textContent = sleep ? sleep + ' hrs' : '8 hrs';
    if (waterEl) waterEl.textContent = water ? water + ' cups' : '8 cups';
  }
};
