// ── Auth Page Logic ───────────────────────────────────────────────────────────

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}

// Redirect if already logged in
if (getToken()) window.location.href = 'app.html';

// ── Login ─────────────────────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');
    errEl.classList.add('hidden');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-loader').classList.remove('hidden');
    btn.disabled = true;

    const loginId = document.getElementById('loginId').value.trim();
    const password = document.getElementById('password').value;

    const res = await Auth.login(loginId, password, 'user');
    if (res.ok && res.data.data?.token) {
      setToken(res.data.data.token);
      setUser({ username: res.data.data.username, role: 'user' });
      window.location.href = 'app.html';
    } else {
      errEl.textContent = res.data.message || 'Login failed. Check your credentials.';
      errEl.classList.remove('hidden');
      btn.querySelector('.btn-text').classList.remove('hidden');
      btn.querySelector('.btn-loader').classList.add('hidden');
      btn.disabled = false;
    }
  });
}

// ── Register ──────────────────────────────────────────────────────────────────
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('regBtn');
    const errEl = document.getElementById('regError');
    const okEl = document.getElementById('regSuccess');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-loader').classList.remove('hidden');
    btn.disabled = true;

    const data = {
      user_username: document.getElementById('user_username').value.trim(),
      first_name: document.getElementById('first_name').value.trim(),
      last_name: document.getElementById('last_name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('reg_password').value,
      gender: document.getElementById('gender').value,
      dob: document.getElementById('dob').value,
      phone_no: document.getElementById('phone_no').value.trim() || null,
      address: document.getElementById('address').value.trim() || null,
      job: document.getElementById('job').value.trim() || null,
    };

    const res = await Auth.registerUser(data);
    if (res.ok) {
      okEl.textContent = 'Account created! Redirecting to login...';
      okEl.classList.remove('hidden');
      setTimeout(() => window.location.href = './login.html', 1800);
    } else {
      errEl.textContent = res.data.message || 'Registration failed.';
      errEl.classList.remove('hidden');
      btn.querySelector('.btn-text').classList.remove('hidden');
      btn.querySelector('.btn-loader').classList.add('hidden');
      btn.disabled = false;
    }
  });
}
