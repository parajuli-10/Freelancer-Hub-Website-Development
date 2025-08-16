// assets/js/auth-demo.js
(function () {
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // --- storage helpers ---
  const KEY = 'fh_user';
  function setUser(u) { localStorage.setItem(KEY, JSON.stringify(u)); }
  function getUser() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  function clearUser() { localStorage.removeItem(KEY); }

  // --- validation helpers ---
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function showErrors(errors) {
    const box = $('.error-list');
    if (!box) return;
    box.innerHTML = errors.map(msg => `<p class="error">${msg}</p>`).join('');
  }

  // --- page behaviors ---
  function onLoginPage() {
    const form = $('form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = ($('#email')?.value || '').trim();
      const pwd = $('#password')?.value || '';
      const userType = document.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';

      const errors = [];
      if (!isValidEmail(email)) errors.push('Please enter a valid email.');
      if (!pwd) errors.push('Password is required.');
      if (errors.length) { showErrors(errors); return; }

      // Demo-only: accept any credentials
      setUser({ email, user_type: userType });
      window.location.href = 'profile.html';
    });
  }

  function onRegisterPage() {
    const form = $('form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = ($('#email')?.value || '').trim();
      const pwd = $('#password')?.value || '';
      const cpw = $('#confirm_password')?.value || '';
      const userType = document.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';

      const errors = [];
      if (!isValidEmail(email)) errors.push('Please enter a valid email.');
      if (!pwd || !cpw) errors.push('Password and confirm password are required.');
      if (pwd !== cpw) errors.push('Passwords do not match.');
      if (errors.length) { showErrors(errors); return; }

      // Demo-only: "create" user and auto-login
      setUser({ email, user_type: userType });
      window.location.href = 'profile.html';
    });
  }

  function onProfilePage() {
    const u = getUser();
    if (!u) { window.location.replace('login.html'); return; }
    const welcome = $('#welcome');
    if (welcome) welcome.textContent = `Welcome, ${u.email} (${u.user_type})`;
  }

  function onLogoutPage() {
    clearUser();
    window.location.replace('index.html');
  }

  // --- router by filename ---
  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  if (page.includes('login.html')) onLoginPage();
  else if (page.includes('register.html')) onRegisterPage();
  else if (page.includes('profile.html')) onProfilePage();
  else if (page.includes('logout.html')) onLogoutPage();
})();
