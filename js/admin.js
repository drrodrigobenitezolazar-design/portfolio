/* =========================================================
   Admin editor — local-only editing with password gate.
   - Default password: rodrigo2026  (change PASSWORD_HASH below)
   - Stored as SHA-256 hash so the password isn't visible in source.
   - All edits are kept in localStorage; user exports JSON to publish.
   ========================================================= */

// SHA-256 of the default password "rodrigo2026"
// To change the password: open browser console on this page and run:
//   await sha256("yournewpassword")
// Then paste the resulting hash below.
const PASSWORD_HASH = "b21f65f19ec266a82965228ca3ea5b5765687dfda53e080e82ccf3fca988290f";

const STORAGE_KEY = 'rbo_content_override_v1';
const ADMIN_FLAG = 'rbo_admin_session';
const CONTENT_URL = 'data/content.json';

let content = null;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
window.sha256 = sha256; // expose for password rotation

/* ---- LOGIN ---- */
async function tryLogin(pwd) {
  const h = await sha256(pwd);
  return h === PASSWORD_HASH;
}

async function handleLogin() {
  const pwd = $('#pwd').value;
  const err = $('#loginErr');
  err.textContent = '';
  if (!pwd) { err.textContent = 'Enter a password.'; return; }
  const ok = await tryLogin(pwd);
  if (!ok) { err.textContent = 'Incorrect password.'; return; }
  sessionStorage.setItem(ADMIN_FLAG, '1');
  await enterEditor();
}

/* ---- LOAD CONTENT ---- */
async function loadContent() {
  const override = localStorage.getItem(STORAGE_KEY);
  if (override) {
    try { content = JSON.parse(override); return; } catch {}
  }
  if (window.SITE_CONTENT) {
    content = JSON.parse(JSON.stringify(window.SITE_CONTENT));
    return;
  }
  const res = await fetch(CONTENT_URL + '?v=' + Date.now());
  content = await res.json();
}

/* ---- BIND profile inputs ---- */
function bindSimpleInputs() {
  $$('input[data-bind], textarea[data-bind]').forEach(inp => {
    const path = inp.dataset.bind.split('.');
    let v = content;
    for (const p of path) v = v && v[p];
    inp.value = v || '';
    inp.addEventListener('input', () => {
      let obj = content;
      for (let i = 0; i < path.length - 1; i++) {
        if (!obj[path[i]]) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = inp.value;
    });
  });
}

/* ---- EXPERIENCE / EDUCATION ---- */
function makeListEditor(rootId, key, fields, template) {
  const root = $('#' + rootId);
  function render() {
    root.innerHTML = '';
    (content[key] || []).forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button class="remove" data-act="del" data-idx="${idx}" title="Remove">×</button>
        ${fields.map(f => `
          <div class="admin-row${f.full ? ' full' : ''}">
            <label>${f.label}</label>
            ${f.type === 'textarea'
              ? `<textarea data-key="${f.key}" rows="3">${escape(item[f.key] || '')}</textarea>`
              : `<input type="text" data-key="${f.key}" value="${escape(item[f.key] || '')}" />`}
          </div>
        `).join('')}
        <div class="admin-actions" style="margin-top: 14px; gap: 8px;">
          <button class="add-btn" data-act="up" data-idx="${idx}" style="width:auto; padding: 6px 14px;">↑ Up</button>
          <button class="add-btn" data-act="down" data-idx="${idx}" style="width:auto; padding: 6px 14px;">↓ Down</button>
        </div>
      `;
      // bind inputs
      $$('[data-key]', card).forEach(inp => {
        inp.addEventListener('input', () => { item[inp.dataset.key] = inp.value; });
      });
      // bind buttons
      $$('[data-act]', card).forEach(btn => {
        btn.addEventListener('click', () => {
          const a = btn.dataset.act;
          if (a === 'del') content[key].splice(idx, 1);
          if (a === 'up' && idx > 0) [content[key][idx-1], content[key][idx]] = [content[key][idx], content[key][idx-1]];
          if (a === 'down' && idx < content[key].length - 1) [content[key][idx+1], content[key][idx]] = [content[key][idx], content[key][idx+1]];
          render();
        });
      });
      root.appendChild(card);
    });
  }
  return { render, add: () => { content[key] = content[key] || []; content[key].push({...template}); render(); } };
}

function escape(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

/* ---- SKILLS / LANGUAGES ---- */
function bindSkillsLangs() {
  const sk = $('#skillsTextarea');
  sk.value = (content.skills || []).join('\n');
  sk.addEventListener('input', () => {
    content.skills = sk.value.split('\n').map(s => s.trim()).filter(Boolean);
  });
  const lg = $('#langsTextarea');
  lg.value = (content.languages || []).map(l => `${l.name} | ${l.level}`).join('\n');
  lg.addEventListener('input', () => {
    content.languages = lg.value.split('\n').map(line => {
      const [name, level] = line.split('|').map(s => s.trim());
      return name ? { name, level: level || '' } : null;
    }).filter(Boolean);
  });
}

/* ---- STATS ---- */
function bindStats() {
  const root = $('#statsList');
  function render() {
    root.innerHTML = '';
    (content.stats || []).forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button class="remove" data-idx="${idx}">×</button>
        <div class="admin-row"><label>Number</label><input type="text" data-key="value" value="${escape(s.value || '')}" /></div>
        <div class="admin-row"><label>Label</label><input type="text" data-key="label" value="${escape(s.label || '')}" /></div>
      `;
      $$('[data-key]', card).forEach(inp => {
        inp.addEventListener('input', () => { s[inp.dataset.key] = inp.value; });
      });
      $$('.remove', card).forEach(btn => btn.addEventListener('click', () => {
        content.stats.splice(idx, 1); render();
      }));
      root.appendChild(card);
    });
  }
  render();
  $('#addStat').addEventListener('click', () => {
    content.stats = content.stats || [];
    content.stats.push({ value: '', label: '' });
    render();
  });
}

/* ---- CASES ---- */
function bindCases() {
  const root = $('#casesList');
  function render() {
    root.innerHTML = '';
    (content.cases || []).forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <button class="remove" data-act="del" data-idx="${idx}">×</button>
        <div class="admin-row"><label>ID</label><input type="text" data-key="id" value="${escape(c.id || '')}" /></div>
        <div class="admin-row"><label>Title</label><input type="text" data-key="title" value="${escape(c.title || '')}" /></div>
        <div class="admin-row"><label>Category</label><input type="text" data-key="category" value="${escape(c.category || '')}" /></div>
        <div class="admin-row full"><label>Description</label><textarea data-key="description" rows="4">${escape(c.description || '')}</textarea></div>
        <div class="admin-row"><label>Before image (path)</label><input type="text" data-key="before" value="${escape(c.before || '')}" /></div>
        <div class="admin-row"><label>After image (path)</label><input type="text" data-key="after" value="${escape(c.after || '')}" /></div>
        <div class="admin-row"><label>Featured</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;">
            <input type="checkbox" data-key="featured" ${c.featured ? 'checked' : ''} style="width:auto;" /> Featured case
          </label>
        </div>
        <div style="display:flex; gap: 12px; margin-top: 10px;">
          ${c.before ? `<img src="${c.before}" style="width:100px;height:80px;object-fit:cover;border:1px solid var(--line);" />` : ''}
          ${c.after ? `<img src="${c.after}" style="width:100px;height:80px;object-fit:cover;border:1px solid var(--line);" />` : ''}
        </div>
        <div class="admin-actions" style="margin-top: 14px; gap: 8px;">
          <button class="add-btn" data-act="up" data-idx="${idx}" style="width:auto;padding:6px 14px;">↑ Up</button>
          <button class="add-btn" data-act="down" data-idx="${idx}" style="width:auto;padding:6px 14px;">↓ Down</button>
        </div>
      `;
      $$('[data-key]', card).forEach(inp => {
        inp.addEventListener('input', () => {
          if (inp.type === 'checkbox') c[inp.dataset.key] = inp.checked;
          else c[inp.dataset.key] = inp.value;
        });
      });
      $$('[data-act]', card).forEach(btn => {
        btn.addEventListener('click', () => {
          const a = btn.dataset.act;
          if (a === 'del' && confirm('Remove this case?')) content.cases.splice(idx, 1);
          if (a === 'up' && idx > 0) [content.cases[idx-1], content.cases[idx]] = [content.cases[idx], content.cases[idx-1]];
          if (a === 'down' && idx < content.cases.length - 1) [content.cases[idx+1], content.cases[idx]] = [content.cases[idx], content.cases[idx+1]];
          render();
        });
      });
      root.appendChild(card);
    });
  }
  render();
  $('#addCase').addEventListener('click', () => {
    content.cases = content.cases || [];
    const nextId = (content.cases.reduce((m, c) => Math.max(m, +c.id || 0), 0)) + 1;
    content.cases.push({
      id: nextId, title: 'New case', category: 'Veneers',
      description: '', before: 'assets/cases/', after: 'assets/cases/'
    });
    render();
  });
}

/* ---- TABS ---- */
function bindTabs() {
  $$('.tab').forEach(t => {
    t.addEventListener('click', () => {
      $$('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const target = t.dataset.tab;
      $$('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
    });
  });
}

/* ---- ACTIONS ---- */
function showToast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function bindActions() {
  $('#saveBtn').addEventListener('click', () => {
    content.meta = content.meta || {};
    content.meta.updatedAt = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    showToast('Changes saved locally.');
  });

  $('#exportBtn').addEventListener('click', () => {
    content.meta = content.meta || {};
    content.meta.updatedAt = new Date().toISOString().slice(0, 10);
    // Export both: content.json (clean JSON) and content.js (loadable on file://)
    const jsonText = JSON.stringify(content, null, 2);
    const jsText = '// Auto-generated by admin.html — replace data/content.js on your repo.\n'
                 + 'window.SITE_CONTENT = ' + jsonText + ';\n';
    const blobJs = new Blob([jsText], { type: 'application/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blobJs);
    a.download = 'content.js';
    a.click();
    URL.revokeObjectURL(a.href);
    // Also offer the JSON
    setTimeout(() => {
      const blobJson = new Blob([jsonText], { type: 'application/json' });
      const a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blobJson);
      a2.download = 'content.json';
      a2.click();
      URL.revokeObjectURL(a2.href);
    }, 600);
    showToast('content.js + content.json downloaded — replace both in data/.');
  });

  $('#previewBtn').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    window.open('index.html', '_blank');
  });

  $('#logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_FLAG);
    location.reload();
  });
}

/* ---- ENTER EDITOR ---- */
let exp, edu;
async function enterEditor() {
  $('#loginScreen').style.display = 'none';
  $('#editorScreen').style.display = 'block';
  await loadContent();

  bindSimpleInputs();

  exp = makeListEditor('experienceList', 'experience', [
    { label: 'Role', key: 'role' },
    { label: 'Place', key: 'place' },
    { label: 'City', key: 'city' },
    { label: 'From', key: 'from' },
    { label: 'To', key: 'to' },
    { label: 'Summary', key: 'summary', type: 'textarea', full: true }
  ], { role: '', place: '', city: '', from: '', to: '', summary: '' });
  exp.render();
  $('#addExperience').addEventListener('click', () => exp.add());

  edu = makeListEditor('educationList', 'education', [
    { label: 'Degree', key: 'degree' },
    { label: 'Place', key: 'place' },
    { label: 'City', key: 'city' },
    { label: 'From', key: 'from' },
    { label: 'To', key: 'to' }
  ], { degree: '', place: '', city: '', from: '', to: '' });
  edu.render();
  $('#addEducation').addEventListener('click', () => edu.add());

  bindSkillsLangs();
  bindCases();
  bindStats();
  bindTabs();
  bindActions();
}

/* ---- BOOT ---- */
document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated this session, skip login
  if (sessionStorage.getItem(ADMIN_FLAG) === '1') {
    enterEditor();
    return;
  }
  $('#loginBtn').addEventListener('click', handleLogin);
  $('#pwd').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  setTimeout(() => $('#pwd').focus(), 100);
});
