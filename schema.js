// Replace Schema — floating panel injected via context menu
(() => {
  const PANEL_ID = '__fr_schema_panel';
  const existing = document.getElementById(PANEL_ID);
  if (existing) { existing.remove(); return; }

  // ── Styles ─────────────────────────────────────────────────────────────
  const styleId = '__fr_schema_style';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      #__fr_schema_panel {
        position: fixed; top: 60px; right: 20px; z-index: 2147483647;
        width: 420px; max-height: 90vh;
        background: #141414; border: 1px solid #2d6a2d;
        border-radius: 14px; box-shadow: 0 8px 48px rgba(0,0,0,.8);
        font-family: 'DM Sans', system-ui, sans-serif; color: #d4d4d4;
        font-size: 13px; display: flex; flex-direction: column;
        overflow: hidden;
      }
      #__fr_schema_panel * { box-sizing: border-box; }

      /* Header */
      #__frs_header {
        display: flex; align-items: center; gap: 10px;
        padding: 13px 16px 11px; border-bottom: 1px solid #2a2a2a;
        cursor: move; flex-shrink: 0;
      }
      #__frs_icon { font-size: 18px; line-height: 1; }
      #__frs_title { font-weight: 700; font-size: 14px; flex: 1; color: #e0e0e0; }
      #__frs_close {
        background: none; border: none; color: #555; font-size: 18px;
        cursor: pointer; padding: 0 2px; line-height: 1; transition: color .15s;
      }
      #__frs_close:hover { color: #fff; }

      /* Body */
      #__frs_body { padding: 16px; overflow-y: auto; flex: 1; }

      /* Steps */
      .frs-step { margin-bottom: 16px; }
      .frs-step-label {
        font-size: 10px; font-weight: 700; color: #888;
        text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px;
        display: flex; align-items: center; gap: 6px;
      }
      .frs-step-num {
        width: 18px; height: 18px; border-radius: 50%; background: #206020;
        color: #a8e6a8; font-size: 10px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }

      /* Textarea */
      #__frs_input {
        width: 100%; height: 160px; resize: vertical;
        background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
        padding: 10px 12px; font-family: 'DM Mono', monospace; font-size: 12px;
        color: #d4d4d4; outline: none; transition: border-color .2s;
        line-height: 1.6;
      }
      #__frs_input:focus { border-color: #2d6a2d; box-shadow: 0 0 0 2px rgba(45,106,45,.2); }
      #__frs_input::placeholder { color: #3a3a3a; }

      /* Format hint */
      .frs-hint {
        background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
        padding: 10px 12px; margin-bottom: 14px; font-size: 11px;
        color: #666; line-height: 1.7; font-family: 'DM Mono', monospace;
      }
      .frs-hint b { color: #888; font-weight: 600; }

      /* Parse preview */
      #__frs_preview {
        display: none; background: #1a1a1a; border: 1px solid #2a2a2a;
        border-radius: 8px; max-height: 180px; overflow-y: auto; margin-bottom: 14px;
      }
      .frs-row {
        display: flex; align-items: stretch; border-bottom: 1px solid #222;
        font-size: 12px;
      }
      .frs-row:last-child { border-bottom: none; }
      .frs-row-key {
        flex: 0 0 45%; padding: 7px 10px; color: #a8e6a8;
        font-family: 'DM Mono', monospace; border-right: 1px solid #222;
        word-break: break-all;
      }
      .frs-row-val {
        flex: 1; padding: 7px 10px; color: #d4d4d4;
        font-family: 'DM Mono', monospace; word-break: break-all;
      }
      .frs-row-status {
        flex: 0 0 24px; display: flex; align-items: center; justify-content: center;
        font-size: 14px;
      }
      .frs-row.matched .frs-row-key { color: #3aaa3a; }
      .frs-row.unmatched .frs-row-key { color: #c0392b; }

      /* Buttons */
      .frs-btn-row { display: flex; gap: 8px; }
      .frs-btn {
        flex: 1; padding: 10px; border: none; border-radius: 9px;
        font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
        cursor: pointer; transition: background .15s, transform .1s;
      }
      .frs-btn:active { transform: scale(.97); }
      .frs-btn-primary { background: #206020; color: #a8e6a8; }
      .frs-btn-primary:hover { background: #2d8c2d; }
      .frs-btn-secondary { background: #1e1e1e; color: #888; border: 1px solid #333; }
      .frs-btn-secondary:hover { background: #2a2a2a; color: #ccc; }
      .frs-btn-ghost { flex: 0 0 auto; padding: 10px 14px; background: #1a2a1a; color: #5a9a5a; border: 1px solid #2a3a2a; border-radius: 9px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }
      .frs-btn-ghost:hover { background: #1e3a1e; color: #7ecf7e; }

      /* Status bar */
      #__frs_status {
        padding: 10px 16px; border-top: 1px solid #1e1e1e;
        font-size: 11px; font-family: 'DM Mono', monospace;
        color: #555; text-align: center; flex-shrink: 0;
        min-height: 36px; display: flex; align-items: center; justify-content: center;
      }
      #__frs_status.ok  { color: #3aaa3a; }
      #__frs_status.err { color: #c0392b; }
      #__frs_status.warn { color: #f39c12; }

      /* Toast */
      .__frs_toast {
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: #1a4d1a; color: #a8e6a8; border: 1px solid #2d8c2d;
        padding: 10px 20px; border-radius: 10px;
        font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
        z-index: 2147483647; box-shadow: 0 4px 20px rgba(0,0,0,.5);
        pointer-events: none; animation: __frs_fadein .2s ease;
      }
      .__frs_toast.error { background: #4d1a1a; color: #e6a8a8; border-color: #8c2d2d; }
      @keyframes __frs_fadein {
        from { opacity:0; transform: translateX(-50%) translateY(8px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(s);
  }

  // ── Panel HTML ──────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div id="__frs_header">
      <span id="__frs_icon">📊</span>
      <span id="__frs_title">Replace Schema</span>
      <button id="__frs_close">✕</button>
    </div>
    <div id="__frs_body">

      <div class="frs-step">
        <div class="frs-step-label"><span class="frs-step-num">1</span> Paste your Excel / spreadsheet data</div>
        <div class="frs-hint">
          Copy two columns from Excel and paste below.<br>
          <b>Column A</b> = input label / title &nbsp;·&nbsp; <b>Column B</b> = value to fill<br>
          <span style="color:#3a3a3a">Example: &nbsp; First name [TAB] John</span>
        </div>
        <textarea id="__frs_input" placeholder="Paste from Excel here…
First name&#9;John
Last name&#9;Doe
Email&#9;john@example.com"></textarea>
      </div>

      <div class="frs-step">
        <div class="frs-step-label"><span class="frs-step-num">2</span> Parsed pairs — green = matched on page</div>
        <div id="__frs_preview"></div>
      </div>

      <div class="frs-btn-row" style="margin-bottom:10px">
        <button class="frs-btn frs-btn-secondary" id="__frs_parse">🔍 Preview matches</button>
        <button class="frs-btn frs-btn-primary"   id="__frs_apply">✅ Apply to page</button>
        <button class="frs-btn-ghost"             id="__frs_paste_clipboard">📋 Paste from clipboard</button>
      </div>

    </div>
    <div id="__frs_status">Paste data and click Preview or Apply</div>
  `;
  document.body.appendChild(panel);

  // ── Dragging ────────────────────────────────────────────────────────────
  const header = document.getElementById('__frs_header');
  let dragOX, dragOY, dragging = false;
  header.addEventListener('mousedown', e => {
    if (e.target.id === '__frs_close') return;
    dragging = true;
    dragOX = e.clientX - panel.getBoundingClientRect().left;
    dragOY = e.clientY - panel.getBoundingClientRect().top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left  = (e.clientX - dragOX) + 'px';
    panel.style.top   = (e.clientY - dragOY) + 'px';
    panel.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  // ── Close ───────────────────────────────────────────────────────────────
  document.getElementById('__frs_close').addEventListener('click', () => panel.remove());

  // ── Helpers ─────────────────────────────────────────────────────────────
  function toast(msg, isError = false) {
    document.querySelectorAll('.__frs_toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = '__frs_toast' + (isError ? ' error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function setStatus(msg, type = '') {
    const s = document.getElementById('__frs_status');
    s.textContent = msg;
    s.className = type;
  }

  // Parse pasted text: supports tab-separated (Excel), or "Label VALUE" with 2+ spaces
  function parseSchema(raw) {
    const pairs = [];
    const lines = raw.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      let key, value;
      if (line.includes('\t')) {
        // Tab-separated (Excel copy-paste)
        const idx = line.indexOf('\t');
        key   = line.slice(0, idx).trim();
        value = line.slice(idx + 1).trim();
      } else if (/\s{2,}/.test(line)) {
        // Two or more spaces as separator
        const m = line.match(/^(.+?)\s{2,}(.*)$/);
        if (m) { key = m[1].trim(); value = m[2].trim(); }
      } else {
        // Single space — everything before last word is key, last word is value
        const parts = line.split(' ');
        value = parts.pop();
        key   = parts.join(' ').trim();
      }

      if (key) pairs.push({ key, value: value || '' });
    }
    return pairs;
  }

  // Collect all candidate inputs on the page with their "title" (label text)
  function collectInputs() {
    const inputs = [];
    document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=file]):not([type=image]), textarea, select').forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      // Gather all possible title/label sources
      const titles = new Set();

      // 1. aria-label
      if (el.getAttribute('aria-label')) titles.add(el.getAttribute('aria-label').trim());

      // 2. placeholder
      if (el.placeholder) titles.add(el.placeholder.trim());

      // 3. name attribute
      if (el.name) titles.add(el.name.trim());

      // 4. id attribute
      if (el.id) titles.add(el.id.trim());

      // 5. <label> linked via for= or wrapping
      if (el.id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl) titles.add(lbl.textContent.trim());
      }
      const wrappingLabel = el.closest('label');
      if (wrappingLabel) {
        // Label text without the input's own text
        const clone = wrappingLabel.cloneNode(true);
        clone.querySelectorAll('input,textarea,select').forEach(c => c.remove());
        const txt = clone.textContent.trim();
        if (txt) titles.add(txt);
      }

      // 6. aria-labelledby
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        labelledBy.split(' ').forEach(id => {
          const el2 = document.getElementById(id);
          if (el2) titles.add(el2.textContent.trim());
        });
      }

      // 7. Nearby preceding text — look at parent's previous sibling or parent label-like element
      const parent = el.parentElement;
      if (parent) {
        // Previous sibling text
        let sib = el.previousElementSibling;
        while (sib) {
          const txt = sib.textContent.trim();
          if (txt && txt.length < 100) { titles.add(txt); break; }
          sib = sib.previousElementSibling;
        }
        // Parent label-like (div/span with text before the input)
        const parentTxt = parent.childNodes;
        for (const node of parentTxt) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            titles.add(node.textContent.trim());
          }
        }
      }

      // 8. title attribute
      if (el.title) titles.add(el.title.trim());

      inputs.push({ el, titles: [...titles].filter(Boolean) });
    });
    return inputs;
  }

  // Find best input match for a schema key
  function matchInput(key, inputs) {
    const keyLower = key.toLowerCase();

    // Exact match first
    for (const inp of inputs) {
      for (const title of inp.titles) {
        if (title.toLowerCase() === keyLower) return inp.el;
      }
    }

    // Contains match
    for (const inp of inputs) {
      for (const title of inp.titles) {
        if (title.toLowerCase().includes(keyLower) || keyLower.includes(title.toLowerCase())) {
          return inp.el;
        }
      }
    }

    return null;
  }

  function setFieldValue(el, value) {
    if (el.tagName === 'SELECT') {
      // Try to match option by text or value
      const opt = Array.from(el.options).find(o =>
        o.text.trim().toLowerCase() === value.toLowerCase() ||
        o.value.toLowerCase() === value.toLowerCase()
      );
      if (opt) el.value = opt.value;
      else el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (el.isContentEditable) {
      el.innerText = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Use native setter to trigger React/Vue reactivity
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ── Preview ─────────────────────────────────────────────────────────────
  function runPreview(apply = false) {
    const raw = document.getElementById('__frs_input').value;
    const pairs = parseSchema(raw);
    if (!pairs.length) {
      setStatus('⚠️ No valid data found — paste tab-separated Excel data', 'err');
      return null;
    }

    const inputs  = collectInputs();
    const preview = document.getElementById('__frs_preview');
    preview.innerHTML = '';
    preview.style.display = 'block';

    let matched = 0, applied = 0;

    pairs.forEach(({ key, value }) => {
      const el = matchInput(key, inputs);
      const row = document.createElement('div');
      row.className = 'frs-row ' + (el ? 'matched' : 'unmatched');

      const keyEl = document.createElement('div');
      keyEl.className = 'frs-row-key';
      keyEl.textContent = key;

      const valEl = document.createElement('div');
      valEl.className = 'frs-row-val';
      valEl.textContent = value;

      const statusEl = document.createElement('div');
      statusEl.className = 'frs-row-status';
      statusEl.textContent = el ? '✓' : '✗';
      statusEl.title = el
        ? `Matched: ${el.tagName.toLowerCase()}${el.name ? '[name='+el.name+']' : el.id ? '#'+el.id : ''}`
        : 'No matching input found';

      row.appendChild(keyEl);
      row.appendChild(valEl);
      row.appendChild(statusEl);
      preview.appendChild(row);

      if (el) {
        matched++;
        if (apply) {
          setFieldValue(el, value);
          // Briefly highlight the filled field
          const orig = el.style.outline;
          el.style.outline = '2px solid #3aaa3a';
          el.style.transition = 'outline .3s';
          setTimeout(() => { el.style.outline = orig; }, 1500);
          applied++;
        }
      }
    });

    return { total: pairs.length, matched, applied };
  }

  // ── Event Listeners ─────────────────────────────────────────────────────
  document.getElementById('__frs_parse').addEventListener('click', () => {
    const result = runPreview(false);
    if (!result) return;
    setStatus(
      `Found ${result.total} pairs · ${result.matched} matched on page · ${result.total - result.matched} unmatched`,
      result.matched > 0 ? 'ok' : 'warn'
    );
  });

  document.getElementById('__frs_apply').addEventListener('click', () => {
    const result = runPreview(true);
    if (!result) return;
    setStatus(
      `✅ Applied ${result.applied} / ${result.total} values`,
      result.applied > 0 ? 'ok' : 'warn'
    );
    if (result.applied > 0) toast(`✅ Filled ${result.applied} field(s)`);
    if (result.matched < result.total) {
      toast(`⚠️ ${result.total - result.matched} label(s) not matched`, true);
    }
  });

  // Paste from clipboard button
  document.getElementById('__frs_paste_clipboard').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('__frs_input').value = text;
      const result = runPreview(false);
      if (result) setStatus(`Pasted ${result.total} pairs · ${result.matched} matched`, result.matched > 0 ? 'ok' : 'warn');
    } catch (e) {
      setStatus('⚠️ Clipboard access denied — paste manually', 'err');
    }
  });

  // Auto-parse on paste into textarea
  document.getElementById('__frs_input').addEventListener('paste', () => {
    setTimeout(() => {
      const result = runPreview(false);
      if (result) setStatus(`${result.total} pairs parsed · ${result.matched} matched on page`, result.matched > 0 ? 'ok' : 'warn');
    }, 50);
  });

  // Focus textarea
  setTimeout(() => document.getElementById('__frs_input').focus(), 100);
})();
