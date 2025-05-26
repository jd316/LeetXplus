import { useState, useEffect, useCallback } from "react";
import Switch from "react-switch";
// Import loading icon so webpack will copy it and give us a URL
import loadingIcon from "../../assets/loading.svg";

import "../styles/solver-form.scss";

// Endpoints for AI providers
const GEMINI_DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';
const OPENROUTER_DEFAULT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3-235b-a22b:free';

function SolverForm() {
	// Track if we're on the description-only version of a problem
	const [isDescriptionPage, setIsDescriptionPage] = useState(false);

	const [loading, setLoading] = useState(false);
	const [solution, setSolution] = useState();
	const [leetCodeProblemInfo, setLeetCodeProblemInfo] = useState();
	const [apiUrl, setApiUrl] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [defaultProvider, setDefaultProvider] = useState('gemini');
	// Status and history state
	const [statusMessage, setStatusMessage] = useState('');
	const [historySolutions, setHistorySolutions] = useState([]);

	useEffect(() => {
		let interval; 

		const fetchCurrentProblemInfo = () => {
			// Ask the background for the current problem
			chrome.runtime.sendMessage({ type: "get-current-problem" }, (response) => {
				if (response && response.problemText) {
					clearInterval(interval);
					console.log("got problem from background", response);
					setLeetCodeProblemInfo(response);
				}
			});
		};

		interval = setInterval(() => {
			fetchCurrentProblemInfo()
		}, 100);

		return () => {
			clearInterval(interval)
		}
	}, [])

	useEffect(() => {
		chrome.storage.local.get(['apiUrl', 'apiKey', 'defaultProvider'], (result) => {
			setApiUrl(result.apiUrl || '');
			setApiKey(result.apiKey || '');
			setDefaultProvider(result.defaultProvider || 'gemini');
		});
	}, []);

	// Auto-refresh when background storage updates (e.g., user navigates to a new problem)
	useEffect(() => {
		const handleStorageChange = (changes, area) => {
			if (area === 'local' && changes.currentProblemState) {
				const newProblem = changes.currentProblemState.newValue;
				if (newProblem && newProblem.problemText) {
					console.log('Problem state updated via storage change', newProblem);
					setLeetCodeProblemInfo(newProblem);
					// Clear previous solution
					setSolution(undefined);
				}
			}
		};
		chrome.storage.onChanged.addListener(handleStorageChange);
		return () => chrome.storage.onChanged.removeListener(handleStorageChange);
	}, []);

	// Load history on mount
	useEffect(() => {
		chrome.storage.local.get(['historySolutions'], (result) => {
			const raw = result.historySolutions || [];
			// Normalize entries to { title, code, link }
			const entries = raw.map(item => {
				return typeof item === 'string'
					? { title: '', code: item, link: '' }
					: { title: item.title || '', code: item.code || '', link: item.link || '' };
			});
			setHistorySolutions(entries);
		});
	}, []);

	// Determine if tab URL includes '/description/'
	useEffect(() => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const url = tabs[0]?.url;
			if (url) {
				try {
					const u = new URL(url);
					setIsDescriptionPage(u.pathname.includes('/description/'));
				} catch {}
			}
		});
	}, []);

	const solve = async () => {
		const getSolutionPrompt = () => {
		return `[INST]
		<<SYS>>
		You are a senior software engineer bot. Your role is to get coding interview problems and solve them using the given programming language.
		Your duties are the following
		- You must follow the directions you're given and ensure every single point in the problem is addressed.
		- You must ensure each example case in the given problem would successfully run
		- You MUST implement each constraint that is given in the problem statement
		- You Do NOT need to address the given follow up at the end of the problem.
		- You will be given the incomplete problem source code. You must complete the source code given using the problem statement.
		- Only respond with the solution written in the given programming language. Remember the solution must be a completed version of the incomplete source code. 
		- Structure your response in markdown code format with the code between 3 back ticks;
		- You must complete the problem in the desired programming language given by the user. ONLY use the programming language given.

		Let me reiterate
		- You must follow the directions you're given and ensure every single point in the problem is addressed.
		- You must ensure each example case in the given problem would successfully run
		- You MUST implement each constraint that is given in the problem statement


		The user will probide the language to solve the problem and the problem in the below:
		LANGUAGE: the desired programming language
		PROBLEM: the problem 
		INCOMPLETE SOURCE CODE: the incomplete source code

		<</SYS>>

		LANGUAGE: ${leetCodeProblemInfo.languageText}
		PROBLEM: ${leetCodeProblemInfo.problemText} 
		INCOMPLETE SOURCE CODE: ${leetCodeProblemInfo.sourceCodeText}
		[/INST]`
		};
		// Notify content script to re-enable Description tab
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id, { type: 'leetx-solution-cleared' }, () => {});
		});
		setLoading(true);
		// Require API key
		if (!apiKey) {
			alert('Missing API Key. Please set your API key in Settings before solving.');
			setLoading(false);
			return;
		}
		const prompt = getSolutionPrompt()
		console.log("Prompt", prompt)
		try {
			// Determine endpoint: custom override, then Gemini or OpenRouter default
			let endpoint;
			if (apiUrl) {
				endpoint = apiUrl;
			} else if (defaultProvider === 'gemini') {
				endpoint = GEMINI_DEFAULT_URL;
			} else {
				endpoint = OPENROUTER_DEFAULT_URL;
			}
			// Fallback if mistakenly pointed at generation status
			if (endpoint.includes('/generation')) {
				endpoint = defaultProvider === 'gemini' ? GEMINI_DEFAULT_URL : OPENROUTER_DEFAULT_URL;
			}
			// Build fetch options for either OpenRouter/OpenAI-style or Google Gemini API
			let fetchOptions;
			if (endpoint.includes('generativelanguage.googleapis.com')) {
				// Use Google Gemini REST API (generateContent)
				// Append API key as query param if provided
				if (apiKey) {
					endpoint += endpoint.includes('?') ? `&key=${apiKey}` : `?key=${apiKey}`;
				}
				fetchOptions = {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [ { parts: [ { text: prompt } ] } ]
					})
				};
			} else {
				// Use default OpenRouter/OpenAI chat-completions
				fetchOptions = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
					},
					body: JSON.stringify({ model: DEFAULT_MODEL, messages: [{ role: 'user', content: prompt }], stream: false })
				};
			}
			// Send request
			const response = await fetch(endpoint, fetchOptions);
			console.log('Fetch response status:', response.status, response);
			// Handle HTTP errors
			if (!response.ok) {
				const errText = await response.text();
				console.error('API error', response.status, errText);
				setSolution(`Error ${response.status}: ${errText}`);
				setLoading(false);
				return;
			}
			// Stream or JSON response parsing
			let contentText = '';
			if (endpoint.includes('generativelanguage.googleapis.com')) {
				// Parse Google Gemini generateContent response
				const geminiResult = await response.json();
				console.log('Gemini API JSON:', geminiResult);
				// Extract text from content.parts
				const parts = geminiResult.candidates?.[0]?.content?.parts || [];
				contentText = parts.map(p => p.text).join('');
			} else {
				// Parse OpenRouter/OpenAI response
				const openResult = await response.json();
				console.log('OpenRouter/OpenAI JSON:', openResult);
				contentText = openResult.choices?.[0]?.message?.content || openResult.choices?.[0]?.text || '';
			}
			console.log('Raw extracted content:', contentText);
			// Extract code from markdown fences
			const fenceRegex = /```[^\n]*\n([\s\S]*?)```/;
			const match = contentText.match(fenceRegex);
			const code = match ? match[1].trim() : contentText;
			console.log('Extracted code:', code);
			setSolution(code);
			// Notify content script that solution is ready, so disable Description tab
			chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
				chrome.tabs.sendMessage(tabs[0].id, { type: 'leetx-solution-ready' }, () => {});
			});
			// Save to history (keep last 3) with title, code, and link
			chrome.storage.local.get(['historySolutions'], (result) => {
				const prev = result.historySolutions || [];
				const newEntry = {
					title: leetCodeProblemInfo.problemTitle || '',
					code,
					link: leetCodeProblemInfo.problemLink || ''
				};
				let hist = [newEntry, ...prev];
				if (hist.length > 3) hist = hist.slice(0,3);
				chrome.storage.local.set({historySolutions: hist});
				setHistorySolutions(hist.map(item =>
					typeof item === 'string'
						? { title: '', code: item, link: '' }
						: { title: item.title || '', code: item.code || '', link: item.link || '' }
				));
			});
		} catch(e) {
			console.log(e)
		}
		
		setLoading(false)

	}

	const autoPaste = () => {
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			chrome.tabs.sendMessage(
				tabs[0].id,
				{type: "autoPaste", sourceCode: solution},
				(response) => {
					if (chrome.runtime.lastError) {
						console.warn('AutoPaste error:', chrome.runtime.lastError.message);
						setStatusMessage('Paste failed: make sure you are on the Code tab.');
					} else {
						setStatusMessage('Pasted successfully!');
					}
					setTimeout(() => setStatusMessage(''), 3000);
				}
			);
		});
	}

	const autoType = () => {
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			chrome.tabs.sendMessage(
				tabs[0].id,
				{type: "autoType", sourceCode: solution},
				(response) => {
					if (chrome.runtime.lastError) {
						console.warn('AutoType error:', chrome.runtime.lastError.message);
						setStatusMessage('Type failed: make sure you are on the Code tab.');
					} else {
						setStatusMessage('Typed successfully!');
					}
					setTimeout(() => setStatusMessage(''), 3000);
				}
			);
		});
	}

	// Copy solution to clipboard
	const copySolution = useCallback(() => {
		if (solution) {
			navigator.clipboard.writeText(solution);
			setStatusMessage('Copied to clipboard!');
			setTimeout(() => setStatusMessage(''), 2000);
		}
	}, [solution]);

	// Clear history function
	const clearHistory = () => {
		chrome.storage.local.set({ historySolutions: [] });
		setHistorySolutions([]);
		setStatusMessage('History cleared!');
		setTimeout(() => setStatusMessage(''), 2000);
	};

	return (
	  <div className="solver-form h-100 w-100 flex flex-col">
		{!leetCodeProblemInfo && (
		  isDescriptionPage ? (
		    <div className="solver-form__no-problem-state flex flex-grow justify-center align-center">
		      <div className="icon-placeholder" />
		      <h2 className="solver-form__no-problem-state__title">
		        You're viewing the problem description only. Click the <strong>Code</strong> tab on LeetCode to load the editor and enable the solver.
		      </h2>
		    </div>
		  ) : (
		    <div className="solver-form__no-problem-state flex flex-grow justify-center align-center">
		      <div className="icon-placeholder" />
		      <h2 className="solver-form__no-problem-state__title">There is no LeetX+ problem to solve!</h2>
		    </div>
		  )
		)}
		{leetCodeProblemInfo && (
		  <div className="solver-form__info">
		    <div className="solver-form__info-list flex flex-col">
		      <div className="solver-form__info-item">
		        <label><b>Language:</b></label>
		        <span>{leetCodeProblemInfo.languageText}</span>
		      </div>
		      <div className="solver-form__info-item">
		        <label><b>Problem:</b></label>
		        <span dangerouslySetInnerHTML={{ __html: leetCodeProblemInfo.problemText.split("\n").join("<br />") }}></span>
		      </div>
		      <div className="solver-form__info-item">
		        <label><b>Source Code To Complete:</b></label>
		        <span dangerouslySetInnerHTML={{ __html: leetCodeProblemInfo.sourceCodeText.split("\n").join("<br />") }}></span>
		      </div>
		    </div>
		  </div>
		)}
		
		{solution && (
		  <>
		    <div className="solver-form__solution-display">
		      <div className="solver-form__solution-header">Solution:</div>
		      <pre>{solution}</pre>
		      <button className="solver-form__copy-btn" onClick={copySolution}>Copy</button>
		    </div>
		    <div className="solver-form__solution-actions">
		      <button className="button button--secondary" onClick={autoPaste}>Auto Paste</button>
		      <button className="button button--secondary" onClick={autoType}>Auto Type (w/ Human Delay)</button>
		    </div>
		  </>
		)}

		{leetCodeProblemInfo && (
		  <div className="solver-form__form-content">
		    <button
		      className="button button--primary w-100"
		      onClick={solve}
		      disabled={loading}
		    >
		      {loading ? (
		        <>
		          <img src={loadingIcon} className="solver-form__button-spinner" alt="Loading..." />
		          Solving...
		        </>
		      ) : (
		        !solution ? 'Solve it' : 'Try again'
		      )}
		    </button>
		  </div>
		)}

		{/* Status message */}
		{statusMessage && (
		  <div className="solver-form__status-message solver-form__status-message--success">
		    {statusMessage}
		  </div>
		)}
		{/* Recent solutions history */}
		{historySolutions.length > 0 && (
		  <div className="solver-form__history">
		    <h3>Recent Solutions:</h3>
		    <ul>
		      {historySolutions.map((item, idx) => (
		        <li key={idx} className="solver-form__history-item">
		          <div className="solver-form__history-title">
		            {item.title || (item.link ? item.link.replace(/^https?:\/\//, '') : `Solution #${idx + 1}`)}
		          </div>
		          {item.link && (
		            <a
		              className="solver-form__history-link"
		              href={item.link}
		              target="_blank"
		              rel="noopener noreferrer"
		            >
		              View Problem
		            </a>
		          )}
		          <pre className="solver-form__history-code">{item.code}</pre>
		          <button
		            className="button button--secondary solver-form__history-copy-btn"
		            onClick={() => {
		              navigator.clipboard.writeText(item.code);
		              setStatusMessage('Copied to clipboard!');
		              setTimeout(() => setStatusMessage(''), 2000);
		            }}
		          >
		            Copy
		          </button>
		        </li>
		      ))}
		    </ul>
		    <button
		      className="button button--danger solver-form__history-clear-btn"
		      onClick={clearHistory}
		    >
		      Clear History
		    </button>
		  </div>
		)}
		{/* Reload button for UX */}
		<div className="solver-form__footer-actions">
		  <button className="button button--secondary" onClick={() => window.location.reload()}>
		    Reload
		  </button>
		</div>
	  </div>
	);
}

export default SolverForm;