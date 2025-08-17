// assets/js/app-demo.js
(function () {
  // ---------- utilities ----------
  const JOBS_KEY  = 'FH_JOBS';
  const APPS_KEY  = 'FH_APPS';
  const SAVED_KEY = 'FH_SAVED'; // { [freelancerEmail]: number[] }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtMoney = (n) => isFinite(n) && n > 0 ? '$' + Number(n).toLocaleString() : '—';
  const when = (d) => new Date(d).toLocaleDateString();

  const read = (k, d) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }
    catch { return d; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uniqId = () => Date.now() + Math.floor(Math.random()*100000);

  const jobsChangedCbs = [];
  const notifyJobsChanged = () => jobsChangedCbs.forEach(cb => { try{cb(listJobs());}catch(e){} });
  const onJobsChanged = (cb) => { jobsChangedCbs.push(cb); };

  // ---------- auth wiring ----------
  const currentUser = () => {
    try { return JSON.parse(localStorage.getItem('fh_user')) || null; }
    catch { return null; }
  };

  const requireAuth = (role /* 'freelancer' | 'client' | undefined */) => {
    const u = currentUser();
    if (!u) { go('login.html'); return false; }
    if (role && (u.user_type || '').toLowerCase() !== role.toLowerCase()) {
      go('profile.html'); return false;
    }
    return true;
  };

  // ---------- seed demo data ----------
  (function seed() {
    const jobs = read(JOBS_KEY, []);
    if (jobs.length) return;
    const demo = [
      { title:'Front-end Developer (React)', location:'Melbourne, VIC', employmentType:'Full-time', salary:105000,
        description:'Build and maintain React components, collaborate with designers, ensure performance and accessibility.',
        clientEmail:'client@example.com' },
      { title:'Data Analyst (Contract)', location:'Sydney, NSW', employmentType:'Contract', salary:90000,
        description:'Create dashboards, analyze trends, support BI projects. SQL + Python preferred.',
        clientEmail:'client@example.com' },
      { title:'WordPress Site Setup', location:'Remote', employmentType:'Part-time', salary:35000,
        description:'Set up a small business site on WordPress, theme customization, light SEO.',
        clientEmail:'owner@acme.co' },
    ];
    const now = new Date().toISOString();
    const seeded = demo.map(j => ({ id: uniqId(), createdAt: now, ...j }));
    write(JOBS_KEY, seeded);
    write(APPS_KEY, []);
    write(SAVED_KEY, {});
  })();

  // ---------- core data ops ----------
  const listJobs = () => read(JOBS_KEY, []);
  const createJob = (job) => {
    const jobs = listJobs();
    const newJob = {
      id: uniqId(),
      title: job.title?.trim(),
      description: job.description?.trim(),
      location: job.location?.trim(),
      employmentType: job.employmentType || 'Full-time',
      salary: Number(job.salary) || 0,
      clientEmail: job.clientEmail,
      createdAt: new Date().toISOString()
    };
    jobs.unshift(newJob);
    write(JOBS_KEY, jobs);
    notifyJobsChanged();
    return newJob;
  };
  const deleteJob = (jobId) => {
    const jobs = listJobs().filter(j => j.id !== jobId);
    write(JOBS_KEY, jobs);
    notifyJobsChanged();
    // remove related apps
    const apps = read(APPS_KEY, []).filter(a => a.jobId !== jobId);
    write(APPS_KEY, apps);
    // remove from saved maps
    const saved = read(SAVED_KEY, {});
    for (const k of Object.keys(saved)) {
      saved[k] = (saved[k] || []).filter(id => id !== jobId);
    }
    write(SAVED_KEY, saved);
  };
  const listMyJobs = (clientEmail) => listJobs().filter(j => (j.clientEmail || '').toLowerCase() === (clientEmail||'').toLowerCase());

  // saved jobs
  const _savedMap = () => read(SAVED_KEY, {});
  const isSaved = (jobId, email) => (_savedMap()[email] || []).includes(jobId);
  const saveJob = (jobId, email) => {
    const s = _savedMap();
    s[email] = s[email] || [];
    if (!s[email].includes(jobId)) s[email].push(jobId);
    write(SAVED_KEY, s);
  };
  const unsaveJob = (jobId, email) => {
    const s = _savedMap();
    s[email] = (s[email] || []).filter(id => id !== jobId);
    write(SAVED_KEY, s);
  };

  // applications
  const listMyApplications = (freelancerEmail) =>
    read(APPS_KEY, []).filter(a => (a.freelancerEmail || '').toLowerCase() === (freelancerEmail||'').toLowerCase());

  const appsForJob = (jobId) => read(APPS_KEY, []).filter(a => a.jobId === jobId);

  const applyToJob = ({ jobId, freelancerEmail, coverLetter }) => {
    const apps = read(APPS_KEY, []);
    // prevent duplicate application by same freelancer to same job
    const dup = apps.find(a => a.jobId === jobId && a.freelancerEmail.toLowerCase() === freelancerEmail.toLowerCase());
    if (dup) return dup;

    const app = {
      id: uniqId(),
      jobId,
      freelancerEmail,
      coverLetter: coverLetter?.trim() || '',
      status: 'Submitted',
      createdAt: new Date().toISOString()
    };
    apps.unshift(app);
    write(APPS_KEY, apps);
    return app;
  };

  // ---------- rendering helpers ----------
  const $ = (sel) => (typeof sel === 'string' ? document.querySelector(sel) : sel);
  const ensureNode = (sel) => {
    const node = $(sel);
    if (!node) throw new Error(`container not found: ${sel}`);
    return node;
  };

  function renderJobs(containerSel, jobsOverride) {
    const c = ensureNode(containerSel);
    const u = currentUser();
    const jobs = jobsOverride || listJobs();

    if (!jobs.length) { c.innerHTML = '<p>No jobs yet.</p>'; return; }

    c.innerHTML = jobs.map(j => {
      const saved = u && u.user_type === 'freelancer' ? isSaved(j.id, u.email) : false;
      const mine = u && u.user_type === 'client' && (j.clientEmail||'').toLowerCase() === u.email.toLowerCase();
      return `
        <div class="card" data-id="${j.id}" style="padding:1rem;margin:1rem 0;border:1px solid #eee;border-radius:12px;">
          <h3>${esc(j.title)}</h3>
          <p><strong>${esc(j.location)}</strong> • ${esc(j.employmentType)} • <strong>${fmtMoney(j.salary)}</strong></p>
          <p>${esc(j.description).slice(0, 180)}${j.description.length>180?'…':''}</p>
          <p class="muted">Posted ${when(j.createdAt)}</p>
          <div class="actions">
            ${u && u.user_type === 'freelancer' ? `
              <button class="btn save-btn">${saved ? 'Unsave' : 'Save'}</button>
              <button class="btn apply-btn">Apply</button>
            ` : ''}
            ${mine ? `<button class="btn danger delete-btn">Delete</button>` : ''}
          </div>
        </div>`;
    }).join('');

    c.querySelectorAll('.card').forEach(card => {
      const id = Number(card.dataset.id);
      const saveBtn = card.querySelector('.save-btn');
      const applyBtn = card.querySelector('.apply-btn');
      const delBtn = card.querySelector('.delete-btn');

      if (saveBtn && u) {
        saveBtn.addEventListener('click', () => {
          if (isSaved(id, u.email)) {
            unsaveJob(id, u.email); saveBtn.textContent = 'Save';
            UI && UI.toast('Removed from saved');
          } else {
            saveJob(id, u.email); saveBtn.textContent = 'Unsave';
            UI && UI.toast('Job saved', 'success');
          }
        });
      }
      if (applyBtn && u) {
        applyBtn.addEventListener('click', () => {
          UI.modal({
            title: 'Apply to job',
            contentHTML: '<textarea id="cover" rows="4" style="width:100%" placeholder="Cover letter"></textarea>',
            submitText: 'Submit',
            onSubmit: () => {
              const cover = document.getElementById('cover').value;
              applyToJob({ jobId:id, freelancerEmail:u.email, coverLetter:cover || '' });
              UI && UI.toast('Application submitted','success');
            }
          });
        });
      }
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          UI.modal({
            title: 'Delete this job?',
            submitText: 'Delete',
            onSubmit: () => { deleteJob(id); UI && UI.toast('Job deleted','success'); renderJobs(containerSel); },
            cancelText: 'Cancel',
            contentHTML: '<p>Are you sure you want to delete this job?</p>'
          });
        });
      }
    });
  }

  function renderSavedJobs(containerSel, freelancerEmail) {
    const c = ensureNode(containerSel);
    const savedIds = (_savedMap()[freelancerEmail] || []);
    const jobs = listJobs().filter(j => savedIds.includes(j.id));

    c.innerHTML = `<h2>Saved Jobs</h2>` + (jobs.length ? '' : '<p>No saved jobs.</p>') +
      jobs.map(j => `
        <div class="card" style="padding:1rem;margin:1rem 0;border:1px solid #eee;border-radius:12px;">
          <h3>${esc(j.title)}</h3>
          <p><strong>${esc(j.location)}</strong> • ${esc(j.employmentType)} • <strong>${fmtMoney(j.salary)}</strong></p>
          <button class="btn unsave" data-id="${j.id}">Unsave</button>
        </div>
      `).join('');

    c.querySelectorAll('.unsave').forEach(b => {
      b.addEventListener('click', () => {
        unsaveJob(Number(b.dataset.id), freelancerEmail);
        renderSavedJobs(containerSel, freelancerEmail);
      });
    });
  }

  function renderMyApplications(containerSel, freelancerEmail) {
    const c = ensureNode(containerSel);
    const apps = listMyApplications(freelancerEmail);
    const jobsById = Object.fromEntries(listJobs().map(j => [j.id, j]));

    c.innerHTML = `<h2>My Applications</h2>` + (apps.length ? '' : '<p>No applications yet.</p>') +
      apps.map(a => {
        const j = jobsById[a.jobId] || {};
        return `
          <div class="card" style="padding:1rem;margin:1rem 0;border:1px solid #eee;border-radius:12px;">
            <h3>${esc(j.title || 'Job')}</h3>
            <p><strong>Status:</strong> ${esc(a.status)} • <span class="muted">${when(a.createdAt)}</span></p>
            ${a.coverLetter ? `<details><summary>Cover letter</summary><p>${esc(a.coverLetter)}</p></details>` : ''}
          </div>
        `;
      }).join('');
  }

  function renderMyJobs(containerSel, clientEmail) {
    const c = ensureNode(containerSel);
    const jobs = listMyJobs(clientEmail);
    const allApps = read(APPS_KEY, []);

    c.innerHTML = `<h2>My Jobs</h2>` + (jobs.length ? '' : '<p>You haven’t posted any jobs yet.</p>') +
      jobs.map(j => {
        const apps = allApps.filter(a => a.jobId === j.id);
        return `
          <div class="card" data-id="${j.id}" style="padding:1rem;margin:1rem 0;border:1px solid #eee;border-radius:12px;">
            <h3>${esc(j.title)}</h3>
            <p><strong>${esc(j.location)}</strong> • ${esc(j.employmentType)} • <strong>${fmtMoney(j.salary)}</strong></p>
            <p class="muted">Posted ${when(j.createdAt)} • Applications: ${apps.length}</p>
            <div class="actions">
              <button class="btn toggle-apps">View Applications (${apps.length})</button>
              <button class="btn danger delete-job">Delete</button>
            </div>
            <div class="apps" hidden>
              ${apps.length ? apps.map(a => `
                <div style="padding:.5rem 0;border-top:1px dashed #ddd;margin-top:.5rem;">
                  <p><strong>${esc(a.freelancerEmail)}</strong> — ${esc(a.status)} <span class="muted">(${when(a.createdAt)})</span></p>
                  ${a.coverLetter ? `<details><summary>Cover letter</summary><p>${esc(a.coverLetter)}</p></details>` : ''}
                </div>
              `).join('') : '<p>No applications yet.</p>'}
            </div>
          </div>
        `;
      }).join('');

    c.querySelectorAll('.card').forEach(card => {
      const id = Number(card.dataset.id);
      card.querySelector('.toggle-apps')?.addEventListener('click', () => {
        const box = card.querySelector('.apps');
        box.hidden = !box.hidden;
      });
      card.querySelector('.delete-job')?.addEventListener('click', () => {
        if (confirm('Delete this job?')) { deleteJob(id); renderMyJobs(containerSel, clientEmail); }
      });
    });
  }

  function renderFreelancerStats(containerSel) {
    const c = ensureNode(containerSel);
    const u = currentUser(); if (!u) return;
    const savedCount = (_savedMap()[u.email] || []).length;
    const appsCount  = listMyApplications(u.email).length;

    c.innerHTML = `
      <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem;border:1px solid #eee;border-radius:12px;">
        <div><h3>Saved Jobs</h3><p style="font-size:2rem;margin:.5rem 0;">${savedCount}</p><a class="btn" href="saved-jobs.html">View Saved</a></div>
        <div><h3>Applications</h3><p style="font-size:2rem;margin:.5rem 0;">${appsCount}</p><a class="btn" href="my-applications.html">View Applications</a></div>
      </div>
    `;
  }

  function renderClientStats(containerSel) {
    const c = ensureNode(containerSel);
    const u = currentUser(); if (!u) return;
    const myJobs = listMyJobs(u.email);
    const apps = read(APPS_KEY, []).filter(a => myJobs.some(j => j.id === a.jobId));

    c.innerHTML = `
      <div class="card" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem;border:1px solid #eee;border-radius:12px;">
        <div><h3>My Jobs</h3><p style="font-size:2rem;margin:.5rem 0;">${myJobs.length}</p><a class="btn" href="my-jobs.html">View Jobs</a></div>
        <div><h3>Applications</h3><p style="font-size:2rem;margin:.5rem 0;">${apps.length}</p><a class="btn" href="job-listings.html">Find Talent</a></div>
      </div>
    `;
  }

  function renderProfileLinks(containerSel) {
    const c = ensureNode(containerSel);
    const u = currentUser();
    if (!u) { c.innerHTML = '<p><a href="login.html">Login</a> to see your dashboard.</p>'; return; }
    if ((u.user_type || '').toLowerCase() === 'freelancer') {
      c.innerHTML = `
        <ul>
          <li><a class="btn" href="freelancer-dashboard.html">Freelancer Dashboard</a></li>
          <li><a class="btn" href="saved-jobs.html">Saved Jobs</a></li>
          <li><a class="btn" href="my-applications.html">My Applications</a></li>
        </ul>
      `;
    } else {
      c.innerHTML = `
        <ul>
          <li><a class="btn" href="client-dashboard.html">Client Dashboard</a></li>
          <li><a class="btn" href="post-job.html">Post a Job</a></li>
          <li><a class="btn" href="my-jobs.html">My Jobs</a></li>
        </ul>
      `;
    }
  }

  // ---------- export ----------
  window.appDemo = {
    // auth helpers
    currentUser, requireAuth,
    // data ops
    listJobs, createJob, deleteJob, listMyJobs,
    saveJob, unsaveJob, isSaved,
    applyToJob, listMyApplications,
    // renderers
    renderJobs, renderSavedJobs, renderMyApplications, renderMyJobs,
    renderFreelancerStats, renderClientStats, renderProfileLinks,
    onJobsChanged
  };
})();
