import React from "react";
import "../styles/docs-panel.scss";
import logo from "../../assets/logo.svg";

function DocsPanel({ onDone }) {
  return (
    <div className="docs-panel">
      <div className="docs-panel__header">
        <h2 className="docs-panel__title">How It Works</h2>
      </div>
      <div className="docs-panel__content">
        <section className="docs-panel__step">
          <h3>1. Setup</h3>
          <p>Run through the onboarding wizard to enter your API key and select your AI provider. To revisit, click the <strong>⚙️ Settings</strong> icon.</p>
        </section>
        <section className="docs-panel__step">
          <h3>2. Open a Problem</h3>
          <p>Navigate to a LeetCode problem and switch to the <strong>Code</strong> tab (not the Description tab) so the editor is loaded.</p>
        </section>
        <section className="docs-panel__step">
          <h3>3. Launch LeetX+</h3>
          <p>Click the LeetX+ icon to open the side panel.</p>
        </section>
        <section className="docs-panel__step">
          <h3>4. Generate a Solution</h3>
          <p>Select your desired programming language and click <strong>Solve it</strong> to generate a code solution via AI.</p>
        </section>
        <section className="docs-panel__step">
          <h3>5. Use the Solution</h3>
          <ul>
            <li>Copy to clipboard</li>
            <li>Auto-paste into the editor</li>
            <li>Auto-type with human-like delay</li>
          </ul>
        </section>
        <section className="docs-panel__step">
          <h3>6. Manage History</h3>
          <p>View recent solutions below. Click "View Problem" to revisit or use "Clear History" to start fresh.</p>
        </section>
      </div>
      <button className="button button--secondary docs-panel__back-btn" onClick={onDone}>Back</button>
    </div>
  );
}

export default DocsPanel; 