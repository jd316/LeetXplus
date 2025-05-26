import React from "react";
import logo from "../../assets/logo.svg";
import "../styles/info-panel.scss";

function InfoPanel({ onDone }) {
  return (
    <div className="info-panel">
      <div className="info-panel__header">
        <img src={logo} alt="LeetX+ Logo" className="info-panel__logo" />
        <h2 className="info-panel__title">About LeetX+</h2>
      </div>
      <p>LeetX+ is an AI-powered side panel extension for LeetCode that automatically solves coding problems using AI models.</p>
      <p><strong>Version:</strong> 1.0.0</p>
      <div className="info-panel__tech">
        <h3>Tech Used</h3>
        <ul className="info-panel__tech-list">
          <li>React</li>
          <li>Chrome Extensions API</li>
          <li>Google Gemini API</li>
          <li>OpenRouter API</li>
        </ul>
      </div>
      <p className="info-panel__credit"><strong>Built with ❤️ by Joydip Biswas.</strong></p>
      <div className="info-panel__links">
        <a
          href="https://github.com/jd316"
          target="_blank"
          rel="noopener noreferrer"
          className="button button--secondary info-panel__link-btn"
        >
          View on GitHub
        </a>
      </div>
      <button className="button button--secondary" onClick={onDone}>Back</button>
    </div>
  );
}

export default InfoPanel; 