// Injected as an inline panel when context menu "Find & Replace" is clicked
(() => {
  const PANEL_ID = '__fr_panel';
  // Toggle: if already open, close it
  const existing = document.getElementById(PANEL_ID);
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div id="__fr_panel_header">
      <span id="__fr_panel_title">🔍 Find &amp; Replace</span>
      <button id="__fr_panel_close">✕</button>
    </div>
    <div id="__fr_panel_tabs">
      <button class="__fr_tab __fr_tab_active" data-tab="find">Find &amp; Replace</button>
      <button class="__fr_tab" data-tab="forms">Form Tools</button>
    </div>
    <div id="__fr_tab_find" class="__fr_tabpanel __fr_tabpanel_active">
      <div class="__fr_field">
        <label>Search for</label>
        <input type="text" id="__fr_search" placeholder="phrase to find…" autocomplete="off" spellcheck="false" />
        <div id="__fr_count"></div>
      </div>
      <div class="__fr_field">
        <label>Replace with</label>
        <input type="text" id="__fr_replace" placeholder="replacement text…" autocomplete="off" spellcheck="false" />
      </div>
      <div class="__fr_opts">
        <label><input type="checkbox" id="__fr_case" /> Case sensitive</label>
        <label><input type="checkbox" id="__fr_word" /> Whole word</label>
      </div>
      <div class="__fr_modetoggle">
        <button class="__fr_modebtn __fr_modebtn_active" id="__fr_mode_inputs">✏️ Inputs only</button>
        <button class="__fr_modebtn" id="__fr_mode_all">🔍 All page text</button>
      </div>
      <div class="__fr_legend" id="__fr_legend" style="display:none">
        <span style="background:#ffb300;width:8px;height:8px;border-radius:2px;display:inline-block"></span> editable &nbsp;
        <span style="background:#4a90d9;width:8px;height:8px;border-radius:2px;display:inline-block"></span> read-only
      </div>
      <div class="__fr_btnrow">
        <button id="__fr_prev">◀ Prev</button>
        <button id="__fr_do_replace" class="__fr_primary">Replace</button>
        <button id="__fr_next">Next ▶</button>
      </div>
      <div class="__fr_btnrow2">
        <button id="__fr_replaceAll" class="__fr_primary">Replace All</button>
        <button id="__fr_replaceNext">Replace Next</button>
      </div>
    </div>
    <div id="__fr_tab_forms" class="__fr_tabpanel">
      <div class="__fr_formcard">
        <b>📋 Copy &amp; Paste Form Data</b>
        <p>Copy field values, paste into matching fields on another page.</p>
        <button id="__fr_copyForms" class="__fr_primary __fr_btnfull">📋 Copy all form data</button>
        <button id="__fr_pasteForms" class="__fr_btnfull">📥 Paste form data</button>
      </div>
      <div class="__fr_formcard">
        <b>🗑️ Clear Forms</b>
        <p>Empty all visible inputs on this page.</p>
        <button id="__fr_clearForms" class="__fr_danger __fr_btnfull">🗑️ Clear all fields</button>
      </div>
    </div>
  `;

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #__fr_panel {
      position: fixed; top: 60px; right: 16px; z-index: 2147483647;
      width: 320px; background: #141414; border: 1px solid #333;
      border-radius: 12px; box-shadow: 0 8px 40px rgba(0,0,0,.7);
      font-family: 'DM Sans', system-ui, sans-serif; color: #d4d4d4;
      font-size: 13px;
    }
    #__fr_panel * { box-sizing: border-box; }
    #__fr_panel_header {
      display: flex; align-items: center; padding: 12px 14px 10px;
      border-bottom: 1px solid #2a2a2a; cursor: move;
    }
    #__fr_panel_title { font-weight: 700; font-size: 13px; flex: 1; }
    #__fr_panel_close {
      background: none; border: none; color: #666; font-size: 16px;
      cursor: pointer; padding: 0 4px; line-height: 1;
    }
    #__fr_panel_close:hover { color: #fff; }
    #__fr_panel_tabs {
      display: flex; gap: 3px; padding: 8px 10px 0;
    }
    .__fr_tab {
      flex: 1; padding: 6px; border: none; border-radius: 8px;
      font-size: 11px; font-weight: 600; cursor: pointer;
      background: transparent; color: #888; transition: all .15s;
    }
    .__fr_tab_active { background: #206020 !important; color: #a8e6a8 !important; }
    .__fr_tab:hover:not(.__fr_tab_active) { background: #2a2a2a; color: #ccc; }
    .__fr_tabpanel { display: none; padding: 12px 14px 14px; }
    .__fr_tabpanel_active { display: block; }
    .__fr_field { margin-bottom: 10px; }
    .__fr_field label { display: block; font-size: 10px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
    .__fr_field input { width: 100%; background: #252525; border: 1px solid #333; border-radius: 8px; padding: 8px 11px; font-family: monospace; font-size: 13px; color: #d4d4d4; outline: none; }
    .__fr_field input:focus { border-color: #2d6a2d; box-shadow: 0 0 0 2px rgba(45,106,45,.25); }
    #__fr_count { font-size: 10px; font-family: monospace; color: #888; margin-top: 3px; min-height: 13px; }
    #__fr_count.found { color: #3aaa3a; }
    #__fr_count.none  { color: #c0392b; }
    .__fr_opts { display: flex; gap: 14px; margin-bottom: 10px; }
    .__fr_opts label { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #888; cursor: pointer; }
    .__fr_opts input { accent-color: #3aaa3a; }
    .__fr_modetoggle { display: flex; background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 3px; gap: 3px; margin-bottom: 8px; }
    .__fr_modebtn { flex: 1; padding: 6px 4px; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #888; transition: all .15s; }
    .__fr_modebtn_active { background: #206020 !important; color: #a8e6a8 !important; }
    .__fr_legend { font-size: 10px; color: #888; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
    .__fr_btnrow  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 6px; }
    .__fr_btnrow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    #__fr_panel button:not(#__fr_panel_close):not(.__fr_tab):not(.__fr_modebtn) {
      padding: 8px 5px; border: none; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      background: #1a4d1a; color: #7ecf7e; transition: background .15s;
    }
    #__fr_panel button.__fr_primary { background: #206020; color: #a8e6a8; }
    #__fr_panel button.__fr_primary:hover { background: #2d8c2d; }
    #__fr_panel button:not(#__fr_panel_close):not(.__fr_tab):not(.__fr_modebtn):not(.__fr_primary):hover { background: #206020; }
    #__fr_panel button.__fr_danger { background: #3a1a1a; color: #e08080; }
    #__fr_panel button.__fr_danger:hover { background: #4a2020; }
    .__fr_formcard { background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .__fr_formcard b { font-size: 11px; display: block; margin-bottom: 5px; color: #aaa; }
    .__fr_formcard p { font-size: 11px; color: #666; margin-bottom: 8px; line-height: 1.5; }
    .__fr_btnfull { width: 100% !important; margin-bottom: 6px; padding: 9px !important; font-size: 12px !important; }
    .__fr_btnfull:last-child { margin-bottom: 0 !important; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  // ── Dragging ──────────────────────────────────────────────────────────────
  const header = panel.querySelector('#__fr_panel_header');
  let dragOX, dragOY, dragging = false;
  header.addEventListener('mousedown', e => {
    if (e.target.id === '__fr_panel_close') return;
    dragging = true;
    dragOX = e.clientX - panel.getBoundingClientRect().left;
    dragOY = e.clientY - panel.getBoundingClientRect().top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left = (e.clientX - dragOX) + 'px';
    panel.style.top  = (e.clientY - dragOY) + 'px';
    panel.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  // ── Close ─────────────────────────────────────────────────────────────────
  panel.querySelector('#__fr_panel_close').addEventListener('click', () => panel.remove());

  // ── Tab switching ─────────────────────────────────────────────────────────
  panel.querySelectorAll('.__fr_tab').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.__fr_tab').forEach(b => b.classList.remove('__fr_tab_active'));
      panel.querySelectorAll('.__fr_tabpanel').forEach(p => p.classList.remove('__fr_tabpanel_active'));
      btn.classList.add('__fr_tab_active');
      panel.querySelector('#__fr_tab_' + btn.dataset.tab).classList.add('__fr_tabpanel_active');
    });
  });

  // ── State ─────────────────────────────────────────────────────────────────
  let searchAll = false;
  const searchEl  = panel.querySelector('#__fr_search');
  const replaceEl = panel.querySelector('#__fr_replace');
  const countEl   = panel.querySelector('#__fr_count');
  const caseEl    = panel.querySelector('#__fr_case');
  const wordEl    = panel.querySelector('#__fr_word');

  function getOpts() {
    return { search: searchEl.value, replace: replaceEl.value,
             caseSensitive: caseEl.checked, wholeWord: wordEl.checked, searchAll };
  }

  function send(action) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ ...getOpts(), action, _fromPanel: true }, resolve);
    });
  }

  function updateCount(res) {
    if (!res) return;
    if (res.total > 0) {
      countEl.textContent = `${res.current + 1} / ${res.total} matches`;
      countEl.className = 'found';
    } else if (searchEl.value) {
      countEl.textContent = 'No matches found';
      countEl.className = 'none';
    } else {
      countEl.textContent = '';
      countEl.className = '';
    }
  }

  // ── Mode toggle ───────────────────────────────────────────────────────────
  panel.querySelector('#__fr_mode_inputs').addEventListener('click', () => {
    searchAll = false;
    panel.querySelector('#__fr_mode_inputs').classList.add('__fr_modebtn_active');
    panel.querySelector('#__fr_mode_all').classList.remove('__fr_modebtn_active');
    panel.querySelector('#__fr_legend').style.display = 'none';
    send('find').then(updateCount);
  });
  panel.querySelector('#__fr_mode_all').addEventListener('click', () => {
    searchAll = true;
    panel.querySelector('#__fr_mode_all').classList.add('__fr_modebtn_active');
    panel.querySelector('#__fr_mode_inputs').classList.remove('__fr_modebtn_active');
    panel.querySelector('#__fr_legend').style.display = 'flex';
    send('find').then(updateCount);
  });

  // ── Search ────────────────────────────────────────────────────────────────
  let debounce;
  searchEl.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => send('find').then(updateCount), 100);
  });
  searchEl.addEventListener('keydown',  e => { if (e.key === 'Enter') { e.preventDefault(); send('replace').then(updateCount); }});
  replaceEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send('replace').then(updateCount); }});
  [caseEl, wordEl].forEach(cb => cb.addEventListener('change', () => send('find').then(updateCount)));

  panel.querySelector('#__fr_prev').addEventListener('click',       () => send('prev').then(updateCount));
  panel.querySelector('#__fr_next').addEventListener('click',       () => send('next').then(updateCount));
  panel.querySelector('#__fr_do_replace').addEventListener('click', () => send('replace').then(updateCount));
  panel.querySelector('#__fr_replaceNext').addEventListener('click',() => send('replaceNext').then(updateCount));
  panel.querySelector('#__fr_replaceAll').addEventListener('click', () => send('replaceAll').then(updateCount));

  // ── Form tools ────────────────────────────────────────────────────────────
  panel.querySelector('#__fr_copyForms').addEventListener('click',  () => { window.__frCopyForms?.(); });
  panel.querySelector('#__fr_pasteForms').addEventListener('click', () => { window.__frPasteForms?.(); });
  panel.querySelector('#__fr_clearForms').addEventListener('click', () => {
    if (confirm('Clear all form fields?')) window.__frClearForms?.();
  });

  searchEl.focus();
})();
