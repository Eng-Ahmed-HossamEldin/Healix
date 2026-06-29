pages['calories'] = {
  render: async () => {
    return `
      <div class="page-header">
        <h2 class="page-title">Calories & Macros</h2>
        <p class="page-desc">Detailed breakdown of your daily nutritional intake.</p>
      </div>

      <div class="grid-2">
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px">
          <h3 class="card-title" style="align-self:flex-start;width:100%;margin-bottom:20px">Calorie Summary</h3>
          <div class="gauge-wrap" style="width:200px;height:200px;margin-bottom:20px">
            <canvas id="calGauge"></canvas>
            <div class="gauge-center">
              <div style="font-size:32px;font-weight:800;color:var(--text);line-height:1"><span id="cEat">0</span></div>
              <div style="font-size:12px;color:var(--sub);margin-bottom:8px">/ <span id="cTgt">0</span> kcal</div>
              <div style="font-size:11px;color:var(--orange);font-weight:600"><span id="cRem">0</span> left</div>
            </div>
          </div>
          <div style="display:flex;width:100%;justify-content:space-around;font-size:13px">
            <div style="text-align:center">
              <div style="color:var(--sub);margin-bottom:4px">Consumed</div>
              <div style="font-weight:700" id="cCon">0</div>
            </div>
            <div style="text-align:center">
              <div style="color:var(--sub);margin-bottom:4px">Remaining</div>
              <div style="font-weight:700;color:var(--teal)" id="cRem2">0</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom:20px">Macronutrients</h3>
          <div style="display:flex;flex-direction:column;gap:24px">
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="font-weight:600;font-size:14px">Protein</span>
                <span style="font-size:13px"><span style="color:#EF4444;font-weight:600" id="mPro">0g</span> / <span id="tPro">0g</span></span>
              </div>
              <div class="prog-bar" style="height:10px"><div class="prog-fill" style="background:#EF4444;width:0%" id="pbPro"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="font-weight:600;font-size:14px">Carbs</span>
                <span style="font-size:13px"><span style="color:#1A7AD4;font-weight:600" id="mCar">0g</span> / <span id="tCar">0g</span></span>
              </div>
              <div class="prog-bar" style="height:10px"><div class="prog-fill" style="background:#1A7AD4;width:0%" id="pbCar"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="font-weight:600;font-size:14px">Fat</span>
                <span style="font-size:13px"><span style="color:#F59E0B;font-weight:600" id="mFat">0g</span> / <span id="tFat">0g</span></span>
              </div>
              <div class="prog-bar" style="height:10px"><div class="prog-fill" style="background:#F59E0B;width:0%" id="pbFat"></div></div>
            </div>
          </div>

          <hr style="border:0;border-top:1px solid var(--border);margin:24px 0">
          
          <h3 class="card-title" style="margin-bottom:16px;font-size:13px;color:var(--sub)">Energy Breakdown</h3>
          <div style="display:flex;height:24px;border-radius:12px;overflow:hidden;margin-bottom:12px">
            <div id="ebPro" style="background:#EF4444;width:30%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600"></div>
            <div id="ebCar" style="background:#1A7AD4;width:40%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600"></div>
            <div id="ebFat" style="background:#F59E0B;width:30%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600"></div>
          </div>
        </div>
      </div>
    `;
  },
  init: async () => {
    const res = await Tracking.summary();
    if (!res.ok) return;
    const s = res.data.data;
    const cal = Math.round(s.calories?.total_calories || 0);
    const burn = 0; // Removed exercise
    const net = cal - burn;
    const tgt = currentReqs?.target_calories || 2000;
    
    document.getElementById('cEat').textContent = cal;
    document.getElementById('cTgt').textContent = tgt;
    document.getElementById('cRem').textContent = Math.max(tgt - net, 0);
    
    document.getElementById('cCon').textContent = cal;
    document.getElementById('cRem2').textContent = Math.max(tgt - net, 0);

    drawDonut(document.getElementById('calGauge'), [
      { value: Math.min(net, tgt), color: '#F59E0B' },
      { value: Math.max(tgt - net, 0), color: 'rgba(255,255,255,0.05)' }
    ], 200);

    // Macros
    const pro = Math.round(s.calories?.total_protein || 0);
    const car = Math.round(s.calories?.total_carbs || 0);
    const fat = Math.round(s.calories?.total_fat || 0);
    
    const tp = currentReqs?.target_protein_g || 100;
    const tc = currentReqs?.target_carbs_g || 200;
    const tf = currentReqs?.target_fat_g || 70;

    document.getElementById('mPro').textContent = pro + 'g'; document.getElementById('tPro').textContent = tp + 'g';
    document.getElementById('mCar').textContent = car + 'g'; document.getElementById('tCar').textContent = tc + 'g';
    document.getElementById('mFat').textContent = fat + 'g'; document.getElementById('tFat').textContent = tf + 'g';

    document.getElementById('pbPro').style.width = Math.min((pro/tp)*100, 100) + '%';
    document.getElementById('pbCar').style.width = Math.min((car/tc)*100, 100) + '%';
    document.getElementById('pbFat').style.width = Math.min((fat/tf)*100, 100) + '%';

    // Breakdown
    const totalMac = (pro*4) + (car*4) + (fat*9) || 1;
    document.getElementById('ebPro').style.width = ((pro*4)/totalMac)*100 + '%'; document.getElementById('ebPro').textContent = Math.round(((pro*4)/totalMac)*100) + '%';
    document.getElementById('ebCar').style.width = ((car*4)/totalMac)*100 + '%'; document.getElementById('ebCar').textContent = Math.round(((car*4)/totalMac)*100) + '%';
    document.getElementById('ebFat').style.width = ((fat*9)/totalMac)*100 + '%'; document.getElementById('ebFat').textContent = Math.round(((fat*9)/totalMac)*100) + '%';
  }
};
