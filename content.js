// Guard against double-injection
if (typeof window.__simpleTranslateLoaded === 'undefined') {
window.__simpleTranslateLoaded = true;

// ── State ──
let settings = {
  autoTranslateEnabled: false,
  whitelistEnabled: false,
  whitelistLangs:   [],
  blacklistEnabled: true,
  blacklistLangs:   ['en', 'pl'],
  autoTargetLang:   'en',
  targetLang:       'en',
};

// Load settings from chrome.storage on inject
chrome.storage.local.get([
  'st_autoTranslateEnabled',
  'st_whitelistEnabled',
  'st_whitelistLangs',
  'st_blacklistEnabled',
  'st_blacklistLangs',
  'st_autoTargetLang',
  'st_targetLang',
], (result) => {
  if (result.st_autoTranslateEnabled !== undefined)
    settings.autoTranslateEnabled = result.st_autoTranslateEnabled === true || result.st_autoTranslateEnabled === 'true';
  if (result.st_whitelistEnabled !== undefined)
    settings.whitelistEnabled = result.st_whitelistEnabled === true || result.st_whitelistEnabled === 'true';
  if (result.st_whitelistLangs)   settings.whitelistLangs   = result.st_whitelistLangs;
  if (result.st_blacklistEnabled !== undefined)
    settings.blacklistEnabled = result.st_blacklistEnabled === true || result.st_blacklistEnabled === 'true';
  if (result.st_blacklistLangs)   settings.blacklistLangs   = result.st_blacklistLangs;
  if (result.st_autoTargetLang)   settings.autoTargetLang   = result.st_autoTargetLang;
  if (result.st_targetLang)       settings.targetLang       = result.st_targetLang;
});

// ── React to storage changes from popup in real-time (all tabs) ──
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if ('st_autoTranslateEnabled' in changes) {
    const v = changes.st_autoTranslateEnabled.newValue;
    settings.autoTranslateEnabled = v === true || v === 'true';
  }
  if ('st_whitelistEnabled' in changes) {
    const v = changes.st_whitelistEnabled.newValue;
    settings.whitelistEnabled = v === true || v === 'true';
  }
  if ('st_whitelistLangs' in changes && changes.st_whitelistLangs.newValue)
    settings.whitelistLangs = changes.st_whitelistLangs.newValue;
  if ('st_blacklistEnabled' in changes) {
    const v = changes.st_blacklistEnabled.newValue;
    settings.blacklistEnabled = v === true || v === 'true';
  }
  if ('st_blacklistLangs' in changes && changes.st_blacklistLangs.newValue)
    settings.blacklistLangs = changes.st_blacklistLangs.newValue;
  if ('st_autoTargetLang' in changes && changes.st_autoTargetLang.newValue)
    settings.autoTargetLang = changes.st_autoTargetLang.newValue;
  if ('st_targetLang' in changes && changes.st_targetLang.newValue)
    settings.targetLang = changes.st_targetLang.newValue;
});

// ── Listen for messages from popup ──
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    sendResponse({ text: window.getSelection().toString().trim() });
  }
  if (request.action === 'updateSettings') {
    settings = { ...settings, ...request.settings };
    chrome.storage.local.set({
      st_autoTranslateEnabled: settings.autoTranslateEnabled,
      st_whitelistEnabled: settings.whitelistEnabled,
      st_whitelistLangs:   settings.whitelistLangs,
      st_blacklistEnabled: settings.blacklistEnabled,
      st_blacklistLangs:   settings.blacklistLangs,
      st_autoTargetLang:   settings.autoTargetLang,
      st_targetLang:       settings.targetLang,
    });
  }
  return true;
});

// ── Translation popup ──
let translatePopup = null;

function removePopup() {
  if (translatePopup) {
    translatePopup.remove();
    translatePopup = null;
    document.removeEventListener('mousedown', onOutsideClick);
  }
}

function createPopup(x, y, translatedText, detectedLangName, targetLangCode) {
  removePopup();

  const popup = document.createElement('div');
  popup.id = '__simple_translate_popup__';

  const targetName = LANG_NAMES_MAP[targetLangCode] || targetLangCode.toUpperCase();

  // Inject scoped stylesheet once — handles dark scrollbar + resets button styles
  // against host-page CSS (all: unset beats any inherited button { } rules)
  if (!document.getElementById('__st_styles__')) {
    const styleEl = document.createElement('style');
    styleEl.id = '__st_styles__';
    styleEl.textContent = `
      #__simple_translate_popup__ #__st_body__::-webkit-scrollbar { width: 6px !important; }
      #__simple_translate_popup__ #__st_body__::-webkit-scrollbar-track { background: #1a1a1a !important; }
      #__simple_translate_popup__ #__st_body__::-webkit-scrollbar-thumb { background: #4a4a4a !important; border-radius: 3px !important; }
      #__simple_translate_popup__ #__st_body__::-webkit-scrollbar-thumb:hover { background: #5a5a5a !important; }
      #__st_drag__ { all: unset !important; box-sizing: border-box !important; cursor: grab !important; color: #555 !important; padding: 1px 4px 1px 0 !important; flex-shrink: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 3px !important; }
      #__st_drag__:hover { color: #aaa !important; }
      #__st_close__ { all: unset !important; box-sizing: border-box !important; cursor: pointer !important; color: #555 !important; font-size: 14px !important; line-height: 1 !important; padding: 0 4px !important; border-radius: 3px !important; flex-shrink: 0 !important; }
      #__st_close__:hover { color: #ccc !important; background: rgba(255,255,255,0.08) !important; }
      #__st_copy__ { all: unset !important; box-sizing: border-box !important; cursor: pointer !important; background: #252525 !important; border: 1px solid #3a3a3a !important; color: #888 !important; font-size: 11px !important; padding: 3px 8px !important; border-radius: 4px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
      #__st_copy__:hover { background: #2e2e2e !important; color: #bbb !important; border-color: #555 !important; }
    `;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  popup.innerHTML = `
    <div id="__st_header__" style="
      padding: 7px 10px 6px;
      background: #272727;
      border-bottom: 1px solid #333;
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
      user-select: none;
    ">
      <button id="__st_drag__" title="Move">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <polygon points="7,0 5,3 9,3"/>
          <polygon points="7,14 5,11 9,11"/>
          <polygon points="0,7 3,5 3,9"/>
          <polygon points="14,7 11,5 11,9"/>
          <rect x="4.5" y="4.5" width="5" height="5"/>
        </svg>
      </button>
      <span style="font-size: 11px; color: #4a90d9; font-weight: 500; white-space: nowrap; flex: 1;">
        ${escapeHtml(detectedLangName)} &rarr; ${escapeHtml(targetName)}
      </span>
      <button id="__st_close__" title="Close">&#x2715;</button>
    </div>
    <div id="__st_body__" style="
      padding: 10px 12px; line-height: 1.55;
      word-break: break-word; max-height: 160px; overflow-y: auto;
      scrollbar-width: thin; scrollbar-color: #4a4a4a #1a1a1a;
    ">${escapeHtml(translatedText)}</div>
    <div style="
      padding: 5px 10px;
      display: flex; justify-content: flex-end;
      border-top: 1px solid #2a2a2a;
    ">
      <button id="__st_copy__">Copy</button>
    </div>
  `;

  popup.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    max-width: 320px;
    min-width: 200px;
    background: #1e1e1e;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #e0e0e0;
    overflow: visible;
    visibility: hidden;
    left: 0; top: 0;
    clip-path: inset(0 round 8px);
  `;

  (document.body || document.documentElement).appendChild(popup);
  translatePopup = popup;

  const pw = popup.offsetWidth  || 280;
  const ph = popup.offsetHeight || 110;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = x + 12;
  let top  = y + 12;
  if (left + pw > vw - 8) left = x - pw - 6;
  if (top  + ph > vh - 8) top  = y - ph - 6;
  if (left < 8) left = 8;
  if (top  < 8) top  = 8;

  popup.style.left       = left + 'px';
  popup.style.top        = top  + 'px';
  popup.style.visibility = 'visible';

  popup.querySelector('#__st_close__').addEventListener('click', removePopup);
  popup.querySelector('#__st_copy__').addEventListener('click', () => {
    navigator.clipboard.writeText(translatedText).then(() => {
      const btn = popup.querySelector('#__st_copy__');
      if (btn) {
        btn.textContent = 'Copied!';
        btn.style.setProperty('color', '#4a90d9', 'important');
        btn.style.setProperty('border-color', '#2a5080', 'important');
        setTimeout(() => {
          if (btn) {
            btn.textContent = 'Copy';
            btn.style.removeProperty('color');
            btn.style.removeProperty('border-color');
          }
        }, 1800);
      }
    });
  });

  // ── Drag ──
  const dragHandle = popup.querySelector('#__st_drag__');
  let dragging = false, dragOffX = 0, dragOffY = 0;

  dragHandle.addEventListener('mouseenter', () => { if (!dragging) dragHandle.style.color = '#aaa'; });
  dragHandle.addEventListener('mouseleave', () => { if (!dragging) dragHandle.style.color = '#555'; });

  dragHandle.addEventListener('mousedown', (e) => {
    dragging = true; _isDragging = true;
    dragOffX = e.clientX - popup.getBoundingClientRect().left;
    dragOffY = e.clientY - popup.getBoundingClientRect().top;
    dragHandle.style.cursor = 'grabbing';
    dragHandle.style.color  = '#4a90d9';
    e.preventDefault(); e.stopPropagation();
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup',   onDragEnd);
  });

  function onDragMove(e) {
    if (!dragging || !translatePopup) return;
    let nx = e.clientX - dragOffX;
    let ny = e.clientY - dragOffY;
    nx = Math.max(0, Math.min(nx, window.innerWidth  - popup.offsetWidth));
    ny = Math.max(0, Math.min(ny, window.innerHeight - popup.offsetHeight));
    popup.style.left = nx + 'px';
    popup.style.top  = ny + 'px';
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    dragHandle.style.cursor = 'grab';
    dragHandle.style.color  = '#555';
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup',   onDragEnd);
    setTimeout(() => { _isDragging = false; }, 0);
  }

  setTimeout(() => { document.addEventListener('mousedown', onOutsideClick); }, 200);
}

let _isDragging = false;

function onOutsideClick(e) {
  if (_isDragging) return;
  if (translatePopup && !translatePopup.contains(e.target)) removePopup();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Language name map ──
const LANG_NAMES_MAP = {
  af:'Afrikaans',sq:'Albanian',am:'Amharic',ar:'Arabic',hy:'Armenian',
  az:'Azerbaijani',eu:'Basque',be:'Belarusian',bn:'Bengali',bs:'Bosnian',
  bg:'Bulgarian',ca:'Catalan',ceb:'Cebuano','zh-CN':'Chinese (Simplified)',
  'zh-TW':'Chinese (Traditional)',hr:'Croatian',cs:'Czech',da:'Danish',
  nl:'Dutch',en:'English',eo:'Esperanto',et:'Estonian',fi:'Finnish',
  fr:'French',gl:'Galician',ka:'Georgian',de:'German',el:'Greek',
  gu:'Gujarati',ht:'Haitian Creole',ha:'Hausa',he:'Hebrew',hi:'Hindi',
  hu:'Hungarian',is:'Icelandic',id:'Indonesian',ga:'Irish',it:'Italian',
  ja:'Japanese',jv:'Javanese',kn:'Kannada',kk:'Kazakh',km:'Khmer',
  ko:'Korean',ku:'Kurdish',ky:'Kyrgyz',lo:'Lao',la:'Latin',lv:'Latvian',
  lt:'Lithuanian',lb:'Luxembourgish',mk:'Macedonian',mg:'Malagasy',
  ms:'Malay',ml:'Malayalam',mt:'Maltese',mi:'Maori',mr:'Marathi',
  mn:'Mongolian',my:'Myanmar (Burmese)',ne:'Nepali',no:'Norwegian',
  fa:'Persian',pl:'Polish',pt:'Portuguese',pa:'Punjabi',ro:'Romanian',
  ru:'Russian',sm:'Samoan',sr:'Serbian',si:'Sinhala',sk:'Slovak',
  sl:'Slovenian',so:'Somali',es:'Spanish',su:'Sundanese',sw:'Swahili',
  sv:'Swedish',tl:'Tagalog (Filipino)',tg:'Tajik',ta:'Tamil',tt:'Tatar',
  te:'Telugu',th:'Thai',tr:'Turkish',tk:'Turkmen',uk:'Ukrainian',
  ur:'Urdu',uz:'Uzbek',vi:'Vietnamese',cy:'Welsh',xh:'Xhosa',
  yi:'Yiddish',yo:'Yoruba',zu:'Zulu',
};

function normalize(code) {
  if (!code) return '';
  const lower = code.toLowerCase();
  if (lower === 'zh-cn' || lower === 'zh') return 'zh-cn';
  if (lower === 'zh-tw') return 'zh-tw';
  return lower.split('-')[0];
}

// ── Track last mouse position ──
let lastMouseX = 0, lastMouseY = 0;
document.addEventListener('mousemove', (e) => { lastMouseX = e.clientX; lastMouseY = e.clientY; }, { passive: true });

// ── Auto-translate on selection ──
let selectionDebounce = null;
let currentRequestId  = 0;

function handleSelectionEvent(e) {
  if (!settings.autoTranslateEnabled) return;

  const evX = (e.clientX !== undefined && e.clientX !== 0) ? e.clientX
    : (e.changedTouches ? e.changedTouches[0].clientX : lastMouseX);
  const evY = (e.clientY !== undefined && e.clientY !== 0) ? e.clientY
    : (e.changedTouches ? e.changedTouches[0].clientY : lastMouseY);

  clearTimeout(selectionDebounce);
  selectionDebounce = setTimeout(() => doTranslateSelection(evX, evY), 420);
}

async function doTranslateSelection(x, y) {
  const selection = window.getSelection();
  const text = selection ? selection.toString().trim() : '';

  if (!text || text.length < 2 || text.length > 600) {
    removePopup(); return;
  }

  const reqId = ++currentRequestId;

  try {
    const tl  = settings.autoTargetLang || settings.targetLang || 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (reqId !== currentRequestId) return;
    if (!res.ok) return;

    const data = await res.json();
    if (reqId !== currentRequestId) return;

    // Detect language
    let detected = '';
    if (data[8] && data[8][0] && data[8][0][0]) detected = data[8][0][0];
    else if (data[2]) detected = data[2];
    if (!detected) { removePopup(); return; }

    const detNorm = normalize(detected);
    const wl = (settings.whitelistLangs || []).map(c => normalize(c));
    const bl = (settings.blacklistLangs || []).map(c => normalize(c));
    const wlOn = settings.whitelistEnabled && wl.length > 0;
    const blOn = settings.blacklistEnabled && bl.length > 0;

    // Rule: if whitelist on+nonempty → only translate listed langs
    if (wlOn && !wl.includes(detNorm)) { removePopup(); return; }
    // Rule: if blacklist on+nonempty → skip listed langs
    if (blOn && bl.includes(detNorm))  { removePopup(); return; }

    // Assemble translation
    let translated = '';
    if (data[0]) data[0].forEach(seg => { if (seg && seg[0]) translated += seg[0]; });
    if (!translated) return;

    // Refine position to selection bounding box
    let popX = x, popY = y;
    try {
      const range = selection.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      if (rect && rect.width > 0) { popX = rect.right; popY = rect.bottom; }
    } catch (_) {}

    const detectedName = LANG_NAMES_MAP[detected] || detected.toUpperCase();
    createPopup(popX, popY, translated, detectedName, tl);

  } catch (err) { /* silent */ }
}

document.addEventListener('mouseup',  handleSelectionEvent);
document.addEventListener('touchend', handleSelectionEvent);
document.addEventListener('scroll',  () => removePopup(), { passive: true });
document.addEventListener('keydown',  (e) => { if (e.key === 'Escape') removePopup(); }, { passive: true });

} // end double-injection guard
