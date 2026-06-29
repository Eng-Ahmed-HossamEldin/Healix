pages['chat'] = {

  // ── Render ─────────────────────────────────────────────────────────────────
  render: async () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 120px);gap:0">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 0 16px 0;flex-shrink:0">
        <div>
          <h2 class="page-title" style="margin:0">
            <span style="background:linear-gradient(135deg,#4DC3E8,#1A7AD4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">✨ Healix AI</span>
          </h2>
          <p class="page-desc" style="margin:4px 0 0">Your personal health & nutrition assistant</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div id="tokenBadge" style="display:none;padding:5px 12px;border-radius:20px;background:rgba(77,195,232,0.1);border:1px solid rgba(77,195,232,0.3);font-size:12px;font-weight:700;color:var(--teal)">
            🪙 <span id="tokenCount">50</span>/50 tokens
          </div>
          <button id="clearHistoryBtn" onclick="pages.chat.clearHistory()" title="Clear conversation"
            style="background:transparent;border:1px solid var(--border);border-radius:8px;padding:7px 14px;cursor:pointer;color:var(--sub);font-size:12px;display:flex;align-items:center;gap:6px;transition:all 0.2s"
            onmouseover="this.style.borderColor='#EF4444';this.style.color='#EF4444'"
            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--sub)'">
            <i class="fas fa-trash-alt"></i> Clear Chat
          </button>
        </div>
      </div>

      <!-- Quick Action Chips -->
      <div id="quickActions" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;flex-shrink:0">
        <button class="chip-btn" onclick="pages.chat.quickAction('generate-meal')">
          <i class="fas fa-utensils"></i> Generate Meal Plan
        </button>
        <button class="chip-btn" onclick="pages.chat.quickAction('generate-exercise')">
          <i class="fas fa-dumbbell"></i> Generate Workout Plan
        </button>
        <button class="chip-btn" onclick="pages.chat.quickAction('check-calories')">
          <i class="fas fa-fire"></i> Check My Calories
        </button>
        <button class="chip-btn" onclick="pages.chat.quickAction('find-doctor')">
          <i class="fas fa-user-doctor"></i> Find a Doctor
        </button>
        <button class="chip-btn" onclick="pages.chat.quickAction('progress')">
          <i class="fas fa-chart-line"></i> Analyze Progress
        </button>
      </div>

      <!-- Chat Window -->
      <div class="card" style="padding:0;overflow:hidden;flex:1;display:flex;flex-direction:column;min-height:0">
        <div id="chatWindow" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth">
          <!-- Messages load here -->
        </div>

        <!-- Input Bar -->
        <div style="border-top:1px solid var(--border);padding:12px 16px;flex-shrink:0">
          <div id="filePreview" style="font-size:12px;color:var(--teal);margin-bottom:8px;display:none">
            <i class="fas fa-paperclip"></i> <span id="filePreviewName"></span>
            <button onclick="pages.chat.removeFile()" style="background:none;border:none;color:var(--sub);cursor:pointer;margin-left:6px"><i class="fas fa-times"></i></button>
          </div>
          <form id="chatForm" style="display:flex;gap:10px;align-items:center">
            <label for="chatImg" style="cursor:pointer;color:var(--sub);padding:0 4px;flex-shrink:0;transition:color 0.2s" title="Attach image"
              onmouseover="this.style.color='var(--teal)'" onmouseout="this.style.color='var(--sub)'">
              <i class="fas fa-camera" style="font-size:18px"></i>
            </label>
            <input type="file" id="chatImg" accept="image/*" style="display:none">
            <input type="text" id="chatInput" placeholder="Ask me anything about your health, diet, or fitness…"
              autocomplete="off"
              style="flex:1;background:var(--card2);border:1px solid var(--border);border-radius:24px;padding:10px 18px;color:var(--text);font-size:14px;outline:none;transition:border-color 0.2s"
              onfocus="this.style.borderColor='var(--teal)'" onblur="this.style.borderColor='var(--border)'">
            <button type="submit" id="chatBtn"
              style="width:42px;height:42px;border-radius:50%;border:none;background:linear-gradient(135deg,#4DC3E8,#1A7AD4);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.2s">
              <i class="fas fa-paper-plane" style="font-size:15px"></i>
            </button>
          </form>
        </div>
      </div>

      <p style="text-align:center;font-size:11px;color:var(--sub);margin-top:8px;flex-shrink:0">
        <i class="fas fa-shield-alt"></i> Healix AI is not a medical professional. Always consult a doctor for medical decisions.
      </p>
    </div>

    <style>
      .chip-btn {
        display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;
        border:1px solid var(--border);background:var(--card2);color:var(--text);
        cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;white-space:nowrap;
      }
      .chip-btn:hover { border-color:var(--teal);color:var(--teal);background:rgba(77,195,232,0.08); }
      .msg-bubble { max-width:78%;display:flex;flex-direction:column;gap:4px; }
      .msg-bubble.user { align-self:flex-end;align-items:flex-end; }
      .msg-bubble.ai   { align-self:flex-start;align-items:flex-start; }
      .msg-text {
        padding:12px 16px;border-radius:18px;font-size:14px;line-height:1.6;word-break:break-word;
      }
      .msg-bubble.user .msg-text { background:linear-gradient(135deg,#4DC3E8,#1A7AD4);color:#fff;border-bottom-right-radius:4px; }
      .msg-bubble.ai   .msg-text { background:var(--card2);border:1px solid var(--border);color:var(--text);border-bottom-left-radius:4px; }
      .msg-meta { font-size:11px;color:var(--sub);padding:0 4px; }
      .msg-sender { font-size:11px;font-weight:700;color:var(--teal);margin-bottom:2px; }
      .typing-dot { display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--sub);animation:typingAnim 1.2s infinite; }
      .typing-dot:nth-child(2){animation-delay:0.2s}
      .typing-dot:nth-child(3){animation-delay:0.4s}
      @keyframes typingAnim { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
      .action-card {
        margin-top:10px;padding:12px 16px;border-radius:12px;
        background:rgba(77,195,232,0.08);border:1px solid rgba(77,195,232,0.3);
        display:flex;align-items:center;gap:12px;
      }
      .action-card-btn {
        padding:7px 16px;border-radius:20px;border:none;
        background:linear-gradient(135deg,#4DC3E8,#1A7AD4);color:#fff;
        cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;
      }
    </style>
  `,

  // ── Init ───────────────────────────────────────────────────────────────────
  init: async () => {
    const form    = document.getElementById('chatForm');
    const input   = document.getElementById('chatInput');
    const fileInp = document.getElementById('chatImg');

    // Show token badge for paid tiers
    const tier = currentUser?.subscription_tier || 'default';
    if (tier !== 'default') {
      const badge = document.getElementById('tokenBadge');
      if (badge) badge.style.display = 'flex';
      // Fetch initial token count
      Agent.getTokens().then(r => { if (r.ok) pages.chat._updateTokenBadge(r.data.tokens_left); });
    }

    // Load previous history
    await pages.chat.loadHistory();

    // File picker
    fileInp.addEventListener('change', () => {
      if (fileInp.files.length > 0) {
        document.getElementById('filePreview').style.display = 'block';
        document.getElementById('filePreviewName').textContent = fileInp.files[0].name;
      }
    });

    // Send form
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      const file = fileInp.files[0];
      if (!text && !file) return;

      pages.chat.addMsg(text || 'Image attached', 'user');
      input.value = '';
      pages.chat.removeFile();

      pages.chat.showTyping();
      const res = await Agent.chat(text || 'Please analyze this image.', file || null);
      pages.chat.hideTyping();

      if (res.ok && res.data) {
        // Update token badge
        pages.chat._updateTokenBadge(res.data.tokens_left);

        if (res.data.type === 'token_limit') {
          // Show token-limit card
          pages.chat.addMsg(res.data.message, 'ai');
        } else if (res.data.message) {
          pages.chat.addMsg(res.data.message, 'ai', res.data.type, res.data.data);
          // Auto-refresh related pages
          const t = res.data.type;
          if (t === 'meal_plan_created' || t === 'meal_plan_modified') {
            pages.chat._schedulePageRefresh('meals');
          } else if (t === 'exercise_plan_created' || t === 'exercise_plan_modified') {
            pages.chat._schedulePageRefresh('explan');
          } else if (t === 'targets_updated') {
            pages.chat._schedulePageRefresh('goals');
          }
        }
      } else {
        pages.chat.addMsg('Sorry, I encountered an error. Please try again.', 'ai');
      }
    });
  },

  // ── Load History ───────────────────────────────────────────────────────────
  loadHistory: async () => {
    const win = document.getElementById('chatWindow');
    const res = await Agent.history();
    if (!res.ok || !res.data.data || res.data.data.length === 0) {
      // Show welcome message
      pages.chat.addMsg(
        `Hello! I'm **Healix AI**, your personal health assistant 🌟\n\nI can help you:\n• 🍽️ Generate personalized meal plans\n• 🏋️ Create custom workout plans\n• 📊 Analyze your progress & calories\n• 👨‍⚕️ Find and connect you with doctors\n\nWhat can I help you with today?`,
        'ai'
      );
      return;
    }
    const history = res.data.data;
    history.forEach(h => pages.chat.addMsg(h.message, h.role === 'model' ? 'ai' : 'user'));
  },

  // ── Add Message ────────────────────────────────────────────────────────────
  addMsg: (text, role, actionType = null, actionData = {}) => {
    const win = document.getElementById('chatWindow');
    if (!win) return;

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role}`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let html = '';
    if (role === 'ai') html += `<div class="msg-sender"><i class="fas fa-robot" style="margin-right:5px"></i>Healix AI</div>`;

    html += `<div class="msg-text">${pages.chat.formatText(text)}</div>`;
    html += `<div class="msg-meta">${timeStr}</div>`;

    // Action card for created/modified plans
    if (actionType === 'meal_plan_created') {
      html += `
        <div class="action-card">
          <i class="fas fa-utensils" style="color:var(--teal);font-size:20px"></i>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Meal Plan Created!</div>
            <div style="font-size:12px;color:var(--sub)">Your personalized plan is ready to view</div>
          </div>
          <button class="action-card-btn" onclick="pages.chat.refreshAndShowPage('meals')">View Plan →</button>
        </div>`;
    } else if (actionType === 'meal_plan_modified') {
      html += `
        <div class="action-card">
          <i class="fas fa-pen-to-square" style="color:var(--teal);font-size:20px"></i>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Meal Plan Updated!</div>
            <div style="font-size:12px;color:var(--sub)">Your changes have been saved — Meal Plans page is now updated</div>
          </div>
          <button class="action-card-btn" onclick="pages.chat.refreshAndShowPage('meals')">View Updated Plan →</button>
        </div>`;
    } else if (actionType === 'exercise_plan_created') {
      html += `
        <div class="action-card">
          <i class="fas fa-dumbbell" style="color:var(--orange);font-size:20px"></i>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Workout Plan Created!</div>
            <div style="font-size:12px;color:var(--sub)">Your personalized plan is ready to view</div>
          </div>
          <button class="action-card-btn" onclick="pages.chat.refreshAndShowPage('explan')">View Plan →</button>
        </div>`;
    } else if (actionType === 'exercise_plan_modified') {
      html += `
        <div class="action-card">
          <i class="fas fa-pen-to-square" style="color:var(--orange);font-size:20px"></i>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Workout Plan Updated!</div>
            <div style="font-size:12px;color:var(--sub)">Your changes have been saved — Exercise Plans page is now updated</div>
          </div>
          <button class="action-card-btn" style="background:linear-gradient(135deg,#F59E0B,#EF4444)" onclick="pages.chat.refreshAndShowPage('explan')">View Updated Plan →</button>
        </div>`;
    } else if (actionType === 'doctor_linked') {
      html += `
        <div class="action-card">
          <i class="fas fa-user-doctor" style="color:#9B59B6;font-size:20px"></i>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Doctor Connected!</div>
            <div style="font-size:12px;color:var(--sub)">You can now chat with your assigned doctor</div>
          </div>
          <button class="action-card-btn" style="background:linear-gradient(135deg,#9B59B6,#7d3c98)" onclick="showPage('coach')">Open Chat →</button>
        </div>`;
    } else if (actionType === 'targets_updated') {
      html += `
        <div class="action-card">
          <i class="fas fa-sliders" style="color:#4CAF50;font-size:20px"></i>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Daily Targets Updated!</div>
            <div style="font-size:12px;color:var(--sub)">Your nutrition targets, sleep or water goals have been saved</div>
          </div>
          <button class="action-card-btn" style="background:linear-gradient(135deg,#4CAF50,#2e7d32)" onclick="showPage('goals')">View Goals →</button>
        </div>`;
    }

    bubble.innerHTML = html;
    win.appendChild(bubble);
    win.scrollTop = win.scrollHeight;
  },

  // ── Typing Indicator ───────────────────────────────────────────────────────
  showTyping: () => {
    const win = document.getElementById('chatWindow');
    const el = document.createElement('div');
    el.id = 'typingIndicator';
    el.className = 'msg-bubble ai';
    el.innerHTML = `
      <div class="msg-sender"><i class="fas fa-robot" style="margin-right:5px"></i>Healix AI</div>
      <div class="msg-text" style="padding:14px 20px">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>`;
    win.appendChild(el);
    win.scrollTop = win.scrollHeight;
    // Disable button
    const btn = document.getElementById('chatBtn');
    if (btn) { btn.style.opacity = '0.5'; btn.disabled = true; }
  },

  hideTyping: () => {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
    const btn = document.getElementById('chatBtn');
    if (btn) { btn.style.opacity = '1'; btn.disabled = false; }
  },

  // ── Quick Actions ──────────────────────────────────────────────────────────
  quickAction: async (type) => {
    const messages = {
      'generate-meal':     'Please create a personalized meal plan for me based on my goals.',
      'generate-exercise': 'Please create a personalized workout plan for me based on my fitness goals.',
      'check-calories':    'What are my daily calorie and macro targets? How am I doing today?',
      'find-doctor':       `Find me a doctor near my location.`,
      'progress':          'Analyze my recent health progress and give me personalized advice.',
    };

    const msg = messages[type];
    if (!msg) return;

    const input = document.getElementById('chatInput');
    if (input) input.value = msg;

    // Auto-submit for plan generation via one-shot API (faster + more reliable)
    if (type === 'generate-meal') {
      const tier = currentUser?.subscription_tier || 'default';
      if (tier === 'default') {
        pages.chat.addMsg(msg, 'user');
        pages.chat.addMsg('⚠️ AI plan generation requires an **AI Pro** or **Doctor** subscription. Please upgrade your plan to unlock this feature!', 'ai');
        return;
      }
      pages.chat.addMsg(msg, 'user');
      pages.chat.showTyping();
      const res = await Agent.genMealPlan();
      pages.chat.hideTyping();
      if (res.ok && res.data.plan_id) {
        pages.chat.addMsg(
          `✅ I've generated a **7-day personalized meal plan** for you based on your calorie and macro targets!\n\nClick below to view it in your Meal Plans section.`,
          'ai', 'meal_plan_created', { plan_id: res.data.plan_id }
        );
      } else {
        pages.chat.addMsg(res.data?.error || 'Failed to generate meal plan. Please make sure your Goals are set first.', 'ai');
      }
      if (input) input.value = '';
      return;
    }

    if (type === 'generate-exercise') {
      const tier = currentUser?.subscription_tier || 'default';
      if (tier === 'default') {
        pages.chat.addMsg(msg, 'user');
        pages.chat.addMsg('⚠️ AI plan generation requires an **AI Pro** or **Doctor** subscription. Please upgrade your plan to unlock this feature!', 'ai');
        return;
      }
      pages.chat.addMsg(msg, 'user');
      pages.chat.showTyping();
      const res = await Agent.genExercisePlan();
      pages.chat.hideTyping();
      if (res.ok && res.data.exercise_plan_id) {
        pages.chat.addMsg(
          `✅ I've generated a **5-day personalized workout plan** for you!\n\nClick below to view it in your Exercise Plans section.`,
          'ai', 'exercise_plan_created', { exercise_plan_id: res.data.exercise_plan_id }
        );
      } else {
        pages.chat.addMsg(res.data?.error || 'Failed to generate exercise plan. Please make sure your Goals are set first.', 'ai');
      }
      if (input) input.value = '';
      return;
    }

    // For other quick actions — just send as chat message
    document.getElementById('chatForm')?.dispatchEvent(new Event('submit'));
  },

  // ── Refresh & Navigate ─────────────────────────────────────────────────────
  // Navigate to a page and force a full data reload
  refreshAndShowPage: (pageId) => {
    // Force re-init even if already on that page by deleting the cached page
    // then calling showPage which will re-render + re-init fresh
    showPage(pageId);
  },

  // Auto-refresh a page's data in the background if it is currently active
  _schedulePageRefresh: (pageId) => {
    // Check if the requested page is already the active page (nav-item has 'active' class)
    const activeNav = document.querySelector('.nav-item.active');
    const currentPage = activeNav ? activeNav.dataset.page : null;
    if (currentPage === pageId) {
      // Re-init the page silently in-place so data refreshes without navigation
      if (pages[pageId] && pages[pageId].init) {
        setTimeout(() => {
          // Re-render and re-init to get fresh data
          const content = document.getElementById('content');
          if (content) {
            pages[pageId].render().then(html => {
              content.innerHTML = html;
              pages[pageId].init();
              toast('✅ Plan updated — page refreshed!', 'success');
            });
          }
        }, 300);
      }
    }
    // If on a different page, the user will see fresh data when they navigate there
  },

  // ── Clear History ──────────────────────────────────────────────────────────
  clearHistory: async () => {
    if (!confirm('Clear your entire conversation history? This cannot be undone.')) return;
    const res = await Agent.clearHistory();
    if (res.ok) {
      const win = document.getElementById('chatWindow');
      if (win) win.innerHTML = '';
      pages.chat.addMsg('Conversation cleared. How can I help you today? 😊', 'ai');
      toast('Chat history cleared', 'success');
    } else {
      toast('Failed to clear history', 'error');
    }
  },

  // ── File Helpers ───────────────────────────────────────────────────────────
  removeFile: () => {
    const fi = document.getElementById('chatImg');
    if (fi) fi.value = '';
    const fp = document.getElementById('filePreview');
    if (fp) fp.style.display = 'none';
  },

  // ── Token Badge Helper ─────────────────────────────────────────────────────
  _updateTokenBadge: (count) => {
    const el = document.getElementById('tokenCount');
    if (el !== null && count !== undefined) {
      el.textContent = count;
      const badge = document.getElementById('tokenBadge');
      if (badge) {
        badge.style.background = count <= 5
          ? 'rgba(239,68,68,0.1)' : count <= 15
          ? 'rgba(245,158,11,0.1)' : 'rgba(77,195,232,0.1)';
        badge.style.borderColor = count <= 5
          ? 'rgba(239,68,68,0.3)' : count <= 15
          ? 'rgba(245,158,11,0.3)' : 'rgba(77,195,232,0.3)';
        badge.style.color = count <= 5 ? '#EF4444' : count <= 15 ? '#F59E0B' : 'var(--teal)';
      }
    }
  },

  // ── Text Formatter (Markdown-lite) ─────────────────────────────────────────
  formatText: (text) => {
    if (!text) return '';
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      .replace(/^[•\-\*] (.+)/gm, '<li style="margin-left:16px">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)/gm, '<li style="margin-left:16px">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Emoji-style headers (lines starting with emoji)
      .replace(/^([\u{1F300}-\u{1FFFF}✅⚠️❌ℹ️🌟📊🍽️🏋️👨‍⚕️💪🔥💧😊].+)/gmu, '<div style="font-weight:700;margin-top:8px">$1</div>');
  }
};
