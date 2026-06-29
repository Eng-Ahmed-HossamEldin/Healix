pages['foodlog'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 class="page-title">Food Log</h2>
          <p class="page-desc">Track what you eat throughout the day.</p>
        </div>
        <input type="date" id="flDate" class="btn-sm btn-outline" style="padding:6px;background:var(--card2)">
      </div>

      <div class="grid-4" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-label">Total Calories</div>
          <div class="stat-val" id="flCal" style="color:var(--orange)">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Protein</div>
          <div class="stat-val" id="flPro" style="color:#EF4444">0g</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Carbs</div>
          <div class="stat-val" id="flCar" style="color:#1A7AD4">0g</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Fat</div>
          <div class="stat-val" id="flFat" style="color:#F59E0B">0g</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-start;align-items:center">
          <h3 class="card-title" style="margin:0;margin-right:auto">Today's Meals</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-sm btn-outline" style="white-space:nowrap" onclick="pages.foodlog.openCreateFood()"><i class="fas fa-magic"></i> Create Custom Food</button>
            <button class="btn-sm btn-primary" style="white-space:nowrap" onclick="pages.foodlog.openAdd()"><i class="fas fa-plus"></i> Add to Log</button>
          </div>
        </div>
        <div class="table-wrap">
          <table id="flTable">
            <thead>
              <tr>
                <th>Food</th>
                <th>Meal</th>
                <th>Portion</th>
                <th>Calories</th>
                <th>Macros (P/C/F)</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody id="flBody">
              <tr><td colspan="6" style="text-align:center;padding:20px;color:var(--sub)">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  init: async () => {
    const dt = document.getElementById('flDate');
    dt.value = today();
    dt.addEventListener('change', () => pages.foodlog.load(dt.value));
    await pages.foodlog.load(dt.value);
  },
  load: async (date) => {
    const res = await Tracking.getFoodLog(date);
    const tbody = document.getElementById('flBody');
    if (!res.ok) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--red)">Failed to load.</td></tr>'; return; }
    const logs = res.data.data || [];
    
    let tCal = 0, tPro = 0, tCar = 0, tFat = 0;
    
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--sub)">No food logged on this date.</td></tr>';
    } else {
      tbody.innerHTML = logs.map(l => {
        tCal += Number(l.calories); tPro += Number(l.protein_g); tCar += Number(l.carbs_g); tFat += Number(l.fat_g);
        return `
          <tr>
            <td style="font-weight:600">${l.food_name}</td>
            <td><span class="badge badge-teal">${l.meal_type}</span></td>
            <td>${l.quantity} ${l.unit}</td>
            <td style="font-weight:600;color:var(--orange)">${l.calories} kcal</td>
            <td>${l.protein_g}g / ${l.carbs_g}g / ${l.fat_g}g</td>
            <td>
              <button class="btn-icon" style="color:var(--red);background:rgba(239,68,68,0.1)" onclick="pages.foodlog.del(${l.log_id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    }

    document.getElementById('flCal').textContent = Math.round(tCal);
    document.getElementById('flPro').textContent = Math.round(tPro) + 'g';
    document.getElementById('flCar').textContent = Math.round(tCar) + 'g';
    const fatEl = document.getElementById('flFat');
    if (fatEl) fatEl.textContent = Math.round(tFat) + 'g';
  },
  del: async (id) => {
    if (!confirm('Delete this entry?')) return;
    await Tracking.deleteFoodLog(id);
    toast('Entry deleted', 'success');
    pages.foodlog.load(document.getElementById('flDate').value);
    refreshTopbarStats();
  },
  openAdd: () => {
    const html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="modal-title" style="margin:0">Add Food</h3>
        <button onclick="closeModal(null)" style="background:none;border:none;color:var(--sub);font-size:22px;cursor:pointer;line-height:1;padding:0 4px">&times;</button>
      </div>
      <div class="form-group">
        <label>Search Database</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="fsq" class="input-wrap" style="flex:1" placeholder="e.g. Apple">
          <button class="btn-sm btn-outline" onclick="pages.foodlog.search()">Search</button>
        </div>
      </div>
      <div id="fsres" style="max-height:150px;overflow-y:auto;margin-bottom:16px;display:flex;flex-direction:column;gap:6px"></div>
      
      <hr style="border:0;border-top:1px solid var(--border);margin:16px 0">
      <div style="font-size:12px;color:var(--sub);margin-bottom:12px">Or enter manually:</div>

      <input type="hidden" id="af_food_id">
      <div class="form-group"><label>Food Name</label><input type="text" id="af_name" class="input-wrap" style="width:100%" required></div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Meal Type</label>
          <select id="af_meal" class="input-wrap" style="width:100%">
            <option value="Breakfast">Breakfast</option><option value="Lunch">Lunch</option><option value="Dinner">Dinner</option><option value="Snack" selected>Snack</option>
          </select>
        </div>
        <div class="form-group"><label>Calories</label><input type="number" id="af_cal" class="input-wrap" style="width:100%" value="0"></div>
      </div>
      <div class="grid-3" style="gap:10px">
        <div class="form-group"><label>Protein (g)</label><input type="number" id="af_pro" class="input-wrap" style="width:100%" value="0"></div>
        <div class="form-group"><label>Carbs (g)</label><input type="number" id="af_car" class="input-wrap" style="width:100%" value="0"></div>
        <div class="form-group"><label>Fat (g)</label><input type="number" id="af_fat" class="input-wrap" style="width:100%" value="0"></div>
      </div>
      <div class="modal-actions" style="display:flex;justify-content:flex-end">
        <button class="btn-sm btn-primary" style="white-space:nowrap;flex-shrink:0" onclick="pages.foodlog.submitAdd()">Save Entry</button>
      </div>
    `;
    openModal(html);
  },
  search: async () => {
    const q = document.getElementById('fsq').value;
    if (!q) return;
    const res = await Foods.search(q);
    const box = document.getElementById('fsres');
    if (!res.ok || !res.data.data.length) { box.innerHTML = '<div style="font-size:12px;color:var(--sub)">No results.</div>'; return; }
    box.innerHTML = res.data.data.map(f => {
      const safeName = f.food_name.replace(/'/g, "\\'");
      return `
        <div style="background:var(--card2);padding:8px 12px;border-radius:6px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="cursor:pointer;flex:1" onclick="pages.foodlog.fill(${f.food_id}, '${safeName}')">
            <span style="font-size:13px;font-weight:600">${f.food_name}</span>
            <div style="font-size:11px;color:var(--sub)">
              ${f.serving_size || '1 serving'} &bull; ${Math.round(f.calories || 0)} kcal &bull; P${Math.round(f.protein_g || 0)}g C${Math.round(f.carbs_g || 0)}g F${Math.round(f.fat_g || 0)}g
            </div>
          </div>
          <button class="btn-sm btn-primary" style="padding:4px 8px;font-size:11px;margin-left:8px" onclick="pages.foodlog.quickAdd(${f.food_id}, '${safeName}', ${f.calories || 0}, ${f.protein_g || 0}, ${f.carbs_g || 0}, ${f.fat_g || 0})">
            <i class="fas fa-plus"></i> Add
          </button>
        </div>
      `;
    }).join('');
  },
  fill: async (id, name) => {
    document.getElementById('af_name').value = name;
    document.getElementById('af_food_id').value = id;
    const res = await apiFetch('/foods/' + id);
    if (res.ok && res.data.data.nutrition) {
      const nut = res.data.data.nutrition;
      document.getElementById('af_cal').value = nut.calories || 0;
      document.getElementById('af_pro').value = nut.protein_g || 0;
      document.getElementById('af_car').value = nut.total_carbs_g || nut.carbs_g || 0;
      document.getElementById('af_fat').value = nut.total_fat_g || nut.fat_g || 0;
    }
    toast('Selected ' + name);
  },
  quickAdd: async (id, name, cal, pro, car, fat) => {
    const mealType = document.getElementById('af_meal').value || 'Snack';
    const flDate = document.getElementById('flDate').value || today();
    const data = {
      food_id: id,
      food_name: name,
      meal_type: mealType,
      calories: cal,
      protein_g: pro,
      carbs_g: car,
      fat_g: fat,
      date: flDate
    };
    if (!data.food_name) return alert('Name required');
    await Tracking.addFoodLog(data);
    closeModal(null);
    toast('Food logged!', 'success');
    pages.foodlog.load(flDate);
    refreshTopbarStats();
  },
  submitAdd: async () => {
    const data = {
      food_id: document.getElementById('af_food_id').value || undefined,
      food_name: document.getElementById('af_name').value,
      meal_type: document.getElementById('af_meal').value,
      calories: document.getElementById('af_cal').value,
      protein_g: document.getElementById('af_pro').value,
      carbs_g: document.getElementById('af_car').value,
      fat_g: document.getElementById('af_fat').value,
      date: document.getElementById('flDate').value
    };
    if (!data.food_name) return alert('Name required');
    await Tracking.addFoodLog(data);
    closeModal(null);
    toast('Food logged!', 'success');
    pages.foodlog.load(document.getElementById('flDate').value);
    refreshTopbarStats();
  },
  openCreateFood: () => {
    const html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="modal-title" style="margin:0">Create Custom Food</h3>
        <button onclick="closeModal(null)" style="background:none;border:none;color:var(--sub);font-size:22px;cursor:pointer;line-height:1;padding:0 4px">&times;</button>
      </div>
      <p style="font-size:12px;color:var(--sub);margin-bottom:16px">Add a new food to the global database for future tracking.</p>
      <div class="form-group"><label>Food Name</label><input type="text" id="cf_name" class="input-wrap" style="width:100%" required></div>
      <div class="form-row-2">
        <div class="form-group"><label>Category</label><input type="text" id="cf_cat" class="input-wrap" style="width:100%" placeholder="e.g. Snack"></div>
        <div class="form-group"><label>Serving Size</label><input type="text" id="cf_srv" class="input-wrap" style="width:100%" placeholder="e.g. 100g"></div>
      </div>
      <div class="form-group">
        <label>Meal Type (for today's log)</label>
        <select id="cf_meal" class="input-wrap" style="width:100%">
          <option value="Breakfast">Breakfast</option><option value="Lunch">Lunch</option><option value="Dinner">Dinner</option><option value="Snack" selected>Snack</option>
        </select>
      </div>
      <div class="grid-2" style="gap:10px">
        <div class="form-group"><label>Calories</label><input type="number" id="cf_cal" class="input-wrap" style="width:100%" required></div>
        <div class="form-group"><label>Protein (g)</label><input type="number" id="cf_pro" class="input-wrap" style="width:100%" required></div>
        <div class="form-group"><label>Carbs (g)</label><input type="number" id="cf_car" class="input-wrap" style="width:100%" required></div>
        <div class="form-group"><label>Fat (g)</label><input type="number" id="cf_fat" class="input-wrap" style="width:100%" required></div>
      </div>
      <div class="modal-actions" style="display:flex;justify-content:flex-end">
        <button class="btn-sm btn-primary" style="white-space:nowrap;flex-shrink:0" onclick="pages.foodlog.submitCreateFood()">Save to Database</button>
      </div>
    `;
    openModal(html);
  },
  submitCreateFood: async () => {
    const name = document.getElementById('cf_name').value;
    const cat = document.getElementById('cf_cat').value;
    const srv = document.getElementById('cf_srv').value;
    const cal = document.getElementById('cf_cal').value;
    const pro = document.getElementById('cf_pro').value;
    const car = document.getElementById('cf_car').value;
    const fat = document.getElementById('cf_fat').value;

    if (!name || !cal || !pro || !car || !fat) return alert('Please fill all required fields');

    const foodData = {
      food_name: name,
      category: cat || 'Custom',
      serving_size: srv || '1 serving'
    };

    const res = await apiFetch('/foods', {
      method: 'POST',
      body: JSON.stringify(foodData)
    });

    if (res.ok && res.data.data.food_id) {
      const foodId = res.data.data.food_id;
      // Add nutrition
      await apiFetch('/foods/' + foodId + '/nutrition', {
        method: 'POST',
        body: JSON.stringify({
          calories: cal,
          protein_g: pro,
          carbs_g: car,
          fat_g: fat
        })
      });
      
      // Auto-add to today's log
      const flDate = document.getElementById('flDate').value || today();
      const mealType = document.getElementById('cf_meal').value || 'Snack';
      await Tracking.addFoodLog({
        food_name: name,
        meal_type: mealType,
        calories: cal,
        protein_g: pro,
        carbs_g: car,
        fat_g: fat,
        date: flDate
      });

      toast('Custom food created and logged!', 'success');
      closeModal(null);
      pages.foodlog.load(flDate);
      refreshTopbarStats();
    } else {
      toast('Failed to create food', 'error');
    }
  }
};
