(function(){
  const Storage = {
    get(k, fallback){
      try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch(e){ return fallback; }
    },
    set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  };

  const Auth = {
    get(){ return Storage.get('fh_user', null); },
    set(u){ Storage.set('fh_user', u); },
    clear(){ localStorage.removeItem('fh_user'); },
    require(){ if(!this.get()){ window.location.href = 'login.html'; } },
    isClient(){ const u=this.get(); return u && u.user_type==='client'; },
    isFreelancer(){ const u=this.get(); return u && u.user_type==='freelancer'; }
  };
  window.Auth = Auth; // expose for debugging if needed

  function seedJobs(){
    if(!localStorage.getItem('fh_jobs')){
      const now = new Date();
      const jobs = [
        {id:1,title:'Frontend Developer',company:'TechSoft',location:'New York',salary:90000,type:'Full-time',remote:'Hybrid',description:'Build UI components.',postedBy:'client1@example.com',createdAt:new Date(now-86400000*2).toISOString(),status:'open'},
        {id:2,title:'Graphic Designer',company:'DesignPro',location:'Remote',salary:60000,type:'Contract',remote:'Remote',description:'Create marketing materials.',postedBy:'client2@example.com',createdAt:new Date(now-86400000*5).toISOString(),status:'open'},
        {id:3,title:'Backend Engineer',company:'ServerCorp',location:'San Francisco',salary:120000,type:'Full-time',remote:'On-site',description:'Work on APIs.',postedBy:'client1@example.com',createdAt:new Date(now-86400000*10).toISOString(),status:'open'},
        {id:4,title:'Data Analyst',company:'DataWorks',location:'Chicago',salary:80000,type:'Part-time',remote:'Hybrid',description:'Analyze datasets.',postedBy:'client3@example.com',createdAt:new Date(now-86400000*20).toISOString(),status:'open'},
        {id:5,title:'Project Manager',company:'BuildIt',location:'Seattle',salary:95000,type:'Full-time',remote:'Remote',description:'Manage projects.',postedBy:'client2@example.com',createdAt:new Date(now-86400000*15).toISOString(),status:'open'},
        {id:6,title:'QA Tester',company:'QualityPlus',location:'Austin',salary:70000,type:'Casual',remote:'On-site',description:'Test software.',postedBy:'client3@example.com',createdAt:new Date(now-86400000*3).toISOString(),status:'open'}
      ];
      Storage.set('fh_jobs', jobs);
    }
    if(!localStorage.getItem('fh_apps')) Storage.set('fh_apps', []);
    if(!localStorage.getItem('fh_saved')) Storage.set('fh_saved', {});
  }

  function getJobs(){ return Storage.get('fh_jobs', []); }
  function saveJobs(j){ Storage.set('fh_jobs', j); }
  function getApps(){ return Storage.get('fh_apps', []); }
  function saveApps(a){ Storage.set('fh_apps', a); }
  function getSaved(){ return Storage.get('fh_saved', {}); }
  function saveSaved(s){ Storage.set('fh_saved', s); }

  function toggleNav(){
    const u = Auth.get();
    document.querySelectorAll('.guest-only').forEach(el=>{el.style.display = u? 'none':'';});
    document.querySelectorAll('.auth-only').forEach(el=>{el.style.display = u? '':'' : 'none';});
    document.querySelectorAll('.for-freelancer').forEach(el=>{el.style.display = Auth.isFreelancer()? '':'none';});
    document.querySelectorAll('.for-client').forEach(el=>{el.style.display = Auth.isClient()? '':'none';});
  }

  function router(){
    const page = location.pathname.split('/').pop();
    switch(page){
      case 'login.html': return controllerLogin();
      case 'register.html': return controllerRegister();
      case 'logout.html': return controllerLogout();
      case 'profile.html': return controllerProfile();
      case 'job-listings.html': return controllerListings();
      case 'job-details.html': return controllerJobDetails();
      case 'saved-jobs.html': return controllerSaved();
      case 'my-applications.html': return controllerApplications();
      case 'post-job.html': return controllerPostJob();
      case 'my-jobs.html': return controllerMyJobs();
    }
  }

  /* Controllers */
  function controllerLogin(){
    const form = document.querySelector('form');
    const err = document.querySelector('.error-list');
    form?.addEventListener('submit', e=>{
      e.preventDefault();
      err.textContent = '';
      const email = form.querySelector('#email').value.trim();
      const pwd = form.querySelector('#password').value.trim();
      const type = form.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';
      const errs = [];
      if(!email) errs.push('Email is required');
      if(!pwd) errs.push('Password is required');
      if(errs.length){ err.innerHTML = errs.map(e=>`<p>${e}</p>`).join(''); return; }
      Auth.set({email,user_type:type});
      window.location.href = 'profile.html';
    });
  }

  function controllerRegister(){
    const form = document.querySelector('form');
    const err = document.querySelector('.error-list');
    form?.addEventListener('submit', e=>{
      e.preventDefault();
      err.textContent='';
      const email = form.querySelector('#email').value.trim();
      const pwd = form.querySelector('#password').value.trim();
      const pwd2 = form.querySelector('#confirm_password').value.trim();
      const type = form.querySelector('input[name="user_type"]:checked')?.value || 'freelancer';
      const errs=[];
      if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)) errs.push('Valid email required');
      if(!pwd) errs.push('Password required');
      if(pwd!==pwd2) errs.push('Passwords must match');
      if(errs.length){ err.innerHTML = errs.map(e=>`<p>${e}</p>`).join(''); return; }
      Auth.set({email,user_type:type});
      window.location.href = 'profile.html';
    });
  }

  function controllerLogout(){
    Auth.clear();
    window.location.href = 'index.html';
  }

  function controllerProfile(){
    Auth.require();
    const u = Auth.get();
    document.getElementById('welcome').textContent = `Welcome, ${u.email} (${u.user_type})`;
    const panels = document.getElementById('profile-panels');
    const jobs = getJobs();
    if(Auth.isFreelancer()){
      const newest = jobs.filter(j=>j.status==='open').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3);
      panels.innerHTML = `
        <div class="cards">
          <div class="card"><a href="saved-jobs.html" class="btn">Saved Jobs</a></div>
          <div class="card"><a href="my-applications.html" class="btn">My Applications</a></div>
        </div>
        <h2 style="margin-top:1.5rem;">Newest Jobs</h2>
        <ul>
          ${newest.map(j=>`<li><a href="job-details.html?id=${j.id}">${j.title}</a></li>`).join('')}
        </ul>`;
    } else if(Auth.isClient()){
      const own = jobs.filter(j=>j.postedBy===u.email).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3);
      panels.innerHTML = `
        <div class="cards">
          <div class="card"><a href="post-job.html" class="btn">Post a Job</a></div>
          <div class="card"><a href="my-jobs.html" class="btn">My Jobs</a></div>
        </div>
        <h2 style="margin-top:1.5rem;">Recent Posts</h2>
        <ul>
          ${own.map(j=>`<li><a href="job-details.html?id=${j.id}">${j.title}</a></li>`).join('')}
        </ul>`;
    }
  }

  function controllerListings(){
    const jobsList = document.getElementById('jobs-list');
    const form = document.getElementById('filters');
    const pagination = document.getElementById('pagination');
    let page = 1; const pageSize = 6;

    function applyFilters(){
      const jobs = getJobs().filter(j=>j.status==='open');
      const q = form.querySelector('#filter-q').value.toLowerCase();
      const loc = form.querySelector('#filter-location').value.toLowerCase();
      const type = form.querySelector('#filter-type').value;
      const remote = form.querySelector('#filter-remote').value;
      const min = parseInt(form.querySelector('#filter-salary-min').value,10) || 0;
      const max = parseInt(form.querySelector('#filter-salary-max').value,10) || Infinity;
      const age = parseInt(form.querySelector('#filter-age').value,10) || null;
      let list = jobs.filter(j=>
        (!q || [j.title,j.company,j.location,j.description].some(v=>v.toLowerCase().includes(q))) &&
        (!loc || j.location.toLowerCase().includes(loc)) &&
        (!type || j.type===type) &&
        (!remote || j.remote===remote) &&
        (j.salary>=min && j.salary<=max) &&
        (!age || (Date.now()-new Date(j.createdAt).getTime())/86400000 <= age)
      );
      return list;
    }

    function render(){
      const list = applyFilters();
      const pages = Math.max(1, Math.ceil(list.length/pageSize));
      if(page>pages) page=pages;
      const start = (page-1)*pageSize;
      const slice = list.slice(start,start+pageSize);
      jobsList.innerHTML = slice.map(j=>{
        const saved = isSaved(j.id);
        const authF = Auth.isFreelancer();
        return `<div class="card"><h3>${j.title}</h3><p>${j.company} - ${j.location}</p>
        <p>Salary: $${j.salary}</p>
        <a class="btn" href="job-details.html?id=${j.id}">View</a>
        ${authF? `<button class="save-btn" data-id="${j.id}">${saved?'Unsave':'Save'}</button> <a class="btn" href="job-details.html?id=${j.id}">Apply</a>`:''}
        </div>`;
      }).join('');
      pagination.innerHTML = '';
      if(pages>1){
        for(let i=1;i<=pages;i++){
          const b=document.createElement('button');
          b.textContent=i; if(i===page) b.disabled=true;
          b.addEventListener('click',()=>{page=i; render();});
          pagination.appendChild(b);
        }
      }
      jobsList.querySelectorAll('.save-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
          toggleSave(parseInt(btn.dataset.id));
          render();
        });
      });
    }
    form?.addEventListener('submit',e=>{e.preventDefault(); page=1; render();});
    render();
  }

  function controllerJobDetails(){
    const params = new URLSearchParams(location.search);
    const id = parseInt(params.get('id'),10);
    const detail = document.getElementById('job-detail');
    const err = document.querySelector('.error-list');
    const applyBox = document.getElementById('apply-box');
    const job = getJobs().find(j=>j.id===id);
    if(!job){ detail.textContent = 'Job not found'; return; }
    detail.innerHTML = `<h1>${job.title}</h1>
      <p><strong>${job.company}</strong> - ${job.location}</p>
      <p>Salary: $${job.salary}</p>
      <p>Type: ${job.type} | Remote: ${job.remote}</p>
      ${job.status==='closed'?'<p><strong>Closed</strong></p>':''}
      <p>${job.description}</p>`;
    const authF = Auth.isFreelancer();
    if(authF){
      const saved = isSaved(job.id);
      applyBox.innerHTML = `
        <button id="save-btn" class="btn">${saved?'Unsave':'Save'}</button>
        <form id="apply-form" style="margin-top:1rem;">
          <label>Name <input id="app-name" required></label>
          <label>Email <input id="app-email" required></label>
          <label>Cover Note <textarea id="app-note" required></textarea></label>
          <button class="btn" type="submit">Apply</button>
        </form>
        <div class="success" style="margin-top:.5rem;"></div>`;
      document.getElementById('app-email').value = Auth.get().email;
      const savedBtn=document.getElementById('save-btn');
      savedBtn.addEventListener('click',()=>{toggleSave(job.id); savedBtn.textContent=isSaved(job.id)?'Unsave':'Save';});
      const form=document.getElementById('apply-form');
      const success=applyBox.querySelector('.success');
      if(hasApplied(job.id)) form.querySelector('button').disabled=true;
      form.addEventListener('submit',e=>{
        e.preventDefault(); err.textContent=''; success.textContent='';
        if(hasApplied(job.id)){ err.textContent='You already applied.'; return; }
        if(job.status==='closed'){ err.textContent='Job is closed.'; return; }
        const name=form.querySelector('#app-name').value.trim();
        const email=form.querySelector('#app-email').value.trim();
        const note=form.querySelector('#app-note').value.trim();
        if(!name||!email||!note){ err.textContent='All fields required.'; return; }
        const apps=getApps();
        const newId=apps.length? Math.max(...apps.map(a=>a.id))+1:1;
        apps.push({id:newId,jobId:job.id,userEmail:Auth.get().email,note,createdAt:new Date().toISOString(),status:'submitted'});
        saveApps(apps);
        form.querySelector('button').disabled=true;
        success.textContent='Application submitted';
      });
    }
  }

  function controllerSaved(){
    Auth.require();
    if(!Auth.isFreelancer()) return window.location.href='index.html';
    const listDiv=document.getElementById('saved-jobs');
    function render(){
      const savedIds=getSaved()[Auth.get().email]||[];
      const jobs=getJobs().filter(j=>savedIds.includes(j.id));
      listDiv.innerHTML=jobs.map(j=>`<div class="card"><h3>${j.title}</h3><p>${j.company}</p><a class="btn" href="job-details.html?id=${j.id}">View</a> <button data-id="${j.id}" class="unsave-btn">Unsave</button></div>`).join('');
      listDiv.querySelectorAll('.unsave-btn').forEach(btn=>btn.addEventListener('click',()=>{toggleSave(parseInt(btn.dataset.id)); render();}));
    }
    render();
  }

  function controllerApplications(){
    Auth.require();
    if(!Auth.isFreelancer()) return window.location.href='index.html';
    const div=document.getElementById('my-apps');
    const apps=getApps().filter(a=>a.userEmail===Auth.get().email);
    const jobs=getJobs();
    div.innerHTML=apps.map(a=>{
      const job=jobs.find(j=>j.id===a.jobId)||{};
      return `<div class="card"><h3>${job.title||'Job'}</h3><p>Status: ${a.status}</p><a class="btn" href="job-details.html?id=${a.jobId}">View</a></div>`;
    }).join('');
  }

  function controllerPostJob(){
    Auth.require();
    if(!Auth.isClient()) return window.location.href='index.html';
    const form=document.getElementById('post-job');
    const err=document.querySelector('.error-list');
    form?.addEventListener('submit',e=>{
      e.preventDefault(); err.textContent='';
      const title=form.querySelector('#job-title').value.trim();
      const company=form.querySelector('#job-company').value.trim();
      const location=form.querySelector('#job-location').value.trim();
      const salary=parseInt(form.querySelector('#job-salary').value,10)||0;
      const type=form.querySelector('#job-type').value;
      const remote=form.querySelector('#job-remote').value;
      const desc=form.querySelector('#job-desc').value.trim();
      const errs=[]; if(!title||!company||!location||!desc) errs.push('All fields required');
      if(errs.length){ err.innerHTML=errs.map(e=>`<p>${e}</p>`).join(''); return; }
      const jobs=getJobs();
      const id=jobs.length?Math.max(...jobs.map(j=>j.id))+1:1;
      jobs.push({id,title,company,location,salary,type,remote,description:desc,postedBy:Auth.get().email,createdAt:new Date().toISOString(),status:'open'});
      saveJobs(jobs);
      window.location.href='my-jobs.html';
    });
  }

  function controllerMyJobs(){
    Auth.require();
    if(!Auth.isClient()) return window.location.href='index.html';
    const div=document.getElementById('my-jobs');
    function render(){
      const jobs=getJobs().filter(j=>j.postedBy===Auth.get().email);
      div.innerHTML=jobs.map(j=>{
        return `<div class="card" data-id="${j.id}">
          <h3><a href="job-details.html?id=${j.id}">${j.title}</a></h3>
          <label>Title <input class="f-title" value="${j.title}"></label>
          <label>Company <input class="f-company" value="${j.company}"></label>
          <label>Location <input class="f-location" value="${j.location}"></label>
          <label>Salary <input type="number" class="f-salary" value="${j.salary}"></label>
          <label>Type <select class="f-type"><option${j.type==='Full-time'?' selected':''}>Full-time</option><option${j.type==='Part-time'?' selected':''}>Part-time</option><option${j.type==='Contract'?' selected':''}>Contract</option><option${j.type==='Casual'?' selected':''}>Casual</option></select></label>
          <label>Remote <select class="f-remote"><option${j.remote==='On-site'?' selected':''}>On-site</option><option${j.remote==='Hybrid'?' selected':''}>Hybrid</option><option${j.remote==='Remote'?' selected':''}>Remote</option></select></label>
          <label>Description <textarea class="f-desc">${j.description}</textarea></label>
          <button class="save-btn">Save</button>
          <button class="toggle-status">${j.status==='open'?'Close':'Open'}</button>
        </div>`;
      }).join('');
      div.querySelectorAll('.save-btn').forEach(btn=>btn.addEventListener('click',()=>{
        const card=btn.closest('.card');
        const id=parseInt(card.dataset.id);
        const jobs=getJobs();
        const job=jobs.find(j=>j.id===id);
        job.title=card.querySelector('.f-title').value.trim();
        job.company=card.querySelector('.f-company').value.trim();
        job.location=card.querySelector('.f-location').value.trim();
        job.salary=parseInt(card.querySelector('.f-salary').value,10)||0;
        job.type=card.querySelector('.f-type').value;
        job.remote=card.querySelector('.f-remote').value;
        job.description=card.querySelector('.f-desc').value.trim();
        saveJobs(jobs);
      }));
      div.querySelectorAll('.toggle-status').forEach(btn=>btn.addEventListener('click',()=>{
        const card=btn.closest('.card');
        const id=parseInt(card.dataset.id);
        const jobs=getJobs();
        const job=jobs.find(j=>j.id===id);
        job.status=job.status==='open'?'closed':'open';
        saveJobs(jobs);
        render();
      }));
    }
    render();
  }

  /* Helpers */
  function isSaved(jobId){
    const map=getSaved();
    const arr=map[Auth.get()?.email]||[];
    return arr.includes(jobId);
  }
  function toggleSave(jobId){
    const map=getSaved();
    const email=Auth.get()?.email; if(!email) return;
    const arr=map[email]||[];
    if(arr.includes(jobId)) map[email]=arr.filter(id=>id!==jobId); else arr.push(jobId), map[email]=arr;
    saveSaved(map);
  }
  function hasApplied(jobId){
    return getApps().some(a=>a.jobId===jobId && a.userEmail===Auth.get()?.email);
  }

  document.addEventListener('DOMContentLoaded', function(){
    seedJobs();
    toggleNav();
    router();
  });
})();
