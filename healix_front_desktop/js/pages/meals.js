pages['meals'] = {
  render: async () => {
    return `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h2 class="page-title">Meal Plans</h2>
          <p class="page-desc">Your assigned or customized diet plans.</p>
        </div>
        <button id="aiGenMealBtn" onclick="pages.meals.aiGenerate()" style="display:none;padding:9px 18px;border-radius:20px;border:none;background:linear-gradient(135deg,#4DC3E8,#1A7AD4);color:#fff;cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px">
          <i class="fas fa-robot"></i> Generate with AI
        </button>
      </div>

      <div id="plansList" style="display:flex;flex-direction:column;gap:20px">
        <div style="text-align:center;padding:40px;color:var(--sub)">Loading plans...</div>
      </div>
    `;
  },
  init: async () => {
    const res = await Plans.getMyPlans();
    const container = document.getElementById('plansList');
    const tier = currentUser?.subscription_tier || 'default';

    // Show AI generate button in header for paid tiers
    if (tier !== 'default') {
      const btn = document.getElementById('aiGenMealBtn');
      if (btn) btn.style.display = 'flex';
    }
    if (!res.ok) { container.innerHTML = '<div class="alert alert-error">Failed to load meal plans.</div>'; return; }
    const plans = res.data.data || [];
    
    if (plans.length === 0) {
      if (currentUser && currentUser.subscription_tier === 'default') {
        // Show generic ready-made plan for free users
        const cal = currentReqs ? currentReqs.target_calories : 2000;
        container.innerHTML = `
          <div class="card">
            <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:16px">
              <div>
                <h3 class="card-title">Standard ${cal} kcal Plan</h3>
                <div class="card-sub">Ready-made plan based on your caloric needs. Upgrade to AI or Doctor for personalized plans.</div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn-sm btn-outline" onclick="pages.meals.downloadGenericPDF(${cal})"><i class="fas fa-download"></i> PDF</button>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <strong style="color:var(--teal)">Breakfast</strong>
                </div>
                <ul style="padding-left:20px;color:var(--text);font-size:13px;line-height:1.6">
                  <li>Oatmeal (1 cup) with berries and honey</li>
                  <li>Boiled eggs (2)</li>
                </ul>
              </div>
              <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <strong style="color:var(--teal)">Lunch</strong>
                </div>
                <ul style="padding-left:20px;color:var(--text);font-size:13px;line-height:1.6">
                  <li>Grilled chicken breast (150g)</li>
                  <li>Brown rice (1 cup) and steamed broccoli</li>
                </ul>
              </div>
              <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <strong style="color:var(--teal)">Dinner</strong>
                </div>
                <ul style="padding-left:20px;color:var(--text);font-size:13px;line-height:1.6">
                  <li>Baked salmon (150g)</li>
                  <li>Quinoa and mixed salad with olive oil</li>
                </ul>
              </div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="card" style="text-align:center;padding:60px 20px">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(77,195,232,0.15),rgba(26,122,212,0.15));display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
              <i class="fas fa-robot" style="font-size:32px;color:var(--teal)"></i>
            </div>
            <h3 style="margin-bottom:8px">No Meal Plans Yet</h3>
            <p style="color:var(--sub);margin-bottom:24px;max-width:400px;margin-inline:auto">Let Healix AI generate a personalized meal plan based on your calorie targets and goals.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <button class="btn-primary" style="max-width:220px" onclick="pages.meals.aiGenerate()">
                <i class="fas fa-robot" style="margin-right:6px"></i>✨ Generate with AI
              </button>
              <button class="btn-outline" style="max-width:180px" onclick="showPage('chat')">Ask in Chat</button>
            </div>
          </div>
        `;
      }
      return;
    }

    container.innerHTML = '';
    for (const p of plans) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:16px">
          <div>
            <h3 class="card-title">${p.goal_type || 'Custom Plan'}</h3>
            <div class="card-sub">Assigned by: Dr. ${p.doctor_username || 'System'} | Targets: ${p.target_calories || '-'} kcal, ${p.target_protein_g||'-'}g Pro</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-sm btn-outline" onclick="pages.meals.downloadPDF(${p.plan_id}, '${p.goal_type || 'Meal_Plan'}')"><i class="fas fa-download"></i> PDF</button>
            <button class="btn-sm btn-outline" onclick="pages.meals.togglePlan(${p.plan_id}, this)">View Meals</button>
          </div>
        </div>
        <div id="meals-${p.plan_id}" class="hidden" style="display:flex;flex-direction:column;gap:12px"></div>
      `;
      container.appendChild(card);
    }
  },
  // AI Generate Meal Plan
  aiGenerate: async () => {
    const tier = currentUser?.subscription_tier || 'default';
    if (tier === 'default') {
      toast('AI plan generation requires an AI Pro or Doctor subscription.', 'error');
      openSubscriptionModal();
      return;
    }

    const btn = document.getElementById('aiGenMealBtn');
    const originalHTML = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; btn.disabled = true; }
    toast('Generating your meal plan with AI…', 'info');

    const res = await Agent.genMealPlan();

    if (btn) { btn.innerHTML = originalHTML; btn.disabled = false; }

    if (res.ok && res.data.plan_id) {
      toast('✅ Meal plan generated! Reloading…', 'success');
      setTimeout(() => pages.meals.init(), 800);
    } else {
      toast(res.data?.error || 'Failed to generate plan. Make sure your Goals are set first.', 'error');
    }
  },

  togglePlan: async (planId, btn) => {
    const box = document.getElementById('meals-' + planId);
    if (!box.classList.contains('hidden')) {
      box.classList.add('hidden');
      btn.textContent = 'View Meals';
      return;
    }
    
    box.classList.remove('hidden');
    btn.textContent = 'Hide Meals';
    box.innerHTML = '<div style="color:var(--sub);font-size:13px">Loading meals...</div>';
    
    const res = await Plans.getPlan(planId);
    if (!res.ok) { box.innerHTML = '<div style="color:var(--red);font-size:13px">Failed to load meals</div>'; return; }
    
    const meals = res.data.data.meals || [];
    if (meals.length === 0) { box.innerHTML = '<div style="color:var(--sub);font-size:13px">No meals assigned to this plan.</div>'; return; }
    
    box.innerHTML = '';
    for (const m of meals) {
      // Create meal section
      const mDiv = document.createElement('div');
      mDiv.style.cssText = 'background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;';
      mDiv.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <strong style="color:var(--teal)">${m.meal_name}</strong>
          <span style="font-size:12px;color:var(--sub)">${m.meal_time || ''}</span>
        </div>
        <div id="items-${m.plan_meal_id}" class="meal-item-list" style="font-size:13px;line-height:1.6">Loading items...</div>
      `;
      box.appendChild(mDiv);
      
      // Fetch items for meal
      Plans.getMealItems(m.plan_meal_id).then(ires => {
        const iBox = document.getElementById('items-' + m.plan_meal_id);
        if (!ires.ok) { iBox.textContent = 'Error loading items'; return; }
        const items = ires.data.data || [];
        if (items.length === 0) { iBox.textContent = 'No specific foods listed.'; return; }
        
        iBox.innerHTML = '<ul style="padding-left:20px;color:var(--text)">' + items.map(i => `
          <li style="margin-bottom:6px" class="pdf-item">
            <strong>${i.food_name}</strong> - ${i.qty} ${i.unit}
            ${i.instruction ? `<div style="font-size:11px;color:var(--sub);margin-top:2px"><i class="fas fa-info-circle"></i> ${i.instruction}</div>` : ''}
          </li>
        `).join('') + '</ul>';
      });
    }
  },
  downloadGenericPDF: (cal) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Healix Diet Plan', 20, 20);
    doc.setFontSize(16);
    doc.text(`Standard ${cal} kcal Plan`, 20, 30);
    doc.setFontSize(12);
    doc.text('Breakfast:', 20, 45);
    doc.text('- Oatmeal (1 cup) with berries and honey\n- Boiled eggs (2)', 25, 52);
    doc.text('Lunch:', 20, 70);
    doc.text('- Grilled chicken breast (150g)\n- Brown rice (1 cup) and steamed broccoli', 25, 77);
    doc.text('Dinner:', 20, 95);
    doc.text('- Baked salmon (150g)\n- Quinoa and mixed salad with olive oil', 25, 102);

    doc.setFontSize(14);
    doc.text('Daily Wellness Targets:', 20, 120);
    doc.setFontSize(12);
    doc.text('- Water Consumption: 8 cups (2 Liters)', 25, 128);
    doc.text('- Sleep Schedule: 7-8 hours per night', 25, 135);

    doc.save('Healix_Generic_Plan.pdf');
  },
  downloadPDF: async (planId, title) => {
    // Basic jsPDF generation for a custom plan
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Healix Diet Plan', 20, 20);
    doc.setFontSize(16);
    doc.text(title, 20, 30);

    const res = await Plans.getPlan(planId);
    if (!res.ok) return alert('Failed to fetch plan for PDF');
    const meals = res.data.data.meals || [];
    
    let y = 45;
    doc.setFontSize(12);
    for (const m of meals) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont(undefined, 'bold');
      doc.text(m.meal_name + (m.meal_time ? ' (' + m.meal_time + ')' : ''), 20, y);
      doc.setFont(undefined, 'normal');
      y += 8;

      const ires = await Plans.getMealItems(m.plan_meal_id);
      if (ires.ok && ires.data.data) {
        for (const i of ires.data.data) {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(`- ${i.food_name}: ${i.qty} ${i.unit}`, 25, y);
          y += 7;
        }
      }
      y += 5;
    }

    if (y > 250) { doc.addPage(); y = 20; }
    y += 5;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Daily Wellness Targets:', 20, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('- Water Consumption: 8 cups (2 Liters) minimum', 25, y);
    y += 7;
    doc.text('- Sleep Schedule: 7-8 hours per night recommended', 25, y);

    doc.save(`Healix_Plan_${planId}.pdf`);
  }
};
