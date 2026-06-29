// ── Main App Logic & Routing ──────────────────────────────────────────────────

// Ensure Auth
if (!requireAuth()) throw new Error('Not authenticated');

// Globals
let currentUser = null;
let currentReqs = null;
let pageHistory = [];
let currentHistoryIndex = -1;
let isNavigatingHistory = false;

// Initialization
async function initApp() {
  // Load user
  const meRes = await Auth.me();
  if (!meRes.ok) { clearToken(); window.location.href = 'login.html'; return; }
  currentUser = meRes.data.data;
  setUser(currentUser);

  // Load requirements
  const reqRes = await Requirements.get();
  currentReqs = reqRes.ok ? reqRes.data.data : null;

  // Update UI topbar
  document.getElementById('topName').textContent = currentUser.first_name || currentUser.username;
  document.getElementById('topAvatar').textContent = (currentUser.first_name ? currentUser.first_name[0] : currentUser.username[0]).toUpperCase();
  document.getElementById('topRole').textContent = currentUser.subscription_tier === 'default' ? 'Free Member' : (currentUser.subscription_tier === 'pro' ? 'AI Member' : 'Doctor Member');

  const subBadge = document.getElementById('subBadge');
  const subText = document.getElementById('subText');
  if (currentUser.subscription_tier === 'doctor') {
    subBadge.style.background = 'rgba(155,89,182,0.1)';
    subBadge.style.color = '#9B59B6';
    subText.textContent = 'Doctor';
  } else if (currentUser.subscription_tier === 'pro') {
    subBadge.style.background = 'rgba(26,122,212,0.1)';
    subBadge.style.color = '#1A7AD4';
    subText.textContent = 'AI';
  } else {
    subBadge.style.background = 'rgba(245,158,11,0.1)';
    subBadge.style.color = 'var(--orange)';
    subText.textContent = 'Free';
  }

  // Load summary for topbar
  refreshTopbarStats();

  // Set up sidebar clicks
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => showPage(el.dataset.page));
  });

  // Load default page
  showPage('dashboard');

  // Initialize Socket.IO
  initSocket();
  fetchNotifs();
}

let socket = null;
function initSocket() {
  try {
    const serverUrl = BASE;
    socket = io(serverUrl, { reconnection: true, reconnectionAttempts: Infinity });
    window.socket = socket;
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join_notifications', currentUser.username);
      // Re-join pending chat room after reconnect
      if (window._pendingChatRoom) {
        socket.emit('join_chat', window._pendingChatRoom);
      }
    });
    socket.on('receive_notification', (notif) => {
      toast(notif.message, 'info');
      fetchNotifs();
    });
    socket.on('disconnect', () => { console.log('Socket disconnected, auto-reconnecting...'); });
  } catch(e) {
    console.warn('Could not connect to Socket.IO:', e.message);
  }
}

// Join a chat room — always works because socket connects on page load
function joinChatRoom(myUsername, partnerUsername, onMessage) {
  if (!window.socket) return;
  const roomPayload = { myUsername, partnerUsername };
  window._pendingChatRoom = roomPayload; // keep for reconnects
  window.socket.off('receive_message');
  window.socket.on('receive_message', onMessage);
  if (window.socket.connected) {
    window.socket.emit('join_chat', roomPayload);
  }
  // If not yet connected, the 'connect' handler above will emit join_chat automatically
}


async function fetchNotifs() {
  const res = await apiCall('GET', '/api/messaging/notifications');
  if (res.ok) {
    const list = res.data.data;
    const dot = document.getElementById('notifDot');
    const container = document.getElementById('notifList');
    
    const unread = list.filter(n => !n.is_read).length;
    if (unread > 0) {
      dot.classList.remove('hidden');
    } else {
      dot.classList.add('hidden');
    }

    if (list.length === 0) {
      container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--sub);font-size:13px">No notifications</div>`;
    } else {
      container.innerHTML = list.map(n => `
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:${n.is_read ? 'transparent' : 'rgba(26,122,212,0.05)'}">
          <div style="font-size:13px;color:var(--text)">${n.message}</div>
          <div style="font-size:11px;color:var(--sub);margin-top:4px">${new Date(n.created_at).toLocaleString()}</div>
        </div>
      `).join('');
    }
  }
}

function toggleNotifDropdown() {
  document.getElementById('notifDropdown').classList.toggle('hidden');
  document.getElementById('profileDropdown').classList.add('hidden');
}

async function markNotifsRead() {
  await apiCall('POST', '/api/messaging/notifications/read');
  document.getElementById('notifDot').classList.add('hidden');
  fetchNotifs();
}

// Topbar Stats
async function refreshTopbarStats() {
  const res = await Tracking.summary();
  if (res.ok && res.data.data) {
    const s = res.data.data;
    document.getElementById('tb-cal').textContent = `${Math.round(s.calories?.total_calories || 0)} kcal`;
    document.getElementById('tb-water').textContent = `${s.water?.cups || 0} cups`;

    // Explicitly update dashboard and calories pages if they are in the DOM
    if (document.getElementById('dashCal') && pages.dashboard && pages.dashboard.init) {
      setTimeout(() => pages.dashboard.init(), 0);
    }
    if (document.getElementById('cEat') && pages.calories && pages.calories.init) {
      setTimeout(() => pages.calories.init(), 0);
    }
  }
}

// Profile Modal
function openProfileModal() {
  const u = currentUser;
  // Temporarily widen the modal box
  const modalBox = document.getElementById('modalBox');
  if (modalBox) modalBox.style.maxWidth = '560px';
  openModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 class="modal-title" style="margin:0">My Profile</h3>
      <button onclick="closeModal(null)" style="background:none;border:none;color:var(--sub);font-size:22px;cursor:pointer;line-height:1;padding:0 4px">&times;</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px">
      <button id="tab-info-btn" onclick="switchProfileTab('info')" style="background:var(--navy-light);color:#fff;border:none;border-radius:6px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap">Edit Info</button>
      <button id="tab-pw-btn" onclick="switchProfileTab('pw')" style="background:transparent;color:var(--sub);border:1px solid var(--border);border-radius:6px;padding:7px 18px;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap">Change Password</button>
    </div>

    <div id="profile-tab-info" style="display:flex;flex-direction:column;max-height:60vh;overflow-y:auto;padding-right:8px">
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
        <div class="form-group" style="margin:0"><label>First Name</label>
          <div class="input-wrap"><i class="fas fa-user"></i><input type="text" id="profFirst" value="${u.first_name || ''}"></div></div>
        <div class="form-group" style="margin:0"><label>Last Name</label>
          <div class="input-wrap"><i class="fas fa-user"></i><input type="text" id="profLast" value="${u.last_name || ''}"></div></div>
        <div class="form-group" style="margin:0"><label>Email <span style="font-size:11px;color:var(--sub)">(read-only)</span></label>
          <div class="input-wrap"><i class="fas fa-envelope"></i><input type="email" value="${u.email || ''}" disabled style="opacity:0.6"></div></div>
        <div class="form-group" style="margin:0"><label>Phone</label>
          <div class="input-wrap"><i class="fas fa-phone"></i><input type="text" id="profPhone" value="${u.phone_no || ''}"></div></div>
        <div class="form-group" style="margin:0"><label>Date of Birth</label>
          <div class="input-wrap"><i class="fas fa-calendar"></i><input type="date" id="profDOB" value="${u.dob ? u.dob.split('T')[0] : ''}"></div></div>
        <div class="form-group" style="margin:0"><label>Address</label>
          <div class="input-wrap"><i class="fas fa-map-marker-alt"></i><input type="text" id="profAddress" value="${u.address || ''}"></div></div>
        <div class="form-group" style="margin:0"><label>Gender</label>
          <div class="input-wrap"><i class="fas fa-venus-mars"></i>
            <select id="profGender" style="padding-left:38px;width:100%">
              <option value="Male" ${u.gender==='Male'?'selected':''}>Male</option>
              <option value="Female" ${u.gender==='Female'?'selected':''}>Female</option>
              <option value="Other" ${u.gender==='Other'?'selected':''}>Other</option>
            </select></div></div>
        <div class="form-group" style="margin:0"><label>Job</label>
          <div class="input-wrap"><i class="fas fa-briefcase"></i><input type="text" id="profJob" value="${u.job || ''}"></div></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--border);margin-top:auto">
        <button onclick="closeModal(null)" style="padding:9px 20px;border-radius:20px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;flex-shrink:0">Cancel</button>
        <button onclick="saveProfile()" style="padding:9px 20px;border-radius:20px;border:none;background:var(--navy-light);color:#fff;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap;flex-shrink:0"><i class="fas fa-save" style="margin-right:6px"></i>Save Changes</button>
      </div>
    </div>

    <div id="profile-tab-pw" style="display:none">
      <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
        <div class="form-group" style="margin:0"><label>Current Password</label>
          <div class="input-wrap"><i class="fas fa-lock"></i><input type="password" id="curPw" placeholder="Enter current password">
            <button class="toggle-pw" onclick="togglePw('curPw',this)"><i class="fas fa-eye"></i></button></div></div>
        <div class="form-group" style="margin:0"><label>New Password</label>
          <div class="input-wrap"><i class="fas fa-key"></i><input type="password" id="newPw" placeholder="Min. 6 characters">
            <button class="toggle-pw" onclick="togglePw('newPw',this)"><i class="fas fa-eye"></i></button></div></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--border)">
        <button onclick="closeModal(null)" style="padding:9px 20px;border-radius:20px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:13px;font-weight:600;color:var(--text);white-space:nowrap">Cancel</button>
        <button onclick="changePassword()" style="padding:9px 20px;border-radius:20px;border:none;background:var(--navy-light);color:#fff;cursor:pointer;font-size:13px;font-weight:600;white-space:nowrap"><i class="fas fa-save" style="margin-right:6px"></i>Change Password</button>
      </div>
    </div>
  `);
}

function switchProfileTab(tab) {
  const isInfo = tab === 'info';
  document.getElementById('profile-tab-info').style.display = isInfo ? '' : 'none';
  document.getElementById('profile-tab-pw').style.display  = isInfo ? 'none' : '';
  document.getElementById('tab-info-btn').style.background = isInfo ? 'var(--navy-light)' : 'transparent';
  document.getElementById('tab-info-btn').style.color      = isInfo ? '#fff' : 'var(--sub)';
  document.getElementById('tab-pw-btn').style.background   = isInfo ? 'transparent' : 'var(--navy-light)';
  document.getElementById('tab-pw-btn').style.color        = isInfo ? 'var(--sub)' : '#fff';
}

async function saveProfile() {
  const data = {
    first_name: document.getElementById('profFirst').value,
    last_name:  document.getElementById('profLast').value,
    phone_no:   document.getElementById('profPhone').value,
    address:    document.getElementById('profAddress').value,
    dob:        document.getElementById('profDOB').value,
    gender:     document.getElementById('profGender').value,
    job:        document.getElementById('profJob').value,
    email:      currentUser.email
  };
  const res = await Users.updateMe(data);
  if (res.ok) {
    toast('Profile updated!', 'success');
    closeModal(null);
    const meRes = await Auth.me();
    if (meRes.ok) { currentUser = meRes.data.data; setUser(currentUser); }
    document.getElementById('topName').textContent = currentUser.first_name || currentUser.username;
    document.getElementById('topAvatar').textContent = (currentUser.first_name?.[0] || currentUser.username[0]).toUpperCase();
  } else {
    toast(res.data?.message || 'Failed to update profile', 'error');
  }
}

async function changePassword() {
  const curPw = document.getElementById('curPw').value;
  const newPw = document.getElementById('newPw').value;
  if (!curPw || !newPw) { toast('Please fill both fields', 'error'); return; }
  const res = await apiCall('PUT', '/api/users/me/password', { currentPassword: curPw, newPassword: newPw });
  if (res.ok) {
    toast('Password changed!', 'success');
    document.getElementById('curPw').value = '';
    document.getElementById('newPw').value = '';
    closeModal(null);
  } else {
    toast(res.data?.message || 'Failed to change password', 'error');
  }
}

// Subscription Modal
async function openSubscriptionModal() {
  const tier = currentUser?.subscription_tier || 'default';
  
  // Check existing pending request
  const reqRes = await SubscriptionRequests.getMyRequest();
  const myReq = reqRes.ok ? reqRes.data.data : null;

  const tierLabel = t => ({ pro: 'AI Pro', doctor: 'Doctor' })[t] || 'Free';
  const statusBadge = (status) => ({
    pending:  `<span style="background:rgba(245,158,11,0.15);color:var(--orange);padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">⏳ Pending Review</span>`,
    approved: `<span style="background:rgba(76,175,80,0.15);color:#4CAF50;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">✅ Approved</span>`,
    rejected: `<span style="background:rgba(239,68,68,0.15);color:#EF4444;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">❌ Rejected</span>`,
  })[status] || '';

  const requestBanner = myReq && myReq.status === 'pending' ? `
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <i class="fas fa-clock" style="color:var(--orange)"></i>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--orange)">Upgrade Request Pending</div>
        <div style="font-size:12px;color:var(--sub);margin-top:2px">You requested the <strong>${tierLabel(myReq.requested_tier)}</strong> plan. Admin will review shortly.</div>
      </div>
    </div>` : (myReq && myReq.status === 'rejected' ? `
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:12px 16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:#EF4444"><i class="fas fa-times-circle" style="margin-right:6px"></i>Last Request Rejected</div>
      ${myReq.admin_note ? `<div style="font-size:12px;color:var(--sub);margin-top:4px">Reason: ${myReq.admin_note}</div>` : ''}
      <div style="font-size:12px;color:var(--sub);margin-top:4px">You may submit a new request below.</div>
    </div>` : '');

  const hasPending = myReq && myReq.status === 'pending';

  openModal(`
    <h3 class="modal-title">Healix Plans</h3>
    ${requestBanner}
    <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;max-height:60vh;overflow-y:auto;padding-right:8px">
      <!-- Free -->
      <div class="card" style="border:1px solid ${tier==='default'?'var(--orange)':'var(--border)'};background:${tier==='default'?'rgba(245,158,11,0.05)':'transparent'}">
        <div style="font-size:18px;font-weight:700;color:var(--orange)">Free <span style="font-size:12px;color:var(--sub);font-weight:400">${tier==='default'?'Current Plan':''}</span></div>
        <p style="font-size:13px;color:var(--sub);margin-top:8px">Basic tracking and standard meal/exercise plans.</p>
        <button class="btn-sm btn-outline" style="margin-top:12px" disabled>${tier==='default'?'Active Plan':'Current: Free'}</button>
      </div>
      
      <!-- AI Pro -->
      <div class="card" style="border:1px solid ${tier==='pro'?'#1A7AD4':'var(--border)'};background:${tier==='pro'?'rgba(26,122,212,0.05)':'transparent'}">
        <div style="font-size:18px;font-weight:700;color:#1A7AD4">AI Pro <span style="font-size:12px;color:var(--sub);font-weight:400">$9.99/mo</span></div>
        <p style="font-size:13px;color:var(--sub);margin-top:8px">Personalized AI generation for meals and exercises.</p>
        ${tier==='pro'
          ? `<button class="btn-sm btn-outline" style="margin-top:12px" disabled>Active Plan</button>`
          : hasPending && myReq.requested_tier === 'pro'
            ? `<button class="btn-sm btn-outline" style="margin-top:12px;opacity:0.6;cursor:default" disabled><i class="fas fa-clock" style="margin-right:6px"></i>Request Pending</button>`
            : `<button class="btn-sm btn-primary" style="margin-top:12px;background:#1A7AD4" onclick="requestPlanUpgrade('pro')" ${hasPending?'disabled style="opacity:0.5;cursor:not-allowed"':''}>Request AI Upgrade</button>`
        }
      </div>
      
      <!-- Doctor -->
      <div class="card" style="border:1px solid ${tier==='doctor'?'var(--purple)':'var(--border)'};background:${tier==='doctor'?'rgba(155,89,182,0.05)':'transparent'}">
        <div style="font-size:18px;font-weight:700;color:var(--purple)">Doctor <span style="font-size:12px;color:var(--sub);font-weight:400">$29.99/mo</span></div>
        <p style="font-size:13px;color:var(--sub);margin-top:8px">Human doctor assignment and real-time chat support.</p>
        ${tier==='doctor'
          ? `<button class="btn-sm btn-outline" style="margin-top:12px" disabled>Active Plan</button>`
          : hasPending && myReq.requested_tier === 'doctor'
            ? `<button class="btn-sm btn-outline" style="margin-top:12px;opacity:0.6;cursor:default" disabled><i class="fas fa-clock" style="margin-right:6px"></i>Request Pending</button>`
            : `<button class="btn-sm btn-primary" style="margin-top:12px;background:var(--purple)" onclick="requestPlanUpgrade('doctor')" ${hasPending?'disabled style="opacity:0.5;cursor:not-allowed"':''}>Request Doctor Upgrade</button>`
        }
      </div>
    </div>
    <p style="font-size:11px;color:var(--sub);text-align:center"><i class="fas fa-info-circle" style="margin-right:4px"></i>Upgrade requests are reviewed by our admin team within 24 hours.</p>
  `);
}

async function requestPlanUpgrade(tier) {
  closeModal({ target: document.getElementById('modalOverlay') });

  const tierLabel = tier === 'doctor' ? 'Doctor' : 'AI Pro';
  if (!confirm(`Submit a request to upgrade to the ${tierLabel} plan? Our admin team will review and activate it shortly.`)) return;
  const res = await SubscriptionRequests.request(tier, null);
  if (res.ok) {
    toast(`✅ ${tierLabel} plan request submitted! You'll be notified once approved.`, 'success');
  } else {
    toast(res.data?.message || 'Failed to submit request', 'error');
  }
}

async function submitDocRequest(doctorUsername) {
  closeModal({ target: document.getElementById('modalOverlay') });
  if (!confirm(`Request Doctor plan with Dr. ${doctorUsername}? Admin will review and activate it.`)) return;
  const res = await SubscriptionRequests.request('doctor', doctorUsername);
  if (res.ok) {
    toast('✅ Doctor plan request submitted! You\'ll be notified once approved.', 'success');
  } else {
    toast(res.data?.message || 'Failed to submit request', 'error');
  }
}

// Sidebar toggle
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const icon = document.getElementById('collapseIcon');
  sb.classList.toggle('collapsed');
  icon.className = sb.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
}

// Logout
function logout() {
  clearToken();
  window.location.href = 'login.html';
}

// ── Page Routing ──────────────────────────────────────────────────────────────

function goBack() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    isNavigatingHistory = true;
    showPage(pageHistory[currentHistoryIndex]);
  }
}

function goForward() {
  if (currentHistoryIndex < pageHistory.length - 1) {
    currentHistoryIndex++;
    isNavigatingHistory = true;
    showPage(pageHistory[currentHistoryIndex]);
  }
}

function updateNavButtons() {
  const backBtn = document.getElementById('navBackBtn');
  const fwdBtn = document.getElementById('navForwardBtn');
  if (backBtn) {
    backBtn.disabled = currentHistoryIndex <= 0;
    backBtn.style.color = currentHistoryIndex <= 0 ? 'var(--border)' : 'var(--text)';
  }
  if (fwdBtn) {
    fwdBtn.disabled = currentHistoryIndex >= pageHistory.length - 1;
    fwdBtn.style.color = currentHistoryIndex >= pageHistory.length - 1 ? 'var(--border)' : 'var(--text)';
  }
}

const pages = {}; // Store page render functions

async function showPage(pageId) {
  const tier = currentUser?.subscription_tier || 'default';

  // Subscription gating
  if (pageId === 'chat' && tier === 'default') {
    openSubscriptionModal();
    return;
  }
  if (pageId === 'coach' && tier !== 'doctor') {
    openSubscriptionModal();
    return;
  }

  if (!isNavigatingHistory) {
    if (pageHistory[currentHistoryIndex] !== pageId) {
      pageHistory = pageHistory.slice(0, currentHistoryIndex + 1);
      pageHistory.push(pageId);
      currentHistoryIndex++;
    }
  } else {
    isNavigatingHistory = false;
  }
  updateNavButtons();

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');

  const content = document.getElementById('content');
  content.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%"><div class="spinner"></div></div>`;

  // Dynamically load page JS if not loaded yet
  if (!pages[pageId]) {
    try {
      await loadScript(`js/pages/${pageId}.js`);
    } catch (e) {
      content.innerHTML = `<div class="alert alert-error">Page module not found or failed to load: ${pageId}</div>`;
      return;
    }
  }

  // Render
  if (pages[pageId]) {
    content.innerHTML = await pages[pageId].render();
    if (pages[pageId].init) setTimeout(() => pages[pageId].init(), 0);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// ── Modals ────────────────────────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay') && !e.target.closest('.close-modal')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalContent').innerHTML = '';
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
