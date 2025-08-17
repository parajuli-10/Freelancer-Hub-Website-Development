// preview-aware helpers
function buildPreviewUrl(targetFile) {
  const here = new URL(location.href);
  if (here.hostname !== 'html-preview.github.io') return targetFile; // normal hosting
  const raw = here.searchParams.get('url');
  if (!raw) return targetFile;
  const rawUrl = new URL(raw);
  rawUrl.pathname = rawUrl.pathname.replace(/[^/]+$/, targetFile);
  const next = new URL(here.origin + here.pathname);
  next.searchParams.set('url', rawUrl.toString());
  return next.toString();
}

function go(targetFile) {
  location.href = buildPreviewUrl(targetFile);
}

function rewriteInternalLinks() {
  const isPreview = location.hostname === 'html-preview.github.io';
  if (!isPreview) return;
  document.querySelectorAll('a[href$=".html"]').forEach(a => {
    const href = a.getAttribute('href');
    if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) return;
    a.setAttribute('href', buildPreviewUrl(href));
  });
}

(function () {
  const KEY = 'fh_user';

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  };
  const setUser = (u) => localStorage.setItem(KEY, JSON.stringify(u));
  const clearUser = () => localStorage.removeItem(KEY);

  function updateNav() {
    const u = getUser();
    const authed = !!u;

    document.querySelectorAll('.guest-only').forEach(el => { el.hidden = authed; });

    document.querySelectorAll('.auth-only').forEach(el => {
      if (!authed) { el.hidden = true; return; }
      const roles = (el.dataset.roles || 'any')
        .split(',')
        .map(s => s.trim().toLowerCase());
      el.hidden = !(roles.includes('any') || roles.includes((u.user_type || '').toLowerCase()));
    });
  }

  function onLoginPage() {
    const form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (document.getElementById('email')?.value || '').trim();
      const pwd = document.getElementById('password')?.value || '';
      const userType = document.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';

      const errors = [];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email.');
      if (!pwd) errors.push('Password is required.');

      const box = document.querySelector('.error-list'); if (box) box.innerHTML = '';
      if (errors.length) { if (box) box.innerHTML = errors.map(m=>`<p class="error">${m}</p>`).join(''); return; }

      setUser({ email, user_type: userType });
      updateNav();
      go('profile.html');
    });
  }

  function onRegisterPage() {
    const form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (document.getElementById('email')?.value || '').trim();
      const pw = document.getElementById('password')?.value || '';
      const cpw = document.getElementById('confirm_password')?.value || '';
      const userType = document.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';

      const errors = [];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email.');
      if (!pw || !cpw) errors.push('Password and confirm password are required.');
      if (pw !== cpw) errors.push('Passwords do not match.');

      const box = document.querySelector('.error-list'); if (box) box.innerHTML = '';
      if (errors.length) { if (box) box.innerHTML = errors.map(m=>`<p class="error">${m}</p>`).join(''); return; }

      setUser({ email, user_type: userType });
      updateNav();
      go('profile.html');
    });
  }

  function onProfilePage() {
    const u = getUser();
    if (!u) { go('login.html'); return; }
    const target = document.getElementById('welcome');
    if (target) target.textContent = `Welcome, ${u.email} (${u.user_type})`;
  }

  function onLogoutPage() {
    clearUser();
    updateNav();
    go('index.html');
  }

  function route() {
    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    if (page.includes('login.html')) onLoginPage();
    else if (page.includes('register.html')) onRegisterPage();
    else if (page.includes('profile.html')) onProfilePage();
    else if (page.includes('logout.html')) onLogoutPage();
  }

  document.addEventListener('DOMContentLoaded', () => {
    rewriteInternalLinks();
    updateNav();
    route();
  });
})();
