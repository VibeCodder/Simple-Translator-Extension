// Guard against double-injection
if (typeof window.__simpleTranslateLoaded === 'undefined') {
window.__simpleTranslateLoaded = true;

// ── State ──
let settings = {
  autoTranslateEnabled: false,
  ignoredLangs: ['en', 'pl'],   // array of language codes
  langListMode: 'ignore',        // 'ignore' = skip listed langs | 'translate' = only translate listed langs
  autoTargetLang: 'en',
  targetLang: 'en',
};

// Load settings from chrome.storage on inject
chrome.storage.local.get([
  'st_autoTranslateEnabled',
  'st_ignoredLangs',
  'st_langListMode',
  'st_autoTargetLang',
  'st_targetLang',
], (result) => {
  if (result.st_autoTranslateEnabled !== undefined)
    settings.autoTranslateEnabled = result.st_autoTranslateEnabled === true || result.st_autoTranslateEnabled === 'true';
  if (result.st_ignoredLangs)   settings.ignoredLangs   = result.st_ignoredLangs;
  if (result.st_langListMode)   settings.langListMode    = result.st_langListMode;
  if (result.st_autoTargetLang) settings.autoTargetLang = result.st_autoTargetLang;
  if (result.st_targetLang)     settings.targetLang     = result.st_targetLang;
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
      st_ignoredLangs:         settings.ignoredLangs,
      st_langListMode:         settings.langListMode,
      st_autoTargetLang:       settings.autoTargetLang,
      st_targetLang:           settings.targetLang,
    });
  }
  return true;
});

// ── Inject shared styles once ──
function ensureStyles() {
  // no shared styles needed
}

// ── Spinner (removed) ──
function showSpinner(x, y) {}
function removeSpinner() {}

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
  ensureStyles();
  removePopup();

  const popup = document.createElement('div');
  popup.id = '__simple_translate_popup__';

  const targetName = LANG_NAMES_MAP[targetLangCode] || targetLangCode.toUpperCase();

  popup.innerHTML = `
    <div id="__st_header__" style="
      padding: 7px 10px 6px;
      background: #272727;
      border-bottom: 1px solid #333;
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
      user-select: none;
    ">
      <button id="__st_drag__" title="Move" style="
        background: none; border: none; cursor: grab;
        color: #555; padding: 1px 4px 1px 0; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        border-radius: 3px; transition: color 0.15s;
      ">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <!-- up -->
          <polygon points="7,0 5,3 9,3"/>
          <!-- down -->
          <polygon points="7,14 5,11 9,11"/>
          <!-- left -->
          <polygon points="0,7 3,5 3,9"/>
          <!-- right -->
          <polygon points="14,7 11,5 11,9"/>
          <!-- center cross -->
          <rect x="4.5" y="4.5" width="5" height="5"/>
        </svg>
      </button>
      <span style="font-size: 11px; color: #4a90d9; font-weight: 500; white-space: nowrap; flex: 1;">
        ${escapeHtml(detectedLangName)} &rarr; ${escapeHtml(targetName)}
      </span>
      <button id="__st_close__" style="
        background: none; border: none; cursor: pointer;
        color: #555; font-size: 14px; line-height: 1;
        padding: 0 2px; border-radius: 3px; flex-shrink: 0;
      " title="Close">&#x2715;</button>
    </div>
    <div style="
      padding: 10px 12px; line-height: 1.55;
      word-break: break-word; max-height: 160px; overflow-y: auto;
    ">${escapeHtml(translatedText)}</div>
    <div style="
      padding: 5px 10px;
      display: flex; justify-content: flex-end;
      border-top: 1px solid #2a2a2a;
    ">
      <button id="__st_copy__" style="
        background: none; border: 1px solid #3a3a3a; cursor: pointer;
        color: #888; font-size: 11px; padding: 3px 8px; border-radius: 4px;
        font-family: inherit;
      ">Copy</button>
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
    overflow: hidden;
    visibility: hidden;
    left: 0; top: 0;
  `;

  (document.body || document.documentElement).appendChild(popup);
  translatePopup = popup;

  // Measure then position
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
      if (btn) { btn.textContent = 'Copied!'; btn.style.color = '#4a90d9'; }
    });
  });

  // ── Drag to move (via drag handle only) ──
  const dragHandle = popup.querySelector('#__st_drag__');
  let dragging = false;
  let dragOffX = 0;
  let dragOffY = 0;

  dragHandle.addEventListener('mouseenter', () => { if (!dragging) dragHandle.style.color = '#aaa'; });
  dragHandle.addEventListener('mouseleave', () => { if (!dragging) dragHandle.style.color = '#555'; });

  dragHandle.addEventListener('mousedown', (e) => {
    dragging = true;
    _isDragging = true;
    dragOffX = e.clientX - popup.getBoundingClientRect().left;
    dragOffY = e.clientY - popup.getBoundingClientRect().top;
    dragHandle.style.cursor = 'grabbing';
    dragHandle.style.color  = '#4a90d9';
    e.preventDefault();
    e.stopPropagation();

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup',   onDragEnd);
  });

  function onDragMove(e) {
    if (!dragging || !translatePopup) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = e.clientX - dragOffX;
    let ny = e.clientY - dragOffY;
    nx = Math.max(0, Math.min(nx, vw - popup.offsetWidth));
    ny = Math.max(0, Math.min(ny, vh - popup.offsetHeight));
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

  // Delay registering outside-click listener so the mouseup that
  // triggered the popup (end of text selection) doesn't immediately close it
  setTimeout(() => {
    document.addEventListener('mousedown', onOutsideClick);
  }, 200);
}

let _isDragging = false;

function onOutsideClick(e) {
  if (_isDragging) return;
  if (translatePopup && !translatePopup.contains(e.target)) {
    removePopup();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// ── Track last known mouse position ──
let lastMouseX = 0;
let lastMouseY = 0;
document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}, { passive: true });

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
    removePopup();
    removeSpinner();
    return;
  }

  const reqId = ++currentRequestId;
  showSpinner(x, y);

  try {
    const tl  = settings.autoTargetLang || settings.targetLang || 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (reqId !== currentRequestId) return;
    removeSpinner();
    if (!res.ok) return;

    const data = await res.json();
    if (reqId !== currentRequestId) return;

    // Detect language
    let detected = '';
    if (data[8] && data[8][0] && data[8][0][0]) detected = data[8][0][0];
    else if (data[2]) detected = data[2];

    if (!detected) { removePopup(); return; }

    // Apply language list mode
    const detNorm  = normalize(detected);
    const langList = (settings.ignoredLangs || []).map(c => normalize(c));
    const mode     = settings.langListMode || 'ignore';

    if (mode === 'ignore') {
      // Don't translate languages on the list
      if (langList.includes(detNorm)) { removePopup(); return; }
    } else {
      // Only translate languages on the list
      if (!langList.includes(detNorm)) { removePopup(); return; }
    }

    // Assemble translated string
    let translated = '';
    if (data[0]) data[0].forEach(seg => { if (seg && seg[0]) translated += seg[0]; });
    if (!translated) return;

    // Refine popup position to selection bounding box
    let popX = x;
    let popY = y;
    try {
      const range = selection.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      if (rect && rect.width > 0) {
        popX = rect.right;
        popY = rect.bottom;
      }
    } catch (_) {}

    const detectedName = LANG_NAMES_MAP[detected] || detected.toUpperCase();
    createPopup(popX, popY, translated, detectedName, tl);

  } catch (err) {
    if (reqId === currentRequestId) removeSpinner();
  }
}

document.addEventListener('mouseup',  handleSelectionEvent);
document.addEventListener('touchend', handleSelectionEvent);

document.addEventListener('scroll',  () => { removePopup(); removeSpinner(); }, { passive: true });
document.addEventListener('keydown',  (e) => { if (e.key === 'Escape') { removePopup(); removeSpinner(); } }, { passive: true });

} // end double-injection guard
