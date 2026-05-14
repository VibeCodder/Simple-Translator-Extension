(() => {
  const VERSION = 'fr_v15';
  if (window[VERSION]) return;
  window[VERSION] = true;
  ['__findReplaceLoaded','fr_v2','fr_v3','fr_v4','fr_v5','fr_v6','fr_v7','fr_v8','fr_v9','fr_v10','fr_v11','fr_v12','fr_v13','fr_v14'].forEach(k => delete window[k]);

  // ── State ────────────────────────────────────────────────────────────────
  let state = {
    search: '', replace: '', caseSensitive: false,
    wholeWord: false, searchAll: false, matches: [], current: -1,
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const STYLE_ID = '__fr_style';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .__fr_hl        { background:#ffb300 !important;color:#000 !important;border-radius:2px; }
      .__fr_hl_act    { background:#ff6d00 !important;color:#fff !important;border-radius:2px;outline:2px solid #ff6d00; }
      .__fr_hl_ro     { background:#4a90d9 !important;color:#fff !important;border-radius:2px; }
      .__fr_hl_ro_act { background:#1a6abf !important;color:#fff !important;border-radius:2px;outline:2px solid #4a90d9; }
      .__fr_toast {
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
        background:#1a4d1a; color:#a8e6a8; border:1px solid #2d8c2d;
        padding:10px 20px; border-radius:10px; font-family:'DM Sans',sans-serif;
        font-size:13px; font-weight:600; z-index:2147483647;
        box-shadow:0 4px 20px rgba(0,0,0,.5); pointer-events:none;
        animation:__fr_fadein .2s ease;
      }
      .__fr_toast.error { background:#4d1a1a; color:#e6a8a8; border-color:#8c2d2d; }
      @keyframes __fr_fadein { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    `;
    document.head.appendChild(s);
  }

  // ── Toast notifications ───────────────────────────────────────────────────
  function showToast(msg, isError = false) {
    document.querySelectorAll('.__fr_toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = '__fr_toast' + (isError ? ' error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
  window.__frShowToast = showToast;

  // ── Find & Replace helpers ────────────────────────────────────────────────
  function buildRegex(search, caseSensitive, wholeWord) {
    if (!search) return null;
    let esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) esc = `\\b${esc}\\b`;
    return new RegExp(esc, caseSensitive ? 'g' : 'gi');
  }

  function isFormField(el) {
    if (!el) return false;
    if (el.tagName === 'INPUT') {
      return ['text','search','email','url','tel','number','password',
              'date','datetime-local','month','week','time']
              .includes((el.type || 'text').toLowerCase());
    }
    return el.tagName === 'TEXTAREA';
  }

  function nearestFormField(el) {
    let cur = el;
    while (cur && cur !== document.body) {
      if (isFormField(cur)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function getVal(el) { return el.isContentEditable ? el.innerText : el.value; }

  function setVal(el, value) {
    if (el.isContentEditable) {
      el.innerText = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  const HL_CLASSES = ['__fr_hl','__fr_hl_act','__fr_hl_ro','__fr_hl_ro_act'];

  function clearHighlights() {
    document.querySelectorAll(HL_CLASSES.map(c => '.' + c).join(',')).forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
  }

  function highlightTextNode(textNode, regex, readOnly) {
    const cls = readOnly ? '__fr_hl_ro' : '__fr_hl';
    const text = textNode.textContent;
    const hits = [];
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(text)) !== null)
      hits.push({ start: m.index, end: m.index + m[0].length });
    if (!hits.length) return [];

    const frag = document.createDocumentFragment();
    let last = 0;
    const spans = [];
    for (const { start, end } of hits) {
      if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
      const sp = document.createElement('span');
      sp.className = cls;
      sp.textContent = text.slice(start, end);
      frag.appendChild(sp);
      spans.push(sp);
      last = end;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
    return spans;
  }

  function findAll() {
    clearHighlights();
    state.matches = [];
    state.current = -1;
    const { search, caseSensitive, wholeWord, searchAll } = state;
    if (!search) return;

    // ── Pass 1: input/textarea — these have no text node children so the
    //   TreeWalker never visits them. Query them directly.
    document.querySelectorAll('input, textarea').forEach(el => {
      if (!isFormField(el)) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const val = getVal(el);
      const re = buildRegex(search, caseSensitive, wholeWord);
      let m; re.lastIndex = 0;
      while ((m = re.exec(val)) !== null)
        state.matches.push({ type: 'input', inputEl: el, start: m.index, end: m.index + m[0].length });
    });

    // ── Pass 2: walk all other text nodes in the DOM ──────────────────────
    const WIDGET_ROLES = new Set(['textbox','searchbox','combobox','spinbutton']);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT','STYLE','NOSCRIPT','IFRAME','INPUT','TEXTAREA'].includes(p.tagName))
          return NodeFilter.FILTER_REJECT;
        if (HL_CLASSES.some(c => p.classList.contains(c))) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      const p = node.parentElement;

      // Check if inside a contenteditable that is a real input widget:
      // must have a widget ARIA role on itself or direct parent.
      const ceAncestor = p.closest('[contenteditable="true"]');
      const isWidgetCE = ceAncestor && (
        WIDGET_ROLES.has(ceAncestor.getAttribute('role')) ||
        WIDGET_ROLES.has(ceAncestor.parentElement?.getAttribute('role'))
      );

      if (isWidgetCE) {
        // Real editable widget (e.g. rich text editor with role=textbox)
        const spans = highlightTextNode(node, buildRegex(search, caseSensitive, wholeWord), false);
        spans.forEach(sp => state.matches.push({ type: 'dom', span: sp, readOnly: false }));
      } else {
        // Everything else is static page text — only included when searchAll is ON
        if (!searchAll) continue;
        // Check if this text node actually matches before trying to highlight
        const re = buildRegex(search, caseSensitive, wholeWord);
        if (!re.test(node.textContent)) continue;
        const spans = highlightTextNode(node, re, true);
        spans.forEach(sp => state.matches.push({ type: 'dom', span: sp, readOnly: true }));
      }
    }

    console.debug(`[FR] findAll: inputs=${state.matches.filter(m=>m.type==='input').length} dom=${state.matches.filter(m=>m.type==='dom').length} searchAll=${searchAll} total=${state.matches.length}`);
    if (state.matches.length) { state.current = 0; activateCurrent(); }
  }

  function activateCurrent() {
    document.querySelectorAll('.__fr_hl_act').forEach(el => el.className = '__fr_hl');
    document.querySelectorAll('.__fr_hl_ro_act').forEach(el => el.className = '__fr_hl_ro');
    if (state.current < 0 || state.current >= state.matches.length) return;
    const match = state.matches[state.current];
    if (match.type === 'dom') {
      match.span.className = match.readOnly ? '__fr_hl_ro_act' : '__fr_hl_act';
      match.span.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else {
      // Scroll into view but DON'T focus/select — that steals focus from the
      // extension popup search box and causes the user's typing to overwrite it
      match.inputEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function navigate(dir) {
    if (!state.matches.length) return;
    state.current = (state.current + dir + state.matches.length) % state.matches.length;
    activateCurrent();
  }

  function replaceCurrent(andAdvance = false) {
    if (!state.matches.length || state.current < 0) return;
    const match = state.matches[state.current];
    const prevIndex = state.current;

    if (match.type === 'dom') {
      // Replace the span with plain text in-place — no findAll() needed
      const spanParent = match.span.parentNode;
      if (spanParent) {
        spanParent.replaceChild(document.createTextNode(state.replace), match.span);
        spanParent.normalize();
      }
      // Remove just this match from the array, keep all others intact
      state.matches.splice(state.current, 1);
      if (state.matches.length === 0) {
        state.current = -1;
      } else {
        // andAdvance: move to next; otherwise stay at same index (now points to next item)
        state.current = prevIndex % state.matches.length;
        if (andAdvance) state.current = (prevIndex) % state.matches.length;
        activateCurrent();
      }
    } else {
      const el = match.inputEl;
      const val = getVal(el);
      setVal(el, val.slice(0, match.start) + state.replace + val.slice(match.end));
      const delta = state.replace.length - (match.end - match.start);
      state.matches.splice(state.current, 1);
      state.matches = state.matches.map(m =>
        (m.type === 'input' && m.inputEl === el && m.start >= match.end)
          ? { ...m, start: m.start + delta, end: m.end + delta } : m
      );
      if (state.matches.length === 0) {
        state.current = -1;
      } else {
        state.current = prevIndex % state.matches.length;
        if (andAdvance) state.current = prevIndex % state.matches.length;
        activateCurrent();
      }
    }
  }

  function replaceAll() {
    // Fresh find to get all current matches highlighted
    findAll();
    if (!state.matches.length) return;

    // Replace all input/textarea fields via value API
    const inputEls = new Set(state.matches.filter(m => m.type === 'input').map(m => m.inputEl));
    inputEls.forEach(el => {
      const re = buildRegex(state.search, state.caseSensitive, state.wholeWord);
      setVal(el, getVal(el).replace(re, state.replace));
    });

    // Replace all highlighted DOM spans in one pass — don't call findAll after,
    // that would re-highlight the newly inserted replacement text
    document.querySelectorAll('.__fr_hl,.__fr_hl_act,.__fr_hl_ro,.__fr_hl_ro_act').forEach(sp => {
      const spParent = sp.parentNode;
      if (spParent) {
        spParent.replaceChild(document.createTextNode(state.replace), sp);
        spParent.normalize();
      }
    });

    // Clear state — no remaining matches
    state.matches = [];
    state.current = -1;
  }

  // ── Form Tools ────────────────────────────────────────────────────────────

  // Collect all visible, meaningful form fields with a stable index
  function collectFormFields() {
    const fields = [];
    document.querySelectorAll('input, textarea, select, [contenteditable="true"]').forEach((el, idx) => {
      // Skip hidden, submit, button, reset, file inputs
      if (el.tagName === 'INPUT') {
        const t = (el.type || 'text').toLowerCase();
        if (['hidden','submit','button','reset','file','image','checkbox','radio'].includes(t)) return;
      }
      // Skip invisible elements
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      fields.push(el);
    });
    return fields;
  }

  window.__frCopyForms = function() {
    const fields = collectFormFields();
    const data = fields.map((el, i) => {
      let value = '';
      if (el.tagName === 'SELECT') {
        value = el.value;
      } else if (el.isContentEditable) {
        value = el.innerText;
      } else {
        value = el.value;
      }
      const label = el.getAttribute('aria-label')
        || el.getAttribute('placeholder')
        || el.getAttribute('name')
        || el.getAttribute('id')
        || `field_${i}`;
      return { index: i, label, value, tag: el.tagName, type: el.type || '' };
    });

    // Send to background for storage (cross-tab clipboard)
    chrome.runtime.sendMessage({ action: 'formDataCopied', data });

    // Also write a human-readable version to system clipboard
    const text = data.map(f => `[${f.label}]: ${f.value}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});

    showToast(`📋 Copied ${data.length} field(s)`);
    return data;
  };

  window.__frPasteForms = function() {
    chrome.runtime.sendMessage({ action: 'requestFormClipboard' }, (response) => {
      const data = response?.data;
      if (!data || !data.length) {
        showToast('⚠️ No form data in clipboard', true);
        return;
      }
      const fields = collectFormFields();
      let pasted = 0;
      data.forEach(item => {
        const el = fields[item.index];
        if (!el) return;
        if (el.tagName === 'SELECT') {
          el.value = item.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.isContentEditable) {
          el.innerText = item.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          setVal(el, item.value);
        }
        pasted++;
      });
      showToast(`📥 Pasted into ${pasted} field(s)`);
    });
  };

  window.__frClearForms = function() {
    const fields = collectFormFields();
    fields.forEach(el => {
      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (el.isContentEditable) {
        el.innerText = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        setVal(el, '');
      }
    });
    showToast(`🗑️ Cleared ${fields.length} field(s)`);
  };

  // ── Message listener ──────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // Ping — just confirm script is alive
    if (msg.action === 'ping') { sendResponse({ ok: true }); return true; }

    // Form tool actions (from popup)
    if (msg.action === 'copyForms')  { window.__frCopyForms();  sendResponse({ ok: true }); return; }
    if (msg.action === 'pasteForms') { window.__frPasteForms(); sendResponse({ ok: true }); return; }
    if (msg.action === 'clearForms') { window.__frClearForms(); sendResponse({ ok: true }); return; }

    // Find & Replace actions
    const prev = { ...state };
    if (msg.search        !== undefined) state.search        = msg.search;
    if (msg.replace       !== undefined) state.replace       = msg.replace;
    if (msg.caseSensitive !== undefined) state.caseSensitive = msg.caseSensitive;
    if (msg.wholeWord     !== undefined) state.wholeWord     = msg.wholeWord;
    if (msg.searchAll     !== undefined) state.searchAll     = msg.searchAll;

    const changed = state.search !== prev.search || state.caseSensitive !== prev.caseSensitive ||
                    state.wholeWord !== prev.wholeWord || state.searchAll !== prev.searchAll;

    switch (msg.action) {
      case 'find':    findAll(); break;
      case 'next':
        if (!state.matches.length || changed) findAll(); else navigate(1); break;
      case 'prev':
        if (!state.matches.length || changed) {
          findAll();
          if (state.matches.length > 1) { state.current = state.matches.length - 1; activateCurrent(); }
        } else navigate(-1);
        break;
      case 'replace':     if (!state.matches.length) findAll(); replaceCurrent(false); break;
      case 'replaceNext': if (!state.matches.length) findAll(); replaceCurrent(true);  break;
      case 'replaceAll':  replaceAll(); break;
      case 'getState':
        sendResponse({ search: state.search, replace: state.replace,
                       caseSensitive: state.caseSensitive, wholeWord: state.wholeWord,
                       searchAll: state.searchAll });
        return true;
    }
    sendResponse({ total: state.matches.length, current: state.current });
    return true;
  });
})();
