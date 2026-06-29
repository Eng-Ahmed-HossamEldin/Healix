pages['exercise'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 class="page-title">Exercise Log</h2>
          <p class="page-desc">Track your workouts and daily steps.</p>
        </div>
        <input type="date" id="exDate" class="btn-sm btn-outline" style="padding:6px;background:var(--card2)">
      </div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="card" style="display:flex;align-items:center;gap:20px">
          <div style="width:80px;height:80px;border-radius:50%;border:4px solid var(--green-light);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--green-light)">
            <i class="fas fa-shoe-prints"></i>
          </div>
          <div style="flex:1">
            <h3 class="card-title" style="margin-bottom:8px">Daily Steps</h3>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
              <span style="font-size:32px;font-weight:800;color:var(--text)" id="exSteps">0</span>
              <span style="color:var(--sub);font-size:14px">/ 10,000</span>
            </div>
            <div style="display:flex;gap:10px">
              <input type="number" id="inpSteps" class="input-wrap" style="width:100px;padding:8px" placeholder="e.g. 5000">
              <button class="btn-sm btn-outline" onclick="pages.exercise.logSteps()">Update</button>
            </div>
          </div>
        </div>
        
        <div class="card" style="display:flex;align-items:center;gap:20px">
          <div style="width:80px;height:80px;border-radius:50%;border:4px solid var(--orange);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--orange)">
            <i class="fas fa-fire"></i>
          </div>
          <div style="flex:1">
            <h3 class="card-title" style="margin-bottom:8px">Calories Burned</h3>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
              <span style="font-size:32px;font-weight:800;color:var(--orange)" id="exCal">0</span>
              <span style="color:var(--sub);font-size:14px">kcal</span>
            </div>
            <div style="font-size:12px;color:var(--sub)">from logged exercises</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Logged Exercises</h3>
          <button class="btn-sm btn-primary" onclick="pages.exercise.openAdd()"><i class="fas fa-plus"></i> Add Workout</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Intensity</th>
                <th>Calories</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody id="exTable">
              <tr><td colspan="6" style="text-align:center;color:var(--sub)">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  init: async () => {
    const dt = document.getElementById('exDate');
    dt.value = today();
    dt.addEventListener('change', () => pages.exercise.load(dt.value));
    
    // Load steps
    const stepRes = await Tracking.getSteps();
    if (stepRes.ok && stepRes.data.data) {
      const todayStep = stepRes.data.data.find(s => s.log_date.split('T')[0] === today());
      if (todayStep) document.getElementById('exSteps').textContent = todayStep.steps;
    }
    
    await pages.exercise.load(dt.value);
  },
  load: async (date) => {
    const res = await Tracking.getExercise(date);
    const tbody = document.getElementById('exTable');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--red)">Failed to load.</td></tr>'; return; }
    
    const logs = res.data.data || [];
    let tCal = 0;
    
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--sub)">No exercises logged on this date.</td></tr>';
    } else {
      tbody.innerHTML = logs.map(l => {
        tCal += Number(l.calories_burned);
        return `
          <tr>
            <td style="font-weight:600">${l.exercise_name}</td>
            <td><span class="badge" style="background:rgba(255,255,255,0.05)">${l.category}</span></td>
            <td>${l.duration_min} min</td>
            <td>${l.intensity}</td>
            <td style="font-weight:600;color:var(--orange)">${l.calories_burned} kcal</td>
            <td>
              <button class="btn-icon" style="color:var(--red);background:rgba(239,68,68,0.1)" onclick="pages.exercise.del(${l.log_id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    }
    document.getElementById('exCal').textContent = Math.round(tCal);
  },
  logSteps: async () => {
    const val = document.getElementById('inpSteps').value;
    if (!val) return;
    await Tracking.logSteps({ steps: val });
    document.getElementById('exSteps').textContent = val;
    document.getElementById('inpSteps').value = '';
    toast('Steps updated', 'success');
    refreshTopbarStats();
  },
  del: async (id) => {
    if (!confirm('Delete this entry?')) return;
    await Tracking.deleteExercise(id);
    toast('Entry deleted', 'success');
    pages.exercise.load(document.getElementById('exDate').value);
    refreshTopbarStats();
  },
  openAdd: () => {
    const html = `
      <h3 class="modal-title">Log Exercise</h3>
      <div class="form-group"><label>Exercise Name</label><input type="text" id="ae_name" class="input-wrap" style="width:100%" required placeholder="e.g. Running"></div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Category</label>
          <select id="ae_cat" class="input-wrap" style="width:100%">
            <option>Cardio</option><option>Strength</option><option>Flexibility</option><option>Sports</option>
          </select>
        </div>
        <div class="form-group"><label>Duration (min)</label><input type="number" id="ae_dur" class="input-wrap" style="width:100%" required placeholder="30" oninput="pages.exercise.estCal()"></div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Intensity</label>
          <select id="ae_int" class="input-wrap" style="width:100%" onchange="pages.exercise.estCal()">
            <option>Low</option><option selected>Moderate</option><option>High</option>
          </select>
        </div>
        <div class="form-group"><label>Calories Burned</label><input type="number" id="ae_cal" class="input-wrap" style="width:100%" value="0"></div>
      </div>
      <div class="modal-actions">
        <button class="btn-sm btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn-sm btn-primary" onclick="pages.exercise.submitAdd()">Save Entry</button>
      </div>
    `;
    openModal(html);
  },
  estCal: () => {
    const dur = document.getElementById('ae_dur')?.value;
    const int = document.getElementById('ae_int')?.value;
    if (dur && int) {
      document.getElementById('ae_cal').value = calcCaloriesBurned('', dur, int);
    }
  },
  submitAdd: async () => {
    const data = {
      exercise_name: document.getElementById('ae_name').value,
      category: document.getElementById('ae_cat').value,
      duration_min: document.getElementById('ae_dur').value,
      intensity: document.getElementById('ae_int').value,
      calories_burned: document.getElementById('ae_cal').value
    };
    if (!data.exercise_name || !data.duration_min) return alert('Name and duration required');
    await Tracking.addExercise(data);
    closeModal();
    toast('Exercise logged!', 'success');
    pages.exercise.load(document.getElementById('exDate').value);
    refreshTopbarStats();
  }
};
