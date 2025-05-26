// Background script uses chrome.storage to persist the current problem state across restarts.

// Add onboarding on first install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open the onboarding panel as a standalone page
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background script received message:", message);
    // Persist problem state when received
    if (message.type === "leetx-plus-problem") {
        console.log("Background persisting problem state:", message.data);
        chrome.storage.local.set({ currentProblemState: message.data });
        return;
    }
    // Respond to popup queries by reading persisted state
    if (message.type === "get-current-problem") {
        console.log("Background responding to get-current-problem");
        chrome.storage.local.get(["currentProblemState"], (result) => {
            console.log("Background get-current-problem result:", result.currentProblemState);
            sendResponse(result.currentProblemState || null);
        });
        // Indicate we'll respond asynchronously
        return true;
    }

    // Other message types: do nothing
});

// When the user clicks the extension icon, open our side panel
chrome.action.onClicked.addListener((tab) => {
  try {
    const url = new URL(tab.url || '');
    const hostname = url.hostname;
    const isLeetCode = hostname.endsWith('leetcode.com') || hostname.endsWith('leetcode.cn');
    if (isLeetCode) {
      chrome.sidePanel.open({ tabId: tab.id })
        .catch(err => console.warn('Side panel open error for tab', tab.id, err));
    } else {
      console.warn('Side panel not active on this tab:', tab.url);
    }
  } catch (e) {
    console.error('Error opening side panel for tab', tab.id, e);
  }
});

// Enable side panel only on LeetCode pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    const isLeetCode = hostname.endsWith('leetcode.com') || hostname.endsWith('leetcode.cn');
    // Enable side panel on all LeetCode problem pages (including description pages)
    chrome.sidePanel.setOptions({
      tabId,
      path: 'index.html',
      enabled: isLeetCode
    }).catch(console.error);
  }
});