import React, { useState, useEffect } from "react";
import Switch from "react-switch";

import "../styles/settings-form.scss";

function SettingsForm({ onDone }) {
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [defaultProvider, setDefaultProvider] = useState("gemini");
  const [status, setStatus] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["apiUrl", "apiKey", "defaultProvider"], (result) => {
      if (result.apiUrl) {
        setUseCustomUrl(true);
        setApiUrl(result.apiUrl);
      } else {
        setUseCustomUrl(false);
        setApiUrl("");
      }
      setApiKey(result.apiKey || "");
      setDefaultProvider(result.defaultProvider || "gemini");
    });
  }, []);

  const handleSave = () => {
    const urlToSave = useCustomUrl ? apiUrl : "";
    chrome.storage.local.set({ apiUrl: urlToSave, apiKey, defaultProvider }, () => {
      setStatus("Settings saved.");
      setTimeout(() => {
        setStatus("");
        onDone();
      }, 1000);
    });
  };

  return (
    <div className="settings-form">
      <h2 className="settings-form__title">Settings</h2>
      <div className="settings-form__guide">
        <p>This extension supports two AI providers: Google Gemini (via AI Studio) and Qwen (via OpenRouter). Follow the steps below to configure:</p>
        <ol>
          <li>
            <strong>Google Gemini (AI Studio):</strong>
            <ol type="a">
              <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">AI Studio</a> and sign in.</li>
              <li>Select <strong>Models</strong>, choose your Gemini model, click the <strong>Endpoint</strong> tab, and copy the <em>REST</em> URL.</li>
              <li>In Google Cloud Console under <strong>APIs & Services → Credentials</strong>, create or select an <strong>API key</strong> and copy it.</li>
              <li>Return here and paste your GCP API key into the <strong>API Key</strong> field; the extension will automatically append it to the Gemini endpoint.</li>
            </ol>
          </li>
          <li>
            <strong>Qwen (OpenRouter):</strong>
            <ol type="a">
              <li>Go to <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">openrouter.ai</a> and sign up or log in.</li>
              <li>In your dashboard, navigate to <strong>API Keys</strong> (or <strong>Account Settings</strong>) and copy your <code>sk-</code> key.</li>
              <li>Toggle <strong>Default model</strong> to Qwen (<em>off</em> = Qwen) and enable <strong>Use custom API endpoint</strong>.</li>
              <li>Enter <code>https://openrouter.ai/api/v1/chat/completions</code> in the API endpoint field and paste your <code>sk-</code> key below.</li>
            </ol>
          </li>
        </ol>
      </div>
      <div className="settings-form__item flex align-center justify-between">
        <label>Default model: Gemini (off = Qwen)</label>
        <Switch
          onChange={(checked) => setDefaultProvider(checked ? "gemini" : "qwen")}
          checked={defaultProvider === "gemini"}
          uncheckedIcon={false}
          checkedIcon={false}
          height={20}
          width={40}
          handleDiameter={18}
        />
      </div>
      <div className="settings-form__item flex align-center justify-between">
        <label>Use custom API endpoint (OpenRouter)</label>
        <Switch
          onChange={setUseCustomUrl}
          checked={useCustomUrl}
          uncheckedIcon={false}
          checkedIcon={false}
          height={20}
          width={40}
          handleDiameter={18}
        />
      </div>
      {useCustomUrl && (
        <div className="settings-form__item">
          <label>API endpoint:</label>
          <input
            type="text"
            value={apiUrl}
            placeholder="Full API URL (e.g. OpenRouter chat/completions; leave blank to use default Gemini)"
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>
      )}
      <div className="settings-form__item">
        <label>API Key:</label>
        <input
          type="text"
          value={apiKey}
          placeholder="Enter your API key (OpenRouter sk- or GCP API key)"
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="settings-form__buttons">
        <button className="button button--secondary" onClick={onDone}>Cancel</button>
        <button className="button button--primary" onClick={handleSave}>Save</button>
      </div>
      {status && <div className="settings-form__status">{status}</div>}
    </div>
  );
}

export default SettingsForm; 