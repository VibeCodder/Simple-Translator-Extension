chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'fr-open',        title: '🔍 Find & Replace',     contexts: ['page','selection'] });
    chrome.contextMenus.create({ id: 'sep1', type: 'separator',                         contexts: ['page','selection'] });
    chrome.contextMenus.create({ id: 'fr-copy-forms',  title: '📋 Copy all form data', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'fr-paste-forms', title: '📥 Paste form data',    contexts: ['page'] });
    chrome.contextMenus.create({ id: 'fr-clear-forms',    title: '🗑️ Clear all forms',   contexts: ['page'] });
    chrome.contextMenus.create({ id: 'fr-replace-schema', title: '📊 Replace Schema',       contexts: ['page','selection'] });
  });
});

// Inject content.js only if not already running (ping check)
async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (_) {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => {});
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;

  if (info.menuItemId === 'fr-open') {
    // Ensure content script is running, then inject panel (panel toggles itself)
    await ensureContentScript(tab.id);
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['panel.js'] });
    return;
  }

  // For form actions, ensure content script is present
  await ensureContentScript(tab.id);

  if (info.menuItemId === 'fr-copy-forms') {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__frCopyForms?.() });
  }
  if (info.menuItemId === 'fr-paste-forms') {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__frPasteForms?.() });
  }
  if (info.menuItemId === 'fr-clear-forms') {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__frClearForms?.() });
  }
  if (info.menuItemId === 'fr-replace-schema') {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['schema.js'] });
  }
});

// Route messages from panel.js (running in page context) to content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg._fromPanel && sender.tab) {
    const { _fromPanel, ...payload } = msg;
    chrome.tabs.sendMessage(sender.tab.id, payload, (res) => {
      sendResponse(res);
    });
    return true;
  }

  if (msg.action === 'formDataCopied') {
    chrome.storage.local.set({ formClipboard: msg.data }, () => {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (c) => window.__frShowToast?.(`📋 Copied ${c} field(s)`),
        args: [msg.data.length]
      });
    });
    return;
  }
  if (msg.action === 'requestFormClipboard') {
    chrome.storage.local.get('formClipboard', (result) => {
      sendResponse({ data: result.formClipboard || [] });
    });
    return true;
  }
});
