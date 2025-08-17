// assets/js/auth-demo.js
(function () {
  // ------------------ preview-aware navigation helpers ------------------
  function isPreviewHost() {
    const h = location.hostname.toLowerCase();
    // support common wrappers
    return h === 'html-preview.github.io' || h === 'review.github.io' || h === 'htmlpreview.github.io';
  }

  /** Build a preview-safe URL to another HTML file in the SAME repo/branch */
  function buildPreviewUrl(targetFile) {
    if (!isPreviewHost()) return targetFile; // normal hosting
    const here = new URL(location.href);
    // html-preview/review use ?url=<raw-github-url>
    const raw = here.searchParams.get('url') || here.searchParams.get('q') || here.searchParams.get('src');
    if (!raw) return targetFile; // fallback: not in a wrapper with param
    const rawUrl = new URL(raw);
    // replace last path segment (filename) with targetFile
    rawUrl.pathname = rawUrl.pathname.replace(/[^/]+$/, targetFile);
    const next = new URL(here.origin + here.pathname);
    next.searchParams.set('url', rawUrl.toString());
    return next.toString();
  }

  /** Navigate (preserves ?url= inside preview wrappers) */
  function go(targetFile) {
    location.href = buildPreviewUrl(targetFile);
  }

  /** Rewrite internal .html anchors so they preserve ?url= in preview wrappers */
  function rewriteInternalLinks() {
    if (!isPreviewHost()) return;
    document.querySelectorAll('a[href$=".html"]').forEach(a => {
      const href = a.getAttribute('href') || '';
      // skip absolute links and mailto/tel
      if (/^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)) return;
      a.setAttribute('href', buildPreviewUrl(href));
    });
  }

  // ------------------ simple fake auth (localStorage) -------------------
  const KEY = 'fh_user';
  const getUser   = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const setUser   = (u) => localStorage.setItem(KEY, JSON.stringify(u));
  const clearUser = () => localStorage.removeItem(KEY);

  // ------------------ role-gated navigation -----------------------------
  function updateNav() {
    const u = getUser();
    const authed = !!u;

    document.querySelectorAll('.guest-only').forEach(el => { el.hidden = authed; });

    document.querySelectorAll('.auth-only').forEach(el => {
      if (!authed) { el.hidden = true; return; }
      const roles = (el.dataset.roles || 'any').split(',').map(s => s.trim().toLowerCase());
      const role  = (u.user_type || '').toLowerCase();
      el.hidden = !(roles.includes('any') || roles.includes(role));
    });
  }

  // ------------------ page controllers ---------------------------------
  function onLoginPage() {
    const form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (document.getElementById('email')?.value || '').trim();
      const pwd   = document.getElementById('password')?.value || '';
      const role  = document.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';

      const errors = [];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email.');
      if (!pwd) errors.push('Password is required.');

      const box = document.querySelector('.error-list'); if (box) box.innerHTML = '';
      if (errors.length) { if (box) box.innerHTML = errors.map(m=>`<p class="error">${m}</p>`).join(''); return; }

      setUser({ email, user_type: role });
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
      const pw    = document.getElementById('password')?.value || '';
      const cpw   = document.getElementById('confirm_password')?.value || '';
      const role  = document.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';

      const errors = [];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email.');
      if (!pw || !cpw) errors.push('Password and confirm password are required.');
      if (pw !== cpw) errors.push('Passwords do not match.');

      const box = document.querySelector('.error-list'); if (box) box.innerHTML = '';
      if (errors.length) { if (box) box.innerHTML = errors.map(m=>`<p class="error">${m}</p>`).join(''); return; }

      setUser({ email, user_type: role });
      updateNav();
      go('profile.html');
    });
  }

  function onProfilePage() {
    const u = getUser();
    if (!u) { location.replace(buildPreviewUrl('login.html')); return; }
    const target = document.getElementById('welcome');
    if (target) target.textContent = `Welcome, ${u.email} (${u.user_type})`;
    // if you render role links here, rewrite them for preview:
    setTimeout(rewriteInternalLinks, 0);
  }

  function onLogoutPage() {
    clearUser();
    updateNav();
    go('index.html');
  }

  // ------------------ router -------------------------------------------
  function route() {
    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    if (page.includes('login.html')) onLoginPage();
    else if (page.includes('register.html')) onRegisterPage();
    else if (page.includes('profile.html')) onProfilePage();
    else if (page.includes('logout.html')) onLogoutPage();
  }

  // ------------------ boot ---------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    rewriteInternalLinks();
    route();
  });

  // expose for other scripts if needed
  window.previewNav = { go, buildPreviewUrl };
})();

