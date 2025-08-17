(function () {
  // ------------------ preview-aware navigation helpers ------------------
  function isPreviewHost() {
    const h = location.hostname.toLowerCase();
    return h === 'html-preview.github.io' || h === 'review.github.io';
  }

  /** Build a preview-safe URL to another HTML file in the SAME repo/branch */
  function buildPreviewUrl(targetFile) {
    if (!isPreviewHost()) return targetFile; // normal hosting
    const here = new URL(location.href);
    const raw = here.searchParams.get('url');
    if (!raw) return targetFile; // fallback: not in a wrapper
    const rawUrl = new URL(raw);
    // replace the last path segment (filename) with targetFile
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

    // elements visible only when logged OUT
    document.querySelectorAll('.guest-only').forEach(el => { el.hidden = authed; });

    // elements visible only when logged IN (optionally by role)
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

    // Optional: render role links if a container exists
    const links = document.getElementById('role-links');
    if (links) {
      if ((u.user_type || '').toLowerCase() === 'freelancer') {
        links.innerHTML = `
          <ul>
            <li><a class="btn" href="freelancer-dashboard.html">Freelancer Dashboard</a></li>
            <li><a class="btn" href="saved-jobs.html">Saved Jobs</a></li>
            <li><a class="btn" href="my-applications.html">My Applications</a></li>
          </ul>`;
      } else {
        links.innerHTML = `
          <ul>
            <li><a class="btn" href="client-dashboard.html">Client Dashboard</a></li>
            <li><a class="btn" href="post-job.html">Post a Job</a></li>
            <li><a class="btn" href="my-jobs.html">My Jobs</a></li>
          </ul>`;
      }
      // make those links preview-safe too
      rewriteInternalLinks();
    }
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

  // expose helpers if needed elsewhere (e.g., other scripts)
  window.previewNav = { go, buildPreviewUrl, isPreviewHost, rewriteInternalLinks };
})();
