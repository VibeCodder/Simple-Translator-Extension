const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' }, { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' }, { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' }, { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' }, { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' }, { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' }, { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' }, { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' }, { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' }, { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' }, { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' }, { code: 'fr', name: 'French' },
  { code: 'gl', name: 'Galician' }, { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' }, { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' }, { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' }, { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' }, { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' }, { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' }, { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' }, { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' }, { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' }, { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' }, { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' }, { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' }, { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' }, { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' }, { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' }, { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' }, { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' }, { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' }, { code: 'no', name: 'Norwegian' },
  { code: 'fa', name: 'Persian' }, { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' }, { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' }, { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' }, { code: 'sr', name: 'Serbian' },
  { code: 'si', name: 'Sinhala' }, { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' }, { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' }, { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' }, { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog (Filipino)' }, { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' }, { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' }, { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' }, { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' }, { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' }, { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' }, { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
];

const LANG_NAMES = {};
const LANG_BY_NAME = {};
LANGUAGES.forEach(l => {
  LANG_NAMES[l.code] = l.name;
  LANG_BY_NAME[l.name.toLowerCase()] = l.code;
});

const sourceText       = document.getElementById('sourceText');
const sourceLangSel    = document.getElementById('sourceLang');
const swapLangBtn      = document.getElementById('swapLangBtn');
const targetLangSel    = document.getElementById('targetLang');
const resultText       = document.getElementById('resultText');
const detectedLang     = document.getElementById('detectedLang');
const spinner          = document.getElementById('spinner');
const errorBanner      = document.getElementById('errorBanner');
const copyBtn          = document.getElementById('copyBtn');
const copySourceBtn    = document.getElementById('copySourceBtn');
const speakSourceBtn   = document.getElementById('speakSourceBtn');
const speakResultBtn   = document.getElementById('speakResultBtn');

const openSettingsBtn      = document.getElementById('openSettingsBtn');
const closeSettingsBtn     = document.getElementById('closeSettingsBtn');
const settingsOverlay      = document.getElementById('settingsOverlay');
const autoTranslateEnabled = document.getElementById('autoTranslateEnabled');

const whitelistEnabled   = document.getElementById('whitelistEnabled');
const whitelistArea      = document.getElementById('whitelistArea');
const addWhitelistSelect = document.getElementById('addWhitelistSelect');
const addWhitelistBtn    = document.getElementById('addWhitelistBtn');

const blacklistEnabled   = document.getElementById('blacklistEnabled');
const blacklistArea      = document.getElementById('blacklistArea');
const addBlacklistSelect = document.getElementById('addBlacklistSelect');
const addBlacklistBtn    = document.getElementById('addBlacklistBtn');

const autoTargetLang     = document.getElementById('autoTargetLang');

let debounceTimer  = null;
let translatedText = '';
let detectedCode   = 'auto';

function parseList(raw) {
  return raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
}

function serializeList(names) {
  return names.join(', ');
}

function getCodesFromArea(textarea) {
  const entries = parseList(textarea.value);
  const codes = new Set();
  entries.forEach(entry => {
    const lower = entry.toLowerCase();
    if (LANG_NAMES[lower]) {
      codes.add(lower);
    } else if (LANG_BY_NAME[lower]) {
      codes.add(LANG_BY_NAME[lower]);
    } else {
      const found = LANGUAGES.find(l => l.code.toLowerCase() === lower);
      if (found) codes.add(found.code);
    }
  });
  return codes;
}

function addLangToArea(textarea, langName) {
  if (!langName) return;
  const current = parseList(textarea.value);
  if (!current.some(e => e.toLowerCase() === langName.toLowerCase())) {
    current.push(langName);
    textarea.value = serializeList(current);
  }
}

function saveWhitelistCodes() {
  chrome.storage.local.set({ st_whitelistLangs: Array.from(getCodesFromArea(whitelistArea)) });
}

function saveBlacklistCodes() {
  chrome.storage.local.set({ st_blacklistLangs: Array.from(getCodesFromArea(blacklistArea)) });
}

function populateDropdowns() {
  LANGUAGES.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    targetLangSel.appendChild(opt);

    const optSrc = document.createElement('option');
    optSrc.value = lang.code;
    optSrc.textContent = lang.name;
    sourceLangSel.appendChild(optSrc);

    const o1 = document.createElement('option');
    o1.value = lang.name; o1.textContent = lang.name;
    addWhitelistSelect.appendChild(o1);

    const o2 = document.createElement('option');
    o2.value = lang.name; o2.textContent = lang.name;
    addBlacklistSelect.appendChild(o2);

    const o3 = document.createElement('option');
    o3.value = lang.code; o3.textContent = lang.name;
    autoTargetLang.appendChild(o3);
  });
}

function initFromStorage(result) {
  targetLangSel.value = result.st_targetLang || 'en';
  sourceLangSel.value = result.st_sourceLang || 'pl';

  autoTranslateEnabled.checked = result.st_autoTranslateEnabled === true || result.st_autoTranslateEnabled === 'true';
  whitelistEnabled.checked = result.st_whitelistEnabled === true || result.st_whitelistEnabled === 'true';

  const wlCodes = Array.isArray(result.st_whitelistLangs) ? result.st_whitelistLangs : [];
  if (wlCodes.length > 0) {
    whitelistArea.value = wlCodes.map(c => LANG_NAMES[c] || c).join(', ');
  } else {
    whitelistArea.value = '';
  }

  const blStored = result.st_blacklistEnabled;
  blacklistEnabled.checked = blStored === undefined || blStored === true || blStored === 'true';

  const blCodes = Array.isArray(result.st_blacklistLangs) ? result.st_blacklistLangs : [];
  if (blCodes.length > 0) {
    blacklistArea.value = blCodes.map(c => LANG_NAMES[c] || c).join(', ');
  } else {
    blacklistArea.value = 'English, Polish';
  }

  autoTargetLang.value = result.st_autoTargetLang || 'en';

  // Fetch any selected text from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) { sourceText.focus(); return; }
    chrome.scripting.executeScript(
      { target: { tabId: tabs[0].id }, func: () => window.getSelection().toString().trim() },
      (results) => {
        if (chrome.runtime.lastError || !results || !results[0]?.result) {
          sourceText.focus(); return;
        }
        const selected = results[0].result;
        if (selected) { sourceText.value = selected; translate(); }
        else { sourceText.focus(); }
      }
    );
  });
}


openSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.add('open');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.remove('open');
});

autoTranslateEnabled.addEventListener('change', () => {
  chrome.storage.local.set({ st_autoTranslateEnabled: autoTranslateEnabled.checked });
});

whitelistEnabled.addEventListener('change', () => {
  chrome.storage.local.set({ st_whitelistEnabled: whitelistEnabled.checked });
});

// Zmieniono 'input' na 'change' - zapisuje dopiero gdy klikniesz poza polem
whitelistArea.addEventListener('change', () => {
  saveWhitelistCodes();
});

addWhitelistBtn.addEventListener('click', () => {
  addLangToArea(whitelistArea, addWhitelistSelect.value);
  saveWhitelistCodes();
});

blacklistEnabled.addEventListener('change', () => {
  chrome.storage.local.set({ st_blacklistEnabled: blacklistEnabled.checked });
});

// Zmieniono 'input' na 'change'
blacklistArea.addEventListener('change', () => {
  saveBlacklistCodes();
});

addBlacklistBtn.addEventListener('click', () => {
  addLangToArea(blacklistArea, addBlacklistSelect.value);
  saveBlacklistCodes();
});

autoTargetLang.addEventListener('change', () => {
  chrome.storage.local.set({ st_autoTargetLang: autoTargetLang.value });
});

targetLangSel.addEventListener('change', () => {
  chrome.storage.local.set({ st_targetLang: targetLangSel.value });
  if (sourceText.value.trim()) translate();
});

// Left button is display-only (doesn't affect the actual translation call,
// which always auto-detects the source language) - just persist its state.
sourceLangSel.addEventListener('change', () => {
  chrome.storage.local.set({ st_sourceLang: sourceLangSel.value });
});

swapLangBtn.addEventListener('click', () => {
  const srcVal = sourceLangSel.value;
  const tgtVal = targetLangSel.value;

  sourceLangSel.value = tgtVal;
  targetLangSel.value = srcVal;

  // Save both values in a single atomic write instead of dispatching two
  // separate 'change' events (which triggered two independent async
  // storage.set calls). If the popup is closed right after clicking swap,
  // Chrome can tear down the popup before both separate writes finish,
  // silently dropping one of them. One combined write closes that gap.
  chrome.storage.local.set(
    { st_sourceLang: tgtVal, st_targetLang: srcVal },
    () => {
      if (sourceText.value.trim()) translate();
    }
  );
});



async function translate() {
  const text = sourceText.value.trim();
  if (!text) { clearResult(); return; }

  setSpinner(true);
  hideError();

  const tl  = targetLangSel.value;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&dt=ld&q=${encodeURIComponent(text)}`;

  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    let out = '';
    if (data[0]) data[0].forEach(seg => { if (seg && seg[0]) out += seg[0]; });

    let detected = 'auto';
    if (data[8] && data[8][0] && data[8][0][0]) detected = data[8][0][0];
    else if (data[2]) detected = data[2];

    detectedCode = detected;
    const detectedName = LANG_NAMES[detected] || detected.toUpperCase();
    detectedLang.textContent = `Detected: ${detectedName}`;

    translatedText = out;
    setResult(out);
  } catch (err) {
    showError('Translation failed. Check your internet connection.');
  } finally {
    setSpinner(false);
  }
}

function setResult(text) { resultText.textContent = text; }

function clearResult() {
  translatedText = '';
  detectedCode = 'auto';
  detectedLang.textContent = '';
  resultText.innerHTML = '<span class="placeholder"></span>';
}

function setSpinner(on)  { spinner.style.display = on ? 'block' : 'none'; }
function showError(msg)  { errorBanner.textContent = msg; errorBanner.style.display = 'block'; }
function hideError()     { errorBanner.style.display = 'none'; }

sourceText.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  if (!sourceText.value.trim()) { clearResult(); return; }
  debounceTimer = setTimeout(translate, 380);
});

copyBtn.addEventListener('click', () => {
  if (!translatedText) return;
  navigator.clipboard.writeText(translatedText).then(() => {
    copyBtn.classList.add('active');
    setTimeout(() => copyBtn.classList.remove('active'), 1500);
  });
});

copySourceBtn.addEventListener('click', () => {
  const text = sourceText.value.trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copySourceBtn.classList.add('active');
    setTimeout(() => copySourceBtn.classList.remove('active'), 1500);
  });
});

function speak(text, langCode) {
  if (!text) return;
  const lang = langCode === 'auto' ? 'en' : langCode;
  const url  = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=gtx&q=${encodeURIComponent(text.slice(0, 200))}`;
  const audio = new Audio(url);
  audio.play().catch(() => {
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      speechSynthesis.speak(utt);
    }
  });
}

speakSourceBtn.addEventListener('click', () => speak(sourceText.value.trim(), detectedCode));
speakResultBtn.addEventListener('click', () => speak(translatedText, targetLangSel.value));

populateDropdowns();
chrome.storage.local.get([
  'st_targetLang',
  'st_sourceLang',
  'st_autoTranslateEnabled',
  'st_whitelistEnabled',
  'st_whitelistLangs',
  'st_blacklistEnabled',
  'st_blacklistLangs',
  'st_autoTargetLang',
], initFromStorage);