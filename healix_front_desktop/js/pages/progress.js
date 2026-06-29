pages['progress'] = {
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Analytics & Progress</h2>
        <p class="page-desc">Visualize your health data over time.</p>
      </div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Weight Trend (Last 30 Days)</h3>
          </div>
          <canvas id="progWeightChart"></canvas>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Water Intake (Last 7 Days)</h3>
          </div>
          <canvas id="progWaterChart"></canvas>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" style="grid-column:span 2">
          <div class="card-header">
            <h3 class="card-title">Sleep History (Last 7 Days)</h3>
          </div>
          <canvas id="progSleepChart"></canvas>
        </div>
      </div>
    `;
  },
  init: async () => {
    // Load weight
    Tracking.getWeight(30).then(res => {
      if (res.ok && res.data.data) {
        const logs = [...res.data.data].reverse();
        const labels = logs.map(l => formatDate(l.logged_at));
        const values = logs.map(l => Number(l.weight_kg));
        drawLine(document.getElementById('progWeightChart'), labels, values, '#1A7AD4', 180);
      }
    });

    // Load water
    Tracking.getWater().then(res => {
      if (res.ok && res.data.data && res.data.data.week) {
        const logs = [...res.data.data.week].reverse();
        const labels = logs.map(l => formatDate(l.log_date));
        const values = logs.map(l => l.cups);
        drawBars(document.getElementById('progWaterChart'), labels, values, '#4DC3E8', 180);
      }
    });

    // Removed step tracking    // Load sleep
    Tracking.getSleep().then(res => {
      if (res.ok && res.data.data) {
        const logs = [...res.data.data].reverse();
        const labels = logs.map(l => formatDate(l.log_date));
        const values = logs.map(l => Number(l.hours));
        drawLine(document.getElementById('progSleepChart'), labels, values, '#9B59B6', 180);
      }
    });
  }
};
