pages['habits'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 class="page-title">Habit Tracker</h2>
          <p class="page-desc">Build healthy routines one day at a time.</p>
        </div>
        <button class="btn-primary btn-sm" onclick="pages.habits.openAdd()"><i class="fas fa-plus"></i> New Habit</button>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <h3 class="card-title">Today's Habits</h3>
          <div class="card-sub" id="hDate"></div>
        </div>
        <div id="habitList" style="display:flex;flex-direction:column;gap:10px">
          <div style="text-align:center;padding:20px;color:var(--sub)">Loading...</div>
        </div>
      </div>
    `;
  },
  init: async () => {
    document.getElementById('hDate').textContent = new Date().toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });
    await pages.habits.load();
  },
  load: async () => {
    const res = await Community.getHabits();
    const list = document.getElementById('habitList');
    if (!res.ok) { list.innerHTML = '<div class="alert alert-error">Failed to load</div>'; return; }
    
    const habits = res.data.data || [];
    if (habits.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px 20px">
          <i class="fas fa-seedling" style="font-size:40px;color:var(--sub);margin-bottom:16px"></i>
          <p style="color:var(--sub);margin-bottom:16px">You haven't set up any habits yet.</p>
          <button class="btn-sm btn-outline" onclick="pages.habits.openAdd()">Create your first habit</button>
        </div>
      `;
      return;
    }
    
    list.innerHTML = habits.map(h => {
      const done = h.completed_today > 0;
      
      // Draw small streak visualization (last 7 days approx based on streak_week count)
      let dots = '';
      for (let i = 0; i < 7; i++) {
        dots += `<div class="streak-dot ${i < h.streak_week ? 'filled' : ''}"></div>`;
      }
      
      return `
        <div class="habit-item">
          <div class="habit-check ${done ? 'done' : ''}" onclick="pages.habits.toggle(${h.habit_id}, ${done})">
            ${done ? '<i class="fas fa-check" style="color:#fff"></i>' : ''}
          </div>
          <div class="habit-info">
            <div class="habit-name" style="${done ? 'text-decoration:line-through;color:var(--sub)' : ''}">${h.habit_name}</div>
            <div class="streak-dots">${dots}</div>
          </div>
          <button class="btn-icon" style="color:var(--sub);background:none" onclick="pages.habits.del(${h.habit_id})"><i class="fas fa-trash"></i></button>
        </div>
      `;
    }).join('');
  },
  toggle: async (id, currentlyDone) => {
    if (currentlyDone) await Community.uncompleteHabit(id);
    else await Community.completeHabit(id);
    pages.habits.load();
  },
  del: async (id) => {
    if(!confirm('Delete this habit?')) return;
    await Community.deleteHabit(id);
    pages.habits.load();
  },
  openAdd: () => {
    const html = `
      <h3 class="modal-title">New Habit</h3>
      <div class="form-group"><label>Habit Name</label><input type="text" id="ah_name" class="input-wrap" style="width:100%" required placeholder="e.g. Meditate for 10 min"></div>
      <div class="form-group"><label>Description (optional)</label><input type="text" id="ah_desc" class="input-wrap" style="width:100%"></div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Frequency</label>
          <select id="ah_freq" class="input-wrap" style="width:100%">
            <option value="daily">Daily</option><option value="weekly">Weekly</option>
          </select>
        </div>
        <div class="form-group"><label>Reminder Time</label><input type="time" id="ah_time" class="input-wrap" style="width:100%"></div>
      </div>
      <div class="modal-actions">
        <button class="btn-sm btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn-sm btn-primary" onclick="pages.habits.submitAdd()">Create</button>
      </div>
    `;
    openModal(html);
  },
  submitAdd: async () => {
    const data = {
      habit_name: document.getElementById('ah_name').value,
      description: document.getElementById('ah_desc').value,
      frequency: document.getElementById('ah_freq').value,
      reminder_time: document.getElementById('ah_time').value
    };
    if (!data.habit_name) return alert('Name required');
    await Community.createHabit(data);
    closeModal();
    toast('Habit created', 'success');
    pages.habits.load();
  }
};
