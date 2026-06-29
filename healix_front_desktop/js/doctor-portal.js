// ── Doctor Portal JS ──────────────────────────────────────────────────────────
const DOC_TOKEN_KEY = 'healix_doc_token';
const DOC_USER_KEY  = 'healix_doc_user';

function getDocToken() { return localStorage.getItem(DOC_TOKEN_KEY); }
function setDocToken(t) { localStorage.setItem(DOC_TOKEN_KEY, t); }
function clearDocToken() { localStorage.removeItem(DOC_TOKEN_KEY); localStorage.removeItem(DOC_USER_KEY); }
function getDocUser() { try { return JSON.parse(localStorage.getItem(DOC_USER_KEY)||'null'); } catch { return null; } }
function setDocUser(u) { localStorage.setItem(DOC_USER_KEY, JSON.stringify(u)); }

// Override apiCall token for doctor portal
const _origGetToken = window.getToken;
// Patch token retrieval: use doctor token if on this page
window.getToken = function() { return getDocToken() || (_origGetToken ? _origGetToken() : null); };

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (inp.type==='password'){inp.type='text';icon.className='fas fa-eye-slash';}
  else{inp.type='password';icon.className='fas fa-eye';}
}
function toast(msg, type='info') {
  const c = document.getElementById('toast'); if(!c) return;
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`; el.textContent = msg;
  c.appendChild(el); setTimeout(()=>el.remove(), 3500);
}
function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal(e) {
  if(e && e.target!==document.getElementById('modalOverlay') && !e.target.closest('.close-modal')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalContent').innerHTML='';
  const modalBox = document.getElementById('modalBox');
  if (modalBox) {
    modalBox.style.maxWidth = '';
    modalBox.style.width = '';
    modalBox.style.padding = '';
    modalBox.style.maxHeight = '';
    modalBox.style.overflowY = '';
  }
}

// ── Chat & Notifications ────────────────────────────────────────────────────────
let socket = null;
function initDocSocket() {
  if (socket) return;
  try {
    const serverUrl = BASE;
    socket = io(serverUrl, { reconnection: true, reconnectionAttempts: Infinity });
    window.socket = socket;
    socket.on('connect', () => {
      console.log('Doc socket connected:', socket.id);
      socket.emit('join_notifications', docCurrentUser.doctor_username);
      if (window._pendingDocChatRoom) {
        socket.emit('join_chat', window._pendingDocChatRoom);
      }
    });
    socket.on('receive_notification', (notif) => {
      toast(notif.message, 'info');
      fetchDocNotifs();
    });
    socket.on('disconnect', () => { console.log('Doc socket disconnected, reconnecting...'); });
  } catch(e) { console.warn('Socket.IO unavailable:', e.message); }
}

function joinDocChatRoom(myUsername, partnerUsername, onMessage) {
  if (!window.socket) return;
  const roomPayload = { myUsername, partnerUsername };
  window._pendingDocChatRoom = roomPayload; // keep for reconnects
  window.socket.off('receive_message');
  window.socket.on('receive_message', onMessage);
  if (window.socket.connected) {
    window.socket.emit('join_chat', roomPayload);
  }
  // If not yet connected, 'connect' handler fires join_chat automatically
}

async function fetchDocNotifs() {
  const res = await apiCall('GET', '/api/messaging/notifications');
  if (res.ok) {
    const list = res.data.data;
    const dot = document.querySelector('.notif-dot');
    
    const unread = list.filter(n => !n.is_read).length;
    if (unread > 0) {
      dot.style.display = 'flex';
      dot.innerHTML = '';
    } else {
      dot.style.display = 'none';
    }
    window._docNotifs = list;
  }
}

function openNotifications() {
  const list = window._docNotifs || [];
  openModal(`
    <div style="padding:20px;max-width:500px;min-width:320px;max-height:80vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div><h3 style="margin:0">Notifications</h3></div>
        <div style="display:flex;gap:12px">
          <button onclick="markDocNotifsRead()" style="background:none;border:none;color:var(--red);font-size:12px;cursor:pointer">Clear all</button>
          <button onclick="closeModal(event)" style="background:none;border:none;color:var(--sub);font-size:20px;cursor:pointer">&times;</button>
        </div>
      </div>
      ${list.length ? list.map(n => `
        <div style="padding:12px 14px;border-radius:10px;background:${n.is_read ? 'var(--card2)' : 'rgba(26,122,212,0.1)'};margin-bottom:10px;">
          <div style="font-size:13px;color:var(--text)">${n.message}</div>
          <div style="font-size:11px;color:var(--sub);margin-top:4px">${new Date(n.created_at).toLocaleString()}</div>
        </div>
      `).join('') : `<div style="padding:24px;text-align:center;color:var(--sub)">No new notifications.</div>`}
    </div>
  `);
}

async function markDocNotifsRead() {
  await apiCall('POST', '/api/messaging/notifications/read');
  document.querySelector('.notif-dot').style.display = 'none';
  fetchDocNotifs();
  closeModal();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function docLogin() {
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginErr');
  const loginId = document.getElementById('loginId').value.trim();
  const password = document.getElementById('loginPw').value;
  err.classList.add('hidden');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...'; btn.disabled = true;
  const res = await apiCall('POST', '/api/auth/login', { loginId, password, role: 'doctor' });
  btn.innerHTML = '<i class="fas fa-sign-in-alt" style="margin-right:6px"></i>Sign In'; btn.disabled = false;
  if (!res.ok) { err.textContent = res.data?.message || 'Invalid credentials'; err.classList.remove('hidden'); return; }
  setDocToken(res.data.data.token);
  // Fetch profile
  const me = await apiCall('GET', '/api/auth/me');
  if (me.ok) setDocUser(me.data.data);
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('portalShell').classList.remove('hidden');
  initPortal();
}

function docLogout() { clearDocToken(); window.location.reload(); }

// ── Init ──────────────────────────────────────────────────────────────────────
let docCurrentUser = null;
let linkedPatients = [];
let currentChatPatient = null;

async function initPortal() {
  docCurrentUser = getDocUser();
  initDocSocket();
  fetchDocNotifs();
  document.querySelectorAll('.portal-nav-item').forEach(el => {
    el.addEventListener('click', () => showDocPage(el.dataset.page));
  });
  document.querySelector('.notif-btn')?.addEventListener('click', openNotifications);
  showDocPage('dashboard');
}

function showDocPage(page) {
  document.querySelectorAll('.portal-nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`.portal-nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  const main = document.getElementById('portalMain');
  const pages = { dashboard, requests, patients, 'meal-plan': mealPlan, 'ex-plan': exPlan, profile };
  if (pages[page]) pages[page](main);
}

// ── Pages ─────────────────────────────────────────────────────────────────────
async function dashboard(main) {
  const doc = docCurrentUser || {};
  main.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Welcome, Dr. ${doc.first_name||'Doctor'} ${doc.last_name||''}!</h2>
      <p class="page-desc">Manage your patients and create personalized plans.</p>
    </div>
    <div class="grid-3" style="margin-bottom:24px">
      <div class="stat-card" id="sc-patients"><div class="stat-icon" style="background:rgba(77,195,232,0.15);color:var(--teal)"><i class="fas fa-users"></i></div><div class="stat-val" id="sv-patients">--</div><div class="stat-label">Linked Patients</div></div>
      <div class="stat-card" id="sc-req"><div class="stat-icon" style="background:rgba(245,158,11,0.15);color:var(--orange)"><i class="fas fa-user-plus"></i></div><div class="stat-val" id="sv-req">--</div><div class="stat-label">Pending Requests</div></div>
      <div class="stat-card" id="sc-cert"><div class="stat-icon" style="background:rgba(155,89,182,0.15);color:var(--purple)"><i class="fas fa-certificate"></i></div><div class="stat-val" style="font-size:14px">${doc.certification||'—'}</div><div class="stat-label">Certification</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">Quick Actions</h3></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <button class="btn-sm btn-teal" onclick="showDocPage('requests')"><i class="fas fa-user-plus" style="margin-right:6px"></i>View Requests</button>
        <button class="btn-sm btn-outline" onclick="showDocPage('patients')"><i class="fas fa-users" style="margin-right:6px"></i>View Patients</button>
      </div>
    </div>
  `;
  const res = await apiCall('GET', '/api/doctors/users?search=');
  if (res.ok) {
    linkedPatients = res.data.data || [];
    document.getElementById('sv-patients').textContent = linkedPatients.length;
  }
  const reqRes = await apiCall('GET', '/api/doctors/requests');
  if (reqRes.ok) {
    document.getElementById('sv-req').textContent = reqRes.data.data.length;
  }
}

async function requests(main) {
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Patient Requests</h2><p class="page-desc">Review and accept/reject incoming patient requests.</p></div>
    <div id="reqList">
      <div style="text-align:center;padding:40px"><div class="spinner"></div></div>
    </div>
  `;
  
  const res = await apiCall('GET', '/api/doctors/requests');
  const box = document.getElementById('reqList');
  if (!res.ok) { box.innerHTML = '<div class="alert alert-error">Failed to load requests.</div>'; return; }
  
  const reqs = res.data.data;
  if (reqs.length === 0) {
    box.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--sub)"><i class="fas fa-inbox" style="font-size:36px;margin-bottom:12px;display:block;opacity:0.4"></i>No pending requests.</div>';
    return;
  }

  box.innerHTML = reqs.map(r => `
    <div class="patient-row" style="cursor:default">
      <div style="position:relative;width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--orange),#d68910);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;color:#fff">
        ${(r.first_name?.[0]||r.user_username[0]).toUpperCase()}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:15px;margin-bottom:2px">${r.first_name||''} ${r.last_name||''}</div>
        <div style="font-size:13px;color:var(--sub)">@${r.user_username} • ${r.email}</div>
        <div style="font-size:11px;color:var(--sub);margin-top:4px">Requested on ${new Date(r.created_at).toLocaleDateString()}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-sm btn-outline" style="border-color:var(--red);color:var(--red)" onclick="respondRequest('${r.user_username}', 'rejected')"><i class="fas fa-times"></i> Reject</button>
        <button class="btn-sm btn-primary" style="background:var(--teal)" onclick="respondRequest('${r.user_username}', 'accepted')"><i class="fas fa-check"></i> Accept</button>
      </div>
    </div>
  `).join('');
}

async function respondRequest(username, status) {
  if (!confirm(`Are you sure you want to ${status} this request?`)) return;
  const res = await apiCall('POST', '/api/doctors/respond-request', { user_username: username, status });
  if (res.ok) {
    toast(`Request ${status}`, 'success');
    showDocPage('requests');
  } else {
    toast('Failed to respond', 'error');
  }
}

async function patients(main) {
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">My Patients</h2><p class="page-desc">Chat and manage your linked patients.</p></div>
    <div style="display:flex; gap:24px; height:calc(100vh - 180px); overflow:hidden;">
      <div style="width:360px; display:flex; flex-direction:column;">
        <div class="card" style="margin-bottom:16px;padding:14px 20px; flex-shrink:0">
          <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:0 12px;height:38px">
            <i class="fas fa-search" style="color:var(--sub);font-size:13px"></i>
            <input id="patSearch" type="text" placeholder="Search patients..." style="background:none;border:none;outline:none;color:var(--text);font-size:13px;flex:1;font-family:inherit" oninput="renderPatients()">
          </div>
        </div>
        <div id="patList" style="flex:1; overflow-y:auto; padding-right:8px;"></div>
      </div>
      <div id="patProfilePane" class="card" style="flex:1; display:none; flex-direction:column; overflow:hidden; padding:0;">
      </div>
    </div>
  `;
  const res = await apiCall('GET', '/api/doctors/users?search=');
  linkedPatients = res.ok ? (res.data.data||[]) : [];
  renderPatients();
}

function renderPatients() {
  const box = document.getElementById('patList'); if (!box) return;
  const q = (document.getElementById('patSearch')?.value||'').toLowerCase();
  let items = linkedPatients;
  if (q) items = items.filter(p => (p.user_username+' '+(p.first_name||'')+' '+(p.last_name||'')).toLowerCase().includes(q));
  if (!items.length) { box.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--sub)"><i class="fas fa-user-slash" style="font-size:36px;margin-bottom:12px;display:block;opacity:0.4"></i>No patients linked yet.</div>'; return; }
  
  box.innerHTML = items.map((p) => `
    <div class="patient-row" onclick="openPatientProfile('${p.user_username}')">
      <div style="position:relative;width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--navy-light));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;color:#fff">
        ${(p.first_name?.[0]||p.user_username[0]).toUpperCase()}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:15px;margin-bottom:2px">${p.first_name||''} ${p.last_name||''}</div>
        <div style="font-size:13px;color:var(--sub)">@${p.user_username}</div>
      </div>
      <div style="font-size:12px;color:var(--sub)">${new Date().toLocaleDateString()}</div>
    </div>
  `).join('');
}

async function openPatientProfile(username) {
  window._currentProfilePatient = username;
  const pane = document.getElementById('patProfilePane');
  if (!pane) return; // if we are not on the patients page
  
  pane.style.display = 'flex';
  pane.innerHTML = '<div style="text-align:center;padding:40px;margin:auto;"><div class="spinner" style="margin:0 auto 12px"></div>Loading patient profile...</div>';
  
  const res = await apiCall('GET', `/api/doctors/users/${username}/case`);
  if (!res.ok) { pane.innerHTML = '<div class="alert alert-error" style="margin:20px;">Failed to load patient profile.</div>'; return; }
  
  const { user, requirements: req, medical_history, medical_records, plans, exercise_plans } = res.data.data;
  const bmi = req && req.weight_kg && req.height_cm ? (req.weight_kg/((req.height_cm/100)**2)).toFixed(1) : '--';
  const initials = (user.first_name?.[0] || user.user_username[0]).toUpperCase();
  const SERVER = `${window.location.protocol}//${window.location.hostname}:5000`;

  pane.innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden">

      <!-- Profile Header -->
      <div style="display:flex;align-items:center;gap:16px;padding:20px 24px;background:linear-gradient(135deg,rgba(26,122,212,0.15),rgba(77,195,232,0.08));border-bottom:1px solid var(--border)">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--navy-light));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;color:#fff;flex-shrink:0">${initials}</div>
        <div style="flex:1">
          <div style="font-size:18px;font-weight:700;color:var(--text)">${user.first_name||''} ${user.last_name||''}</div>
          <div style="font-size:13px;color:var(--sub)">@${user.user_username} · ${user.email||''}</div>
          <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
            <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(77,195,232,0.15);color:var(--teal);font-weight:600">${user.subscription_tier||'default'}</span>
            ${user.conditions?.map(c => `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(239,68,68,0.15);color:#EF4444;font-weight:600">${c.name}</span>`).join('')||''}
          </div>
        </div>
        <button onclick="document.getElementById('patProfilePane').style.display='none'" style="background:none;border:none;color:var(--sub);font-size:20px;cursor:pointer;padding:4px">&times;</button>
      </div>

      <!-- Tabs -->
      <div style="display:flex;border-bottom:1px solid var(--border);flex-shrink:0;overflow-x:auto">
        ${['profile','macros','medical','meal-plans','exercise','logs'].map((t,i) => `
          <button onclick="patTab('${t}','${username}')" id="ptab-${t}"
            style="padding:12px 18px;background:none;border:none;border-bottom:2px solid ${i===0?'var(--teal)':'transparent'};color:${i===0?'var(--teal)':'var(--sub)'};cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap;transition:all 0.2s">
            ${['👤 Profile','⚡ Macros','🩺 Medical','🍽️ Meal Plans','💪 Exercise','📊 Logs'][i]}
          </button>`).join('')}
      </div>

      <!-- Tab Content -->
      <div style="flex:1;overflow-y:auto;padding:20px 24px;min-height:0">

        <!-- Profile Tab -->
        <div id="ptab-profile-content">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${[['Gender',user.gender||'--'],['DOB',user.dob?user.dob.split('T')[0]:'--'],['Phone',user.phone_no||'--'],['Address',user.address||'--'],['Job',user.job||'--'],['Weight',req?.weight_kg?(req.weight_kg+' kg'):'--'],['Height',req?.height_cm?(req.height_cm+' cm'):'--'],['BMI',bmi],['Goal',req?.goal||'--'],['Activity',req?.activity_rate||'--']].map(([l,v]) => `
              <div style="background:var(--card2);border-radius:10px;padding:12px">
                <div style="font-size:11px;color:var(--sub);margin-bottom:4px;text-transform:uppercase;font-weight:600">${l}</div>
                <div style="font-size:14px;font-weight:600;color:var(--text)">${v}</div>
              </div>`).join('')}
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
            <button class="btn-sm btn-primary" onclick="openChat('${username}')"><i class="fas fa-comment"></i> Chat</button>
            <button class="btn-sm btn-outline" onclick="manageFoodPlan('${username}')"><i class="fas fa-utensils"></i> New Meal Plan</button>
            <button class="btn-sm btn-outline" onclick="manageExercisePlan('${username}')"><i class="fas fa-dumbbell"></i> New Exercise Plan</button>
          </div>
        </div>

        <!-- Macros Tab (hidden) -->
        <div id="ptab-macros-content" style="display:none">
          <p style="font-size:13px;color:var(--sub);margin-bottom:16px">Edit this patient's daily nutrition targets, sleep goal, and water intake without changing their meal plan.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group" style="margin:0"><label>Calories (kcal)</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="pt-cal" value="${req?.target_calories||''}" placeholder="e.g. 2000"></div></div>
            <div class="form-group" style="margin:0"><label>Protein (g)</label><div class="input-wrap"><i class="fas fa-drumstick-bite"></i><input type="number" id="pt-pro" value="${req?.target_protein_g||''}" placeholder="e.g. 150"></div></div>
            <div class="form-group" style="margin:0"><label>Carbs (g)</label><div class="input-wrap"><i class="fas fa-wheat-awn"></i><input type="number" id="pt-carb" value="${req?.target_carbs_g||''}" placeholder="e.g. 200"></div></div>
            <div class="form-group" style="margin:0"><label>Fat (g)</label><div class="input-wrap"><i class="fas fa-cheese"></i><input type="number" id="pt-fat" value="${req?.target_fat_g||''}" placeholder="e.g. 60"></div></div>
            <div class="form-group" style="margin:0"><label>Sleep Goal (hours)</label><div class="input-wrap"><i class="fas fa-moon"></i><input type="number" id="pt-sleep" value="${req?.sleep_hours_target||8}" placeholder="e.g. 8" step="0.5"></div></div>
            <div class="form-group" style="margin:0"><label>Water Goal (cups)</label><div class="input-wrap"><i class="fas fa-droplet"></i><input type="number" id="pt-water" value="${req?.water_cups_target||8}" placeholder="e.g. 8"></div></div>
          </div>
          <button onclick="savePatientTargets('${username}')" class="btn-primary" id="pt-save-btn" style="margin-top:18px">
            <i class="fas fa-save"></i> Save Targets &amp; Notify Patient
          </button>
        </div>

        <!-- Medical Tab (hidden) -->
        <div id="ptab-medical-content" style="display:none">
          ${medical_history?.length ? `
            <div style="margin-bottom:16px">
              <div style="font-size:12px;font-weight:700;color:var(--sub);text-transform:uppercase;margin-bottom:8px">Doctor-Diagnosed Conditions</div>
              ${medical_history.map(h => `
                <div style="background:var(--card2);border:1px solid var(--border);border-left:3px solid #EF4444;border-radius:8px;padding:12px;margin-bottom:8px">
                  <div style="font-weight:600">${h.condition_name} <span style="font-size:11px;color:var(--sub);margin-left:6px">Severity: ${h.severity||'—'}</span></div>
                  ${h.notes ? `<div style="font-size:12px;color:var(--sub);margin-top:4px">${h.notes}</div>` : ''}
                </div>`).join('')}
            </div>` : ''}
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--sub);text-transform:uppercase;margin-bottom:8px">Patient-Uploaded Medical Records</div>
            ${medical_records?.length ? medical_records.map(r => {
              const fileUrl = r.file_path ? `${SERVER}/${r.file_path.replace(/\\/g,'/')}` : null;
              return `
                <div style="background:var(--card2);border:1px solid var(--border);border-left:3px solid #F59E0B;border-radius:8px;padding:12px;margin-bottom:10px">
                  <div style="font-weight:600">${r.condition_name}
                    <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:rgba(245,158,11,0.15);color:#F59E0B;margin-left:6px">${r.condition_type||'other'}</span>
                  </div>
                  ${r.extra_info ? `<div style="font-size:12px;color:var(--sub);margin:6px 0">${r.extra_info}</div>` : ''}
                  ${fileUrl ? (r.file_type === 'image'
                    ? `<img src="${fileUrl}" alt="Medical record" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:8px;object-fit:contain">`
                    : `<a href="${fileUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(239,68,68,0.1);color:#EF4444;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;margin-top:8px"><i class="fas fa-file-pdf"></i> View PDF: ${r.file_name}</a>`)
                    : ''}
                </div>`;
            }).join('') : '<div style="color:var(--sub);font-size:13px;padding:16px;text-align:center">No uploaded medical records.</div>'}
          </div>
        </div>

        <!-- Meal Plans Tab (hidden) -->
        <div id="ptab-meal-plans-content" style="display:none">
          ${plans?.length ? plans.map(p => `
            <div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div><div style="font-weight:600">${p.goal_type||'Custom Meal Plan'}</div><div style="font-size:12px;color:var(--sub)">Plan #${p.plan_id} · ${p.start_date||'No date'}</div></div>
                <div style="display:flex;gap:8px">
                  <button class="btn-sm btn-outline" onclick="viewFoodPlan(${p.plan_id})">View</button>
                  <button class="btn-sm btn-outline" style="color:var(--teal);border-color:var(--teal)" onclick="editFoodPlan(${p.plan_id})"><i class="fas fa-edit"></i> Edit</button>
                  <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="deletePlan(${p.plan_id}, 'meal')"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            </div>`).join('') : '<div style="color:var(--sub);font-size:13px;padding:24px;text-align:center">No meal plans assigned yet.</div>'}
          <button class="btn-sm btn-outline" onclick="manageFoodPlan('${username}')" style="margin-top:8px"><i class="fas fa-plus"></i> New Meal Plan</button>
        </div>

        <!-- Exercise Tab (hidden) -->
        <div id="ptab-exercise-content" style="display:none">
          ${exercise_plans?.length ? exercise_plans.map(p => `
            <div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div><div style="font-weight:600">${p.goal_type||'Workout Plan'}</div><div style="font-size:12px;color:var(--sub)">Plan #${p.plan_id}</div></div>
                <div style="display:flex;gap:8px">
                  <button class="btn-sm btn-outline" onclick="viewExercisePlan(${p.plan_id})">View</button>
                  <button class="btn-sm btn-outline" style="color:var(--teal);border-color:var(--teal)" onclick="editExercisePlan(${p.plan_id})"><i class="fas fa-edit"></i> Edit</button>
                  <button class="btn-sm btn-outline" style="color:var(--red);border-color:var(--red)" onclick="deletePlan(${p.plan_id}, 'exercise')"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            </div>`).join('') : '<div style="color:var(--sub);font-size:13px;padding:24px;text-align:center">No exercise plans assigned yet.</div>'}
          <button class="btn-sm btn-outline" onclick="manageExercisePlan('${username}')" style="margin-top:8px"><i class="fas fa-plus"></i> New Exercise Plan</button>
        </div>

        <!-- Logs Tab (hidden) -->
        <div id="ptab-logs-content" style="display:none">
          <div id="ptab-logs-inner" style="text-align:center;padding:32px;color:var(--sub)">
            <div class="spinner" style="margin:0 auto 12px"></div>Loading logs...
          </div>
        </div>

      </div>
    </div>
  `;
}

function patTab(name, username) {
  const tabs = ['profile','macros','medical','meal-plans','exercise','logs'];
  tabs.forEach(t => {
    const btn = document.getElementById(`ptab-${t}`);
    const content = document.getElementById(`ptab-${t}-content`);
    const active = t === name;
    if (btn) { btn.style.borderBottomColor = active ? 'var(--teal)' : 'transparent'; btn.style.color = active ? 'var(--teal)' : 'var(--sub)'; }
    if (content) content.style.display = active ? 'block' : 'none';
  });
  if (name === 'logs' && username) loadPatientLogs(username);
}

async function loadPatientLogs(username) {
  const inner = document.getElementById('ptab-logs-inner');
  if (!inner) return;
  inner.innerHTML = '<div class="spinner" style="margin:0 auto 12px"></div><div style="color:var(--sub);font-size:13px">Loading logs...</div>';

  const res = await apiCall('GET', `/api/doctors/users/${username}/logs`);
  if (!res.ok) {
    inner.innerHTML = '<div class="alert alert-error">Failed to load logs.</div>';
    return;
  }
  const { food, sleep, water, weight } = res.data.data;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'}) : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString(undefined, {hour:'2-digit',minute:'2-digit'}) : '';

  const sectionHdr = (icon, title, color) => `
    <div style="display:flex;align-items:center;gap:10px;margin:20px 0 12px;">
      <div style="width:32px;height:32px;border-radius:8px;background:${color}22;display:flex;align-items:center;justify-content:center;font-size:16px">${icon}</div>
      <div style="font-size:15px;font-weight:700;color:var(--text)">${title}</div>
      <div style="flex:1;height:1px;background:var(--border)"></div>
    </div>`;

  const foodHtml = food && food.length ? food.map(f => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--border);border-left:3px solid #22c55e;border-radius:8px;margin-bottom:8px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.food_name}</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">${f.meal_type||'Snack'} · ${f.quantity||1} ${f.unit||'serving'}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:13px;font-weight:700;color:#22c55e">${Math.round(f.calories||0)} kcal</div>
        <div style="font-size:10px;color:var(--sub)">${fmtDate(f.logged_at)} ${fmtTime(f.logged_at)}</div>
      </div>
    </div>`).join('')
    : '<div style="color:var(--sub);font-size:13px;padding:12px;text-align:center">No food logs recorded.</div>';

  const sleepHtml = sleep && sleep.length ? sleep.map(s => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--border);border-left:3px solid #8b5cf6;border-radius:8px;margin-bottom:8px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px;color:var(--text)">${s.hours}h sleep</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">Quality: ${s.quality||'—'} · Stress: ${s.stress_level!==null&&s.stress_level!==undefined?s.stress_level+'/10':'—'}</div>
        ${s.notes ? `<div style="font-size:11px;color:var(--sub);margin-top:2px;font-style:italic">${s.notes}</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:10px;color:var(--sub)">${fmtDate(s.log_date)}</div>
        ${s.bedtime ? `<div style="font-size:10px;color:var(--sub)">${s.bedtime} → ${s.wake_time||'?'}</div>` : ''}
      </div>
    </div>`).join('')
    : '<div style="color:var(--sub);font-size:13px;padding:12px;text-align:center">No sleep logs recorded.</div>';

  const waterHtml = water && water.length ? water.map(w => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--border);border-left:3px solid #3b82f6;border-radius:8px;margin-bottom:8px">
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px;color:var(--text)">${w.cups||0} cups <span style="color:var(--sub);font-weight:400;font-size:12px">(${w.ml||0} ml)</span></div>
      </div>
      <div style="font-size:10px;color:var(--sub)">${fmtDate(w.log_date)}</div>
    </div>`).join('')
    : '<div style="color:var(--sub);font-size:13px;padding:12px;text-align:center">No water logs recorded.</div>';

  // ── Weight Logs ──────────────────────────────────────────────
  const weightHtml = weight && weight.length ? weight.map(w => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card2);border:1px solid var(--border);border-left:3px solid #f59e0b;border-radius:8px;margin-bottom:8px">
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px;color:var(--text)">${w.weight_kg} kg</div>
        ${w.notes ? `<div style="font-size:11px;color:var(--sub);margin-top:2px;font-style:italic">${w.notes}</div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:10px;color:var(--sub)">${fmtDate(w.logged_at)} ${fmtTime(w.logged_at)}</div>
      </div>
    </div>`).join('')
    : '<div style="color:var(--sub);font-size:13px;padding:12px;text-align:center">No weight logs recorded.</div>';

  inner.innerHTML = `
    <div style="padding-bottom:16px">
      ${sectionHdr('🥗','Food Logs','#22c55e')}
      <div style="max-height:220px;overflow-y:auto;padding-right:4px">${foodHtml}</div>
      ${sectionHdr('😴','Sleep Logs','#8b5cf6')}
      <div style="max-height:200px;overflow-y:auto;padding-right:4px">${sleepHtml}</div>
      ${sectionHdr('💧','Water Logs','#3b82f6')}
      <div style="max-height:200px;overflow-y:auto;padding-right:4px">${waterHtml}</div>
      ${sectionHdr('⚖️','Weight Logs','#f59e0b')}
      <div style="max-height:200px;overflow-y:auto;padding-right:4px">${weightHtml}</div>
    </div>`;
}

async function savePatientTargets(username) {
  const btn = document.getElementById('pt-save-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
  const data = {
    target_calories: parseFloat(document.getElementById('pt-cal').value) || null,
    target_protein_g: parseFloat(document.getElementById('pt-pro').value) || null,
    target_carbs_g: parseFloat(document.getElementById('pt-carb').value) || null,
    target_fat_g: parseFloat(document.getElementById('pt-fat').value) || null,
    sleep_hours_target: parseFloat(document.getElementById('pt-sleep').value) || null,
    water_cups_target: parseFloat(document.getElementById('pt-water').value) || null,
  };
  const res = await apiCall('PUT', `/api/doctors/users/${username}/targets`, data);
  btn.innerHTML = '<i class="fas fa-save"></i> Save Targets & Notify Patient'; btn.disabled = false;
  if (res.ok) { toast('✅ Targets updated & patient notified!', 'success'); }
  else toast('Failed to update targets', 'error');
}

async function deletePlan(planId, type) {
  if (!confirm(`Are you sure you want to delete this ${type} plan?`)) return;
  const endpoint = type === 'meal' ? `/api/plans/${planId}` : `/api/plans/exercise-plans/${planId}`;
  const res = await apiCall('DELETE', endpoint);
  if (res.ok) {
    toast(`${type === 'meal' ? 'Meal' : 'Exercise'} plan deleted!`, 'success');
    if (window._currentProfilePatient) {
      openPatientProfile(window._currentProfilePatient);
    }
  } else {
    toast(`Failed to delete ${type} plan.`, 'error');
  }
}



async function viewFoodPlan(planId) {
  openModal('<div style="text-align:center;padding:20px"><div class="spinner" style="margin:0 auto 12px"></div>Loading food plan...</div>');
  const res = await apiCall('GET', `/api/plans/${planId}`);
  if (!res.ok) { document.getElementById('modalContent').innerHTML = '<div class="alert alert-error">Unable to load food plan.</div>'; return; }
  const { plan, meals } = res.data.data;
  document.getElementById('modalContent').innerHTML = `
    <div style="padding:20px;max-width:600px;">
      <h3 class="modal-title">Food Plan #${plan.plan_id}</h3>
      <p style="color:var(--sub);margin-bottom:16px">${plan.goal_type||'No goal type set'}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:var(--card2);padding:12px;border-radius:10px"><div style="font-size:11px;color:var(--sub);margin-bottom:4px">START</div>${plan.start_date||'—'}</div>
        <div style="background:var(--card2);padding:12px;border-radius:10px"><div style="font-size:11px;color:var(--sub);margin-bottom:4px">END</div>${plan.end_date||'—'}</div>
      </div>
      <div style="max-height: 50vh; overflow-y: auto; padding-right: 10px;">
        ${meals.length ? meals.map(meal => `
          <div style="background:var(--card2);padding:14px;border-radius:12px;margin-bottom:12px">
            <div style="font-weight:600">${meal.meal_name||'Meal'} <span style="color:var(--sub);font-size:12px">${meal.meal_time||''}</span></div>
            <div style="font-size:12px;color:var(--sub);margin-top:8px">Day ${meal.day_no||1}</div>
          </div>
        `).join('') : '<div style="color:var(--sub);">No meal entries found for this plan.</div>'}
      </div>
      <div class="modal-actions" style="margin-top:18px">
        <button class="btn-sm btn-outline" onclick="openPatientProfile(window._currentProfilePatient)"><i class="fas fa-arrow-left"></i> Back to Profile</button>
      </div>
    </div>
  `;
}

async function viewExercisePlan(planId) {
  openModal('<div style="text-align:center;padding:20px"><div class="spinner" style="margin:0 auto 12px"></div>Loading exercise plan...</div>');
  const res = await apiCall('GET', `/api/plans/exercise-plans/${planId}`);
  if (!res.ok) { document.getElementById('modalContent').innerHTML = '<div class="alert alert-error">Unable to load exercise plan.</div>'; return; }
  const { plan, exercises } = res.data.data;
  document.getElementById('modalContent').innerHTML = `
    <div style="padding:20px;max-width:600px;">
      <h3 class="modal-title">Exercise Plan #${plan.plan_id}</h3>
      <p style="color:var(--sub);margin-bottom:16px">${plan.goal_type||'No goal type set'}</p>
      <div style="max-height: 50vh; overflow-y: auto; padding-right: 10px;">
        ${exercises && exercises.length ? exercises.map(ex => `
          <div style="background:var(--card2);padding:14px;border-radius:12px;margin-bottom:12px">
            <div style="font-weight:600">${ex.name||'Exercise'} (Day ${ex.day_number})</div>
            <div style="font-size:12px;color:var(--sub);margin-top:6px">Sets: ${ex.sets||'-'}, Reps: ${ex.reps||'-'}</div>
            <div style="font-size:12px;color:var(--sub);margin-top:6px">${ex.instruction||''}</div>
          </div>
        `).join('') : '<div style="color:var(--sub);">No exercises found for this plan.</div>'}
      </div>
      <div class="modal-actions" style="margin-top:18px">
        <button class="btn-sm btn-outline" onclick="openPatientProfile(window._currentProfilePatient)"><i class="fas fa-arrow-left"></i> Back to Profile</button>
      </div>
    </div>
  `;
}


async function editFoodPlan(planId) {
  const res = await apiCall('GET', `/api/plans/${planId}`);
  if (!res.ok) { toast('Could not load plan', 'error'); return; }
  const { plan } = res.data.data;
  openModal(`
    <div style="padding:24px;max-width:520px;width:100%">
      <h3 class="modal-title"><i class="fas fa-edit" style="color:var(--teal);margin-right:8px"></i>Edit Meal Plan #${planId}</h3>
      <div class="form-group"><label>Goal Type</label><div class="input-wrap"><i class="fas fa-bullseye"></i><input type="text" id="ep-goal" value="${plan.goal_type||''}" placeholder="e.g. Weight Loss"></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group"><label>Start Date</label><div class="input-wrap"><i class="fas fa-calendar"></i><input type="date" id="ep-start" value="${plan.start_date?plan.start_date.split('T')[0]:''}"></div></div>
        <div class="form-group"><label>End Date</label><div class="input-wrap"><i class="fas fa-calendar-check"></i><input type="date" id="ep-end" value="${plan.end_date?plan.end_date.split('T')[0]:''}"></div></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea id="ep-notes" placeholder="Special instructions..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:inherit;font-size:14px;resize:vertical;min-height:80px;outline:none;box-sizing:border-box">${plan.notes||''}</textarea></div>
      <div class="modal-actions" style="margin-top:8px">
        <button class="btn-sm btn-outline" onclick="closeModal(event)">Cancel</button>
        <button class="btn-sm btn-primary" id="save-fp-btn" onclick="saveFoodPlanEdit(${planId})"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </div>
  `);
}

async function saveFoodPlanEdit(planId) {
  const btn = document.getElementById('save-fp-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
  const data = {
    goal_type: document.getElementById('ep-goal').value,
    start_date: document.getElementById('ep-start').value || null,
    end_date: document.getElementById('ep-end').value || null,
    notes: document.getElementById('ep-notes').value || null
  };
  const res = await apiCall('PUT', `/api/plans/${planId}`, data);
  btn.innerHTML = '<i class="fas fa-save"></i> Save Changes'; btn.disabled = false;
  if (res.ok) {
    toast('✅ Meal plan updated!', 'success');
    closeModal({ target: document.getElementById('modalOverlay') });
    if (window._currentProfilePatient) openPatientProfile(window._currentProfilePatient);
  } else {
    toast(res.data?.message || 'Failed to update plan', 'error');
  }
}

async function editExercisePlan(planId) {
  const res = await apiCall('GET', `/api/plans/exercise-plans/${planId}`);
  if (!res.ok) { toast('Could not load plan', 'error'); return; }
  const { plan } = res.data.data;
  openModal(`
    <div style="padding:24px;max-width:400px;width:100%">
      <h3 class="modal-title"><i class="fas fa-edit" style="color:var(--teal);margin-right:8px"></i>Edit Exercise Plan #${planId}</h3>
      <div class="form-group"><label>Goal Type</label><div class="input-wrap"><i class="fas fa-bullseye"></i><input type="text" id="eep-goal" value="${plan.goal_type||''}" placeholder="e.g. Muscle Gain"></div></div>
      <div class="modal-actions" style="margin-top:8px">
        <button class="btn-sm btn-outline" onclick="closeModal(event)">Cancel</button>
        <button class="btn-sm btn-primary" id="save-ep-btn" onclick="saveExercisePlanEdit(${planId})"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </div>
  `);
}

async function saveExercisePlanEdit(planId) {
  const btn = document.getElementById('save-ep-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
  const data = { goal_type: document.getElementById('eep-goal').value };
  const res = await apiCall('PUT', `/api/plans/exercise-plans/${planId}`, data);
  btn.innerHTML = '<i class="fas fa-save"></i> Save Changes'; btn.disabled = false;
  if (res.ok) {
    toast('✅ Exercise plan updated!', 'success');
    closeModal({ target: document.getElementById('modalOverlay') });
    if (window._currentProfilePatient) openPatientProfile(window._currentProfilePatient);
  } else {
    toast(res.data?.message || 'Failed to update plan', 'error');
  }
}

async function openChat(username) {
  closeModal();

  // Stop any previous poll
  if (window._docChatPollTimer) { clearInterval(window._docChatPollTimer); window._docChatPollTimer = null; }
  currentChatPatient = username;

  openModal(`
    <div class="chat-modal">
      <div class="chat-header">
        <h3>Chat with ${username}</h3>
        <button onclick="closeDoctorChat()" style="background:none;border:none;color:var(--sub);font-size:18px;cursor:pointer">&times;</button>
      </div>
      <div class="chat-messages" id="docChatMessages" style="display:flex;flex-direction:column;gap:12px">
        <div class="spinner" style="margin:auto"></div>
      </div>
      <div class="chat-input">
        <input type="text" placeholder="Type a message..." id="docChatInput" autocomplete="off">
        <button onclick="sendChatMessage('${username}')" class="chat-send-btn"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `);

  // Track rendered IDs for dedup
  window._docChatRenderedIds = new Set();
  window._docChatPartner = username;

  // Load history
  const res = await apiCall('GET', `/api/messaging/history/${username}`);
  const box = document.getElementById('docChatMessages');
  if (!box) return;
  if (res.ok && res.data.data) {
    box.innerHTML = '';
    if (res.data.data.length === 0) {
      box.innerHTML = `<div style="margin:auto;text-align:center;color:var(--sub);font-size:13px">
        <i class="fas fa-comment-dots" style="font-size:28px;margin-bottom:8px;display:block;opacity:0.4"></i>
        No messages yet. Start the conversation!
      </div>`;
    } else {
      res.data.data.forEach(msg => {
        appendDoctorMessage(msg);
        if (msg.id) window._docChatRenderedIds.add(msg.id);
      });
      box.scrollTop = box.scrollHeight;
    }
  } else {
    box.innerHTML = '<div style="color:var(--red);margin:auto">Failed to load history</div>';
  }

  // Clear previous listener to avoid stacking handlers
  if (window.socket) {
    window.socket.off('receive_message');
  }

  // Socket setup — joinDocChatRoom handles timing
  joinDocChatRoom(docCurrentUser.doctor_username, username, (msg) => {
    // Skip messages sent by ME — already added optimistically
    if (msg.sender_username === docCurrentUser.doctor_username) return;
    // Skip duplicates (may arrive via poll too)
    if (msg.id && window._docChatRenderedIds.has(msg.id)) return;
    if (msg.id) window._docChatRenderedIds.add(msg.id);
    // Clear empty state if present
    const emptyState = document.querySelector('#docChatMessages > div[style*="margin:auto"]');
    if (emptyState) emptyState.remove();
    appendDoctorMessage(msg);
    const b = document.getElementById('docChatMessages');
    if (b) b.scrollTop = b.scrollHeight;
  });

  // ── Polling fallback every 4 s so patient messages always arrive ─────────
  window._docChatPollTimer = setInterval(async () => {
    if (!document.getElementById('docChatMessages') || window._docChatPartner !== username) {
      clearInterval(window._docChatPollTimer);
      window._docChatPollTimer = null;
      return;
    }
    const pr = await apiCall('GET', `/api/messaging/history/${username}`);
    if (!pr.ok || !pr.data.data) return;
    const b = document.getElementById('docChatMessages');
    if (!b) return;
    let newMsgs = pr.data.data.filter(m => m.id && !window._docChatRenderedIds.has(m.id));
    if (newMsgs.length === 0) return;
    // Resolve optimistic elements sent by the doctor — replace placeholder with real ID
    newMsgs = newMsgs.filter(m => {
      if (m.sender_username === docCurrentUser.doctor_username) {
        const optimistic = b.querySelector('.doc-optimistic-msg');
        if (optimistic) {
          optimistic.id = `doc-msg-${m.id}`;
          optimistic.classList.remove('doc-optimistic-msg');
          window._docChatRenderedIds.add(m.id);
          return false; // already in DOM — skip
        }
      }
      return true;
    });
    if (newMsgs.length === 0) return;
    const emptyState = b.querySelector('div[style*="margin:auto"]');
    if (emptyState) emptyState.remove();
    newMsgs.forEach(m => {
      appendDoctorMessage(m);
      window._docChatRenderedIds.add(m.id);
    });
    b.scrollTop = b.scrollHeight;
  }, 4000);

  const inputEl = document.getElementById('docChatInput');
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage(username);
    });
    inputEl.focus();
  }
}

function closeDoctorChat() {
  if (window._docChatPollTimer) { clearInterval(window._docChatPollTimer); window._docChatPollTimer = null; }
  closeModal();
}


function appendDoctorMessage(msg, isOptimistic = false) {
  const box = document.getElementById('docChatMessages');
  if (!box) return;

  const isMe = msg.sender_username === docCurrentUser.doctor_username;
  const bg = isMe ? 'var(--navy-light)' : 'var(--card2)';
  const color = isMe ? '#fff' : 'var(--text)';
  const align = isMe ? 'flex-end' : 'flex-start';
  const radius = isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
  const border = isMe ? 'none' : '1px solid var(--border)';
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const idAttr = msg.id ? `id="doc-msg-${msg.id}"` : '';
  const optimisticClass = isOptimistic ? ' doc-optimistic-msg' : '';

  box.insertAdjacentHTML('beforeend', `
    <div ${idAttr} class="${optimisticClass.trim()}" style="align-self:${align};max-width:75%;display:flex;flex-direction:column;gap:4px">
      <div style="background:${bg};color:${color};padding:10px 16px;border-radius:${radius};border:${border};font-size:14px;line-height:1.4;word-break:break-word">
        ${msg.message}
      </div>
      <div style="font-size:10px;color:var(--sub);align-self:${isMe ? 'flex-end' : 'flex-start'}">${time}</div>
    </div>
  `);
}

function sendChatMessage(username) {
  const input = document.getElementById('docChatInput');
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) return;

  // Optimistically add the message to UI immediately (marked for dedup)
  const box = document.getElementById('docChatMessages');
  const emptyState = box ? box.querySelector('div[style*="margin:auto"]') : null;
  if (emptyState) emptyState.remove();

  appendDoctorMessage({
    sender_username: docCurrentUser.doctor_username,
    receiver_username: username,
    message: txt,
    created_at: new Date().toISOString(),
    id: null
  }, true /* isOptimistic */);

  if (box) box.scrollTop = box.scrollHeight;

  input.value = '';
  input.focus();

  // Emit via Socket.IO to persist and broadcast to patient
  if (window.socket) {
    window.socket.emit('send_message', {
      sender_username: docCurrentUser.doctor_username,
      receiver_username: username,
      message: txt
    });
  } else {
    toast('Chat connection unavailable. Please refresh.', 'error');
  }
}

function manageFoodPlan(username) {
  closeModal();
  window._selectedPatient = username;
  showDocPage('meal-plan');
}

function manageExercisePlan(username) {
  closeModal();
  window._selectedPatient = username;
  showDocPage('ex-plan');
}

async function mealPlan(main) {
  const [patientsRes, foodsRes] = await Promise.all([
    apiCall('GET', '/api/doctors/users?search='),
    apiCall('GET', '/api/foods')
  ]);
  const patients = patientsRes.ok ? (patientsRes.data.data||[]) : [];
  window.allFoods = foodsRes.ok ? (foodsRes.data.data||[]) : [];
  
  const preselect = window._selectedPatient || '';
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Create Meal Plan</h2><p class="page-desc">Assign a personalized meal plan to a patient.</p></div>
    <div class="card" style="max-width:700px">
      <div class="form-group"><label>Patient</label>
        <select id="mp-patient" class="input-wrap" style="width:100%">
          <option value="">-- Select Patient --</option>
          ${patients.map(p=>`<option value="${p.user_username}" ${p.user_username===preselect?'selected':''}>${p.first_name||''} ${p.last_name||''} (@${p.user_username})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Number of Meals per Day</label>
        <div class="input-wrap"><i class="fas fa-utensils"></i><input type="number" id="mp-num-meals" placeholder="e.g. 3" min="1" max="10" style="padding-left:38px"></div>
      </div>
      <button class="btn-primary" onclick="setupMealPlanForm()" id="mp-setup-btn"><i class="fas fa-cog" style="margin-right:6px"></i>Setup Plan</button>
      <div id="mp-form-container" style="display:none"></div>
    </div>
  `;
  window._selectedPatient = '';
}

function setupMealPlanForm() {
  const numMeals = parseInt(document.getElementById('mp-num-meals').value);
  if (!numMeals || numMeals < 1 || numMeals > 10) { toast('Please enter a valid number of meals (1-10)', 'error'); return; }
  const container = document.getElementById('mp-form-container');
  container.style.display = 'block';
  container.innerHTML = `
    <div class="form-row-2">
      <div class="form-group"><label>Goal Type</label><div class="input-wrap"><i class="fas fa-bullseye"></i><input type="text" id="mp-goal" placeholder="e.g. Weight Loss" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Target Calories</label><div class="input-wrap"><i class="fas fa-fire"></i><input type="number" id="mp-cal" placeholder="e.g. 1800" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Protein (g)</label><div class="input-wrap"><i class="fas fa-drumstick-bite"></i><input type="number" id="mp-protein" placeholder="e.g. 150" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Carbs (g)</label><div class="input-wrap"><i class="fas fa-bread-slice"></i><input type="number" id="mp-carbs" placeholder="e.g. 200" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Fat (g)</label><div class="input-wrap"><i class="fas fa-cheese"></i><input type="number" id="mp-fat" placeholder="e.g. 60" style="padding-left:38px"></div></div>
      <div class="form-group"><label>Water (cups)</label><div class="input-wrap"><i class="fas fa-tint" style="color:var(--navy-light)"></i><input type="number" id="mp-water" placeholder="e.g. 8" style="padding-left:38px"></div></div>
    </div>
    <div class="form-row-2">
      <div class="form-group"><label>Start Date</label><div class="input-wrap"><i class="fas fa-calendar"></i><input type="date" id="mp-start" style="padding-left:38px"></div></div>
      <div class="form-group"><label>End Date</label><div class="input-wrap"><i class="fas fa-calendar-check"></i><input type="date" id="mp-end" style="padding-left:38px"></div></div>
    </div>
    <div id="meals-container" style="max-height:400px; overflow-y:auto; padding-right:8px; margin-bottom:16px;">
      ${Array.from({length: numMeals}, (_, i) => `
        <div class="meal-item" style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
          <div class="form-group"><label>Meal ${i+1} Name</label><input type="text" id="meal-name-${i}" placeholder="e.g. Breakfast" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none"></div>
          <div class="form-group"><label>Meal ${i+1} Time</label><input type="time" id="meal-time-${i}" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none"></div>
          <div style="border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:12px">
            <div style="font-weight:600;margin-bottom:12px;font-size:14px"><i class="fas fa-utensils" style="color:var(--teal);margin-right:6px"></i>Foods for Meal ${i+1}</div>
            <div id="foods-meal-${i}"></div>
            <button class="btn-sm btn-outline" onclick="addFoodRow(${i})" style="margin-top:10px"><i class="fas fa-plus" style="margin-right:4px"></i>Add Food</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="form-group"><label>Notes</label><textarea id="mp-notes" placeholder="Special instructions..." style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--text);font-family:inherit;font-size:14px;resize:vertical;min-height:80px;outline:none"></textarea></div>
    <button class="btn-primary" onclick="submitMealPlan(${numMeals})" id="mp-btn"><i class="fas fa-save" style="margin-right:6px"></i>Create Plan</button>
    <div id="mp-result" style="margin-top:12px"></div>
  `;
}

let foodRowIdx = 0;
function addFoodRow(mealIdx) {
  const box = document.getElementById(`foods-meal-${mealIdx}`);
  const idx = foodRowIdx++;
  const row = document.createElement('div');
  row.id = `food-row-${idx}`;
  row.className = "food-row";
  row.style.cssText = 'display:grid;grid-template-columns:3fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
  
  const options = (window.allFoods || []).map(f => 
    `<option value="${f.food_id}" data-cal="${f.calories||0}" data-pro="${f.protein_g||0}" data-carb="${f.total_carbs_g||0}" data-fat="${f.total_fat_g||0}">${f.food_name} (${f.serving_size})</option>`
  ).join('');

  row.innerHTML = `
    <select class="food-select" onchange="updateMacros()" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none">
      <option value="">-- Choose Food --</option>
      ${options}
    </select>
    <input type="number" class="food-qty" placeholder="Qty" value="1" min="0.1" step="0.1" oninput="updateMacros()" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none">
    <button onclick="document.getElementById('food-row-${idx}').remove(); updateMacros()" style="background:rgba(239,68,68,0.15);border:none;border-radius:6px;color:var(--red);padding:8px 10px;cursor:pointer"><i class="fas fa-trash"></i></button>
  `;
  box.appendChild(row);
}

function updateMacros() {
  let totCal = 0, totPro = 0, totCarb = 0, totFat = 0;
  document.querySelectorAll('.food-row').forEach(row => {
    const select = row.querySelector('.food-select');
    const qtyInput = row.querySelector('.food-qty');
    const qty = parseFloat(qtyInput.value) || 0;
    if (select.selectedIndex > 0 && qty > 0) {
      const opt = select.options[select.selectedIndex];
      totCal += (parseFloat(opt.dataset.cal) || 0) * qty;
      totPro += (parseFloat(opt.dataset.pro) || 0) * qty;
      totCarb += (parseFloat(opt.dataset.carb) || 0) * qty;
      totFat += (parseFloat(opt.dataset.fat) || 0) * qty;
    }
  });
  
  document.getElementById('mp-cal').value = Math.round(totCal);
  document.getElementById('mp-protein').value = Math.round(totPro);
  document.getElementById('mp-carbs').value = Math.round(totCarb);
  document.getElementById('mp-fat').value = Math.round(totFat);
}

async function submitMealPlan(numMeals) {
  const username = document.getElementById('mp-patient').value;
  if (!username) { toast('Please select a patient', 'error'); return; }
  const btn = document.getElementById('mp-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; btn.disabled = true;
  const data = {
    goal_type: document.getElementById('mp-goal').value,
    target_calories: document.getElementById('mp-cal').value || null,
    target_protein_g: document.getElementById('mp-protein').value || null,
    target_carbs_g: document.getElementById('mp-carbs').value || null,
    target_fat_g: document.getElementById('mp-fat').value || null,
    target_water_cups: document.getElementById('mp-water').value || null,
    start_date: document.getElementById('mp-start').value || null,
    end_date: document.getElementById('mp-end').value || null,
    notes: document.getElementById('mp-notes').value || null
  };
  const res = await apiCall('POST', `/api/plans/users/${username}`, data);
  if (!res.ok) {
    btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Create Plan'; btn.disabled = false;
    document.getElementById('mp-result').innerHTML = `<div class="alert alert-error">${res.data?.message||'Failed to create plan'}</div>`;
    return;
  }
  const planId = res.data.data.plan_id;
  const mealItems = [];
  for (let i = 0; i < numMeals; i++) {
    const mealName = document.getElementById(`meal-name-${i}`).value.trim() || `Meal ${i+1}`;
    const mealTime = document.getElementById(`meal-time-${i}`).value || null;
    const mealData = { meal_name: mealName, meal_time: mealTime, day_no: 1 };
    const mealRes = await apiCall('POST', `/api/plans/${planId}/meals`, mealData);
    
    if (mealRes.ok) {
      const mealId = mealRes.data.data.plan_meal_id;
      const foodRows = document.querySelectorAll(`#foods-meal-${i} .food-row`);
      for (const row of foodRows) {
        const select = row.querySelector('.food-select');
        const qty = parseFloat(row.querySelector('.food-qty').value);
        if (select.value && qty > 0) {
          await apiCall('POST', `/api/plans/meals/${mealId}/items`, {
            food_id: parseInt(select.value),
            qty: qty
          });
        }
      }
    }
    mealItems.push({ mealData, ok: mealRes.ok });
  }
  btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Create Plan'; btn.disabled = false;
  const box = document.getElementById('mp-result');
  if (mealItems.every(item => item.ok)) {
    box.innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle" style="margin-right:6px"></i>Plan created with ${numMeals} meals! ID: ${planId}</div>`;
    toast('Meal plan created!', 'success');
  } else {
    box.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-circle" style="margin-right:6px"></i>Plan created, but some meals could not be added. Please review.</div>`;
    toast('Plan created with warnings', 'error');
  }
}

async function exPlan(main) {
  const [patientsRes, exercisesRes] = await Promise.all([
    apiCall('GET', '/api/doctors/users?search='),
    apiCall('GET', '/api/content/exercises')
  ]);
  const patients = patientsRes.ok ? (patientsRes.data.data||[]) : [];
  window.allExercises = exercisesRes.ok ? (exercisesRes.data.data||[]) : [];
  
  const preselect = window._selectedPatient || '';
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">Create Exercise Plan</h2><p class="page-desc">Assign a personalized workout plan to a patient.</p></div>
    <div class="card" style="max-width:700px">
      <div class="form-group"><label>Patient</label>
        <select id="ep-patient" class="input-wrap" style="width:100%">
          <option value="">-- Select Patient --</option>
          ${patients.map(p=>`<option value="${p.user_username}" ${p.user_username===preselect?'selected':''}>${p.first_name||''} ${p.last_name||''} (@${p.user_username})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Number of Days</label>
        <div class="input-wrap"><i class="fas fa-calendar-week"></i><input type="number" id="ep-num-days" placeholder="e.g. 7" min="1" max="30" style="padding-left:38px"></div>
      </div>
      <button class="btn-primary" onclick="setupExPlanForm()" id="ep-setup-btn"><i class="fas fa-cog" style="margin-right:6px"></i>Setup Plan</button>
      <div id="ep-form-container" style="display:none"></div>
    </div>
  `;
  window._selectedPatient = '';
}

function setupExPlanForm() {
  const numDays = parseInt(document.getElementById('ep-num-days').value);
  if (!numDays || numDays < 1 || numDays > 30) { toast('Please enter a valid number of days (1-30)', 'error'); return; }
  const container = document.getElementById('ep-form-container');
  container.style.display = 'block';
  container.innerHTML = `
    <div class="form-group"><label>Goal Type</label><div class="input-wrap"><i class="fas fa-bullseye"></i><input type="text" id="ep-goal" placeholder="e.g. Muscle Gain" style="padding-left:38px"></div></div>
    <div id="days-container" style="max-height:400px; overflow-y:auto; padding-right:8px; margin-bottom:16px;">
      ${Array.from({length: numDays}, (_, i) => `
        <div class="day-item" style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
          <div class="form-group"><label>Day ${i+1} Name</label><input type="text" id="day-name-${i}" placeholder="e.g. Monday" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none"></div>
          <div style="border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:12px">
            <div style="font-weight:600;margin-bottom:12px;font-size:14px"><i class="fas fa-plus-circle" style="color:var(--teal);margin-right:6px"></i>Exercises for Day ${i+1}</div>
            <div id="exercises-day-${i}"></div>
            <button class="btn-sm btn-outline" onclick="addExerciseRow(${i})" style="margin-top:10px"><i class="fas fa-plus" style="margin-right:4px"></i>Add Exercise</button>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="btn-primary" onclick="submitExPlan(${numDays})" id="ep-btn"><i class="fas fa-save" style="margin-right:6px"></i>Create Exercise Plan</button>
    <div id="ep-result" style="margin-top:12px"></div>
  `;
  // Add initial exercise row for each day
  for (let i = 0; i < numDays; i++) {
    addExerciseRow(i);
  }
}

let exRowIdx = 0;
function addExerciseRow(dayIdx) {
  const box = document.getElementById(`exercises-day-${dayIdx}`);
  const idx = exRowIdx++;
  const row = document.createElement('div');
  row.id = `ex-row-${idx}`;
  row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
  const options = (window.allExercises || []).map(e => 
    `<option value="${e.exercise_id}">${e.name} (${e.category||'General'})</option>`
  ).join('');

  row.innerHTML = `
    <select data-field="exercise_id" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none">
      <option value="">-- Choose Exercise --</option>
      ${options}
    </select>
    <input type="number" placeholder="Sets" data-field="sets" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none">
    <input type="text" placeholder="Reps" data-field="reps" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none">
    <input type="text" placeholder="Rest" data-field="rest" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-size:13px;font-family:inherit;outline:none">
    <button onclick="document.getElementById('ex-row-${idx}').remove()" style="background:rgba(239,68,68,0.15);border:none;border-radius:6px;color:var(--red);padding:8px 10px;cursor:pointer"><i class="fas fa-trash"></i></button>
  `;
  box.appendChild(row);
}

async function submitExPlan(numDays) {
  const username = document.getElementById('ep-patient').value;
  if (!username) { toast('Please select a patient', 'error'); return; }
  const btn = document.getElementById('ep-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...'; btn.disabled = true;
  // Create the plan first
  const planRes = await apiCall('POST', `/api/plans/users/${username}/exercise-plans`, { goal_type: document.getElementById('ep-goal').value || null });
  if (!planRes.ok) { btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Create Exercise Plan'; btn.disabled = false; toast('Failed to create plan', 'error'); return; }
  const planId = planRes.data.data.plan_id;
  // Add exercises for each day
  for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
    const dayName = document.getElementById(`day-name-${dayIdx}`).value || `Day ${dayIdx+1}`;
    const rows = document.querySelectorAll(`#exercises-day-${dayIdx} > div`);
    for (const row of rows) {
      const exSelect = row.querySelector('[data-field="exercise_id"]');
      const exId = parseInt(exSelect.value);
      const sets = row.querySelector('[data-field="sets"]').value;
      const reps = row.querySelector('[data-field="reps"]').value;
      const rest = row.querySelector('[data-field="rest"]').value;
      if (!exId) continue;
      
      const exName = exSelect.options[exSelect.selectedIndex].text.split('(')[0].trim();
      
      await apiCall('POST', `/api/plans/exercise-plans/${planId}/exercises`, { 
        exercise_id: exId, 
        day_number: dayIdx + 1, 
        sets: parseInt(sets)||3, 
        reps: reps||'10', 
        instruction: `${dayName}: ${exName} (${sets} sets, ${reps} reps, rest: ${rest})` 
      });
    }
  }
  btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Create Exercise Plan'; btn.disabled = false;
  document.getElementById('ep-result').innerHTML = `<div class="alert alert-success"><i class="fas fa-check-circle" style="margin-right:6px"></i>Exercise plan created (ID: ${planId})!</div>`;
  toast('Exercise plan created!', 'success');
}

async function profile(main) {
  const doc = docCurrentUser || {};
  main.innerHTML = `
    <div class="page-header"><h2 class="page-title">My Profile</h2><p class="page-desc">Manage your account information.</p></div>
    <div style="display:flex; gap:20px; flex-wrap:wrap;">
      <div class="card" style="flex:1; min-width:300px;">
        <h3>Edit Profile</h3>
        <div class="form-group" style="margin-top:16px"><label>First Name</label><div class="input-wrap"><i class="fas fa-user"></i><input type="text" id="profFirst" value="${doc.first_name||''}"></div></div>
        <div class="form-group"><label>Last Name</label><div class="input-wrap"><i class="fas fa-user"></i><input type="text" id="profLast" value="${doc.last_name||''}"></div></div>
        <div class="form-group"><label>Phone Number</label><div class="input-wrap"><i class="fas fa-phone"></i><input type="text" id="profPhone" value="${doc.phone_no||''}"></div></div>
        <div class="form-group"><label>Address</label><div class="input-wrap"><i class="fas fa-map-marker-alt"></i><input type="text" id="profAddress" value="${doc.address||''}"></div></div>
        <div class="form-group"><label>Date of Birth</label><div class="input-wrap"><i class="fas fa-calendar"></i><input type="date" id="profDob" value="${doc.dob ? doc.dob.split('T')[0] : ''}"></div></div>
        <div class="form-group"><label>Certification</label><div class="input-wrap"><i class="fas fa-certificate"></i><input type="text" id="profCert" value="${doc.certification||''}"></div></div>
        <button class="btn-primary" onclick="updateDocProfile(this)"><i class="fas fa-save" style="margin-right:6px"></i>Save Profile</button>
      </div>

      <div class="card" style="flex:1; min-width:300px;">
        <h3>Change Password</h3>
        <div class="form-group" style="margin-top:16px"><label>Current Password</label>
          <div class="input-wrap"><i class="fas fa-lock"></i><input type="password" id="oldPw" placeholder="Enter current password"><button class="toggle-pw" onclick="togglePw('oldPw',this)"><i class="fas fa-eye"></i></button></div>
        </div>
        <div class="form-group"><label>New Password</label>
          <div class="input-wrap"><i class="fas fa-key"></i><input type="password" id="newPw" placeholder="Enter new password"><button class="toggle-pw" onclick="togglePw('newPw',this)"><i class="fas fa-eye"></i></button></div>
        </div>
        <button class="btn-primary" onclick="updateDocPassword(this)"><i class="fas fa-save" style="margin-right:6px"></i>Change Password</button>
      </div>
    </div>
  `;
}

async function updateDocProfile(btn) {
  const data = {
    first_name: document.getElementById('profFirst').value,
    last_name: document.getElementById('profLast').value,
    phone_no: document.getElementById('profPhone').value,
    address: document.getElementById('profAddress').value,
    dob: document.getElementById('profDob').value,
    certification: document.getElementById('profCert').value
  };
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
  const res = await apiCall('PUT', '/api/doctors/profile', data);
  btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Save Profile'; btn.disabled = false;
  if (res.ok) {
    toast('Profile updated!', 'success');
    fetchDocProfile(); // refresh data
  } else {
    toast(res.data?.message || 'Error updating profile', 'error');
  }
}

async function updateDocPassword(btn) {
  const oldPw = document.getElementById('oldPw').value;
  const newPw = document.getElementById('newPw').value;
  if (!oldPw || !newPw) { toast('Please fill both fields', 'error'); return; }
  
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; btn.disabled = true;
  const res = await apiCall('PUT', '/api/doctors/profile/password', { currentPassword: oldPw, newPassword: newPw });
  btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Change Password'; btn.disabled = false;
  if (res.ok) {
    toast('Password changed!', 'success');
    document.getElementById('oldPw').value = '';
    document.getElementById('newPw').value = '';
  } else {
    toast(res.data?.message || 'Error changing password', 'error');
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (getDocToken()) {
    const u = getDocUser();
    if (u) { docCurrentUser = u; document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('portalShell').classList.remove('hidden'); initPortal(); }
    else { docLogin(); }
  }
});
