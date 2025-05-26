import React from "react";
import logo from "../../assets/logo.svg";
import actionIcon from "../../assets/logo-16.png";
import "../styles/onboarding-panel.scss";

function OnboardingPanel({ onDone }) {
  const finish = () => {
    // Open a sample problem for first-time users
    chrome.tabs.create({ url: 'https://leetcode.com/problems/two-sum/' });
    // Mark onboarding complete
    chrome.storage.local.set({ onboarded: true }, () => {
      // Close this tab (onboarding) when done
      window.close();
    });
  };

  return (
    <div className="onboarding-panel">
      <img src={logo} alt="LeetX+ Logo" className="onboarding-panel__logo" />
      <h2>Welcome to LeetX+</h2>
      <ol className="onboarding-panel__steps">
        <li>
          <img src={actionIcon} alt="Pin icon" className="onboarding-panel__step-icon" />
          Pin the LeetX+ extension to your Chrome toolbar (click the puzzle icon and pin LeetX+).
        </li>
        <li>
          <img src={actionIcon} alt="Code tab icon" className="onboarding-panel__step-icon" />
          Navigate to a LeetCode problem and switch to the <strong>Code</strong> tab (not the Description tab) so the editor is loaded.
        </li>
        <li>
          <img src={actionIcon} alt="Extension icon" className="onboarding-panel__step-icon" />
          Click the LeetX+ icon to open the side panel.
        </li>
        <li>
          <img src={actionIcon} alt="Settings icon" className="onboarding-panel__step-icon" />
          Go to <strong>Settings</strong> and enter your API key.
        </li>
        <li>
          <img src={actionIcon} alt="Provider icon" className="onboarding-panel__step-icon" />
          Select your preferred AI provider (Gemini or OpenRouter).
        </li>
        <li>
          <img src={actionIcon} alt="Solve icon" className="onboarding-panel__step-icon" />
          Click <strong>Solve it</strong> to generate a solution and use Copy, Auto-Paste, or Auto-Type.
        </li>
      </ol>
      <button className="button button--primary onboarding-panel__button" onClick={finish}>
        Get Started
      </button>
      {/* Developer credit */}
      <div className="onboarding-panel__footer">
        <small>
          Built with ❤️ by Joydip Biswas.{' '}
          <a href="https://github.com/jd316" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </small>
      </div>
    </div>
  );
}

export default OnboardingPanel; 