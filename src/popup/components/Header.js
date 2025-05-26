import React from "react";
import Settings from "./icons/Settings";
import Info from "./icons/Info";
import Docs from "./icons/Docs";
import logo from "../../assets/logo.svg"; // Import the logo

import "../styles/header.scss";

function Header({ onSettingsClick, onInfoClick, onDocsClick }) {
	const openSettingsPage = () => {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options.html'));
		}
	};
	// Handlers for each action
	const handleSettingsClick = onSettingsClick || openSettingsPage;
	const handleInfoClick = onInfoClick || (() => {});
	const handleDocsClick = onDocsClick || (() => {});

	return (
		<div className="header">
			<div className="header__logo-title">
				<img src={logo} alt="LeetX+ Logo" className="header__logo" />
				<h1>LeetX+</h1>
			</div>
			<div className="header__actions">
				<Info classes="info__icon" onClick={handleInfoClick} />
				<Docs classes="docs__icon" onClick={handleDocsClick} />
				<Settings classes="settings__icon" onClick={handleSettingsClick} />
			</div>
		</div>
	);
}

export default Header;