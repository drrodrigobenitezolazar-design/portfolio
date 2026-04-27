/* =========================================================
   Main script — loads content.json, renders the public page
   and handles all interactivity (nav, filters, lightbox).
   ========================================================= */

const CONTENT_URL = 'data/content.json';
const STORAGE_KEY = 'rbo_content_override_v1';
const ADMIN_FLAG = 'rbo_admin_session';

let content = null;

/* -------- Utilities -------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'data') Object.assign(e.dataset, attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (html) e.innerHTML = html;
  return e;
}

/* -------- Load content (with admin override) -------- */
async function loadContent() {
  // 1. Admin override in localStorage (when previewing edits)
  const override = localStorage.getItem(STORAGE_KEY);
  if (override) {
    try { content = JSON.parse(override); return; }
    catch (e) { console.warn('Invalid override, falling back'); }
  }
  // 2. Inline content from data/content.js (works even on file://)
  if (window.SITE_CONTENT) {
    content = JSON.parse(JSON.stringify(window.SITE_CONTENT));
    return;
  }
  // 3. As a last resort, try fetching the JSON file (only works over http/https)
  try {
    const res = await fetch(CONTENT_URL + '?v=' + Date.now());
    content = await res.json();
  } catch (e) {
    console.error('Could not load content', e);
    content = { profile: {}, experience: [], education: [], skills: [], languages: [], cases: [], stats: [] };
  }
}

/* -------- Render: profile --------- */
function renderProfile() {
  const p = content.profile || {};
  document.title = `${p.name} — ${p.title}`;
  $('[data-edit="profile.title"]').textContent = p.title || '';
  $('[data-edit="profile.location"]').textContent = p.location || '';
  $$('[data-edit="profile.intro"]').forEach(n => n.textContent = p.intro || '');
  $('[data-edit="profile.tagline"]').textContent = p.tagline || '';

  // Hero name split
  const fullName = (p.name || '').replace(/^Dr\.\s+/, '');
  const parts = fullName.split(/\s+/);
  const first = parts[0] || '';
  const last = parts.slice(1).join(' ') || '';
  $('[data-edit-fn="firstName"]').textContent = first;
  $('[data-edit-fn="lastName"]').textContent = last;

  // Brand label
  $('.brand').innerHTML = '<span class="dot"></span>' + (p.name || '');

  // Contact section
  const cEmail = $('#cEmail');
  cEmail.textContent = p.email || '';
  cEmail.href = 'mailto:' + (p.email || '');
  const cPhone = $('#cPhone');
  cPhone.textContent = p.phone || '';
  cPhone.href = 'tel:' + (p.phone || '').replace(/\s/g, '');
  const cIg = $('#cIg');
  cIg.textContent = '@' + (p.instagram || '');
  cIg.href = p.instagramUrl || '#';
  $('#cLoc').textContent = p.location || '';
  $('#cLicense').textContent = p.license || '';
}

/* -------- Render: stats -------- */
function renderStats() {
  const grid = $('#statsGrid');
  grid.innerHTML = '';
  (content.stats || []).forEach(s => {
    const node = el('div', { class: 'stat' });
    node.innerHTML = `<div class="num">${s.value}</div><div class="label">${s.label}</div>`;
    grid.appendChild(node);
  });
}

/* -------- Render: experience / education -------- */
function renderTimeline(listId, items) {
  const root = $(listId);
  root.innerHTML = '';
  items.forEach(item => {
    const tl = el('div', { class: 'tl-item' });
    const dates = item.from && item.to ? `${item.from} — ${item.to}` : (item.from || '');
    tl.innerHTML = `
      <div class="tl-date">${dates}${item.city ? ' · ' + item.city : ''}</div>
      <h3 class="tl-place">${item.place || item.degree || ''}</h3>
      ${item.role ? `<div class="tl-role">${item.role}</div>` : ''}
      ${item.degree && item.place && item.degree !== item.place ? `<div class="tl-role">${item.degree}</div>` : ''}
      ${item.summary ? `<p class="tl-summary">${item.summary}</p>` : ''}
    `;
    root.appendChild(tl);
  });
}

/* -------- Render: skills + languages -------- */
function renderTags() {
  const sk = $('#skillsList');
  sk.innerHTML = '';
  (content.skills || []).forEach(s => {
    sk.appendChild(el('span', { class: 'tag' }, s));
  });
  const lg = $('#languagesList');
  lg.innerHTML = '';
  (content.languages || []).forEach(l => {
    lg.appendChild(el('span', { class: 'tag' }, `${l.name} <span class="level">${l.level}</span>`));
  });
}

/* -------- Render: cases + filters -------- */
let activeFilter = 'all';

function renderCaseFilter() {
  const root = $('#caseFilter');
  const cats = new Set(['all']);
  (content.cases || []).forEach(c => {
    if (c.category) c.category.split('·').forEach(s => cats.add(s.trim()));
  });
  root.innerHTML = '';
  Array.from(cats).forEach(cat => {
    const b = el('button', { class: 'filter-btn' + (cat === activeFilter ? ' active' : '') }, cat === 'all' ? 'All cases' : cat);
    b.dataset.cat = cat;
    b.addEventListener('click', () => {
      activeFilter = cat;
      $$('.filter-btn').forEach(bb => bb.classList.toggle('active', bb.dataset.cat === cat));
      renderCases();
    });
    root.appendChild(b);
  });
}

function renderCases() {
  const root = $('#caseGrid');
  root.innerHTML = '';
  const cases = (content.cases || []).filter(c => {
    if (activeFilter === 'all') return true;
    return (c.category || '').includes(activeFilter);
  });
  cases.forEach(c => {
    const card = el('article', { class: 'case-card reveal' });
    card.innerHTML = `
      <div class="case-thumb">
        <div class="ba">
          <img src="${c.before}" alt="Before" loading="lazy" />
          <img src="${c.after}" alt="After" loading="lazy" />
          <span class="label before">Before</span>
          <span class="label after">After</span>
        </div>
      </div>
      <div class="case-body">
        <div class="case-cat">${c.category || 'Case'}</div>
        <div class="case-title">${c.title}</div>
        <p class="case-snippet">${c.description}</p>
      </div>
    `;
    card.addEventListener('click', () => openLightbox(c));
    root.appendChild(card);
  });
  setupReveal();
}

/* -------- Lightbox / before-after slider -------- */
function openLightbox(c) {
  const lb = $('#lightbox');
  $('#beforeImg').src = c.before;
  $('#afterImg').src = c.after;
  $('#lbCat').textContent = c.category || 'Case';
  $('#lbTitle').textContent = c.title;
  $('#lbDesc').textContent = c.description;
  const ex = $('#lbExtras');
  ex.innerHTML = '';
  (c.extras || []).forEach(src => {
    const i = el('img');
    i.src = src;
    i.alt = c.title;
    ex.appendChild(i);
  });
  resetCompareHandle();
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = $('#lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function resetCompareHandle() {
  setComparePos(50);
}
function setComparePos(percent) {
  percent = Math.max(0, Math.min(100, percent));
  // After image is clipped from the left: at percent X, the LEFT X% is hidden,
  // the right (100-X)% is visible. So the "Before" shows on the left side
  // and "After" on the right — drag right to reveal more of After.
  const after = $('#afterImg');
  const handle = $('#handle');
  if (after) after.style.clipPath = `inset(0 0 0 ${percent}%)`;
  if (handle) handle.style.left = percent + '%';
}

function bindCompareSlider() {
  const compare = $('#compare');
  let dragging = false;

  function pointerMove(e) {
    if (!dragging) return;
    const rect = compare.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = (x / rect.width) * 100;
    setComparePos(pct);
  }
  function start(e) { dragging = true; pointerMove(e); }
  function end() { dragging = false; }

  compare.addEventListener('mousedown', start);
  compare.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('touchmove', pointerMove, { passive: true });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);

  // Re-align after image on load and resize
  $('#beforeImg').addEventListener('load', resetCompareHandle);
  $('#afterImg').addEventListener('load', resetCompareHandle);
  window.addEventListener('resize', resetCompareHandle);
}

/* -------- Nav behaviour -------- */
function bindNav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = $('#menuToggle');
  const menu = $('#mobileMenu');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    menu.classList.toggle('open');
  });
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('open');
    menu.classList.remove('open');
  }));
}

/* -------- Reveal on scroll -------- */
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal:not(.in)').forEach(n => obs.observe(n));
}

/* -------- Lightbox events -------- */
function bindLightbox() {
  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lightbox').addEventListener('click', e => {
    if (e.target === $('#lightbox')) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* -------- Admin badge ---------- */
function bindAdminBadge() {
  const badge = $('#adminBadge');
  if (sessionStorage.getItem(ADMIN_FLAG) === '1') {
    badge.classList.add('on');
  }
  $('#adminExit').addEventListener('click', e => {
    e.preventDefault();
    sessionStorage.removeItem(ADMIN_FLAG);
    badge.classList.remove('on');
  });
}

/* -------- Footer/utility ---------- */
function setYear() {
  $('#year').textContent = new Date().getFullYear();
}

/* -------- Boot ---------- */
async function boot() {
  await loadContent();
  renderProfile();
  renderStats();
  renderTimeline('#experienceList', content.experience || []);
  renderTimeline('#educationList', content.education || []);
  renderTags();
  renderCaseFilter();
  renderCases();
  bindNav();
  bindCompareSlider();
  bindLightbox();
  bindAdminBadge();
  setYear();
  setupReveal();
}

document.addEventListener('DOMContentLoaded', boot);

/* Expose for admin.html */
window.RBO = {
  getContent: () => JSON.parse(JSON.stringify(content)),
  setContent: (c) => {
    content = c;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  },
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
