const searchInput = document.getElementById('searchInput');
const replaceInput = document.getElementById('replaceInput');
const matchCount  = document.getElementById('matchCount');
const statusPill  = document.getElementById('statusPill');
const cbCase      = document.getElementById('caseSensitive');
const cbWord      = document.getElementById('wholeWord');
const legend      = document.getElementById('legend');

const SETTINGS_KEY = 'fr_settings';
let searchAll = false;

// ── Settings ─────────────────────────────────────────────────────────────
function saveSettings() {
  chrome.storage.sync.set({ [SETTINGS_KEY]: { caseSensitive: cbCase.checked, wholeWord: cbWord.checked, searchAll } });
}
async function loadSettings() {
  return new Promise(r => chrome.storage.sync.get(SETTINGS_KEY, res => r(res[SETTINGS_KEY] || {})));
}

// ── Tabs ──────────────────────────────────────────────────────────────────
document.getElementById('tabFind').addEventListener('click', () => {
  document.getElementById('tabFind').classList.add('active');
  document.getElementById('tabForms').classList.remove('active');
  document.getElementById('panelFind').classList.add('active');
  document.getElementById('panelForms').classList.remove('active');
});
document.getElementById('tabForms').addEventListener('click', () => {
  document.getElementById('tabForms').classList.add('active');
  document.getElementById('tabFind').classList.remove('active');
  document.getElementById('panelForms').classList.add('active');
  document.getElementById('panelFind').classList.remove('active');
});

// ── Search all mode toggle ────────────────────────────────────────────────
document.getElementById('modeInputs').addEventListener('click', () => {
  searchAll = false;
  document.getElementById('modeInputs').classList.add('active');
  document.getElementById('modeAll').classList.remove('active');
  legend.style.display = 'none';
  saveSettings();
  sendMessage('find').then(updateStatus);
});
document.getElementById('modeAll').addEventListener('click', () => {
  searchAll = true;
  document.getElementById('modeAll').classList.add('active');
  document.getElementById('modeInputs').classList.remove('active');
  legend.style.display = 'flex';
  saveSettings();
  sendMessage('find').then(updateStatus);
});

// ── Messaging ─────────────────────────────────────────────────────────────
function getOptions() {
  return { search: searchInput.value, replace: replaceInput.value,
           caseSensitive: cbCase.checked, wholeWord: cbWord.checked, searchAll };
}

async function getTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureInjected(tabId) {
  // Ping the content script — only inject if it's not already running
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (_) {
    // Not running, inject it
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    } catch (_2) {}
  }
}

async function sendMessage(action, extra = {}) {
  const tab = await getTab();
  if (!tab) return null;
  await ensureInjected(tab.id);
  try {
    return await chrome.tabs.sendMessage(tab.id, { action, ...getOptions(), ...extra });
  } catch (e) {
    console.error('FR error:', e);
    return null;
  }
}

// ── Status ────────────────────────────────────────────────────────────────
function updateStatus(res) {
  if (!res) return;
  if (res.total > 0) {
    matchCount.textContent = `${res.current + 1} / ${res.total} matches`;
    matchCount.className = 'match-count found';
    statusPill.textContent = `${res.total} found`;
    statusPill.className = 'status-pill active';
  } else if (searchInput.value.length > 0) {
    matchCount.textContent = 'No matches found';
    matchCount.className = 'match-count none';
    statusPill.textContent = 'no match';
    statusPill.className = 'status-pill';
  } else {
    matchCount.textContent = '';
    matchCount.className = 'match-count';
    statusPill.textContent = 'idle';
    statusPill.className = 'status-pill';
  }
}

// ── Find & Replace events ─────────────────────────────────────────────────
let debounce;
searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => sendMessage('find').then(updateStatus), 100);
});
searchInput.addEventListener('keydown',  async e => { if (e.key==='Enter') { e.preventDefault(); updateStatus(await sendMessage('replace')); }});
replaceInput.addEventListener('keydown', async e => { if (e.key==='Enter') { e.preventDefault(); updateStatus(await sendMessage('replace')); }});

[cbCase, cbWord].forEach(cb => cb.addEventListener('change', () => { saveSettings(); sendMessage('find').then(updateStatus); }));

document.getElementById('btnPrev').addEventListener('click',        () => sendMessage('prev').then(updateStatus));
document.getElementById('btnNext').addEventListener('click',        () => sendMessage('next').then(updateStatus));
document.getElementById('btnReplace').addEventListener('click',     () => sendMessage('replace').then(updateStatus));
document.getElementById('btnReplaceNext').addEventListener('click', () => sendMessage('replaceNext').then(updateStatus));
document.getElementById('btnReplaceAll').addEventListener('click',  () => sendMessage('replaceAll').then(updateStatus));

// ── Form Tools events ─────────────────────────────────────────────────────
document.getElementById('btnCopyForms').addEventListener('click', async () => {
  await sendMessage('copyForms');
});
document.getElementById('btnPasteForms').addEventListener('click', async () => {
  await sendMessage('pasteForms');
});
document.getElementById('btnClearForms').addEventListener('click', async () => {
  if (!confirm('Clear all form fields on this page?')) return;
  await sendMessage('clearForms');
});

// ── Init ──────────────────────────────────────────────────────────────────
(async () => {
  const saved = await loadSettings();
  if (saved.caseSensitive !== undefined) cbCase.checked = saved.caseSensitive;
  if (saved.wholeWord     !== undefined) cbWord.checked = saved.wholeWord;
  if (saved.searchAll     !== undefined) {
    searchAll = saved.searchAll;
    if (searchAll) {
      document.getElementById('modeAll').classList.add('active');
      document.getElementById('modeInputs').classList.remove('active');
      legend.style.display = 'flex';
    }
  }

  const tab = await getTab();
  if (!tab) return;
  try {
    await ensureInjected(tab.id);
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
    if (res?.search) {
      searchInput.value  = res.search;
      replaceInput.value = res.replace || '';
      updateStatus(await sendMessage('find'));
    }
  } catch (_) {}
})();
