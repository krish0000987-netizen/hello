// Zofed Foods - interactions (mobile + user friendly)
const PHONE = '7240975556';
const WA_BASE = `https://wa.me/91${PHONE}`;

function waLink(msg){
  return `${WA_BASE}?text=${encodeURIComponent(msg)}`;
}
const DEFAULT_WA_MSG = "Hello Zofed Foods, I am interested in your ready-to-cook food products. Please share more details.";

document.addEventListener('DOMContentLoaded', ()=>{
  // header scroll
  const header = document.querySelector('.header');
  const onScroll = ()=> header && header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // inject mobile bottom action bar if not present (user friendly thumb access)
  if(!document.querySelector('.mobile-action-bar')){
    const bar = document.createElement('div');
    bar.className = 'mobile-action-bar';
    bar.setAttribute('role','toolbar');
    bar.setAttribute('aria-label','Quick actions');
    bar.innerHTML = `
      <a href="tel:+91${PHONE}" class="btn btn-ghost" aria-label="Call Zofed Foods"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01-0 0.18 2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.57 2.11L6 7a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.57c.907.339 1.85.573 2.81.7A2 2 0 0122 13.92z" style="transform:translate(3px,3px)"/></svg> Call Now</a>
      <a href="#" data-wa="${DEFAULT_WA_MSG}" class="btn btn-whatsapp" aria-label="WhatsApp Zofed Foods"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19.05 4.94A9.82 9.82 0 0012 2a9.82 9.82 0 00-8.45 14.86L2 22l5.26-1.38A9.82 9.82 0 1019.05 4.94zM12 20a7.82 7.82 0 01-4-1.1l-.29-.17-3.12.82.83-3.05-.19-.31A7.82 7.82 0 1112 20zm6.59-5.85c-.36-.18-2.14-1.06-2.47-1.18s-.57-.18-.81.18-1 .23-1.18.23-.37.18-.74.37-.72.43-.34.83 1.24 1.73 2.14 2.35c.1.07.2.15.29.21.36.22.64.35.86.45.36.16.68.14.96.09.29-.05.9-.37 1.03-.73.13-.36.13-.67.09-.73-.04-.07-.18-.11-.54-.29z"/></svg> WhatsApp</a>
    `;
    document.body.appendChild(bar);
  }

  // skip link injection for a11y
  if(!document.querySelector('.skip-link')){
    const skip = document.createElement('a');
    skip.href = '#main';
    skip.className = 'skip-link';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
    const mainEl = document.querySelector('main');
    if(mainEl && !mainEl.id) mainEl.id = 'main';
  }

  // drawer - improved mobile friendly
  const btn = document.getElementById('hamburger');
  const drawer = document.getElementById('drawer');
  const backdrop = drawer?.querySelector('.drawer-backdrop');
  const closeBtn = document.getElementById('drawerClose');
  let lastFocus = null;
  function openDrawer(){
    lastFocus = document.activeElement;
    drawer?.classList.add('open');
    btn?.classList.add('active');
    btn?.setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
    // focus first link
    setTimeout(()=> drawer?.querySelector('.drawer-nav a')?.focus(), 100);
  }
  function closeDrawer(){
    drawer?.classList.remove('open');
    btn?.classList.remove('active');
    btn?.setAttribute('aria-expanded','false');
    document.body.style.overflow='';
    if(lastFocus) lastFocus.focus();
  }
  btn?.addEventListener('click', ()=> drawer.classList.contains('open') ? closeDrawer() : openDrawer());
  backdrop?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && drawer?.classList.contains('open')) closeDrawer(); });
  // trap focus + swipe close
  let touchStartX = 0;
  drawer?.addEventListener('touchstart', e=> touchStartX = e.touches[0].clientX, {passive:true});
  drawer?.addEventListener('touchend', e=>{
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(dx > 80) closeDrawer();
  }, {passive:true});

  // reveal on scroll
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in') });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=> obs.observe(el));

  // whatsapp buttons (delegate for dynamically injected bar too)
  document.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-wa]');
    if(!el) return;
    e.preventDefault();
    const msg = el.getAttribute('data-wa') || DEFAULT_WA_MSG;
    window.open(waLink(msg),'_blank','noopener');
  });

  // product gallery
  document.querySelectorAll('.gallery-thumbs button').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.gallery-thumbs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const src = b.querySelector('img')?.src;
      const main = document.getElementById('galleryMainImg');
      if(src && main){
        main.style.opacity='0.6';
        const img = new Image();
        img.onload = ()=>{ main.src = src; main.style.opacity='1'; };
        img.src = src;
      }
    });
  });

  // product filters - mobile friendly with clear, empty state, debounce
  const search = document.getElementById('productSearch');
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('[data-category]');
  let activeCat = 'all';

  // add clear button
  if(search && !document.querySelector('.search-clear')){
    const clear = document.createElement('button');
    clear.type='button';
    clear.className='search-clear';
    clear.setAttribute('aria-label','Clear search');
    clear.textContent='✕';
    search.parentElement?.appendChild(clear);
    const toggleClear = ()=> clear.classList.toggle('show', !!search.value);
    search.addEventListener('input', toggleClear);
    clear.addEventListener('click', ()=>{ search.value=''; toggleClear(); applyFilter(); search.focus(); });
    toggleClear();
  }

  // inject empty state
  const grid = document.getElementById('productGrid');
  let emptyEl = document.getElementById('emptyState');
  if(grid && !emptyEl){
    emptyEl = document.createElement('div');
    emptyEl.id='emptyState';
    emptyEl.className='empty-state';
    emptyEl.innerHTML=`<h3>No products found</h3><p>Try a different search or category.</p><button class="btn btn-ghost" style="margin-top:12px;min-height:44px" onclick="document.getElementById('productSearch').value='';document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));document.querySelector('.chip[data-filter=all]').classList.add('active');document.dispatchEvent(new CustomEvent('resetFilter'))">Clear filters</button>`;
    grid.parentElement?.appendChild(emptyEl);
    document.addEventListener('resetFilter', ()=>{ activeCat='all'; applyFilter(); });
  }

  function applyFilter(){
    const q = (search?.value || '').toLowerCase().trim();
    let visible=0;
    cards.forEach(c=>{
      const cat = c.getAttribute('data-category');
      const text = c.textContent.toLowerCase();
      const catOk = activeCat==='all' || cat===activeCat;
      const qOk = !q || text.includes(q);
      const show = catOk && qOk;
      c.style.display = show ? '' : 'none';
      if(show) visible++;
    });
    if(emptyEl) emptyEl.classList.toggle('show', visible===0);
    // update URL for shareability (no reload)
    if(search && chips.length){
      const params = new URLSearchParams();
      if(activeCat!=='all') params.set('cat', activeCat);
      if(q) params.set('q', q);
      history.replaceState(null,'', params.toString() ? `?${params}` : location.pathname);
    }
  }
  // debounce search
  let t;
  search?.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(applyFilter, 220); });
  chips.forEach(ch=>{
    ch.addEventListener('click', ()=>{
      chips.forEach(x=>x.classList.remove('active'));
      ch.classList.add('active');
      activeCat = ch.dataset.filter;
      // scroll chip into view on mobile
      ch.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
      applyFilter();
    });
  });
  // restore from URL on load
  try{
    const p = new URLSearchParams(location.search);
    const cat = p.get('cat');
    const q = p.get('q');
    if(cat && document.querySelector(`.chip[data-filter="${cat}"]`)){
      chips.forEach(x=>x.classList.remove('active'));
      document.querySelector(`.chip[data-filter="${cat}"]`)?.classList.add('active');
      activeCat=cat;
    }
    if(q && search){ search.value=q; search.parentElement?.querySelector('.search-clear')?.classList.add('show'); }
    if(cat||q) applyFilter();
  }catch(e){}

  // enquiry form -> whatsapp + better UX
  const form = document.getElementById('enquiryForm');
  if(form){
    // auto format phone
    const phoneInput = form.querySelector('#fPhone');
    phoneInput?.addEventListener('input', ()=>{
      let v = phoneInput.value.replace(/\D/g,'').slice(0,10);
      phoneInput.value = v;
    });
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;
      form.querySelectorAll('.field').forEach(f=> f.classList.remove('invalid'));
      const get = id=> form.querySelector('#'+id);
      const name = get('fName')?.value.trim();
      const phone = get('fPhone')?.value.trim();
      const email = get('fEmail')?.value.trim();
      const product = get('fProduct')?.value.trim();
      const message = get('fMessage')?.value.trim();

      if(!name){ valid=false; const f=get('fName')?.closest('.field'); f?.classList.add('invalid'); firstInvalid=firstInvalid||get('fName'); }
      if(!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s+/g,''))){ valid=false; const f=get('fPhone')?.closest('.field'); f?.classList.add('invalid'); firstInvalid=firstInvalid||get('fPhone'); }
      if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ valid=false; const f=get('fEmail')?.closest('.field'); f?.classList.add('invalid'); firstInvalid=firstInvalid||get('fEmail'); }
      if(!message){ valid=false; const f=get('fMessage')?.closest('.field'); f?.classList.add('invalid'); firstInvalid=firstInvalid||get('fMessage'); }
      if(!valid){ firstInvalid?.focus(); // shake animation
        firstInvalid?.animate([{transform:'translateX(0)'},{transform:'translateX(6px)'},{transform:'translateX(-6px)'},{transform:'translateX(0)'}],{duration:320, easing:'ease-out'});
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : '';
      if(submitBtn){ submitBtn.textContent='Opening WhatsApp…'; submitBtn.disabled=true; }

      const lines = [
        `Hello Zofed Foods,`,
        `I am interested in your ready-to-cook products.`,
        ``,
        `Name: ${name}`,
        `Phone: ${phone}`,
        email ? `Email: ${email}` : null,
        product ? `Interested Product: ${product}` : null,
        `Message: ${message}`,
        ``,
        `Please share more details.`
      ].filter(Boolean).join('\n');
      window.open(waLink(lines),'_blank','noopener');
      const ok = document.getElementById('formSuccess');
      if(ok){ ok.style.display='block'; ok.scrollIntoView({behavior:'smooth', block:'center'}); setTimeout(()=>{ ok.style.display='none'; if(submitBtn){ submitBtn.textContent=origText; submitBtn.disabled=false; } }, 4000); }
      else if(submitBtn){ setTimeout(()=>{ submitBtn.textContent=origText; submitBtn.disabled=false; }, 1200); }
      form.reset();
      form.querySelectorAll('.search-clear').forEach(c=>c.classList.remove('show'));
    });
    // live validation clear on input
    form.querySelectorAll('input, textarea, select').forEach(el=>{
      el.addEventListener('input', ()=> el.closest('.field')?.classList.remove('invalid'));
      el.addEventListener('change', ()=> el.closest('.field')?.classList.remove('invalid'));
    });
  }

  // product enquiry via url param
  const urlParams = new URLSearchParams(location.search);
  const p = urlParams.get('product');
  if(p){
    const title = document.getElementById('detailTitle');
    const cat = document.getElementById('detailCat');
    const desc = document.getElementById('detailDesc');
    const map = {
      snacks:{title:'Ready-to-Cook Snacks',cat:'Ready-to-Cook Snacks',desc:'Crispy, flavourful snacks crafted to deliver authentic taste with effortless preparation — perfect for tea-time, gatherings and everyday cravings.'},
      meals:{title:'Instant Meal Solutions',cat:'Instant Meal Solutions',desc:'Wholesome, satisfying meal options designed for busy days — ready in minutes, without compromising on taste or quality.'},
      frozen:{title:'Frozen / Ready-to-Cook Delicacies',cat:'Frozen Delicacies',desc:'Chef-inspired delicacies preserved for freshness, ready to cook and serve whenever you need a special meal.'},
      indian:{title:'Indian Favorites',cat:'Indian Favorites',desc:'Beloved Indian classics made convenient — rich flavours and familiar tastes, prepared to perfection at home.'},
      quick:{title:'Quick Meal Options',cat:'Quick Meal Options',desc:'Light, fast and delicious options for when time is short but taste still matters.'},
      breakfast:{title:'Quick Breakfast Solutions',cat:'Quick Meal Options',desc:'Start the day deliciously with easy, ready-to-cook breakfast choices loved by the whole family.'}
    };
    if(map[p] && title){
      title.textContent = map[p].title;
      if(cat) cat.textContent = map[p].cat;
      if(desc) desc.textContent = map[p].desc;
      const waBtn = document.getElementById('detailWa');
      if(waBtn) waBtn.setAttribute('data-wa', `Hello Zofed Foods, I am interested in ${map[p].title}. Please share more details.`);
    }
  }

  // improve header hamburger a11y
  if(btn){
    btn.setAttribute('aria-label','Open navigation menu');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls','drawer');
  }
});
