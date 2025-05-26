// Add DEFAULT_API_URL at the top
const DEFAULT_API_URL = "https://openrouter.ai/v1/chat/completions?model=qwen/qwen3-235b-a22b:free";

// Saves options to chrome.storage
function saveOptions() {
  const apiUrl = document.getElementById('apiUrl').value;
  const apiKey = document.getElementById('apiKey').value;
  chrome.storage.local.set({ apiUrl, apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved.';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
}

// Restores options by reading from chrome.storage
function restoreOptions() {
  chrome.storage.local.get(['apiUrl','apiKey'], (result) => {
    // Use stored URL or default free Qwen3 model endpoint
    document.getElementById('apiUrl').value = result.apiUrl || DEFAULT_API_URL;
    document.getElementById('apiKey').value = result.apiKey || '';
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions); 