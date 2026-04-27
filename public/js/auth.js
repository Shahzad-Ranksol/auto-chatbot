'use strict';

if (localStorage.getItem('token')) window.location.replace('/dashboard.html');

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

async function login() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('btn-login');
  const errEl    = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!email || !password) {
    errEl.textContent = 'Please enter your email and password.';
    errEl.style.display = 'block'; return;
  }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>&nbsp; Signing in…';
  try {
    const res  = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.replace('/dashboard.html');
  } catch (err) {
    errEl.textContent = err.message || 'Login failed. Please try again.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
