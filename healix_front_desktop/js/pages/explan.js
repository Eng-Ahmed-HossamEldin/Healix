pages['explan'] = {
  render: async () => `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h2 class="page-title">Exercise Plans</h2>
          <p class="page-desc">Your personalized workout schedule to hit your fitness goals.</p>
        </div>
        <div id="explan-tier-badge"></div>
      </div>
    </div>
    <div id="exPlanList" style="display:flex;flex-direction:column;gap:20px">
      <div style="text-align:center;padding:40px;color:var(--sub)"><div class="spinner" style="margin:0 auto 12px"></div>Loading your plans...</div>
    </div>
  `,

  init: async () => {
    // Show tier badge
    const tierBadge = document.getElementById('explan-tier-badge');
    const tier = currentUser?.subscription_tier || 'default';
    if (tier === 'pro') {
      tierBadge.innerHTML = '<span class="badge" style="background:rgba(26,122,212,0.2);color:#1A7AD4;font-size:12px"><i class="fas fa-robot" style="margin-right:4px"></i>AI Plan</span>';
    } else if (tier === 'doctor') {
      tierBadge.innerHTML = '<span class="badge" style="background:rgba(155,89,182,0.2);color:#9B59B6;font-size:12px"><i class="fas fa-stethoscope" style="margin-right:4px"></i>Doctor Plan</span>';
    } else {
      tierBadge.innerHTML = '<span class="badge badge-orange" style="font-size:12px"><i class="fas fa-crown" style="margin-right:4px"></i>Free Tier</span>';
    }

    const container = document.getElementById('exPlanList');
    const res = await ExPlans.getMyPlans();

    if (!res.ok) { container.innerHTML = '<div class="alert alert-error">Failed to load exercise plans.</div>'; return; }
    const plans = res.data.data || [];

    if (plans.length === 0) {
      // Generic plan for free users
      if (tier === 'default') {
        container.innerHTML = pages.explan._genericPlanHTML();
      } else {
        container.innerHTML = `
          <div class="card" style="text-align:center;padding:60px 20px">
            <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.15));display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
              <i class="fas fa-robot" style="font-size:32px;color:var(--orange)"></i>
            </div>
            <h3 style="margin-bottom:8px">No Exercise Plans Yet</h3>
            <p style="color:var(--sub);margin-bottom:24px;max-width:420px;margin-inline:auto">
              Let Healix AI generate a personalized workout plan based on your fitness goals.
            </p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <button class="btn-primary" style="max-width:220px;background:linear-gradient(135deg,#F59E0B,#EF4444)" onclick="pages.explan.aiGenerate()">
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
            <h3 class="card-title"><i class="fas fa-dumbbell" style="color:var(--teal);margin-right:8px"></i>${p.goal_type || 'Workout Plan'}</h3>
            <div class="card-sub">Assigned by: ${p.doctor_username ? 'Dr. ' + p.doctor_username : 'System'} &nbsp;·&nbsp; Created: ${new Date(p.created_at).toLocaleDateString()}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-sm btn-outline" onclick="pages.explan.downloadPDF(${p.plan_id}, '${p.goal_type || 'Exercise_Plan'}')"><i class="fas fa-download"></i> PDF</button>
            <button class="btn-sm btn-teal" onclick="pages.explan.togglePlan(${p.plan_id}, this)">View Plan</button>
          </div>
        </div>
        <div id="explan-${p.plan_id}" class="hidden" style="display:flex;flex-direction:column;gap:12px"></div>
      `;
      container.appendChild(card);
    }
  },

  // AI Generate Exercise Plan
  aiGenerate: async () => {
    const tier = currentUser?.subscription_tier || 'default';
    if (tier === 'default') {
      toast('AI plan generation requires an AI Pro or Doctor subscription.', 'error');
      openSubscriptionModal();
      return;
    }

    toast('Generating your workout plan with AI…', 'info');
    const container = document.getElementById('exPlanList');
    if (container) container.innerHTML = `<div style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto 12px"></div><div style="color:var(--sub)">AI is building your workout plan…</div></div>`;

    const res = await Agent.genExercisePlan();

    if (res.ok && res.data.exercise_plan_id) {
      toast('✅ Exercise plan generated! Loading…', 'success');
      setTimeout(() => pages.explan.init(), 800);
    } else {
      toast(res.data?.error || 'Failed to generate plan. Make sure your Goals are set first.', 'error');
      if (container) container.innerHTML = `<div class="alert alert-error">Failed to generate plan. Please set your Goals first and try again.</div>`;
    }
  },

  togglePlan: async (planId, btn) => {
    const box = document.getElementById('explan-' + planId);
    if (!box.classList.contains('hidden')) {
      box.classList.add('hidden'); btn.textContent = 'View Plan'; return;
    }
    box.classList.remove('hidden');
    btn.textContent = 'Hide Plan';
    box.innerHTML = '<div style="color:var(--sub);font-size:13px"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading exercises...</div>';

    const res = await ExPlans.getPlanById(planId);
    if (!res.ok) { box.innerHTML = '<div class="alert alert-error">Failed to load plan.</div>'; return; }
    const exercises = res.data.data?.exercises || [];

    if (exercises.length === 0) { box.innerHTML = '<div style="color:var(--sub);font-size:13px;padding:12px">No exercises assigned to this plan yet.</div>'; return; }

    // Group by day
    const byDay = {};
    exercises.forEach(ex => {
      const d = ex.day_number || 1;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(ex);
    });
    const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    box.innerHTML = Object.keys(byDay).sort((a,b) => a-b).map(day => `
      <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px">
        <div style="font-weight:700;color:var(--teal);margin-bottom:12px;font-size:13px">
          <i class="fas fa-calendar-day" style="margin-right:6px"></i>Day ${day} — ${dayNames[(parseInt(day)-1) % 7]}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${byDay[day].map(ex => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px">
              <div style="width:32px;height:32px;border-radius:8px;background:rgba(77,195,232,0.15);color:var(--teal);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="fas fa-dumbbell" style="font-size:13px"></i>
              </div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:14px">${ex.name}</div>
                <div style="font-size:12px;color:var(--sub)">${ex.category || ''}</div>
              </div>
              <div style="text-align:right;font-size:13px">
                ${ex.sets ? `<span style="color:var(--orange);font-weight:600">${ex.sets} sets</span>` : ''}
                ${ex.reps ? `<span style="color:var(--sub)"> × ${ex.reps}</span>` : ''}
              </div>
              ${ex.instruction ? `<div style="font-size:11px;color:var(--sub);margin-top:4px;font-style:italic">${ex.instruction}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  _genericPlanHTML: () => {
    const plan = [
      { day: 'Day 1 — Upper Body', color: '#EF4444', exercises: [
        { name: 'Push-ups', sets: 3, reps: '12-15' },
        { name: 'Dumbbell Rows', sets: 3, reps: '10 each' },
        { name: 'Shoulder Press', sets: 3, reps: '10' }
      ]},
      { day: 'Day 2 — Lower Body', color: '#F59E0B', exercises: [
        { name: 'Bodyweight Squats', sets: 4, reps: '15' },
        { name: 'Lunges', sets: 3, reps: '10 each leg' },
        { name: 'Calf Raises', sets: 3, reps: '20' }
      ]},
      { day: 'Day 3 — Core & Cardio', color: '#1A7AD4', exercises: [
        { name: 'Plank Hold', sets: 3, reps: '45 sec' },
        { name: 'Jumping Jacks', sets: 3, reps: '60 sec' },
        { name: 'Mountain Climbers', sets: 3, reps: '30 sec' }
      ]},
    ];
    const cal = currentReqs?.target_calories || 2000;
    return `
      <div class="card">
        <div class="card-header" style="border-bottom:1px solid var(--border);padding-bottom:16px;margin-bottom:16px">
          <div>
            <h3 class="card-title"><i class="fas fa-dumbbell" style="color:var(--teal);margin-right:8px"></i>Standard 3-Day Split Plan</h3>
            <div class="card-sub">Generic plan for ${cal} kcal goal. Upgrade to AI or Doctor for a personalized plan.</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-sm btn-outline" onclick="pages.explan.downloadGenericPDF()"><i class="fas fa-download"></i> PDF</button>
            <button class="btn-sm btn-outline" onclick="showPage('coach')" style="border-color:var(--orange);color:var(--orange)"><i class="fas fa-crown"></i> Upgrade</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${plan.map(p => `
            <div style="background:var(--card2);border:1px solid var(--border);border-left:3px solid ${p.color};border-radius:var(--radius-sm);padding:16px">
              <div style="font-weight:700;color:${p.color};margin-bottom:12px;font-size:13px"><i class="fas fa-calendar-day" style="margin-right:6px"></i>${p.day}</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${p.exercises.map(ex => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:6px">
                    <span style="font-size:13px;font-weight:500">${ex.name}</span>
                    <span style="font-size:12px;color:var(--sub)">${ex.sets} sets × ${ex.reps}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:20px;padding:16px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;display:flex;align-items:center;gap:16px">
          <i class="fas fa-crown" style="font-size:28px;color:var(--orange)"></i>
          <div>
            <div style="font-weight:700;margin-bottom:4px">Unlock Personalized Plans</div>
            <div style="font-size:13px;color:var(--sub)">Upgrade to AI for AI-generated plans or Doctor to get a doctor-assigned workout schedule.</div>
          </div>
          <button class="btn-sm" style="background:var(--orange);color:#fff;flex-shrink:0;white-space:nowrap" onclick="showPage('coach')">Upgrade Now</button>
        </div>
      </div>
    `;
  },

  downloadGenericPDF: () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lineH = 7;
    let y = 20;
    doc.setFontSize(20); doc.setFont(undefined, 'bold');
    doc.text('Healix — Exercise Plan', 20, y); y += 10;
    doc.setFontSize(13); doc.setFont(undefined, 'normal');
    doc.text('Standard 3-Day Split (Generic)', 20, y); y += 10;

    const plan = [
      { day: 'Day 1 — Upper Body', exercises: ['Push-ups: 3 × 12-15','Dumbbell Rows: 3 × 10 each','Shoulder Press: 3 × 10'] },
      { day: 'Day 2 — Lower Body', exercises: ['Bodyweight Squats: 4 × 15','Lunges: 3 × 10 each leg','Calf Raises: 3 × 20'] },
      { day: 'Day 3 — Core & Cardio', exercises: ['Plank Hold: 3 × 45 sec','Jumping Jacks: 3 × 60 sec','Mountain Climbers: 3 × 30 sec'] },
    ];
    plan.forEach(p => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont(undefined, 'bold'); doc.setFontSize(13);
      doc.text(p.day, 20, y); y += lineH;
      doc.setFont(undefined, 'normal'); doc.setFontSize(11);
      p.exercises.forEach(ex => { doc.text('  • ' + ex, 20, y); y += lineH; });
      y += 4;
    });
    doc.save('Healix_Exercise_Plan.pdf');
  },

  downloadPDF: async (planId, title) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(20); doc.setFont(undefined, 'bold');
    doc.text('Healix — Exercise Plan', 20, y); y += 10;
    doc.setFontSize(13); doc.setFont(undefined, 'normal');
    doc.text(title, 20, y); y += 12;

    const res = await ExPlans.getPlanById(planId);
    if (!res.ok) return alert('Failed to fetch plan for PDF');
    const exercises = res.data.data?.exercises || [];
    const byDay = {};
    exercises.forEach(ex => { const d = ex.day_number||1; if(!byDay[d]) byDay[d]=[]; byDay[d].push(ex); });

    Object.keys(byDay).sort((a,b) => a-b).forEach(day => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont(undefined, 'bold'); doc.setFontSize(13);
      doc.text(`Day ${day}`, 20, y); y += 7;
      doc.setFont(undefined, 'normal'); doc.setFontSize(11);
      byDay[day].forEach(ex => {
        const line = `  • ${ex.name}${ex.sets ? ': ' + ex.sets + ' sets' : ''}${ex.reps ? ' × ' + ex.reps : ''}`;
        doc.text(line, 20, y); y += 6;
      });
      y += 4;
    });
    doc.save(`Healix_ExPlan_${planId}.pdf`);
  }
};
