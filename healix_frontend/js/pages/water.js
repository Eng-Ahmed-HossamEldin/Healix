pages['water'] = {
  cups: 0,
  target: 8,
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Water Intake</h2>
        <p class="page-desc">Stay hydrated throughout the day.</p>
      </div>

      <div class="grid-2">
        <div class="card" style="text-align:center;padding:40px 20px">
          <h3 class="card-title" style="margin-bottom:20px">Today's Progress</h3>
          
          <div class="gauge-wrap" style="width:180px;height:180px;margin:0 auto 20px">
            <canvas id="waterGauge"></canvas>
            <div class="gauge-center">
              <i class="fas fa-droplet" style="color:var(--teal);font-size:32px;margin-bottom:8px"></i>
              <div style="font-size:28px;font-weight:800;color:var(--text);line-height:1"><span id="wCups">0</span></div>
              <div style="font-size:12px;color:var(--sub)">/ <span id="wTarget">8</span> cups</div>
            </div>
          </div>

          <div style="display:flex;justify-content:center;gap:16px;margin-bottom:24px">
            <button class="btn-icon" style="background:rgba(255,255,255,0.05);color:var(--text);width:48px;height:48px;font-size:18px" onclick="pages.water.change(-1)"><i class="fas fa-minus"></i></button>
            <button class="btn-icon" style="background:var(--teal);color:#fff;width:48px;height:48px;font-size:18px;box-shadow:0 4px 12px rgba(77,195,232,0.4)" onclick="pages.water.change(1)"><i class="fas fa-plus"></i></button>
          </div>
          
          <div style="font-size:13px;color:var(--sub)">
            1 cup = 250ml. Total: <span id="wMl" style="color:var(--text);font-weight:600">0</span> ml
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <h3 class="card-title" style="margin-bottom:16px">Weekly Overview</h3>
            <canvas id="waterChart"></canvas>
          </div>
          
          <div class="card">
            <h3 class="card-title" style="margin-bottom:12px">Hydration Tips</h3>
            <ul style="font-size:13px;color:var(--sub);line-height:1.6;padding-left:20px">
              <li>Drink a glass of water first thing in the morning.</li>
              <li>Keep a reusable water bottle with you.</li>
              <li>Add lemon or cucumber slices for flavor.</li>
              <li>Eat water-rich foods like fruits and vegetables.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },
  init: async () => {
    pages.water.target = 8;
    document.getElementById('wTarget').textContent = pages.water.target;
    
    const res = await Tracking.getWater();
    if (res.ok && res.data.data) {
      const todayLog = res.data.data.today;
      pages.water.cups = todayLog ? todayLog.cups : 0;
      
      const weekLogs = res.data.data.week || [];
      // reverse for chronological order
      weekLogs.reverse();
      const labels = weekLogs.map(l => formatDate(l.log_date));
      const values = weekLogs.map(l => l.cups);
      if(values.length) drawBars(document.getElementById('waterChart'), labels, values, '#4DC3E8', 140);
    }
    
    pages.water.updateUI();
  },
  change: async (delta) => {
    let newVal = pages.water.cups + delta;
    if (newVal < 0) newVal = 0;
    if (newVal === pages.water.cups) return;
    
    pages.water.cups = newVal;
    pages.water.updateUI();
    
    // Optimistic update, save to backend
    await Tracking.logWater(newVal);
    refreshTopbarStats();
  },
  updateUI: () => {
    const c = pages.water.cups;
    const t = pages.water.target;
    document.getElementById('wCups').textContent = c;
    document.getElementById('wMl').textContent = c * 250;
    
    const canvas = document.getElementById('waterGauge');
    if (canvas) {
      drawDonut(canvas, [
        { value: Math.min(c, t), color: '#4DC3E8' },
        { value: Math.max(t - c, 0), color: 'rgba(255,255,255,0.05)' }
      ], 180);
    }
  }
};
