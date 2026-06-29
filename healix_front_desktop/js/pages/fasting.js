pages['fasting'] = {
  activeFast: null,
  interval: null,
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Fasting Timer</h2>
        <p class="page-desc">Track your intermittent fasting windows.</p>
      </div>

      <div class="card" style="text-align:center;padding:60px 20px;max-width:600px;margin:0 auto 24px">
        <h3 class="card-title" style="margin-bottom:8px" id="fStatus">Not Fasting</h3>
        <div style="color:var(--sub);font-size:13px;margin-bottom:30px" id="fTarget">--</div>
        
        <div class="fast-clock" id="fTimer">00:00:00</div>
        
        <div class="prog-bar" style="margin:24px auto;max-width:300px;height:10px">
          <div class="prog-fill" style="background:var(--teal);width:0%" id="fProg"></div>
        </div>

        <div id="fActions" style="margin-top:40px">
          <button class="btn-primary" style="max-width:200px;margin:0 auto" onclick="pages.fasting.start()">Start Fasting</button>
        </div>
      </div>

      <div class="card" style="max-width:600px;margin:0 auto">
        <div class="card-header"><h3 class="card-title">Recent Fasts</h3></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Protocol</th><th>Started</th><th>Ended</th><th>Duration</th></tr></thead>
            <tbody id="fTable"></tbody>
          </table>
        </div>
      </div>
    `;
  },
  init: async () => {
    pages.fasting.load();
  },
  load: async () => {
    const res = await Community.getActiveFast();
    if (res.ok && res.data.data) {
      pages.fasting.activeFast = res.data.data;
      pages.fasting.startTick();
    } else {
      pages.fasting.activeFast = null;
      if (pages.fasting.interval) clearInterval(pages.fasting.interval);
      document.getElementById('fTimer').textContent = '00:00:00';
      document.getElementById('fProg').style.width = '0%';
      document.getElementById('fStatus').textContent = 'Not Fasting';
      document.getElementById('fTarget').textContent = 'Select a protocol to start';
      document.getElementById('fActions').innerHTML = `<button class="btn-primary" style="max-width:200px;margin:0 auto" onclick="pages.fasting.start()">Start Fasting</button>`;
    }

    const hRes = await Community.getFastHistory();
    if (hRes.ok) {
      const tbody = document.getElementById('fTable');
      const hist = hRes.data.data || [];
      tbody.innerHTML = hist.filter(h => h.status !== 'active').slice(0,5).map(h => `
        <tr>
          <td><span class="badge badge-teal">${h.protocol}</span></td>
          <td>${formatDate(h.start_time)} <span style="font-size:11px;color:var(--sub)">${formatTime(h.start_time)}</span></td>
          <td>${formatDate(h.end_time)} <span style="font-size:11px;color:var(--sub)">${formatTime(h.end_time)}</span></td>
          <td style="font-weight:600">${Number(h.actual_hours).toFixed(1)}h</td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--sub)">No completed fasts yet.</td></tr>';
    }
  },
  startTick: () => {
    if (pages.fasting.interval) clearInterval(pages.fasting.interval);
    
    document.getElementById('fStatus').textContent = 'Fasting';
    document.getElementById('fStatus').style.color = 'var(--mint)';
    document.getElementById('fTarget').textContent = `Protocol: ${pages.fasting.activeFast.protocol} | Target: ${pages.fasting.activeFast.target_hours}h`;
    document.getElementById('fActions').innerHTML = `<button class="btn-sm btn-danger" onclick="pages.fasting.end()">End Fast</button>`;

    const tick = () => {
      const f = pages.fasting.activeFast;
      if (!f || !document.getElementById('fTimer')) { clearInterval(pages.fasting.interval); return; }
      
      const st = new Date(f.start_time).getTime();
      const diffMs = Date.now() - st;
      const hours = diffMs / 3600000;
      
      document.getElementById('fTimer').textContent = elapsed(f.start_time);
      
      const pct = Math.min((hours / f.target_hours) * 100, 100);
      document.getElementById('fProg').style.width = pct + '%';
      
      if (pct >= 100) {
        document.getElementById('fProg').style.background = 'var(--green-light)';
        document.getElementById('fStatus').textContent = 'Goal Reached!';
      }
    };
    
    tick();
    pages.fasting.interval = setInterval(tick, 1000);
  },
  start: async () => {
    const p = prompt('Enter fasting protocol (e.g. 16:8)', '16:8');
    if (!p) return;
    const t = prompt('Target hours?', '16');
    if (!t) return;
    
    await Community.startFast({ protocol: p, target_hours: Number(t) });
    pages.fasting.load();
  },
  end: async () => {
    if(!confirm('End fast now?')) return;
    await Community.endFast();
    pages.fasting.load();
  }
};
