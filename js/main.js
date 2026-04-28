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
    const imgs = c.images || (c.before && c.after ? [c.before, c.after] : []);
    if (!imgs.length) return;
    const card = el('article', { class: 'case-card reveal' });
    const multiSvg = imgs.length > 1
      ? `<div class="multi-indicator" aria-hidden="true"><svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6.5" y="3.5" width="12" height="12" rx="1.5" stroke="white" stroke-width="1.6" fill="rgba(0,0,0,0.18)"/><rect x="3.5" y="6.5" width="12" height="12" rx="1.5" stroke="white" stroke-width="1.6" fill="rgba(0,0,0,0.45)"/></svg></div>`
      : '';
    card.innerHTML = `
      ${multiSvg}
      <img src="${imgs[0]}" alt="${c.category || 'Case'}" loading="lazy" />
      <div class="case-overlay"><span class="case-overlay-cat">${c.category || ''}</span></div>
    `;
    // Detect orientation once the image loads — portrait images get .portrait so they show fully
    const img = card.querySelector('img');
    img.addEventListener('load', () => {
      if (img.naturalHeight > img.naturalWidth * 1.1) card.classList.add('portrait');
    }, { once: true });
    card.addEventListener('click', () => openLightbox(c, imgs));
    root.appendChild(card);
  });
  setupReveal();
}

/* -------- Lightbox carousel -------- */
let _lbImages = [];
let _lbIndex = 0;

function openLightbox(c, imgs) {
  _lbImages = imgs || c.images || [];
  _lbIndex = 0;
  const lb = $('#lightbox');
  $('#lbCat').textContent = c.category || '';
  // Build slides
  const track = $('#lbTrack');
  track.innerHTML = '';
  _lbImages.forEach((src, idx) => {
    const slide = el('div', { class: 'lb-slide' });
    slide.innerHTML = `<img src="${src}" alt="${c.category || 'Case'} ${idx+1}" />`;
    track.appendChild(slide);
  });
  // Build dots
  const dots = $('#lbDots');
  dots.innerHTML = '';
  if (_lbImages.length > 1) {
    _lbImages.forEach((_, idx) => {
      const d = el('span', { class: 'lb-dot' });
      d.addEventListener('click', () => goToSlide(idx));
      dots.appendChild(d);
    });
  }
  // Show / hide nav
  const showNav = _lbImages.length > 1;
  $('#lbPrev').classList.toggle('hidden', !showNav);
  $('#lbNext').classList.toggle('hidden', !showNav);
  $('#lbCounter').style.visibility = showNav ? 'visible' : 'hidden';
  goToSlide(0, true);
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
function goToSlide(idx, instant = false) {
  if (!_lbImages.length) return;
  _lbIndex = ((idx % _lbImages.length) + _lbImages.length) % _lbImages.length;
  const track = $('#lbTrack');
  if (instant) track.style.transition = 'none';
  track.style.transform = `translateX(-${_lbIndex * 100}%)`;
  if (instant) requestAnimationFrame(() => track.style.transition = '');
  $$('.lb-dot').forEach((d, i) => d.classList.toggle('active', i === _lbIndex));
  $('#lbCounter').textContent = `${_lbIndex + 1} / ${_lbImages.length}`;
}
function next() { goToSlide(_lbIndex + 1); }
function prev() { goToSlide(_lbIndex - 1); }

function bindCarousel() {
  $('#lbPrev').addEventListener('click', prev);
  $('#lbNext').addEventListener('click', next);
  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!$('#lightbox').classList.contains('open')) return;
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
  // Touch swipe
  const stage = $('#lbStage');
  let startX = null, dx = 0;
  stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; dx = 0; }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (startX === null) return;
    dx = e.touches[0].clientX - startX;
  }, { passive: true });
  stage.addEventListener('touchend', () => {
    if (Math.abs(dx) > 60) { dx > 0 ? prev() : next(); }
    startX = null; dx = 0;
  });
  // Window resize: jump without animation
  window.addEventListener('resize', () => goToSlide(_lbIndex, true));
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
  bindCarousel();
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
