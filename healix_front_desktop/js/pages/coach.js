pages['coach'] = {
  render: async () => `
    <div class="page-header" style="margin-bottom:0;padding-bottom:12px;border-bottom:1px solid var(--border)">
      <h2 class="page-title">Doctor Chat</h2>
    </div>
    <div id="doctorContent" style="height:calc(100vh - 140px);display:flex;flex-direction:column">
      <div style="margin:auto;text-align:center"><div class="spinner"></div></div>
    </div>
  `,

  init: async () => {
    pages.coach.loadState();
  },

  loadState: async () => {
    const u = currentUser;
    const c = document.getElementById('doctorContent');
    if (!c) return;

    if (u.assigned_doctor_username) {
      pages.coach.renderChat(u.assigned_doctor_username);
    } else if (u.subscription_tier !== 'doctor') {
      c.innerHTML = `
        <div style="margin:auto;text-align:center;max-width:400px">
          <i class="fas fa-user-doctor" style="font-size:48px;color:var(--purple);margin-bottom:16px"></i>
          <h3 style="font-size:20px;margin-bottom:12px">Doctor Subscription Required</h3>
          <p style="color:var(--sub);font-size:14px;line-height:1.5;margin-bottom:20px">You need to upgrade to the Doctor plan before you can choose a clinician.</p>
        </div>
      `;
    } else if (u.doctor_request_status === 'pending') {
      const docLabel = u.pending_doctor_name ? u.pending_doctor_name : `Dr. ${u.pending_doctor_username || 'Doctor'}`;
      c.innerHTML = `
        <div style="margin:auto;text-align:center;max-width:400px;padding:20px">
          <div style="width:72px;height:72px;border-radius:50%;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
            <i class="fas fa-hourglass-half" style="font-size:32px;color:var(--orange)"></i>
          </div>
          <h3 style="font-size:20px;margin-bottom:12px">Request Pending Approval</h3>
          <p style="color:var(--sub);font-size:14px;line-height:1.6;margin-bottom:24px">
            Your request to connect with <strong>${docLabel}</strong> is pending review. You will be able to start chatting once the doctor approves the consultation request.
          </p>
          <button class="btn-outline" style="border-color:var(--red);color:var(--red);padding:10px 20px;border-radius:24px;font-weight:600;font-size:13px;cursor:pointer;background:transparent" onclick="pages.coach.cancelRequest()">
            <i class="fas fa-times" style="margin-right:6px"></i>Cancel Request &amp; Pick Another Doctor
          </button>
        </div>
      `;
    } else {
      // Approved doctor subscriber — let them pick a doctor
      c.innerHTML = `
        <div style="padding:20px">
          <div style="margin-bottom:24px">
            <h3 style="margin-bottom:6px">Choose Your Doctor</h3>
            <p style="font-size:13px;color:var(--sub)">Your Doctor plan is active! Select a doctor below to send a consultation request.</p>
          </div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:24px">
            <div style="flex:1;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:0 12px;height:38px">
              <i class="fas fa-search" style="color:var(--sub);font-size:13px"></i>
              <input id="docSearch" type="text" placeholder="Search by name or specialty..." style="background:none;border:none;outline:none;color:var(--text);font-size:13px;flex:1;font-family:inherit" oninput="pages.coach.filterDoctors()">
            </div>
          </div>
          <div id="doctorGrid" class="grid-3">
            <div class="spinner"></div>
          </div>
        </div>
      `;
      pages.coach.loadDoctors();
    }
  },

  loadDoctors: async () => {
    const grid = document.getElementById('doctorGrid');
    if(!grid) return;
    const res = await Doctors.list();
    if (!res.ok) { grid.innerHTML = '<div class="alert alert-error" style="grid-column:span 3">Failed to load doctors.</div>'; return; }
    window.loadedDoctors = res.data.data || [];
    pages.coach.filterDoctors();
  },

  filterDoctors: () => {
    const grid = document.getElementById('doctorGrid');
    if(!grid) return;
    const q = (document.getElementById('docSearch')?.value || '').toLowerCase();
    let docs = window.loadedDoctors || [];
    if (q) docs = docs.filter(d => (d.first_name + ' ' + d.last_name).toLowerCase().includes(q) || (d.certification || '').toLowerCase().includes(q));

    if (docs.length === 0) {
      grid.innerHTML = '<div style="grid-column:span 3;text-align:center;padding:60px;color:var(--sub)">No doctors found.</div>';
      return;
    }

    const initials = d => ((d.first_name?.[0] || '') + (d.last_name?.[0] || '')).toUpperCase() || 'DR';
    grid.innerHTML = docs.map(d => `
      <div class="card" style="border:1px solid var(--border)">
        <div style="text-align:center;margin-bottom:16px">
          <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--purple),#7d3c98);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;margin:0 auto 12px">${initials(d)}</div>
          <div style="font-size:16px;font-weight:700">Dr. ${d.first_name || ''} ${d.last_name || ''}</div>
          ${d.certification ? `<div style="font-size:12px;color:var(--purple);margin-top:4px">${d.certification}</div>` : ''}
        </div>
        <button class="btn-primary" style="background:var(--purple);font-size:13px;padding:10px" onclick="pages.coach.selectDoctor('${d.doctor_username}', 'Dr. ${d.first_name || ''} ${d.last_name || ''}')">Send Request</button>
      </div>
    `).join('');
  },

  selectDoctor: async (doctorUsername, doctorLabel) => {
    if (!confirm(`Send consultation request to ${doctorLabel}? The doctor will review your profile to approve.`)) return;
    const res = await Users.requestDoctor(doctorUsername);
    if (res.ok) {
      toast(`✅ Consultation request sent to ${doctorLabel}!`, 'success');
      // Refresh currentUser so doctor_request_status is updated
      const meRes = await Auth.me();
      if (meRes.ok) { currentUser = meRes.data.data; setUser(currentUser); }
      setTimeout(() => pages.coach.loadState(), 800);
    } else {
      toast(res.data?.message || 'Failed to request doctor', 'error');
    }
  },

  cancelRequest: async () => {
    if (!confirm('Are you sure you want to cancel your consultation request?')) return;
    const res = await Users.cancelDoctorRequest();
    if (res.ok) {
      toast('✅ Request cancelled successfully.', 'success');
      // Refresh currentUser so doctor_request_status is updated
      const meRes = await Auth.me();
      if (meRes.ok) { currentUser = meRes.data.data; setUser(currentUser); }
      setTimeout(() => pages.coach.loadState(), 800);
    } else {
      toast(res.data?.message || 'Failed to cancel request', 'error');
    }
  },

  renderChat: async (doctorUsername) => {
    const c = document.getElementById('doctorContent');
    c.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;background:var(--bg)">
        <div style="padding:16px;background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--purple);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold">DR</div>
          <div>
            <div style="font-weight:700;font-size:15px">Dr. ${doctorUsername}</div>
            <div id="coachOnlineStatus" style="font-size:11px;color:var(--green)">Connecting...</div>
          </div>
        </div>
        <div id="coachChatHistory" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth">
          <div class="spinner" style="margin:auto"></div>
        </div>
        <div style="padding:16px;background:var(--card);border-top:1px solid var(--border);display:flex;gap:12px;flex-shrink:0">
          <input type="text" id="coachChatInput" placeholder="Type a message..." style="flex:1;padding:12px 16px;border-radius:24px;border:1px solid var(--border);background:var(--bg);color:var(--text);outline:none;font-family:inherit;font-size:14px">
          <button id="coachSendBtn" class="btn-icon" style="background:var(--purple);color:#fff;width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0" onclick="pages.coach.sendMessage('${doctorUsername}')">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    // Track rendered message IDs to avoid duplicates
    pages.coach._renderedIds = new Set();
    pages.coach._lastPollPartner = doctorUsername;

    // Load chat history from REST API
    const res = await Messaging.getChatHistory(doctorUsername);
    const hist = document.getElementById('coachChatHistory');
    if (!hist) return;

    if (res.ok && res.data.data) {
      hist.innerHTML = '';
      if (res.data.data.length === 0) {
        hist.innerHTML = `<div style="margin:auto;text-align:center;color:var(--sub);font-size:13px">
          <i class="fas fa-comment-dots" style="font-size:32px;margin-bottom:12px;display:block;opacity:0.4"></i>
          No messages yet. Say hello to your doctor!
        </div>`;
      } else {
        res.data.data.forEach(msg => {
          pages.coach.appendMessage(msg);
          if (msg.id) pages.coach._renderedIds.add(msg.id);
        });
        hist.scrollTop = hist.scrollHeight;
      }
    } else {
      hist.innerHTML = '<div style="margin:auto;color:var(--red)">Failed to load chat history</div>';
    }

    // Setup Socket — use the global joinChatRoom helper
    if (window.socket) {
      window.socket.off('receive_message');
    }

    joinChatRoom(currentUser.username, doctorUsername, (msg) => {
      // Skip messages sent by ME — already added optimistically
      if (msg.sender_username === currentUser.username) return;
      // Clear empty-state placeholder if present
      const emptyState = document.querySelector('#coachChatHistory > div[style*="margin:auto"]');
      if (emptyState) emptyState.remove();
      // Skip if already rendered (dedup with poll)
      if (msg.id && pages.coach._renderedIds.has(msg.id)) return;
      if (msg.id) pages.coach._renderedIds.add(msg.id);
      pages.coach.appendMessage(msg);
      const h = document.getElementById('coachChatHistory');
      if (h) h.scrollTop = h.scrollHeight;
    });

    // ── Polling fallback (every 4 s) so doctor messages always arrive ───────
    if (pages.coach._pollTimer) clearInterval(pages.coach._pollTimer);
    pages.coach._pollTimer = setInterval(async () => {
      // Stop polling if the chat window is no longer in DOM
      if (!document.getElementById('coachChatHistory') || pages.coach._lastPollPartner !== doctorUsername) {
        clearInterval(pages.coach._pollTimer);
        pages.coach._pollTimer = null;
        return;
      }
      const pr = await Messaging.getChatHistory(doctorUsername);
      if (!pr.ok || !pr.data.data) return;
      const h = document.getElementById('coachChatHistory');
      if (!h) return;
      let newMsgs = pr.data.data.filter(m => m.id && !pages.coach._renderedIds.has(m.id));
      if (newMsgs.length === 0) return;
      // Resolve optimistic messages the user already sent (dedup with DOM)
      newMsgs = newMsgs.filter(m => {
        if (m.sender_username === currentUser.username) {
          const optMsgs = pages.coach._optimisticMsgs || [];
          const optIdx = optMsgs.indexOf(m.message);
          if (optIdx !== -1) {
            pages.coach._renderedIds.add(m.id);
            pages.coach._optimisticMsgs.splice(optIdx, 1);
            return false;
          }
        }
        return true;
      });
      if (newMsgs.length === 0) return;
      const emptyState = h.querySelector('div[style*="margin:auto"]');
      if (emptyState) emptyState.remove();
      newMsgs.forEach(m => {
        pages.coach.appendMessage(m);
        pages.coach._renderedIds.add(m.id);
      });
      h.scrollTop = h.scrollHeight;
    }, 4000);

    // Update status label once connected
    const updateStatus = () => {
      const el = document.getElementById('coachOnlineStatus');
      if (el) el.textContent = window.socket?.connected ? 'Online' : 'Reconnecting...';
    };
    if (window.socket) {
      window.socket.on('connect', updateStatus);
      window.socket.on('disconnect', updateStatus);
      updateStatus();
    }

    // Enter key to send
    const inputEl = document.getElementById('coachChatInput');
    if (inputEl) {
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') pages.coach.sendMessage(doctorUsername);
      });
      inputEl.focus();
    }
  },

  appendMessage: (msg) => {
    const hist = document.getElementById('coachChatHistory');
    if (!hist) return;
    const isMe = msg.sender_username === currentUser.username;
    const bg = isMe ? 'var(--purple)' : 'var(--card)';
    const color = isMe ? '#fff' : 'var(--text)';
    const align = isMe ? 'flex-end' : 'flex-start';
    const radius = isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
    const border = isMe ? 'none' : '1px solid var(--border)';
    const time = msg.created_at
      ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const idAttr = msg.id ? `id="coach-msg-${msg.id}"` : '';

    hist.insertAdjacentHTML('beforeend', `
      <div ${idAttr} style="align-self:${align};max-width:75%;display:flex;flex-direction:column;gap:4px">
        <div style="background:${bg};color:${color};padding:10px 16px;border-radius:${radius};border:${border};font-size:14px;line-height:1.4;word-break:break-word">
          ${msg.message}
        </div>
        <div style="font-size:10px;color:var(--sub);align-self:${isMe ? 'flex-end' : 'flex-start'}">${time}</div>
      </div>
    `);
  },

  sendMessage: (doctorUsername) => {
    const inp = document.getElementById('coachChatInput');
    if (!inp) return;
    const txt = inp.value.trim();
    if (!txt) return;

    // Optimistically add message to UI immediately
    const hist = document.getElementById('coachChatHistory');
    const emptyState = hist ? hist.querySelector('div[style*="margin:auto"]') : null;
    if (emptyState) emptyState.remove();

    pages.coach._optimisticMsgs = pages.coach._optimisticMsgs || [];
    pages.coach._optimisticMsgs.push(txt);

    pages.coach.appendMessage({
      sender_username: currentUser.username,
      receiver_username: doctorUsername,
      message: txt,
      created_at: new Date().toISOString(),
      id: null
    });

    if (hist) hist.scrollTop = hist.scrollHeight;

    inp.value = '';
    inp.focus();

    // Emit via Socket.IO to persist and broadcast
    if (window.socket) {
      window.socket.emit('send_message', {
        sender_username: currentUser.username,
        receiver_username: doctorUsername,
        message: txt
      });
    } else {
      toast('Chat connection unavailable. Please refresh.', 'error');
    }
  }
};
