// ── Admin Portal JS ───────────────────────────────────────────────────────────
const ADMIN_TOKEN_KEY = 'healix_admin_token';

function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY); }
function setAdminToken(t) { localStorage.setItem(ADMIN_TOKEN_KEY, t); }
function clearAdminToken() { localStorage.removeItem(ADMIN_TOKEN_KEY); }

// Override token for this page
function getToken() { return getAdminToken(); }

function togglePw(id, btn) {
  const inp = document.getElementById(id), icon = btn.querySelector('i');
  if(inp.type==='password'){inp.type='text';icon.className='fas fa-eye-slash';}
  else{inp.type='password';icon.className='fas fa-eye';}
}
function toast(msg, type='info') {
  const c = document.getElementById('toast'); if(!c) return;
  const el = document.createElement('div'); el.className=`toast-msg ${type}`; el.textContent=msg;
  c.appendChild(el); setTimeout(()=>el.remove(), 3500);
}
function openModal(html) { document.getElementById('modalContent').innerHTML=html; document.getElementById('modalOverlay').classList.remove('hidden'); }
function closeModal(e) {
  if(e && e.target!==document.getElementById('modalOverlay') && !e.target.closest('.close-modal')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalContent').innerHTML='';
}
function closeModalDirect() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalContent').innerHTML='';
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function adminLogin() {
  const btn = document.getElementById('loginBtn'), err = document.getElementById('loginErr');
  const loginId = document.getElementById('loginId').value.trim();
  const password = document.getElementById('loginPw').value;
  err.classList.add('hidden');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Signing in...'; btn.disabled=true;
  const res = await apiCall('POST','/api/auth/login',{loginId,password,role:'admin'});
  btn.innerHTML='<i class="fas fa-sign-in-alt" style="margin-right:6px"></i>Admin Sign In'; btn.disabled=false;
  if(!res.ok){err.textContent=res.data?.message||'Invalid credentials';err.classList.remove('hidden');return;}
  setAdminToken(res.data.data.token);
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('portalShell').classList.remove('hidden');
  initAdmin();
}

function adminLogout() { clearAdminToken(); window.location.reload(); }

// ── Init ──────────────────────────────────────────────────────────────────────
let _adminUsername = null;

function initAdmin() {
  // Store admin username from token
  try {
    const token = getAdminToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      _adminUsername = payload.username || 'admin';
    }
  } catch(e) { _adminUsername = 'admin'; }

  document.querySelectorAll('.portal-nav-item').forEach(el => {
    el.addEventListener('click', ()=>showAdminPage(el.dataset.page));
  });

  // Wire notification bell
  const bellBtn = document.querySelector('.notif-btn');
  if (bellBtn) bellBtn.addEventListener('click', openAdminNotifications);

  // Init socket for real-time notifications
  try {
    const host = window.location.hostname || 'localhost';
    const serverUrl = `${window.location.protocol}//${host}:5000`;
    if (typeof io !== 'undefined') {
      const adminSocket = io(serverUrl, { reconnection: true });
      adminSocket.on('connect', () => {
        adminSocket.emit('join_notifications', _adminUsername);
      });
      adminSocket.on('receive_notification', (notif) => {
        toast(notif.message, 'info');
        fetchAdminNotifs();
      });
    }
  } catch(e) { console.warn('Admin socket unavailable:', e.message); }

  fetchAdminNotifs();
  showAdminPage('overview');
}

// ── Notifications ─────────────────────────────────────────────────────────────
async function fetchAdminNotifs() {
  const res = await apiCall('GET', '/api/messaging/notifications');
  if (res.ok) {
    const list = res.data.data || [];
    const dot = document.querySelector('.notif-dot');
    const unread = list.filter(n => !n.is_read).length;
    if (dot) {
      dot.style.display = unread > 0 ? 'flex' : 'none';
      if (unread > 0) {
        dot.textContent = unread > 9 ? '9+' : unread;
        dot.style.cssText = 'position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;background:var(--orange);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;padding:0 3px';
      }
    }
    window._adminNotifs = list;
  }
}

function openAdminNotifications() {
  const list = window._adminNotifs || [];
  openModal(`
    <div style="padding:20px;max-width:500px;min-width:320px;max-height:80vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h3 style="margin:0"><i class="fas fa-bell" style="color:var(--orange);margin-right:8px"></i>Notifications</h3>
        <div style="display:flex;gap:12px">
          <button onclick="markAdminNotifsRead()" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer;font-family:inherit">Clear all</button>
          <button onclick="closeModalDirect()" style="background:none;border:none;color:var(--sub);font-size:20px;cursor:pointer">&times;</button>
        </div>
      </div>
      ${list.length ? list.map(n => `
        <div style="padding:12px 14px;border-radius:10px;background:${n.is_read ? 'var(--card2)' : 'rgba(255,193,58,0.1)'};border:1px solid ${n.is_read ? 'var(--border)' : 'rgba(255,193,58,0.3)'};margin-bottom:10px">
          <div style="font-size:13px;color:var(--text)">${n.message}</div>
          <div style="font-size:11px;color:var(--sub);margin-top:4px">${new Date(n.created_at).toLocaleString()}</div>
        </div>
      `).join('') : `<div style="padding:24px;text-align:center;color:var(--sub)"><i class="fas fa-check-circle" style="font-size:28px;margin-bottom:8px;display:block;opacity:0.4"></i>No notifications.</div>`}
    </div>
  `);
}

async function markAdminNotifsRead() {
  await apiCall('POST', '/api/messaging/notifications/read');
  const dot = document.querySelector('.notif-dot');
  if (dot) dot.style.display = 'none';
  window._adminNotifs = (window._adminNotifs || []).map(n => ({...n, is_read: true}));
  closeModalDirect();
}

function showAdminPage(page) {
  document.querySelectorAll('.portal-nav-item').forEach(el=>el.classList.remove('active'));
  const nav = document.querySelector(`.portal-nav-item[data-page="${page}"]`);
  if(nav) nav.classList.add('active');
  const main = document.getElementById('portalMain');
  ({overview, users, doctors, plans, foods, recipes, exercises, subscriptionRequests})[page]?.(main);
}

// ── Overview ──────────────────────────────────────────────────────────────────
async function overview(main) {
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Platform Overview</h2><p class="page-desc">Real-time Healix platform statistics.</p></div>
    <div class="grid-3" id="statsGrid" style="margin-bottom:24px">
      ${['total_users','total_doctors','total_foods','total_recipes','total_exercises','total_plans'].map(k=>`
        <div class="stat-card" id="stat-${k}">
          <div class="spinner" style="margin:0 auto"></div>
        </div>`).join('')}
    </div>
  `;
  const res = await apiCall('GET','/api/admin/stats');
  if(!res.ok){document.getElementById('statsGrid').innerHTML='<div class="alert alert-error" style="grid-column:span 3">Failed to load stats.</div>';return;}
  const s = res.data.data;
  const cfg = [
    {k:'total_users',     label:'Total Users',   icon:'fa-users',        color:'var(--teal)',   val: s.total_users},
    {k:'total_doctors',   label:'Doctors',       icon:'fa-user-doctor',  color:'var(--purple)', val: s.total_doctors},
    {k:'total_foods',     label:'Food Items',    icon:'fa-utensils',     color:'var(--orange)', val: s.total_foods},
    {k:'total_recipes',   label:'Recipes',       icon:'fa-book-open',    color:'var(--green)',  val: s.total_recipes},
    {k:'total_exercises', label:'Exercises',     icon:'fa-dumbbell',     color:'#1A7AD4',       val: s.total_exercises},
    {k:'total_plans',     label:'Meal Plans',    icon:'fa-calendar-week',color:'var(--green)',  val: s.total_plans},
  ];
  cfg.forEach(c=>{
    const el = document.getElementById('stat-'+c.k);
    if(el) el.innerHTML=`<div class="stat-icon" style="background:${c.color}22;color:${c.color}"><i class="fas ${c.icon}"></i></div><div class="stat-val">${c.val}</div><div class="stat-label">${c.label}</div>`;
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function users(main) {
  main.innerHTML=`<div class="page-header"><h2 class="page-title">User Management</h2><p class="page-desc">View and manage all user accounts.</p></div>
    <div class="card" style="margin-bottom:16px;padding:14px 20px">
      <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:0 12px;height:38px">
        <i class="fas fa-search" style="color:var(--sub);font-size:13px"></i>
        <input id="userSearch" type="text" placeholder="Search users..." style="background:none;border:none;outline:none;color:var(--text);font-size:13px;flex:1;font-family:inherit" oninput="filterUsers()">
      </div>
    </div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Subscription</th><th>Expires</th><th>Actions</th></tr></thead><tbody id="usersBody"><tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading...</td></tr></tbody></table></div></div>`;
  const res = await apiCall('GET','/api/admin/users');
  window._adminUsers = res.ok ? (res.data.data||[]) : [];
  filterUsers();
}

function filterUsers() {
  const q = (document.getElementById('userSearch')?.value||'').toLowerCase();
  let items = window._adminUsers||[];
  if(q) items = items.filter(u=>(u.user_username+' '+u.email+' '+(u.first_name||'')+' '+(u.last_name||'')).toLowerCase().includes(q));
  const tierBadge = t => ({pro:`<span class="badge" style="background:rgba(26,122,212,0.2);color:#1A7AD4">AI</span>`,doctor:`<span class="badge" style="background:rgba(155,89,182,0.2);color:var(--purple)">Doctor</span>`}[t]||`<span class="badge" style="background:rgba(139,163,180,0.15);color:var(--sub)">Free</span>`);
  document.getElementById('usersBody').innerHTML = items.length===0
    ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)">No users found.</td></tr>'
    : items.map(u=>`<tr>
        <td><div style="font-weight:600">${u.first_name||''} ${u.last_name||''}</div><div style="font-size:11px;color:var(--sub)">@${u.user_username}</div></td>
        <td style="color:var(--sub);font-size:13px">${u.email}</td>
        <td>${tierBadge(u.subscription_tier)}</td>
        <td style="font-size:12px;color:var(--sub)">${u.subscription_end_date?new Date(u.subscription_end_date).toLocaleDateString():'—'}</td>
        <td style="display:flex;gap:6px">
          <button class="btn-sm btn-outline" style="color:var(--teal);border-color:var(--teal)" onclick="showUserInfoModal('${u.user_username}')"><i class="fas fa-info-circle"></i> Info</button>
          <button class="btn-sm btn-outline" onclick="editUserSub('${u.user_username}','${u.subscription_tier}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-sm btn-outline" style="color:var(--purple);border-color:var(--purple)" onclick="promoteToDoctorPrompt('${u.user_username}')"><i class="fas fa-stethoscope"></i> Promote</button>
          <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="terminateUserPrompt('${u.user_username}')"><i class="fas fa-trash"></i> Terminate</button>
        </td>
      </tr>`).join('');
}

function showUserInfoModal(username) {
  const u = window._adminUsers.find(x => x.user_username === username);
  if (!u) return;

  const tierBadge = t => ({pro:`<span class="badge" style="background:rgba(26,122,212,0.2);color:#1A7AD4">AI</span>`,doctor:`<span class="badge" style="background:rgba(155,89,182,0.2);color:var(--purple)">Doctor</span>`}[t]||`<span class="badge" style="background:rgba(139,163,180,0.15);color:var(--sub)">Free</span>`);
  
  openModal(`
    <h3 class="modal-title" style="margin-bottom:16px"><i class="fas fa-user-circle" style="color:var(--teal);margin-right:8px"></i>User Information</h3>
    
    <div style="background:rgba(0,0,0,0.03);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
        <div><strong style="color:var(--sub)">Username:</strong> <span style="color:var(--text)">@${u.user_username}</span></div>
        <div><strong style="color:var(--sub)">Name:</strong> <span style="color:var(--text)">${u.first_name || ''} ${u.last_name || ''}</span></div>
        <div><strong style="color:var(--sub)">Email:</strong> <span style="color:var(--text)">${u.email || '—'}</span></div>
        <div><strong style="color:var(--sub)">Phone:</strong> <span style="color:var(--text)">${u.phone_no || '—'}</span></div>
        <div><strong style="color:var(--sub)">Created At:</strong> <span style="color:var(--text)">${u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span></div>
        <div><strong style="color:var(--sub)">Subscription:</strong> ${tierBadge(u.subscription_tier)}</div>
        <div><strong style="color:var(--sub)">Sub Expiry:</strong> <span style="color:var(--text)">${u.subscription_end_date ? new Date(u.subscription_end_date).toLocaleDateString() : '—'}</span></div>
        <div><strong style="color:var(--sub)">Assigned Doctor:</strong> <span style="color:var(--text)">${u.assigned_doctor_username ? '@'+u.assigned_doctor_username : 'None'}</span></div>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModalDirect()">Close</button>
    </div>
  `);
}

function editUserSub(username, currentTier) {
  openModal(`
    <h3 class="modal-title">Edit Subscription — @${username}</h3>
    <div class="form-group" style="margin-top:16px"><label>New Tier</label>
      <select id="newTier" class="input-wrap" style="width:100%">
        <option value="default" ${currentTier==='default'?'selected':''}>Free (Default)</option>
        <option value="pro" ${currentTier==='pro'?'selected':''}>AI</option>
        <option value="doctor" ${currentTier==='doctor'?'selected':''}>Doctor</option>
      </select>
    </div>
    <div class="form-group"><label>Duration (days)</label><div class="input-wrap"><i class="fas fa-calendar"></i><input type="number" id="newDays" value="30" style="padding-left:38px"></div></div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="applySubChange('${username}')">Apply Change</button>
    </div>
  `);
}

async function applySubChange(username) {
  const tier = document.getElementById('newTier').value;
  const days = parseInt(document.getElementById('newDays').value)||30;
  const res = await apiCall('PUT',`/api/admin/users/${username}/subscription`,{tier,durationDays:days});
  if(res.ok){toast('Subscription updated!','success');closeModal({target:document.getElementById('modalOverlay')});showAdminPage('users');}
  else toast(res.data?.message||'Failed','error');
}

function promoteToDoctorPrompt(username) {
  openModal(`
    <h3 class="modal-title">Promote @${username} to Doctor</h3>
    <p style="font-size:13px;color:var(--sub);margin-bottom:16px">This will transfer the user's account to the Doctor database and remove them from the standard user list. They will use the Doctor Portal moving forward.</p>
    <div class="form-group"><label>Certification (e.g., General Practice, Dietitian)</label><div class="input-wrap"><i class="fas fa-certificate"></i><input type="text" id="docCert" placeholder="Nutritionist" style="padding-left:38px"></div></div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm" style="background:var(--purple);color:#fff" onclick="executePromote('${username}')">Confirm Promotion</button>
    </div>
  `);
}

async function executePromote(username) {
  const cert = document.getElementById('docCert').value || 'General';
  const res = await apiCall('POST', `/api/admin/users/${username}/promote`, { certification: cert });
  if (res.ok) {
    toast(`@${username} is now a Doctor!`, 'success');
    closeModal({target:document.getElementById('modalOverlay')});
    showAdminPage('users');
  } else {
    toast(res.data?.message || 'Failed to promote', 'error');
  }
}

function terminateUserPrompt(username) {
  openModal(`
    <h3 class="modal-title" style="color:var(--red)"><i class="fas fa-exclamation-triangle"></i> Terminate User</h3>
    <p style="font-size:13px;color:var(--sub);margin-bottom:16px">Are you sure you want to permanently delete <strong>@${username}</strong>? This action cannot be undone and all associated data will be removed.</p>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm" style="background:var(--red);color:#fff" onclick="executeTerminateUser('${username}')">Yes, Terminate</button>
    </div>
  `);
}

async function executeTerminateUser(username) {
  const res = await apiCall('DELETE', `/api/admin/users/${username}`);
  if (res.ok) {
    toast(`User @${username} has been terminated.`, 'success');
    closeModal({target:document.getElementById('modalOverlay')});
    showAdminPage('users');
  } else {
    toast(res.data?.message || 'Failed to terminate user', 'error');
  }
}

// ── Doctors ───────────────────────────────────────────────────────────────────
async function doctors(main) {
  main.innerHTML=`<div class="page-header"><h2 class="page-title">Doctor Management</h2><p class="page-desc">All registered doctors on the platform.</p></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Doctor</th><th>Email</th><th>Certification</th><th>Location</th><th>Actions</th></tr></thead>
    <tbody id="docBody"><tr><td colspan="5" style="text-align:center;padding:20px"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading...</td></tr></tbody></table></div></div>`;
  const res = await apiCall('GET','/api/admin/doctors');
  const docs = res.ok ? (res.data.data||[]) : [];
  document.getElementById('docBody').innerHTML = docs.length===0
    ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)">No doctors found.</td></tr>'
    : docs.map(d=>`<tr>
        <td><div style="font-weight:600">Dr. ${d.first_name||''} ${d.last_name||''}</div><div style="font-size:11px;color:var(--sub)">@${d.doctor_username}</div></td>
        <td style="font-size:13px;color:var(--sub)">${d.email}</td>
        <td><span class="badge badge-teal">${d.certification||'—'}</span></td>
        <td style="font-size:13px;color:var(--sub)">${d.address||'—'}</td>
        <td style="display:flex;gap:6px">
          <button class="btn-sm btn-outline" style="color:var(--orange);border-color:var(--orange)" onclick="downgradeToUserPrompt('${d.doctor_username}')"><i class="fas fa-arrow-down"></i> Downgrade</button>
          <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="terminateDoctorPrompt('${d.doctor_username}')"><i class="fas fa-trash"></i> Terminate</button>
        </td>
      </tr>`).join('');
}

function downgradeToUserPrompt(username) {
  openModal(`
    <h3 class="modal-title">Downgrade Dr. @${username}?</h3>
    <p style="font-size:13px;color:var(--sub);margin-bottom:16px">This will revoke Doctor Portal access and transfer this account back to a standard Member account.</p>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm" style="background:var(--red);color:#fff" onclick="executeDowngrade('${username}')">Confirm Downgrade</button>
    </div>
  `);
}

async function executeDowngrade(username) {
  const res = await apiCall('POST', `/api/admin/doctors/${username}/downgrade`);
  if (res.ok) {
    toast(`Dr. @${username} has been downgraded to a user`, 'success');
    closeModal({target:document.getElementById('modalOverlay')});
    showAdminPage('doctors');
  } else {
    toast(res.data?.message || 'Failed to downgrade', 'error');
  }
}

function terminateDoctorPrompt(username) {
  openModal(`
    <h3 class="modal-title" style="color:var(--red)"><i class="fas fa-exclamation-triangle"></i> Terminate Doctor</h3>
    <p style="font-size:13px;color:var(--sub);margin-bottom:16px">Are you sure you want to permanently delete Dr. <strong>@${username}</strong>? This action cannot be undone and all associated plans will be removed.</p>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm" style="background:var(--red);color:#fff" onclick="executeTerminateDoctor('${username}')">Yes, Terminate</button>
    </div>
  `);
}

async function executeTerminateDoctor(username) {
  const res = await apiCall('DELETE', `/api/admin/doctors/${username}`);
  if (res.ok) {
    toast(`Doctor @${username} has been terminated.`, 'success');
    closeModal({target:document.getElementById('modalOverlay')});
    showAdminPage('doctors');
  } else {
    toast(res.data?.message || 'Failed to terminate doctor', 'error');
  }
}

// ── Plans ─────────────────────────────────────────────────────────────────────
async function plans(main) {
  main.innerHTML=`<div class="page-header"><h2 class="page-title">Diet Plans</h2><p class="page-desc">Manage user meal plans and nutrition targets.</p></div>
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="card-title" style="margin:0"><i class="fas fa-calendar-week" style="color:var(--green);margin-right:8px"></i>All Diet Plans</h3>
        <button class="btn-sm btn-primary" onclick="showAddPlanModal()"><i class="fas fa-plus" style="margin-right:6px"></i>Create Plan</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>User</th><th>Goal</th><th>Macros (kcal/P/C/F)</th><th>Dates</th><th>Actions</th></tr></thead><tbody id="plansBody"><tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading plans...</td></tr></tbody></table></div>
    </div>
  `;
  loadPlans();
}

async function loadPlans() {
  const res = await apiCall('GET','/api/admin/plans');
  const tbody = document.getElementById('plansBody');
  if(!res.ok){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--red)">Failed to load plans.</td></tr>';return;}
  window._adminPlans = res.data.data || [];
  if(!window._adminPlans.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)">No plans in database.</td></tr>';return;}
  tbody.innerHTML = window._adminPlans.map((p, idx)=>`
    <tr>
      <td><div style="font-weight:600">@${p.user_username}</div><div style="font-size:11px;color:var(--sub)">By ${p.doctor_username||'AI'}</div></td>
      <td><span class="badge badge-teal">${p.goal_type||'—'}</span></td>
      <td>
        <div style="font-size:13px"><strong>${Math.round(p.target_calories)}</strong> kcal</div>
        <div style="font-size:11px;color:var(--sub)">P: ${Math.round(p.target_protein_g)}g | C: ${Math.round(p.target_carbs_g)}g | F: ${Math.round(p.target_fat_g)}g</div>
      </td>
      <td style="font-size:12px;color:var(--sub)">
        ${p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'} to 
        ${p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}
      </td>
      <td style="display:flex;gap:6px">
        <button class="btn-sm btn-outline" onclick="editPlan(${idx})"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="deletePlan(${p.plan_id})"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function showAddPlanModal() { openPlanModal(); }
function editPlan(idx) { openPlanModal(window._adminPlans[idx]); }

function openPlanModal(p = null) {
  const isEdit = !!p;
  const cur = p?.goal_type || '';
  const goalOptions = ['Weight Loss','Weight Gain','Muscle Gain','Maintenance','Fat Loss','Lean Bulk','Keto','Low Carb','High Protein','Diabetic-Friendly','Heart-Healthy','Custom'];
  const goalSelect = '<select id="p_goal" style="width:100%;background:#ffffff;border:1px solid #d0d0d0;border-radius:8px;padding:10px 14px;color:#1a1a2e;font-family:inherit;font-size:13px;outline:none;cursor:pointer">'
    + '<option value="" ' + (!cur ? 'selected' : '') + ' style="background:#ffffff;color:#1a1a2e">-- Select a Goal --</option>'
    + goalOptions.map(g => '<option value="' + g + '" ' + (cur === g ? 'selected' : '') + ' style="background:#ffffff;color:#1a1a2e">' + g + '</option>').join('')
    + '</select>';

  openModal(`
    <h3 class="modal-title"><i class="fas ${isEdit?'fa-edit':'fa-plus-circle'}" style="color:var(--green);margin-right:8px"></i>${isEdit?'Edit':'Create'} Diet Plan</h3>
    <div class="form-row-2" style="margin-top:16px">
      <div class="form-group"><label>User Username *</label><div class="input-wrap"><i class="fas fa-user"></i><input type="text" id="p_user" value="${p?.user_username||''}" ${isEdit?'readonly style="background:rgba(255,255,255,0.03)"':''} placeholder="username" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Doctor Username (Optional)</label><div class="input-wrap"><i class="fas fa-user-doctor"></i><input type="text" id="p_doc" value="${p?.doctor_username||''}" placeholder="doctor_username" style="padding-left:38px"></div></div>
    </div>
    <div class="form-group"><label>Goal Type</label>${goalSelect}</div>
    <div class="form-row-2">
      <div class="form-group"><label>Start Date</label><div class="input-wrap"><i class="fas fa-calendar-alt"></i><input type="date" id="p_start" value="${p?.start_date ? p.start_date.split('T')[0] : ''}" style="padding-left:38px"></div></div>
      <div class="form-group"><label>End Date</label><div class="input-wrap"><i class="fas fa-calendar-check"></i><input type="date" id="p_end" value="${p?.end_date ? p.end_date.split('T')[0] : ''}" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Target Calories</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="p_cal" value="${p?.target_calories||''}" placeholder="2000" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Protein (g)</label><div class="input-wrap"><i class="fas fa-drumstick-bite"></i><input type="number" id="p_prot" value="${p?.target_protein_g||''}" placeholder="150" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Carbs (g)</label><div class="input-wrap"><i class="fas fa-wheat-awn"></i><input type="number" id="p_carb" value="${p?.target_carbs_g||''}" placeholder="200" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Fat (g)</label><div class="input-wrap"><i class="fas fa-cheese"></i><input type="number" id="p_fat" value="${p?.target_fat_g||''}" placeholder="60" style="padding-left:38px"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="submitPlan(${p?.plan_id||'null'})" id="planBtn"><i class="fas fa-save" style="margin-right:6px"></i>${isEdit?'Update':'Create'} Plan</button>
    </div>
  `);
}

async function submitPlan(planId) {
  const user = document.getElementById('p_user').value.trim();
  if(!user){toast('User username is required','error');return;}
  const btn = document.getElementById('planBtn');
  const isEdit = !!planId;
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled=true;
  
  const data = {
    user_username: user,
    doctor_username: document.getElementById('p_doc').value.trim() || null,
    goal_type: document.getElementById('p_goal').value.trim() || null,
    start_date: document.getElementById('p_start').value || null,
    end_date: document.getElementById('p_end').value || null,
    target_calories: parseFloat(document.getElementById('p_cal').value) || 0,
    target_protein_g: parseFloat(document.getElementById('p_prot').value) || 0,
    target_carbs_g: parseFloat(document.getElementById('p_carb').value) || 0,
    target_fat_g: parseFloat(document.getElementById('p_fat').value) || 0
  };

  const method = isEdit ? 'PUT' : 'POST';
  const url = isEdit ? `/api/admin/plans/${planId}` : '/api/admin/plans';
  
  const res = await apiCall(method, url, data);
  btn.innerHTML='<i class="fas fa-save" style="margin-right:6px"></i>' + (isEdit?'Update':'Create') + ' Plan'; btn.disabled=false;
  
  if(res.ok){closeModal();toast(`Plan ${isEdit?'updated':'created'}!`,'success');loadPlans();}
  else toast(res.data?.message||'Failed','error');
}

async function deletePlan(planId) {
  if(!confirm('Are you sure you want to delete this diet plan?')) return;
  const res = await apiCall('DELETE', `/api/admin/plans/${planId}`);
  if(res.ok){toast('Plan deleted!','success');loadPlans();}
  else toast(res.data?.message||'Failed','error');
}

// ── Foods ─────────────────────────────────────────────────────────────────────
async function foods(main) {
  main.innerHTML=`<div class="page-header"><h2 class="page-title">Foods Database</h2><p class="page-desc">Manage the global nutrition database.</p></div>
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="card-title" style="margin:0"><i class="fas fa-utensils" style="color:var(--orange);margin-right:8px"></i>All Foods</h3>
        <button class="btn-sm btn-primary" onclick="showAddFoodModal()" style="background:linear-gradient(135deg,var(--orange),#e67e22)"><i class="fas fa-plus" style="margin-right:6px"></i>Add Food</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Food Name</th><th>Category</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Serving</th><th>Actions</th></tr></thead><tbody id="foodsBody"><tr><td colspan="8" style="text-align:center;padding:20px;color:var(--sub)"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading foods...</td></tr></tbody></table></div>
    </div>
  `;
  loadFoods();
}

async function loadFoods() {
  const res = await apiCall('GET','/api/admin/foods');
  const tbody = document.getElementById('foodsBody');
  if(!res.ok){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--red)">Failed to load foods.</td></tr>';return;}
  const foods = res.data.data;
  if(!foods.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--sub)">No foods in database.</td></tr>';return;}
  tbody.innerHTML = foods.map(f=>`
    <tr>
      <td style="font-weight:600">${f.food_name}</td>
      <td>${f.category||'—'}</td>
      <td>${f.calories_per_100g||0}</td>
      <td>${f.protein_per_100g||0}g</td>
      <td>${f.carbs_per_100g||0}g</td>
      <td>${f.fat_per_100g||0}g</td>
      <td>${f.serving_size||'100g'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-sm btn-outline" onclick="editFood(${f.food_id}, '${f.food_name}', '${f.category||''}', ${f.calories_per_100g||0}, ${f.protein_per_100g||0}, ${f.carbs_per_100g||0}, ${f.fat_per_100g||0}, '${f.serving_size||'100g'}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="deleteFood(${f.food_id}, '${f.food_name}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

function showAddFoodModal() {
  openModal(`
    <h3 class="modal-title"><i class="fas fa-plus-circle" style="color:var(--orange);margin-right:8px"></i>Add New Food</h3>
    <div class="form-row-2">
      <div class="form-group"><label>Food Name *</label><div class="input-wrap"><i class="fas fa-apple-whole"></i><input type="text" id="fn" placeholder="e.g. Brown Rice" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Category</label><div class="input-wrap"><i class="fas fa-tag"></i><input type="text" id="fc" placeholder="e.g. Grains" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Calories / 100g</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="fcal" placeholder="216" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Serving Size</label><div class="input-wrap"><i class="fas fa-weight-hanging"></i><input type="text" id="fs" placeholder="100g" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2" style="grid-template-columns:repeat(3,1fr)">
      <div class="form-group"><label>Protein (g)</label><div class="input-wrap"><i class="fas fa-drumstick-bite"></i><input type="number" id="fp" placeholder="4.5" step="0.1" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Carbs (g)</label><div class="input-wrap"><i class="fas fa-wheat-awn"></i><input type="number" id="fcar" placeholder="45" step="0.1" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Fat (g)</label><div class="input-wrap"><i class="fas fa-cheese"></i><input type="number" id="ff" placeholder="1.8" step="0.1" style="padding-left:38px"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="submitFood()" id="foodBtn"><i class="fas fa-plus" style="margin-right:6px"></i>Add Food</button>
    </div>
  `);
}

function editFood(id, name, category, calories, protein, carbs, fat, serving) {
  openModal(`
    <h3 class="modal-title"><i class="fas fa-edit" style="color:var(--teal);margin-right:8px"></i>Edit Food</h3>
    <div class="form-row-2">
      <div class="form-group"><label>Food Name *</label><div class="input-wrap"><i class="fas fa-apple-whole"></i><input type="text" id="efn" value="${name}" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Category</label><div class="input-wrap"><i class="fas fa-tag"></i><input type="text" id="efc" value="${category}" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Calories / 100g</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="efcal" value="${calories}" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Serving Size</label><div class="input-wrap"><i class="fas fa-weight-hanging"></i><input type="text" id="efs" value="${serving}" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2" style="grid-template-columns:repeat(3,1fr)">
      <div class="form-group"><label>Protein (g)</label><div class="input-wrap"><i class="fas fa-drumstick-bite"></i><input type="number" id="efp" value="${protein}" step="0.1" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Carbs (g)</label><div class="input-wrap"><i class="fas fa-wheat-awn"></i><input type="number" id="efcar" value="${carbs}" step="0.1" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Fat (g)</label><div class="input-wrap"><i class="fas fa-cheese"></i><input type="number" id="eff" value="${fat}" step="0.1" style="padding-left:38px"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="updateFood(${id})" id="editFoodBtn"><i class="fas fa-save" style="margin-right:6px"></i>Update Food</button>
    </div>
  `);
}

async function updateFood(foodId) {
  const name = document.getElementById('efn').value.trim();
  if(!name){toast('Food name is required','error');return;}
  const btn = document.getElementById('editFoodBtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Updating...'; btn.disabled=true;
  const data={
    food_name:name,
    category:document.getElementById('efc').value||null,
    calories_per_100g:parseFloat(document.getElementById('efcal').value)||0,
    protein_per_100g:parseFloat(document.getElementById('efp').value)||0,
    carbs_per_100g:parseFloat(document.getElementById('efcar').value)||0,
    fat_per_100g:parseFloat(document.getElementById('eff').value)||0,
    serving_size:document.getElementById('efs').value||'100g'
  };
  const res = await apiCall('PUT',`/api/admin/foods/${foodId}`,data);
  btn.innerHTML='<i class="fas fa-save" style="margin-right:6px"></i>Update Food'; btn.disabled=false;
  if(res.ok){closeModal();toast('Food updated!','success');loadFoods();}
  else toast(res.data?.message||'Failed to update food','error');
}

async function deleteFood(foodId, foodName) {
  if(!confirm(`Delete "${foodName}" from the database? This action cannot be undone.`)) return;
  const res = await apiCall('DELETE',`/api/admin/foods/${foodId}`);
  if(res.ok){toast('Food deleted!','success');loadFoods();}
  else toast(res.data?.message||'Failed to delete food','error');
}

async function submitFood() {
  const name = document.getElementById('fn').value.trim();
  if(!name){toast('Food name is required','error');return;}
  const btn = document.getElementById('foodBtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding...'; btn.disabled=true;
  const data={
    food_name:name,
    category:document.getElementById('fc').value||null,
    calories_per_100g:parseFloat(document.getElementById('fcal').value)||0,
    protein_per_100g:parseFloat(document.getElementById('fp').value)||0,
    carbs_per_100g:parseFloat(document.getElementById('fcar').value)||0,
    fat_per_100g:parseFloat(document.getElementById('ff').value)||0,
    serving_size:document.getElementById('fs').value||'100g'
  };
  const res = await apiCall('POST','/api/admin/foods',data);
  btn.innerHTML='<i class="fas fa-plus" style="margin-right:6px"></i>Add Food'; btn.disabled=false;
  if(res.ok){closeModal();toast('Food added!','success');loadFoods();}
  else toast(res.data?.message||'Failed to add food','error');
}

// ── Recipes ───────────────────────────────────────────────────────────────────
async function recipes(main) {
  main.innerHTML=`<div class="page-header"><h2 class="page-title">Recipes Database</h2><p class="page-desc">Manage recipe collection for meal planning.</p></div>
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="card-title" style="margin:0"><i class="fas fa-book-open" style="color:var(--green);margin-right:8px"></i>All Recipes</h3>
        <button class="btn-sm btn-primary" onclick="showAddRecipeModal()" style="background:linear-gradient(135deg,var(--green),#4caf50)"><i class="fas fa-plus" style="margin-right:6px"></i>Add Recipe</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Recipe Name</th><th>Calories</th><th>Prep Time</th><th>Created</th><th>Actions</th></tr></thead><tbody id="recipesBody"><tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading recipes...</td></tr></tbody></table></div>
    </div>
  `;
  loadRecipes();
}

async function loadRecipes() {
  const res = await apiCall('GET','/api/admin/recipes');
  const tbody = document.getElementById('recipesBody');
  if(!res.ok){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--red)">Failed to load recipes.</td></tr>';return;}
  const recipes = res.data.data;
  if(!recipes.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)">No recipes in database.</td></tr>';return;}
  tbody.innerHTML = recipes.map(r=>`
    <tr>
      <td style="font-weight:600">${r.name}</td>
      <td>${r.calories||'—'}</td>
      <td>${r.prep_time_min||'—'} min</td>
      <td>${new Date(r.created_at).toLocaleDateString()}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-sm btn-outline" onclick="editRecipe(${r.recipe_id}, '${r.name}', ${r.calories||0}, ${r.prep_time_min||0}, '${(r.instructions||'').replace(/'/g, "\\'")}', '${r.image_url||''}', '${r.video_url||''}', '${r.thumbnail_url||''}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="deleteRecipe(${r.recipe_id}, '${r.name}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

// ── Exercises ─────────────────────────────────────────────────────────────────
async function exercises(main) {
  main.innerHTML=`<div class="page-header"><h2 class="page-title">Exercises Database</h2><p class="page-desc">Manage exercise library for workout planning.</p></div>
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="card-title" style="margin:0"><i class="fas fa-dumbbell" style="color:var(--purple);margin-right:8px"></i>All Exercises</h3>
        <button class="btn-sm btn-primary" onclick="showAddExerciseModal()" style="background:linear-gradient(135deg,var(--purple),#9b59b6)"><i class="fas fa-plus" style="margin-right:6px"></i>Add Exercise</button>
      </div>
      <div class="table-wrap"><table><thead><tr><th>Exercise Name</th><th>Category</th><th>YouTube</th><th>Created</th><th>Actions</th></tr></thead><tbody id="exercisesBody"><tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading exercises...</td></tr></tbody></table></div>
    </div>
  `;
  loadExercises();
}

async function loadExercises() {
  const res = await apiCall('GET','/api/admin/exercises');
  const tbody = document.getElementById('exercisesBody');
  if(!res.ok){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--red)">Failed to load exercises.</td></tr>';return;}
  const exercises = res.data.data;
  if(!exercises.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--sub)">No exercises in database.</td></tr>';return;}
  tbody.innerHTML = exercises.map(e=>`
    <tr>
      <td style="font-weight:600">${e.name}</td>
      <td>${e.category||'—'}</td>
      <td>${e.youtube_url ? '<i class="fab fa-youtube" style="color:#ff0000"></i>' : '—'}</td>
      <td>${new Date(e.created_at).toLocaleDateString()}</td>
      <td style="display:flex;gap:6px">
        <button class="btn-sm btn-outline" onclick="editExercise(${e.exercise_id}, '${e.name}', '${e.category||''}', '${e.youtube_url||''}', '${(e.instructions||'').replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="deleteExercise(${e.exercise_id}, '${e.name}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');
}

// Modal functions for Recipes
function showAddRecipeModal() {
  openModal(`
    <h3 class="modal-title"><i class="fas fa-plus-circle" style="color:var(--green);margin-right:8px"></i>Add New Recipe</h3>
    <div class="form-group"><label>Recipe Name *</label><div class="input-wrap"><i class="fas fa-utensils"></i><input type="text" id="rn" placeholder="e.g. Chicken Stir Fry"></div></div>
    <div class="form-row-2">
      <div class="form-group"><label>Calories</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="rcal" placeholder="450"></div></div>
      <div class="form-group"><label>Prep Time (min)</label><div class="input-wrap"><i class="fas fa-clock"></i><input type="number" id="rtime" placeholder="30"></div></div>
    </div>
    <div class="form-group"><label>Instructions</label><textarea id="rinst" rows="4" placeholder="Step-by-step cooking instructions..." style="width:100%;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:inherit;outline:none;resize:vertical"></textarea></div>
    <div class="form-group"><label>Image URL</label><div class="input-wrap"><i class="fas fa-image"></i><input type="url" id="rimg" placeholder="https://..."></div></div>
    <div class="form-row-2">
      <div class="form-group"><label>Video URL (MP4)</label><div class="input-wrap"><i class="fas fa-video"></i><input type="url" id="rvid" placeholder="https://...mp4"></div></div>
      <div class="form-group"><label>Thumbnail URL</label><div class="input-wrap"><i class="fas fa-image"></i><input type="url" id="rthumb" placeholder="https://..."></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="submitRecipe()" id="recipeBtn"><i class="fas fa-plus" style="margin-right:6px"></i>Add Recipe</button>
    </div>
  `);
}

function editRecipe(id, name, calories, time, instructions, image, video, thumbnail) {
  openModal(`
    <h3 class="modal-title"><i class="fas fa-edit" style="color:var(--teal);margin-right:8px"></i>Edit Recipe</h3>
    <div class="form-group"><label>Recipe Name *</label><div class="input-wrap"><i class="fas fa-utensils"></i><input type="text" id="ern" value="${name}"></div></div>
    <div class="form-row-2">
      <div class="form-group"><label>Calories</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="ercal" value="${calories}"></div></div>
      <div class="form-group"><label>Prep Time (min)</label><div class="input-wrap"><i class="fas fa-clock"></i><input type="number" id="ertime" value="${time}"></div></div>
    </div>
    <div class="form-group"><label>Instructions</label><textarea id="erinst" rows="4" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:inherit;outline:none;resize:vertical">${instructions}</textarea></div>
    <div class="form-group"><label>Image URL</label><div class="input-wrap"><i class="fas fa-image"></i><input type="url" id="erimg" value="${image}"></div></div>
    <div class="form-row-2">
      <div class="form-group"><label>Video URL (MP4)</label><div class="input-wrap"><i class="fas fa-video"></i><input type="url" id="ervid" value="${video}"></div></div>
      <div class="form-group"><label>Thumbnail URL</label><div class="input-wrap"><i class="fas fa-image"></i><input type="url" id="erthumb" value="${thumbnail}"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="updateRecipe(${id})" id="editRecipeBtn"><i class="fas fa-save" style="margin-right:6px"></i>Update Recipe</button>
    </div>
  `);
}

async function submitRecipe() {
  const name = document.getElementById('rn').value.trim();
  if(!name){toast('Recipe name is required','error');return;}
  const btn = document.getElementById('recipeBtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding...'; btn.disabled=true;
  const data={
    name,
    calories:parseInt(document.getElementById('rcal').value)||null,
    prep_time_min:parseInt(document.getElementById('rtime').value)||null,
    instructions:document.getElementById('rinst').value||null,
    image_url:document.getElementById('rimg').value||null,
    video_url:document.getElementById('rvid').value||null,
    thumbnail_url:document.getElementById('rthumb').value||null
  };
  const res = await apiCall('POST','/api/admin/recipes',data);
  btn.innerHTML='<i class="fas fa-plus" style="margin-right:6px"></i>Add Recipe'; btn.disabled=false;
  if(res.ok){closeModal();toast('Recipe added!','success');loadRecipes();}
  else toast(res.data?.message||'Failed to add recipe','error');
}

async function updateRecipe(recipeId) {
  const name = document.getElementById('ern').value.trim();
  if(!name){toast('Recipe name is required','error');return;}
  const btn = document.getElementById('editRecipeBtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Updating...'; btn.disabled=true;
  const data={
    name,
    calories:parseInt(document.getElementById('ercal').value)||null,
    prep_time_min:parseInt(document.getElementById('ertime').value)||null,
    instructions:document.getElementById('erinst').value||null,
    image_url:document.getElementById('erimg').value||null,
    video_url:document.getElementById('ervid').value||null,
    thumbnail_url:document.getElementById('erthumb').value||null
  };
  const res = await apiCall('PUT',`/api/admin/recipes/${recipeId}`,data);
  btn.innerHTML='<i class="fas fa-save" style="margin-right:6px"></i>Update Recipe'; btn.disabled=false;
  if(res.ok){closeModal();toast('Recipe updated!','success');loadRecipes();}
  else toast(res.data?.message||'Failed to update recipe','error');
}

async function deleteRecipe(recipeId, recipeName) {
  if(!confirm(`Delete "${recipeName}" from the database? This action cannot be undone.`)) return;
  const res = await apiCall('DELETE',`/api/admin/recipes/${recipeId}`);
  if(res.ok){toast('Recipe deleted!','success');loadRecipes();}
  else toast(res.data?.message||'Failed to delete recipe','error');
}

// Modal functions for Exercises
function showAddExerciseModal() {
  openModal(`
    <h3 class="modal-title"><i class="fas fa-plus-circle" style="color:var(--purple);margin-right:8px"></i>Add New Exercise</h3>
    <div class="form-group"><label>Exercise Name *</label><div class="input-wrap"><i class="fas fa-dumbbell"></i><input type="text" id="en" placeholder="e.g. Push-ups"></div></div>
    <div class="form-group"><label>Category</label><div class="input-wrap"><i class="fas fa-tag"></i><input type="text" id="ecat" placeholder="e.g. Strength"></div></div>
    <div class="form-group"><label>YouTube URL</label><div class="input-wrap"><i class="fab fa-youtube"></i><input type="url" id="eyt" placeholder="https://www.youtube.com/watch?v=..."></div></div>
    <div class="form-group"><label>Instructions</label><textarea id="einst" rows="4" placeholder="Exercise instructions..." style="width:100%;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:inherit;outline:none;resize:vertical"></textarea></div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="submitExercise()" id="exerciseBtn"><i class="fas fa-plus" style="margin-right:6px"></i>Add Exercise</button>
    </div>
  `);
}

function editExercise(id, name, category, youtube, instructions) {
  openModal(`
    <h3 class="modal-title"><i class="fas fa-edit" style="color:var(--teal);margin-right:8px"></i>Edit Exercise</h3>
    <div class="form-group"><label>Exercise Name *</label><div class="input-wrap"><i class="fas fa-dumbbell"></i><input type="text" id="een" value="${name}"></div></div>
    <div class="form-group"><label>Category</label><div class="input-wrap"><i class="fas fa-tag"></i><input type="text" id="eecat" value="${category}"></div></div>
    <div class="form-group"><label>YouTube URL</label><div class="input-wrap"><i class="fab fa-youtube"></i><input type="url" id="eeyt" value="${youtube}"></div></div>
    <div class="form-group"><label>Instructions</label><textarea id="eeinst" rows="4" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:inherit;outline:none;resize:vertical">${instructions}</textarea></div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline close-modal" onclick="closeModal(event)">Cancel</button>
      <button class="btn-sm btn-teal" onclick="updateExercise(${id})" id="editExerciseBtn"><i class="fas fa-save" style="margin-right:6px"></i>Update Exercise</button>
    </div>
  `);
}

async function submitExercise() {
  const name = document.getElementById('en').value.trim();
  if(!name){toast('Exercise name is required','error');return;}
  const btn = document.getElementById('exerciseBtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding...'; btn.disabled=true;
  const data={
    name,
    category:document.getElementById('ecat').value||null,
    youtube_url:document.getElementById('eyt').value||null,
    instructions:document.getElementById('einst').value||null
  };
  const res = await apiCall('POST','/api/admin/exercises',data);
  btn.innerHTML='<i class="fas fa-plus" style="margin-right:6px"></i>Add Exercise'; btn.disabled=false;
  if(res.ok){closeModal();toast('Exercise added!','success');loadExercises();}
  else toast(res.data?.message||'Failed to add exercise','error');
}

async function updateExercise(exerciseId) {
  const name = document.getElementById('een').value.trim();
  if(!name){toast('Exercise name is required','error');return;}
  const btn = document.getElementById('editExerciseBtn');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Updating...'; btn.disabled=true;
  const data={
    name,
    category:document.getElementById('eecat').value||null,
    youtube_url:document.getElementById('eeyt').value||null,
    instructions:document.getElementById('eeinst').value||null
  };
  const res = await apiCall('PUT',`/api/admin/exercises/${exerciseId}`,data);
  btn.innerHTML='<i class="fas fa-save" style="margin-right:6px"></i>Update Exercise'; btn.disabled=false;
  if(res.ok){closeModal();toast('Exercise updated!','success');loadExercises();}
  else toast(res.data?.message||'Failed to update exercise','error');
}

async function deleteExercise(exerciseId, exerciseName) {
  if(!confirm(`Delete "${exerciseName}" from the database? This action cannot be undone.`)) return;
  const res = await apiCall('DELETE',`/api/admin/exercises/${exerciseId}`);
  if(res.ok){toast('Exercise deleted!','success');loadExercises();}
  else toast(res.data?.message||'Failed to delete exercise','error');
}

// ── Subscription Requests ─────────────────────────────────────────────────────
async function subscriptionRequests(main) {
  main.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Subscription Requests</h2>
      <p class="page-desc">Review and action user plan upgrade requests.</p>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>User</th><th>Current Plan</th><th>Requested</th><th>Doctor</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="subReqBody"><tr><td colspan="7" style="text-align:center;padding:20px"><div class="spinner" style="display:inline-block;margin-right:8px"></div>Loading...</td></tr></tbody>
        </table>
      </div>
    </div>`;
  loadSubRequests();
}

async function loadSubRequests() {
  const res = await apiCall('GET', '/api/subscriptions/all');
  const tbody = document.getElementById('subReqBody');
  if (!tbody) return;
  if (!res.ok) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red)">Failed to load requests.</td></tr>'; return; }
  const items = res.data.data || [];
  if (!items.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--sub)">No subscription requests yet.</td></tr>'; return; }

  const tierBadge = t => ({pro:`<span class="badge" style="background:rgba(26,122,212,0.2);color:#1A7AD4">AI Pro</span>`,doctor:`<span class="badge" style="background:rgba(155,89,182,0.2);color:var(--purple)">Doctor</span>`}[t]||`<span class="badge" style="background:rgba(139,163,180,0.15);color:var(--sub)">Free</span>`);
  const statusBadge = s => ({pending:`<span class="badge" style="background:rgba(245,158,11,0.2);color:var(--orange)">⏳ Pending</span>`,approved:`<span class="badge" style="background:rgba(76,175,80,0.2);color:#4CAF50">✅ Approved</span>`,rejected:`<span class="badge" style="background:rgba(239,68,68,0.2);color:#EF4444">❌ Rejected</span>`}[s]||'');

  tbody.innerHTML = items.map(r => `<tr>
    <td><div style="font-weight:600">${r.first_name||''} ${r.last_name||''}</div><div style="font-size:11px;color:var(--sub)">@${r.user_username}</div></td>
    <td>${tierBadge(r.current_tier)}</td>
    <td>${tierBadge(r.requested_tier)}</td>
    <td style="font-size:12px;color:var(--sub)">${r.doctor_username ? '@'+r.doctor_username : '—'}</td>
    <td style="font-size:12px;color:var(--sub)">${new Date(r.created_at).toLocaleDateString()}</td>
    <td>${statusBadge(r.status)}</td>
    <td style="display:flex;gap:6px">
      ${r.status === 'pending' ? `
        <button class="btn-sm btn-teal" onclick="approveSubRequest(${r.id})"><i class="fas fa-check"></i> Approve</button>
        <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="rejectSubRequest(${r.id})"><i class="fas fa-times"></i> Reject</button>
      ` : '<span style="font-size:12px;color:var(--sub)">Reviewed</span>'}
    </td>
  </tr>`).join('');
}

async function approveSubRequest(id) {
  if (!confirm('Approve this subscription request? The plan will be activated immediately.')) return;
  const res = await apiCall('POST', `/api/subscriptions/${id}/review`, { action: 'approve' });
  if (res.ok) { toast('Request approved! User has been notified.', 'success'); loadSubRequests(); }
  else toast(res.data?.message || 'Failed to approve', 'error');
}

function rejectSubRequest(id) {
  openModal(`
    <h3 class="modal-title" style="color:var(--red)"><i class="fas fa-times-circle" style="margin-right:8px"></i>Reject Request</h3>
    <p style="font-size:13px;color:var(--sub);margin-bottom:16px">Optionally provide a reason that will be shown to the user.</p>
    <div class="form-group">
      <label>Rejection Reason (optional)</label>
      <div class="input-wrap"><i class="fas fa-comment"></i><input type="text" id="rejectNote" placeholder="e.g. Please complete your profile first..." style="padding-left:38px"></div>
    </div>
    <div class="modal-actions">
      <button class="btn-sm btn-outline" onclick="closeModalDirect()">Cancel</button>
      <button class="btn-sm" style="background:var(--red);color:#fff" onclick="confirmRejectSub(${id})"><i class="fas fa-times" style="margin-right:6px"></i>Reject Request</button>
    </div>
  `);
}

async function confirmRejectSub(id) {
  const note = document.getElementById('rejectNote')?.value || '';
  const res = await apiCall('POST', `/api/subscriptions/${id}/review`, { action: 'reject', admin_note: note });
  if (res.ok) { toast('Request rejected. User has been notified.', 'success'); closeModalDirect(); loadSubRequests(); }
  else toast(res.data?.message || 'Failed to reject', 'error');
}

// ── Boot ──────────────────────────────────────────────────────────────────────

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  if(getAdminToken()){
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('portalShell').classList.remove('hidden');
    initAdmin();
  }
});
