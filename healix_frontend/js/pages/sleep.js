pages['sleep'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 class="page-title">Sleep</h2>
          <p class="page-desc">Monitor your recovery and sleep metrics.</p>
        </div>
        <button class="btn-primary btn-sm" onclick="pages.sleep.openAdd()"><i class="fas fa-plus"></i> Log Sleep</button>
      </div>

      <div class="card" style="display:flex;align-items:center;gap:20px;margin-bottom:20px">
        <div style="width:80px;height:80px;border-radius:50%;border:4px solid var(--purple);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--purple)">
          <i class="fas fa-moon"></i>
        </div>
        <div style="flex:1">
          <h3 class="card-title" style="margin-bottom:8px">Last Night's Sleep</h3>
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
            <span style="font-size:32px;font-weight:800;color:var(--text)" id="slHours">0.0</span>
            <span style="color:var(--sub);font-size:14px">hours</span>
          </div>
          <div style="font-size:12px;color:var(--sub)">Quality: <span id="slQual" style="color:var(--text);font-weight:600">--</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Sleep Logs</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>Quality</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody id="slTable">
              <tr><td colspan="4" style="text-align:center;color:var(--sub)">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  init: async () => {
    const res = await Tracking.getSleep();
    const tbody = document.getElementById('slTable');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="4">Failed to load</td></tr>'; return; }
    
    const logs = res.data.data || [];
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--sub)">No sleep logs found.</td></tr>';
      return;
    }

    const latest = logs[0];
    document.getElementById('slHours').textContent = latest.hours;
    document.getElementById('slQual').textContent = latest.quality;

    tbody.innerHTML = logs.map(l => {
      let qColor = 'var(--text)';
      if(l.quality==='Excellent'||l.quality==='Good') qColor = 'var(--green-light)';
      if(l.quality==='Poor') qColor = 'var(--red)';
      
      return `
        <tr>
          <td>${formatDate(l.log_date)}</td>
          <td style="font-weight:600">${l.hours} h</td>
          <td style="color:${qColor};font-weight:600">${l.quality}</td>
          <td style="color:var(--sub)">${l.notes || '-'}</td>
        </tr>
      `;
    }).join('');
  },
  openAdd: () => {
    const html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="modal-title" style="margin:0">Log Sleep</h3>
        <button onclick="closeModal(null)" style="background:none;border:none;color:var(--sub);font-size:22px;cursor:pointer;line-height:1;padding:0 4px">&times;</button>
      </div>
      <div class="form-row-2">
        <div class="form-group"><label>Total Hours</label><input type="number" step="0.5" id="as_hrs" class="input-wrap" style="width:100%" required placeholder="e.g. 7.5"></div>
        <div class="form-group">
          <label>Quality</label>
          <select id="as_qual" class="input-wrap" style="width:100%">
            <option>Poor</option><option>Fair</option><option selected>Good</option><option>Excellent</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Notes</label><input type="text" id="as_notes" class="input-wrap" style="width:100%"></div>
      <div class="modal-actions" style="display:flex;justify-content:flex-end">
        <button class="btn-sm btn-primary" style="white-space:nowrap;flex-shrink:0" onclick="pages.sleep.submitAdd()">Save Entry</button>
      </div>
    `;
    openModal(html);
  },
  submitAdd: async () => {
    const data = {
      hours: document.getElementById('as_hrs').value,
      quality: document.getElementById('as_qual').value,
      stress_level: 5, // Defaulting stress since it's removed from UI
      notes: document.getElementById('as_notes').value
    };
    if (!data.hours) return alert('Hours required');
    await Tracking.addSleep(data);
    closeModal();
    toast('Sleep logged', 'success');
    pages.sleep.init();
    refreshTopbarStats();
  }
};
