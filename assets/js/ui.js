(function(){
  const UI = {};

  // Toast notifications
  UI.toast = function(msg, type='info') {
    let root = document.getElementById('toast-root');
    if(!root){
      root = document.createElement('div');
      root.id='toast-root';
      root.className='toast-root';
      root.setAttribute('aria-live','polite');
      root.setAttribute('aria-atomic','true');
      document.body.appendChild(root);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(()=>{ t.remove(); },3000);
  };

  // Modal
  UI.modal = function(opts){
    const backdrop = document.createElement('div');
    backdrop.className='modal-backdrop';
    backdrop.setAttribute('data-modal','');
    backdrop.innerHTML = `\n  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">\n    <div class="modal-header"><h3 id="modal-title">${opts.title||''}</h3><button class="icon-btn" aria-label="Close" data-close>&times;</button></div>\n    <div class="modal-body">${opts.contentHTML||''}</div>\n    <div class="modal-footer">\n      <button class="btn ghost" data-cancel>${opts.cancelText||'Cancel'}</button>\n      <button class="btn" data-submit>${opts.submitText||'Save'}</button>\n    </div>\n  </div>`;
    document.body.appendChild(backdrop);
    const modal = backdrop.querySelector('.modal');
    const firstFocus = backdrop.querySelector('[data-close]');
    firstFocus.focus();

    function close(){
      document.removeEventListener('keydown', trap);
      backdrop.remove();
    }
    backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
    backdrop.querySelector('[data-close]').addEventListener('click', close);
    backdrop.querySelector('[data-cancel]').addEventListener('click', ()=>{ close(); opts.onCancel && opts.onCancel(); });
    backdrop.querySelector('[data-submit]').addEventListener('click', ()=>{ const res = opts.onSubmit && opts.onSubmit(); if(res!==false) close(); });
    function trap(e){
      if(e.key==='Escape') close();
      if(e.key==='Tab'){
        const focusable = backdrop.querySelectorAll('button, [href], input, textarea, select');
        const first = focusable[0];
        const last = focusable[focusable.length-1];
        if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', trap);
    return { close };
  };

  // Skeleton
  UI.skeleton = function(count=3, lines=3){
    let html='';
    for(let i=0;i<count;i++){
      html += '<div class="card">';
      for(let j=0;j<lines;j++) html += '<div class="skeleton"></div>';
      html += '</div>';
    }
    return html;
  };

  // Theme management
  function apply(theme){
    const html=document.documentElement;
    if(theme==='system') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', theme);
  }
  UI.setTheme = function(theme){
    localStorage.setItem('theme', theme);
    apply(theme);
  };
  UI.initThemeToggle = function(){
    const saved = localStorage.getItem('theme') || 'system';
    apply(saved);
    const btn = document.createElement('button');
    btn.className='theme-toggle icon-btn';
    btn.setAttribute('aria-label','Toggle theme');
    btn.innerHTML='<i data-feather="moon"></i>';
    const header=document.querySelector('.site-header');
    header && header.appendChild(btn);
    btn.addEventListener('click', ()=>{
      const current = localStorage.getItem('theme') || 'system';
      const next = current==='light' ? 'dark' : current==='dark' ? 'system' : 'light';
      UI.setTheme(next);
      btn.innerHTML = next==='dark' ? '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
      if(window.feather) feather.replace();
    });
  };

  // Header utilities
  function initHeader(){
    const header=document.querySelector('.site-header');
    if(!header) return;
    const nav = header.querySelector('.navigation');
    const toggle=document.createElement('button');
    toggle.className='menu-toggle';
    toggle.setAttribute('aria-label','Menu');
    toggle.innerHTML='<i data-feather="menu"></i>';
    header.insertBefore(toggle, nav);
    toggle.addEventListener('click', ()=>{ nav.classList.toggle('open'); });
    window.addEventListener('scroll', ()=>{
      if(window.scrollY>10) header.classList.add('is-stuck');
      else header.classList.remove('is-stuck');
    });
  }

  // Ripple effect on buttons
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.btn');
    if(!btn || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const circle=document.createElement('span');
    const d=Math.max(btn.clientWidth, btn.clientHeight);
    circle.style.width=circle.style.height=d+'px';
    circle.style.left=e.clientX-btn.getBoundingClientRect().left-d/2+'px';
    circle.style.top=e.clientY-btn.getBoundingClientRect().top-d/2+'px';
    circle.className='ripple';
    const rip=btn.getElementsByClassName('ripple')[0];
    if(rip) rip.remove();
    btn.appendChild(circle);
    setTimeout(()=>circle.remove(),600);
  });

  document.addEventListener('DOMContentLoaded', ()=>{
    UI.initThemeToggle();
    initHeader();
    const path = (new URLSearchParams(location.search).get('url') || location.pathname).split('/').pop();
    document.querySelectorAll('.navigation a').forEach(a=>{
      if(a.getAttribute('href')===path) a.classList.add('active');
    });
    if(window.feather) feather.replace();
  });

  window.UI = UI;
})();
