pages['weight'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 class="page-title">Weight Tracking</h2>
          <p class="page-desc">Monitor your body weight progress.</p>
        </div>
        <button class="btn-primary btn-sm" onclick="pages.weight.openAdd()"><i class="fas fa-plus"></i> Log Weight</button>
      </div>

      <div class="grid-3" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Current Weight</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <div class="stat-val" id="wCurrent">--</div>
            <span style="font-size:14px;color:var(--sub)">kg</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Target Weight</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <div class="stat-val" id="wTarget">--</div>
            <span style="font-size:14px;color:var(--sub)">kg</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current BMI</div>
          <div style="display:flex;align-items:center;gap:12px">
            <div class="stat-val" id="wBmi">--</div>
            <div id="wBmiBadge"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <h3 class="card-title">Progress Chart</h3>
        </div>
        <canvas id="weightChart"></canvas>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Logs</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody id="wTable">
              <tr><td colspan="3" style="text-align:center;color:var(--sub)">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  init: async () => {
    // Fill targets from requirements
    if (currentReqs) {
      document.getElementById('wTarget').textContent = currentReqs.target_weight_kg || '--';
    }

    const res = await Tracking.getWeight(30);
    if (!res.ok) { document.getElementById('wTable').innerHTML = '<tr><td colspan="3">Failed to load</td></tr>'; return; }
    
    const logs = res.data.data || [];
    const tbody = document.getElementById('wTable');
    
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--sub)">No weight logs found.</td></tr>';
      return;
    }

    // Latest weight & BMI
    const currentWeight = Number(logs[0].weight_kg);
    document.getElementById('wCurrent').textContent = currentWeight.toFixed(1);
    
    if (currentReqs && currentReqs.height_cm) {
      const bmi = calcBMI(currentWeight, currentReqs.height_cm);
      document.getElementById('wBmi').textContent = bmi;
      const cat = bmiCategory(bmi);
      document.getElementById('wBmiBadge').innerHTML = `<span class="badge" style="background:${cat.color}22;color:${cat.color}">${cat.label}</span>`;
    }

    // Chart (reverse logs for chronological order)
    const chartLogs = [...logs].reverse();
    const labels = chartLogs.map(l => formatDate(l.logged_at));
    const values = chartLogs.map(l => Number(l.weight_kg));
    drawLine(document.getElementById('weightChart'), labels, values, '#1A7AD4', 200);

    // Table
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${formatDate(l.logged_at)} <span style="color:var(--sub);font-size:11px;margin-left:6px">${formatTime(l.logged_at)}</span></td>
        <td style="font-weight:600">${Number(l.weight_kg).toFixed(1)} kg</td>
        <td style="color:var(--sub)">${l.notes || '-'}</td>
      </tr>
    `).join('');
  },
  openAdd: () => {
    const html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="modal-title" style="margin:0">Log Weight</h3>
        <button onclick="closeModal(null)" style="background:none;border:none;color:var(--sub);font-size:22px;cursor:pointer;line-height:1;padding:0 4px">&times;</button>
      </div>
      <div class="form-group">
        <label>Weight (kg)</label>
        <div class="input-wrap">
          <i class="fas fa-weight-scale"></i>
          <input type="number" step="0.1" id="aw_val" placeholder="e.g. 70.5" required>
        </div>
      </div>
      <div class="form-group">
        <label>Notes (optional)</label>
        <div class="input-wrap">
          <i class="fas fa-sticky-note"></i>
          <input type="text" id="aw_notes" placeholder="e.g. Morning, after fasting">
        </div>
      </div>
      <div class="modal-actions" style="display:flex;justify-content:flex-end">
        <button class="btn-sm btn-primary" style="white-space:nowrap;flex-shrink:0" onclick="pages.weight.submitAdd()">Save Entry</button>
      </div>
    `;
    openModal(html);
  },
  submitAdd: async () => {
    const kg = document.getElementById('aw_val').value;
    const notes = document.getElementById('aw_notes').value;
    if (!kg) return alert('Weight is required');
    
    await Tracking.addWeight({ weight_kg: kg, notes });
    closeModal(null);
    toast('Weight logged successfully', 'success');
    pages.weight.init();
  }
};
