const Theme = {
  KEY: 'dc-theme',
  get() { return localStorage.getItem(this.KEY) || 'dark'; },
  set(t) {
    localStorage.setItem(this.KEY, t);
    document.documentElement.setAttribute('data-theme', t);
  },
  toggle() { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
  init() { this.set(this.get()); }
};
window.Theme = Theme;

function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '[OK]', error: '[ERR]', info: '[INFO]' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span style="color:var(--cyan);flex-shrink:0">${icons[type] || '>'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    t.style.transition = '.3s';
    setTimeout(() => t.remove(), 300);
  }, duration);
}
window.showToast = showToast;

class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}=+*?#.01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const length = Math.max(this.el.innerText.length, newText.length);
    const promise = new Promise(resolve => { this.resolve = resolve; });
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = this.el.innerText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 18);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.3) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve && this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

function initBoot() {
  const screen = document.getElementById('boot-screen');
  if (!screen) return;
  const log = document.getElementById('boot-log');
  const bar = document.getElementById('boot-bar-fill');
  if (!log) return;

  const lines = [
    '> DEVCENTER_OS v2.0.0 — INITIATING...',
    '> LOADING CRYPTO MODULES................. [OK]',
    '> MOUNTING /dev/center..................... [OK]',
    '> ESTABLISHING SECURE TUNNEL (AES-256).... [OK]',
    '> VERIFYING KERNEL INTEGRITY.............. [OK]',
    '> LAUNCHING UI RUNTIME.................... [OK]',
  ];

  let i = 0;
  function nextLine() {
    if (i >= lines.length) {
      if (bar) bar.style.width = '100%';
      setTimeout(() => {
        screen.classList.add('hidden');
        document.body.style.overflow = '';
      }, 700);
      return;
    }
    const li = document.createElement('div');
    li.className = 'boot-line';
    li.textContent = lines[i];
    li.style.animationDelay = '0s';
    log.appendChild(li);
    if (bar) bar.style.width = `${((i + 1) / lines.length) * 100}%`;
    i++;
    setTimeout(nextLine, 320 + Math.random() * 100);
  }

  document.body.style.overflow = 'hidden';
  setTimeout(nextLine, 300);
}

function initMatrix() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, cols, drops;
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF<>{}[]()+-=/\\#@!?';
  const fontSize = 13;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.floor(W / fontSize);
    drops = new Array(cols).fill(0).map(() => Math.floor(Math.random() * -H / fontSize));
  }
  resize();
  window.addEventListener('resize', () => { resize(); });

  function draw() {
    ctx.fillStyle = 'rgba(1,3,10,0.06)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < cols; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const y = drops[i] * fontSize;
      const progress = drops[i] / (H / fontSize);
      const r = Math.floor(79 + (0 - 79) * progress);
      const g = Math.floor(125 + (245 - 125) * progress);
      const b = Math.floor(255);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.5 + progress * 0.3})`;
      ctx.font = `${fontSize}px 'Space Mono', monospace`;
      ctx.fillText(char, i * fontSize, y);
      if (y > H && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.4;
    }
  }

  let rafId;
  function loop() { draw(); rafId = requestAnimationFrame(loop); }
  loop();
}

function initTypewriter() {
  const el = document.getElementById('hero-typewriter');
  if (!el) return;
  const text = el.dataset.text || el.textContent;
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.parentNode.insertBefore(cursor, el.nextSibling);

  let i = 0;
  function type() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(type, 28 + Math.random() * 18);
    }
  }
  setTimeout(type, 800);
}

function initScrollReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const scramblers = new WeakMap();

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const delay = parseInt(el.dataset.delay || 0);
      setTimeout(() => {
        el.classList.add('visible');
        const title = el.querySelector('.section-title, .scramble-target');
        if (title && !scramblers.has(title)) {
          const ts = new TextScramble(title);
          scramblers.set(title, ts);
          const original = title.textContent;
          ts.setText(original);
        }
      }, delay);
      obs.unobserve(el);
    });
  }, { threshold: 0.1 });

  els.forEach(el => obs.observe(el));
}

function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.counter);
      const isFloat = String(target).includes('.');
      const duration = 1600;
      const frames = duration / 16;
      const step = target / frames;
      let current = 0;
      let frame = 0;

      function tick() {
        frame++;
        current = Math.min(current + step, target);
        const scrambleChance = 1 - (frame / frames);
        if (Math.random() < scrambleChance * 0.6) {
          const chars = '0123456789';
          el.textContent = chars[Math.floor(Math.random() * chars.length)];
        } else {
          el.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
        }
        if (current < target) requestAnimationFrame(tick);
        else el.textContent = isFloat ? target.toFixed(1) : Math.floor(target);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => obs.observe(c));
}

function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

const codeSnippets = {
  js: `<span class="c-dim">// INITIALIZE SDK</span>\n<span class="c-blue">import</span> <span class="c-cyan">{ DevCenter }</span> <span class="c-blue">from</span> <span class="c-green">'@devcenter/sdk'</span>;\n\n<span class="c-blue">const</span> <span class="c-yellow">client</span> = <span class="c-blue">new</span> <span class="c-cyan">DevCenter</span>({\n  <span class="c-yellow">apiKey</span>: <span class="c-green">'dc_live_xxxxxxxx'</span>,\n  <span class="c-yellow">project</span>: <span class="c-green">'mon-projet'</span>\n});\n\n<span class="c-dim">// DEPLOY TO PROD</span>\n<span class="c-blue">const</span> <span class="c-yellow">deploy</span> = <span class="c-blue">await</span> <span class="c-yellow">client</span>.<span class="c-cyan">deploy</span>({\n  <span class="c-yellow">env</span>: <span class="c-green">'production'</span>,\n  <span class="c-yellow">branch</span>: <span class="c-green">'main'</span>\n});\n\n<span class="c-blue">console</span>.<span class="c-cyan">log</span>(<span class="c-green">\`&gt;&gt; ONLINE: \${deploy.url}\`</span>);`,
  python: `<span class="c-dim"># INITIALIZE SDK</span>\n<span class="c-blue">from</span> <span class="c-green">devcenter</span> <span class="c-blue">import</span> <span class="c-cyan">DevCenter</span>\n\n<span class="c-yellow">client</span> = <span class="c-cyan">DevCenter</span>(\n  <span class="c-yellow">api_key</span>=<span class="c-green">"dc_live_xxxxxxxx"</span>,\n  <span class="c-yellow">project</span>=<span class="c-green">"mon-projet"</span>\n)\n\n<span class="c-dim"># DEPLOY TO PROD</span>\n<span class="c-yellow">deploy</span> = <span class="c-yellow">client</span>.<span class="c-cyan">deploy</span>(\n  <span class="c-yellow">env</span>=<span class="c-green">"production"</span>\n)\n\n<span class="c-blue">print</span>(<span class="c-green">f"&gt;&gt; ONLINE: {deploy['url']}"</span>)`,
  curl: `<span class="c-dim"># DEPLOY VIA REST API</span>\n<span class="c-blue">curl</span> -X POST \\\n  <span class="c-green">https://api.devcenter.io/v1/deploy</span> \\\n  -H <span class="c-green">"Authorization: Bearer dc_live_xxx"</span> \\\n  -H <span class="c-green">"Content-Type: application/json"</span> \\\n  -d <span class="c-green">'{</span>\n    <span class="c-yellow">"project"</span>: <span class="c-green">"mon-projet"</span>,\n    <span class="c-yellow">"env"</span>:     <span class="c-green">"production"</span>,\n    <span class="c-yellow">"branch"</span>:  <span class="c-green">"main"</span>\n  <span class="c-green">}'</span>`
};

function initCodeTabs() {
  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      const wrapper = tab.closest('.code-tabs-wrapper');
      wrapper.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const block = wrapper.nextElementSibling;
      if (block && codeSnippets[lang]) {
        block.style.opacity = '0';
        setTimeout(() => {
          block.innerHTML = codeSnippets[lang];
          block.style.opacity = '1';
          block.style.transition = 'opacity .25s';
        }, 150);
      }
    });
  });
}

const searchData = [
  { icon: '[~]', title: 'Accueil', section: 'PAGE', href: '#hero' },
  { icon: '[F]', title: 'Fonctionnalites', section: 'SECTION', href: '#features' },
  { icon: '[S]', title: 'Services', section: 'SECTION', href: '#services' },
  { icon: '[D]', title: 'Documentation', section: 'SECTION', href: '#docs' },
  { icon: '[T]', title: 'Temoignages', section: 'SECTION', href: '#testimonials' },
  { icon: '[?]', title: 'FAQ', section: 'SECTION', href: '#faq' },
  { icon: '[C]', title: 'Contact', section: 'SECTION', href: '#contact' },
  { icon: '[DC]', title: 'Serveur Discord', section: 'SERVICE', href: '#services' },
  { icon: '[WEB]', title: 'Site Web', section: 'SERVICE', href: '#services' },
  { icon: '[BOT]', title: 'Bot Discord', section: 'SERVICE', href: '#services' },
  { icon: '[ADM]', title: 'Admin Panel', section: 'SYSTEM', href: 'admin/index.html' },
];

function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  if (!container) return;
  const filtered = query
    ? searchData.filter(i =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.section.toLowerCase().includes(query.toLowerCase()))
    : searchData;
  container.innerHTML = filtered.map(item => `
    <div class="search-result-item" onclick="navigateTo('${item.href}')">
      <div class="sr-icon" style="font-family:'Space Mono',monospace;font-size:.58rem">${item.icon}</div>
      <div>
        <div class="sr-title">${item.title}</div>
        <div class="sr-section">${item.section}</div>
      </div>
    </div>
  `).join('') || `<div style="padding:1rem;color:var(--text-muted);text-align:center;font-family:'Space Mono',monospace;font-size:.72rem">// NO_RESULTS_FOUND</div>`;
}

function navigateTo(href) {
  closeSearch();
  if (href.startsWith('#')) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = href;
  }
}
window.navigateTo = navigateTo;

function openSearch() {
  document.getElementById('search-overlay')?.classList.add('open');
  setTimeout(() => document.getElementById('search-input')?.focus(), 50);
  renderSearchResults('');
}
function closeSearch() {
  document.getElementById('search-overlay')?.classList.remove('open');
}
window.openSearch = openSearch;
window.closeSearch = closeSearch;

function initSearch() {
  const input = document.getElementById('search-input');
  if (input) input.addEventListener('input', e => renderSearchResults(e.target.value));
  document.getElementById('search-overlay')?.addEventListener('click', function (e) {
    if (e.target === this) closeSearch();
  });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });
}

function initNav() {
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
  }
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-center a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.nav-center a[href="#${e.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => observer.observe(s));
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span style="font-family:'Space Mono',monospace">SENDING...</span>`;
    const data = Object.fromEntries(new FormData(form));

    let ok = true;
    if (typeof DB !== 'undefined') {
      const result = await DB.createContactMessage(data);
      ok = !!result;
    } else {
      showToast('Message transmis (mode demo)', 'success');
    }

    if (!ok) {
      btn.disabled = false;
      btn.innerHTML = original;
      return;
    }

    await new Promise(r => setTimeout(r, 500));
    btn.innerHTML = `<span>[OK] MESSAGE_SENT</span>`;
    btn.style.background = 'var(--green)';
    btn.style.color = '#000';
    setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; btn.style.color = ''; btn.disabled = false; form.reset(); }, 3500);
  });
}

function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span style="font-family:'Space Mono',monospace">PROCESSING...</span>`;
    const data = Object.fromEntries(new FormData(form));

    let ok = true;
    if (typeof DB !== 'undefined') {
      const result = await DB.createOrder(data);
      ok = !!result;
    } else {
      showToast('Commande enregistree (mode demo)', 'success');
    }

    btn.disabled = false;
    btn.innerHTML = original;
    if (ok) form.reset();
  });
}

function openOrderModal(service) {
  const overlay = document.getElementById('order-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (service) {
    const sel = document.getElementById('order-service-select');
    if (sel) sel.value = service;
  }
  setTimeout(() => {
    const first = overlay.querySelector('input[name="name"]');
    if (first) first.focus();
  }, 120);
}

function closeOrderModal() {
  const overlay = document.getElementById('order-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target.id === 'order-overlay') closeOrderModal();
}

window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.handleOverlayClick = handleOverlayClick;

function initOrderModal() {
  const form = document.getElementById('order-modal-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.order-submit');
    const textEl = document.getElementById('order-submit-text');
    const iconEl = document.getElementById('order-submit-icon');

    btn.classList.add('loading');
    if (textEl) textEl.textContent = 'PROCESSING...';
    if (iconEl) iconEl.style.display = 'none';

    const data = Object.fromEntries(new FormData(form));

    let ok = false;
    if (typeof DB !== 'undefined') {
      const result = await DB.createOrder(data);
      ok = !!result;
    } else {
      await new Promise(r => setTimeout(r, 900));
      showToast('Commande enregistree (mode demo)', 'success');
      ok = true;
    }

    btn.classList.remove('loading');

    if (ok) {
      btn.classList.add('success');
      if (textEl) textEl.textContent = '[OK] COMMANDE_ENVOYEE';
      showToast('Commande transmise — nous vous contactons bientot sur Discord', 'success', 5000);
      form.reset();
      setTimeout(() => {
        btn.classList.remove('success');
        if (textEl) textEl.textContent = 'ENVOYER LA DEMANDE';
        if (iconEl) iconEl.style.display = '';
        closeOrderModal();
      }, 2200);
    } else {
      if (textEl) textEl.textContent = 'ENVOYER LA DEMANDE';
      if (iconEl) iconEl.style.display = '';
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOrderModal();
  });
}

function initFeatCards() {
  document.querySelectorAll('.feat-card').forEach((card, i) => {
    card.dataset.index = `0x${(i + 1).toString(16).padStart(2, '0').toUpperCase()}`;
  });
}

function serviceIconSVG(type) {
  const icons = {
    discord: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
    web: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
    bot: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    other: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`
  };
  return icons[type] || icons.other;
}

let _activeServicesCache = null;
async function getActiveServices() {
  if (_activeServicesCache) return _activeServicesCache;
  if (typeof DB === 'undefined') return [];
  let services;
  try { services = await DB.getServices(); } catch (e) { return []; }
  _activeServicesCache = (services || []).filter(s => s.active !== false);
  return _activeServicesCache;
}

async function renderServicesSection() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  const active = await getActiveServices();
  if (!active.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-family:'Space Mono',monospace;font-size:.8rem">// AUCUN_SERVICE_DISPONIBLE</p>`;
    return;
  }
  grid.innerHTML = active.map((s, i) => `
    <div class="svc-card reveal visible" data-delay="${i * 100}">
      <div class="svc-num">${String(i + 1).padStart(2, '0')} —</div>
      <div class="svc-icon-wrap">${serviceIconSVG(s.type)}</div>
      <div class="svc-title">${s.name}</div>
      <div class="svc-desc">${s.description || ''}</div>
      <a href="#order-section" class="svc-link">COMMANDER CE SERVICE &rsaquo;</a>
    </div>
  `).join('');
}

async function renderTestimonialsSection() {
  const grid = document.getElementById('testi-grid');
  if (!grid || typeof DB === 'undefined') return;
  let testis;
  try { testis = await DB.getTestimonials(); } catch (e) { return; }
  if (!testis || !testis.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-family:'Space Mono',monospace;font-size:.8rem">// AUCUN_TEMOIGNAGE</p>`;
    return;
  }
  grid.innerHTML = testis.map((t, i) => `
    <div class="testi-card reveal visible" data-delay="${i * 100}">
      <div class="testi-stars">${'<div class="testi-star"></div>'.repeat(t.stars || 5)}</div>
      <p class="testi-text">"${t.text}"</p>
      <div class="testi-author">
        <div class="testi-av">${(t.name || '?').slice(0, 2).toUpperCase()}</div>
        <div>
          <div class="testi-name">${t.name || ''}</div>
          <div class="testi-role">${(t.role || '').toUpperCase()}</div>
        </div>
      </div>
    </div>
  `).join('');
}

async function populateOrderServiceOptions() {
  const select = document.getElementById('order-service-select');
  if (!select) return;
  const active = await getActiveServices();

  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = '-- SELECTIONNER UN SERVICE --';
  select.appendChild(placeholder);

  if (!active.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.disabled = true;
    opt.textContent = 'Aucun service disponible actuellement';
    select.appendChild(opt);
    select.disabled = true;
    return;
  }

  active.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.type || 'other';
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}

function initHeroGlitch() {
  const line = document.querySelector('.hero h1 .line-2');
  if (!line) return;
  line.classList.add('glitch');
  line.dataset.text = line.textContent;
}

async function checkSiteSettings() {
  if (typeof DB === 'undefined') return;
  let settings;
  try { settings = await DB.getSiteSettings(); } catch (e) { return; }
  if (!settings) return;

  if (settings.maintenance_mode) {
    const overlay = document.getElementById('maintenance-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  if (settings.accept_orders === false) {
    const form = document.getElementById('order-form');
    if (form && !form.dataset.closed) {
      form.dataset.closed = '1';
      Array.from(form.elements).forEach(el => { el.disabled = true; });
      const btn = form.querySelector('.submit-btn');
      if (btn) btn.innerHTML = '<span>COMMANDES_FERMEES</span>';
      const notice = document.createElement('p');
      notice.textContent = 'Les commandes sont temporairement fermees. Revenez plus tard.';
      notice.style.cssText = "color:var(--text-muted);font-family:'Space Mono',monospace;font-size:.72rem;margin-top:.75rem;text-align:center";
      form.appendChild(notice);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await checkSiteSettings();
  Theme.init();
  initBoot();
  initMatrix();
  initHeroGlitch();
  initTypewriter();
  await Promise.all([
    renderServicesSection(),
    renderTestimonialsSection(),
    populateOrderServiceOptions()
  ]);
  initScrollReveal();
  initCounters();
  initFAQ();
  initCodeTabs();
  initSearch();
  initNav();
  initContactForm();
  initOrderForm();
  initOrderModal();
  initFeatCards();

  const codeOut = document.getElementById('code-output');
  if (codeOut) codeOut.innerHTML = codeSnippets.js;
});