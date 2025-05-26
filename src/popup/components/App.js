import React, { useState, useEffect } from "react";
import Header from "./Header";
import InfoPanel from "./InfoPanel";
import DocsPanel from "./DocsPanel";
import SolverForm from "./SolverForm";
import SettingsForm from "./SettingsForm";
import OnboardingPanel from "./OnboardingPanel";

import "../styles/app.scss"

function App() {
	// Onboarding state
	const [onboarded, setOnboarded] = useState(null);
	useEffect(() => {
		chrome.storage.local.get(['onboarded'], (result) => {
			setOnboarded(result.onboarded === true);
		});
	}, []);

	const handleOnboardingDone = () => {
		chrome.storage.local.set({ onboarded: true });
		setOnboarded(true);
	};

	// Panel toggles
	const [showSettings, setShowSettings] = useState(false);
	const [showInfo, setShowInfo] = useState(false);
	const [showDocs, setShowDocs] = useState(false);

	const closeAll = () => {
		setShowSettings(false);
		setShowInfo(false);
		setShowDocs(false);
	};

	// Show nothing while loading flag
	if (onboarded === null) {
		return null;
	}
	// First-run onboarding
	if (onboarded === false) {
		return (
			<div className="app">
				<OnboardingPanel onDone={handleOnboardingDone} />
			</div>
		);
	}

	return (
		<div className="app">
			<Header
				onSettingsClick={() => { closeAll(); setShowSettings(true); }}
				onInfoClick={() => { closeAll(); setShowInfo(true); }}
				onDocsClick={() => { closeAll(); setShowDocs(true); }}
			/>
			{showSettings && <SettingsForm onDone={closeAll} />}
			{showInfo && <InfoPanel onDone={closeAll} />}
			{showDocs && <DocsPanel onDone={closeAll} />}
			{!showSettings && !showInfo && !showDocs && <SolverForm />}
		</div>
	);
}

export default App;