// ── Healix API Service ────────────────────────────────────────────────────────
const API_PROTOCOL = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;
const API_HOST = window.location.hostname || 'localhost';
const BASE = `${API_PROTOCOL}//${API_HOST}:5000`;

function getToken() { return localStorage.getItem('healix_token'); }
function setToken(t) { localStorage.setItem('healix_token', t); }
function clearToken() { localStorage.removeItem('healix_token'); localStorage.removeItem('healix_user'); }
function getUser() { try { return JSON.parse(localStorage.getItem('healix_user') || 'null'); } catch { return null; } }
function setUser(u) { localStorage.setItem('healix_user', JSON.stringify(u)); }

async function apiCall(method, path, body = null, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const opts = { method, headers, cache: 'no-store' };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  try {
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error('API Error:', e);
    return { ok: false, status: 0, data: { message: 'Network error. Is the server running?' } };
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const Auth = {
  login: (loginId, password, role = 'user') =>
    apiCall('POST', '/api/auth/login', { loginId, password, role }),
  registerUser: (data) => apiCall('POST', '/api/auth/register/user', data),
  me: () => apiCall('GET', '/api/auth/me'),
};

// ── Requirements ─────────────────────────────────────────────────────────────
const Requirements = {
  get: () => apiCall('GET', '/api/requirements/me'),
  upsert: (data) => apiCall('POST', '/api/requirements/me', data),
};

// ── Tracking ─────────────────────────────────────────────────────────────────
const Tracking = {
  summary: () => apiCall('GET', `/api/tracking/summary?date=${today()}`),
  // Food log
  getFoodLog: (date) => apiCall('GET', `/api/tracking/food-log?date=${date || today()}`),
  addFoodLog: (data) => apiCall('POST', '/api/tracking/food-log', data),
  deleteFoodLog: (id) => apiCall('DELETE', `/api/tracking/food-log/${id}`),
  // Weight
  getWeight: (limit = 30) => apiCall('GET', `/api/tracking/weight?limit=${limit}`),
  addWeight: (data) => apiCall('POST', '/api/tracking/weight', data),
  // Water
  getWater: () => apiCall('GET', '/api/tracking/water'),
  logWater: (cups) => apiCall('POST', '/api/tracking/water', { cups }),
  // Sleep
  getSleep: (limit = 7) => apiCall('GET', `/api/tracking/sleep?limit=${limit}`),
  addSleep: (data) => apiCall('POST', '/api/tracking/sleep', data),
  // Steps
  getSteps: () => apiCall('GET', '/api/tracking/steps'),
  logSteps: (data) => apiCall('POST', '/api/tracking/steps', data),
  // Exercise
  getExercise: (date) => apiCall('GET', `/api/tracking/exercise?date=${date || today()}`),
  addExercise: (data) => apiCall('POST', '/api/tracking/exercise', data),
  deleteExercise: (id) => apiCall('DELETE', `/api/tracking/exercise/${id}`),
};

// ── Foods ─────────────────────────────────────────────────────────────────────
const Foods = {
  search: (q) => apiCall('GET', `/api/foods?search=${encodeURIComponent(q || '')}`),
  getById: (id) => apiCall('GET', `/api/foods/${id}`),
};

// ── Plans ─────────────────────────────────────────────────────────────────────
const Plans = {
  getMyPlans: () => apiCall('GET', '/api/plans/my-plans'),
  getPlan: (id) => apiCall('GET', `/api/plans/${id}`),
  getMealItems: (mealId) => apiCall('GET', `/api/plans/meals/${mealId}/items`),
};

// ── Community (habits, fasting, social) ─────────────────────────────────────
const Community = {
  // Habits
  getHabits: () => apiCall('GET', '/api/community/habits'),
  createHabit: (data) => apiCall('POST', '/api/community/habits', data),
  deleteHabit: (id) => apiCall('DELETE', `/api/community/habits/${id}`),
  completeHabit: (id) => apiCall('POST', `/api/community/habits/${id}/complete`),
  uncompleteHabit: (id) => apiCall('DELETE', `/api/community/habits/${id}/complete`),
  // Fasting
  getActiveFast: () => apiCall('GET', '/api/community/fasting/active'),
  getFastHistory: () => apiCall('GET', '/api/community/fasting/history'),
  startFast: (data) => apiCall('POST', '/api/community/fasting/start', data),
  endFast: () => apiCall('POST', '/api/community/fasting/end'),
  // Social
  getPosts: () => apiCall('GET', '/api/community/posts'),
  createPost: (data) => apiCall('POST', '/api/community/posts', data),
  likePost: (id) => apiCall('POST', `/api/community/posts/${id}/like`),
  // Challenges
  getChallenges: () => apiCall('GET', '/api/community/challenges'),
  joinChallenge: (id) => apiCall('POST', `/api/community/challenges/${id}/join`),
  getMyChallenges: () => apiCall('GET', '/api/community/challenges/my'),
};

// ── Chat (legacy doctor-chat) ─────────────────────────────────────────────────
const Chat = {
  send: (message, file = null) => {
    if (file) {
      const fd = new FormData();
      fd.append('message', message);
      fd.append('file', file);
      return apiCall('POST', '/api/chat', fd, true);
    }
    return apiCall('POST', '/api/chat', { message });
  },
};

// ── AI Agent ──────────────────────────────────────────────────────────────────
const Agent = {
  chat: (message, file = null) => {
    if (file) {
      const fd = new FormData();
      fd.append('message', message);
      fd.append('file', file);
      return apiCall('POST', '/api/agent/chat', fd, true);
    }
    return apiCall('POST', '/api/agent/chat', { message });
  },
  history:         ()  => apiCall('GET',    '/api/agent/history'),
  clearHistory:    ()  => apiCall('DELETE', '/api/agent/history'),
  genMealPlan:     ()  => apiCall('POST',   '/api/agent/generate-meal-plan'),
  genExercisePlan: ()  => apiCall('POST',   '/api/agent/generate-exercise-plan'),
  getTokens:       ()  => apiCall('GET',    '/api/agent/tokens'),
};

// ── Medical Records ────────────────────────────────────────────────────────────
const MedicalRecords = {
  list: () => apiCall('GET', '/api/medical/records'),
  create: (formData) => apiCall('POST', '/api/medical/records', formData, true),
  delete: (id) => apiCall('DELETE', `/api/medical/records/${id}`),
  getPatient: (username) => apiCall('GET', `/api/medical/records/patient/${username}`),
  fileUrl: (filePath) => `${BASE}/${filePath}`,
};

// ── Medical ─────────────────────────────────────────────────────────────────
const Medical = {
  getHistory: () => apiCall('GET', '/api/medical/my-history'),
};

// ── Content ──────────────────────────────────────────────────────────────────
const Content = {
  getRecipes:   () => apiCall('GET', '/api/content/recipes'),
  getExercises: () => apiCall('GET', '/api/content/exercises'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
const Users = {
  me:             ()     => apiCall('GET',  '/api/users/me'),
  updateMe:       (data) => apiCall('PUT',  '/api/users/me', data),
  getConditions:  ()     => apiCall('GET',  '/api/users/conditions'),
  subscribe:      (data) => apiCall('POST', '/api/users/subscribe', data),
  requestDoctor:  (doctor_username) => apiCall('POST', '/api/users/request-doctor', { doctor_username }),
  // For users who already have an approved doctor subscription — directly assigns the doctor
  selectDoctor:   (doctor_username) => apiCall('POST', '/api/users/select-doctor', { doctor_username }),
  cancelDoctorRequest: () => apiCall('POST', '/api/users/cancel-doctor-request'),
};

const Messaging = {
  getChatHistory:    (partner) => apiCall('GET', `/api/messaging/history/${partner}`),
  getNotifications:  ()        => apiCall('GET', '/api/messaging/notifications'),
  readNotifications: ()        => apiCall('POST','/api/messaging/notifications/read')
};

// ── Doctors (user-facing) ──────────────────────────────────────────────────────
const Doctors = {
  list:        ()             => apiCall('GET',  '/api/doctors/list'),
  me:          ()             => apiCall('GET',  '/api/doctors/me'),
  searchUsers: (q)            => apiCall('GET',  `/api/doctors/users?search=${encodeURIComponent(q || '')}`),
  linkUser:    (data)         => apiCall('POST', '/api/doctors/link-user', data),
  getUserCase: (uname)        => apiCall('GET',  `/api/doctors/users/${uname}/case`),
  updatePatientTargets: (uname, data) => apiCall('PUT', `/api/doctors/users/${uname}/targets`, data),
  getMyExercisePlans: (uname) => apiCall('GET',  `/api/plans/exercise-plans-for/${uname}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
const Admin = {
  getUsers:            ()             => apiCall('GET',  '/api/admin/users'),
  getDoctors:          ()             => apiCall('GET',  '/api/admin/doctors'),
  updateSubscription:  (uname, data)  => apiCall('PUT',  `/api/admin/users/${uname}/subscription`, data),
  addFood:             (data)         => apiCall('POST', '/api/admin/foods', data),
  getStats:            ()             => apiCall('GET',  '/api/admin/stats'),
  // Subscription requests
  getSubscriptionRequests: ()         => apiCall('GET',  '/api/subscriptions/all'),
  reviewSubscriptionRequest: (id, action, note) => apiCall('POST', `/api/subscriptions/${id}/review`, { action, admin_note: note }),
};

// ── Subscription Requests (user-facing) ───────────────────────────────────────
const SubscriptionRequests = {
  request:   (tier, doctorUsername) => apiCall('POST', '/api/subscriptions/request', { requested_tier: tier, doctor_username: doctorUsername || null }),
  getMyRequest: ()                  => apiCall('GET',  '/api/subscriptions/my-request'),
};

// ── ExercisePlans (user-facing) ────────────────────────────────────────────────
const ExPlans = {
  getMyPlans:   ()   => apiCall('GET', '/api/plans/my-exercise-plans'),
  getPlanById:  (id) => apiCall('GET', `/api/plans/exercise-plans/${id}`),
};

// ── apiFetch compatibility shim ────────────────────────────────────────────────
// Some legacy page modules call apiFetch(path, opts) instead of the namespace objects.
async function apiFetch(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  let body = null;
  if (opts.body) {
    try { body = JSON.parse(opts.body); } catch { body = opts.body; }
  }
  return apiCall(method, '/api' + path, body);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }

function requireAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}

function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return (weightKg / (h * h)).toFixed(1);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#1A7AD4' };
  if (bmi < 25)   return { label: 'Normal',      color: '#4CAF50' };
  if (bmi < 30)   return { label: 'Overweight',  color: '#F59E0B' };
  return              { label: 'Obese',       color: '#EF4444' };
}

function calcCaloriesBurned(exercise, durationMin, intensity) {
  const MET = { Low: 3, Moderate: 5, High: 8 };
  const met = MET[intensity] || 5;
  // Estimate for ~70kg person
  return Math.round(met * 70 * (durationMin / 60));
}

function formatDate(dtStr) {
  if (!dtStr) return '';
  return new Date(dtStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(dtStr) {
  if (!dtStr) return '';
  return new Date(dtStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function elapsed(startISO) {
  const diff = Date.now() - new Date(startISO).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Simple donut chart on canvas
function drawDonut(canvas, segments, size = 140) {
  const ctx = canvas.getContext('2d');
  canvas.width = size; canvas.height = size;
  const cx = size / 2, cy = size / 2, r = size / 2 - 14, lw = 22;
  ctx.clearRect(0, 0, size, size);
  let start = -Math.PI / 2;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  segments.forEach(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    ctx.beginPath(); ctx.arc(cx, cy, r, start, start + sweep);
    ctx.strokeStyle = seg.color; ctx.lineWidth = lw; ctx.lineCap = 'butt';
    ctx.stroke(); start += sweep;
  });
}

// Simple bar chart on canvas
function drawBars(canvas, labels, values, color = '#4DC3E8', h = 120) {
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 300;
  canvas.width = w; canvas.height = h;
  const max = Math.max(...values, 1);
  const bw = (w / values.length) * 0.55;
  const gap = (w / values.length) * 0.45;
  ctx.clearRect(0, 0, w, h);
  values.forEach((v, i) => {
    const bh = (v / max) * (h - 24);
    const x = i * (bw + gap) + gap / 2;
    const y = h - bh - 20;
    ctx.fillStyle = color + '33';
    ctx.beginPath();
    ctx.roundRect(x, h - 20, bw, -Math.max(bh, 2), 4);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, Math.max(bh, 2), 4);
    ctx.fill();
    if (labels[i]) {
      ctx.fillStyle = '#8BA3B4'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + bw / 2, h - 4);
    }
  });
}

// Line chart
function drawLine(canvas, labels, values, color = '#4DC3E8', h = 120) {
  const ctx = canvas.getContext('2d');
  const w = canvas.offsetWidth || 300;
  canvas.width = w; canvas.height = h;
  if (!values.length) return;
  const min = Math.min(...values) - 1, max = Math.max(...values) + 1;
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / Math.max(values.length - 1, 1)) * (w - 20) + 10,
    y: h - 20 - ((v - min) / range) * (h - 30)
  }));
  // gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '44'); grad.addColorStop(1, 'transparent');
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  // fill below
  ctx.lineTo(pts[pts.length - 1].x, h - 20);
  ctx.lineTo(pts[0].x, h - 20);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  // dots
  pts.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
  // labels
  labels.forEach((lbl, i) => {
    ctx.fillStyle = '#8BA3B4'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(lbl, pts[i].x, h - 4);
  });
}
