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
const LANG_BY_NAME = {}; // lowercase name → code
LANGUAGES.forEach(l => {
  LANG_NAMES[l.code] = l.name;
  LANG_BY_NAME[l.name.toLowerCase()] = l.code;
});

// ── Elements ──
const sourceText       = document.getElementById('sourceText');
const targetLangSel    = document.getElementById('targetLang');
const resultText       = document.getElementById('resultText');
const detectedLang     = document.getElementById('detectedLang');
const spinner          = document.getElementById('spinner');
const errorBanner      = document.getElementById('errorBanner');
const copyBtn          = document.getElementById('copyBtn');
const copySourceBtn    = document.getElementById('copySourceBtn');
const speakSourceBtn   = document.getElementById('speakSourceBtn');
const speakResultBtn   = document.getElementById('speakResultBtn');

// Settings elements
const openSettingsBtn      = document.getElementById('openSettingsBtn');
const closeSettingsBtn     = document.getElementById('closeSettingsBtn');
const settingsOverlay      = document.getElementById('settingsOverlay');
const autoTranslateEnabled = document.getElementById('autoTranslateEnabled');
const autoLangConfig       = document.getElementById('autoLangConfig');
const ignoredLangsArea     = document.getElementById('ignoredLangsArea');
const addLangSelect        = document.getElementById('addLangSelect');
const addLangBtn           = document.getElementById('addLangBtn');
const autoTargetLang       = document.getElementById('autoTargetLang');
const modeTranslateThese   = document.getElementById('modeTranslateThese');
const modeDontTranslate    = document.getElementById('modeDontTranslate');

let debounceTimer  = null;
let translatedText = '';
let detectedCode   = 'auto';

// ── Ignored languages helpers ──
// Parse the textarea: comma/newline separated list of language names or codes
function parseIgnoredList(raw) {
  return raw
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function serializeIgnoredList(names) {
  return names.join(', ');
}

function getIgnoredCodes() {
  const raw = ignoredLangsArea.value;
  const entries = parseIgnoredList(raw);
  const codes = new Set();
  entries.forEach(entry => {
    const lower = entry.toLowerCase();
    // try matching by code first, then by name
    if (LANG_NAMES[lower]) {
      codes.add(lower);
    } else if (LANG_BY_NAME[lower]) {
      codes.add(LANG_BY_NAME[lower]);
    } else {
      // try matching by code case-insensitively
      const found = LANGUAGES.find(l => l.code.toLowerCase() === lower);
      if (found) codes.add(found.code);
    }
  });
  return codes;
}

// ── Populate dropdowns ──
function populateDropdown() {
  LANGUAGES.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    targetLangSel.appendChild(opt);
  });
  const saved = localStorage.getItem('st_targetLang') || 'en';
  targetLangSel.value = saved;
}

function populateSettingsDropdowns() {
  // Add-language picker
  LANGUAGES.forEach(lang => {
    const opt1 = document.createElement('option');
    opt1.value = lang.name;
    opt1.textContent = lang.name;
    addLangSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = lang.code;
    opt2.textContent = lang.name;
    autoTargetLang.appendChild(opt2);
  });

  // Load saved ignored list
  const savedIgnored = localStorage.getItem('st_ignoredLangs') || 'English, Polish';
  ignoredLangsArea.value = savedIgnored;

  // Load saved mode (translate these / don't translate these)
  const savedMode = localStorage.getItem('st_langListMode') || 'ignore';
  if (savedMode === 'translate') {
    modeTranslateThese.checked = true;
  } else {
    modeDontTranslate.checked = true;
  }

  // Load saved auto-target lang
  autoTargetLang.value = localStorage.getItem('st_autoTargetLang') || 'en';

  // Load toggle
  const enabled = localStorage.getItem('st_autoTranslateEnabled') === 'true';
  autoTranslateEnabled.checked = enabled;
  autoLangConfig.classList.toggle('visible', enabled);
}

targetLangSel.addEventListener('change', () => {
  localStorage.setItem('st_targetLang', targetLangSel.value);
  if (sourceText.value.trim()) translate();
});

// ── Settings panel ──
openSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.add('open');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.remove('open');
  pushSettingsToContentScript();
});

autoTranslateEnabled.addEventListener('change', () => {
  const enabled = autoTranslateEnabled.checked;
  localStorage.setItem('st_autoTranslateEnabled', enabled);
  autoLangConfig.classList.toggle('visible', enabled);
  pushSettingsToContentScript();
});

// Save ignored list on edit
ignoredLangsArea.addEventListener('input', () => {
  localStorage.setItem('st_ignoredLangs', ignoredLangsArea.value);
  pushSettingsToContentScript();
});

// Radio buttons — list mode
[modeTranslateThese, modeDontTranslate].forEach(radio => {
  radio.addEventListener('change', () => {
    localStorage.setItem('st_langListMode', radio.value);
    pushSettingsToContentScript();
  });
});

// Add language button
addLangBtn.addEventListener('click', () => {
  const langName = addLangSelect.value;
  if (!langName) return;

  const current = parseIgnoredList(ignoredLangsArea.value);
  // Avoid duplicates (case-insensitive)
  if (!current.some(e => e.toLowerCase() === langName.toLowerCase())) {
    current.push(langName);
    ignoredLangsArea.value = serializeIgnoredList(current);
    localStorage.setItem('st_ignoredLangs', ignoredLangsArea.value);
    pushSettingsToContentScript();
  }
});

// Save auto-target lang
autoTargetLang.addEventListener('change', () => {
  localStorage.setItem('st_autoTargetLang', autoTargetLang.value);
  pushSettingsToContentScript();
});

function pushSettingsToContentScript() {
  const ignoredCodes = Array.from(getIgnoredCodes());
  const settings = {
    autoTranslateEnabled: autoTranslateEnabled.checked,
    ignoredLangs: ignoredCodes,
    langListMode: modeTranslateThese.checked ? 'translate' : 'ignore',
    autoTargetLang: autoTargetLang.value,
    targetLang: targetLangSel.value,
  };
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', settings })
      .catch(() => {});
  });
}

// ── Translate ──
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

function setResult(text) {
  resultText.textContent = text;
}

function clearResult() {
  translatedText = '';
  detectedCode = 'auto';
  detectedLang.textContent = '';
  resultText.innerHTML = '<span class="placeholder"></span>';
}

function setSpinner(on) {
  spinner.style.display = on ? 'block' : 'none';
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.style.display = 'block';
}

function hideError() {
  errorBanner.style.display = 'none';
}

// ── Input handler with debounce ──
sourceText.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  if (!sourceText.value.trim()) { clearResult(); return; }
  debounceTimer = setTimeout(translate, 380);
});

// ── Copy ──
copyBtn.addEventListener('click', () => {
  if (!translatedText) return;
  navigator.clipboard.writeText(translatedText).then(() => {
    copyBtn.classList.add('active');
    setTimeout(() => copyBtn.classList.remove('active'), 1500);
  });
});

// ── Text-to-speech via Google TTS ──
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

copySourceBtn.addEventListener('click', () => {
  const text = sourceText.value.trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copySourceBtn.classList.add('active');
    setTimeout(() => copySourceBtn.classList.remove('active'), 1500);
  });
});

speakSourceBtn.addEventListener('click', () => {
  speak(sourceText.value.trim(), detectedCode);
});

speakResultBtn.addEventListener('click', () => {
  speak(translatedText, targetLangSel.value);
});

// ── Init ──
populateDropdown();
populateSettingsDropdowns();
pushSettingsToContentScript();

// Fetch selected text from page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]?.id) { sourceText.focus(); return; }
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      func: () => window.getSelection().toString().trim()
    },
    (results) => {
      if (chrome.runtime.lastError || !results || !results[0]?.result) {
        sourceText.focus();
        return;
      }
      const selected = results[0].result;
      if (selected) {
        sourceText.value = selected;
        translate();
      } else {
        sourceText.focus();
      }
    }
  );
});
