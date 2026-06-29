pages['dashboard'] = {
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Good Morning, <span id="dashName"></span>!</h2>
        <p class="page-desc">Here's a summary of your health today.</p>
      </div>
      
      <div class="grid-3" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--orange)"><i class="fas fa-fire"></i></div>
          <div class="stat-val" id="dashCal">0</div>
          <div class="stat-label">Calories Eaten</div>
          <div class="prog-bar"><div class="prog-fill" style="background:var(--orange);width:0%" id="dashCalProg"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(77,195,232,0.15);color:var(--teal)"><i class="fas fa-droplet"></i></div>
          <div class="stat-val" id="dashWater">0 <span style="font-size:14px;color:var(--sub)">/ 8 cups</span></div>
          <div class="stat-label">Water Intake</div>
          <div class="prog-bar"><div class="prog-fill" style="background:var(--teal);width:0%" id="dashWaterProg"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(155,89,182,0.15);color:var(--purple)"><i class="fas fa-moon"></i></div>
          <div class="stat-val" id="dashSleep">0h</div>
          <div class="stat-label">Sleep Last Night</div>
          <div class="stat-sub" id="dashSleepQual">No data</div>
        </div>
      </div>

      <div class="grid-3">
        <div class="card" style="grid-column: span 2">
          <div class="card-header">
            <h3 class="card-title">Macronutrients</h3>
            <button class="btn-sm btn-outline" onclick="showPage('calories')">Details</button>
          </div>
          <div style="display:flex;align-items:center;gap:30px">
            <canvas id="macroChart"></canvas>
            <div style="flex:1;display:flex;flex-direction:column;gap:16px">
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
                  <span style="color:#EF4444;font-weight:600">Protein</span><span id="dashPro">0g</span>
                </div>
                <div class="prog-bar"><div class="prog-fill" style="background:#EF4444;width:0%" id="dashProProg"></div></div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
                  <span style="color:#1A7AD4;font-weight:600">Carbs</span><span id="dashCar">0g</span>
                </div>
                <div class="prog-bar"><div class="prog-fill" style="background:#1A7AD4;width:0%" id="dashCarProg"></div></div>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
                  <span style="color:#F59E0B;font-weight:600">Fat</span><span id="dashFat">0g</span>
                </div>
                <div class="prog-bar"><div class="prog-fill" style="background:#F59E0B;width:0%" id="dashFatProg"></div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Quick Actions</h3>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn-primary" onclick="showPage('foodlog')" style="background:var(--card2);border:1px solid var(--border)"><i class="fas fa-plus" style="color:var(--orange)"></i> Log Food</button>
            <button class="btn-primary" onclick="showPage('water')" style="background:var(--card2);border:1px solid var(--border)"><i class="fas fa-plus" style="color:var(--teal)"></i> Log Water</button>
            <button class="btn-primary" onclick="showPage('weight')" style="background:var(--card2);border:1px solid var(--border)"><i class="fas fa-plus" style="color:var(--green)"></i> Log Weight</button>
          </div>
        </div>
      </div>
    `;
  },
  init: async () => {
    document.getElementById('dashName').textContent = currentUser?.first_name || 'User';
    const res = await Tracking.summary();
    if (res.ok && res.data.data) {
      const s = res.data.data;
      
      // Cal
      const cal = Math.round(s.calories?.total_calories || 0);
      const targetCal = currentReqs?.target_calories || 2000;
      document.getElementById('dashCal').textContent = cal;
      document.getElementById('dashCalProg').style.width = Math.min((cal/targetCal)*100, 100) + '%';

      // Water
      const water = s.water?.cups || 0;
      document.getElementById('dashWater').innerHTML = `${water} <span style="font-size:14px;color:var(--sub)">/ 8 cups</span>`;
      document.getElementById('dashWaterProg').style.width = Math.min((water/8)*100, 100) + '%';

      // Sleep
      if (s.sleep) {
        document.getElementById('dashSleep').textContent = s.sleep.hours + 'h';
        document.getElementById('dashSleepQual').textContent = 'Quality: ' + s.sleep.quality;
      }

      // Macros
      const pro = Math.round(s.calories?.total_protein || 0);
      const car = Math.round(s.calories?.total_carbs || 0);
      const fat = Math.round(s.calories?.total_fat || 0);
      document.getElementById('dashPro').textContent = pro + 'g';
      document.getElementById('dashCar').textContent = car + 'g';
      document.getElementById('dashFat').textContent = fat + 'g';
      
      const tPro = currentReqs?.target_protein_g || 100;
      const tCar = currentReqs?.target_carbs_g || 200;
      const tFat = currentReqs?.target_fat_g || 70;
      
      document.getElementById('dashProProg').style.width = Math.min((pro/tPro)*100, 100) + '%';
      document.getElementById('dashCarProg').style.width = Math.min((car/tCar)*100, 100) + '%';
      document.getElementById('dashFatProg').style.width = Math.min((fat/tFat)*100, 100) + '%';

      drawDonut(document.getElementById('macroChart'), [
        { value: pro*4 || 1, color: '#EF4444' },
        { value: car*4 || 1, color: '#1A7AD4' },
        { value: fat*9 || 1, color: '#F59E0B' }
      ]);
    }
  }
};
