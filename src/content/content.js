// Wrap entire content script in IIFE to early-return on description pages
+(function() {
  // Content script logic
  console.log("LeetX+ content.js loaded");
  // Silence debug logging from here on
  console.log = () => {};
  console.warn = () => {};
  let runSolverInitiated = false;
  let problemText;
  let problemTitle;
  let problemLink;
  let languageText;
  let sourceCodeText;
  let debugLangLogged = false;
  let ignoreCodeChange = false;
  // Manage disabling and pausing observer when solution is active
  let solutionActive = false;
  let leetxDescTab = null;
  let leetxDescTabHandler = null;

  function injectScript(file, node) {
    // Attempt to inject into specified node, fallback to head or html
    var target = document.getElementsByTagName(node)[0] || document.head || document.documentElement;
    if (!target) {
        console.warn('Injection target not found; aborting script injection:', node);
        return;
    }
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = file;
    target.appendChild(s);
  }
  injectScript(chrome.runtime.getURL('src/content/contentScript.js'), 'body');

  // Determine if this is a description-only URL
  const descPagePattern = /^\/problems\/[^\/]+\/description\/?$/;
  const isDescriptionOnly = descPagePattern.test(window.location.pathname);

  function runSolver() {
    // Don't re-send problem data if a solution is active
    if (solutionActive) {
      return;
    }
    try {
      chrome.runtime.sendMessage({type: "leetx-plus-problem", data: {
        problemTitle,
        problemLink,
        problemText,
        languageText,
        sourceCodeText
      }});
    } catch (e) {
      console.warn('LeetX+ content.js: unable to send message (extension context may be invalidated)', e);
    }
  }

  // Helper functions for versatile UI detection across LeetCode variants
  function getDescriptionElement() {
    // New UI container
    const dataTrack = document.querySelector('[data-track-load="description_content"]');
    if (dataTrack) { console.log('getDescriptionElement: selected data-track-load container'); return dataTrack; }
    // Known static selectors
    const staticDesc = document.querySelector('.question-content__JfgR, .content__u3I1');
    if (staticDesc) { console.log('getDescriptionElement: selected static description selector'); return staticDesc; }
    // Tab panels (contest/interview)
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
    if (panels.length > 0) {
      const visiblePanel = panels.find(p => {
        const hiddenAttr = p.hasAttribute('hidden') || p.getAttribute('aria-hidden') === 'true';
        const style = window.getComputedStyle(p);
        return !hiddenAttr && style.display !== 'none' && p.innerText.trim().length > 0;
      });
      if (visiblePanel) { console.log('getDescriptionElement: selected visible tabpanel'); return visiblePanel; }
      console.log('getDescriptionElement: no visible tabpanel, using first panel fallback');
      return panels[0];
    }
    // Fallback markdown
    const markdown = document.querySelector('div.markdown');
    console.log('getDescriptionElement: selected markdown fallback');
    return markdown;
  }
  function getLanguageElement() {
    // Dropdown / button selectors
    const el1 = document.querySelector("[id^=\"headlessui-listbox-button\"], [id^=\"headlessui-menu-button\"], [id^=\"headlessui-popover-button\"]");
    if (el1) { console.log('getLanguageElement: selected headlessui dropdown element'); return el1; }
    // Editor-scoped dropdown
    const el2 = document.querySelector("#editor [id^=\"headlessui-listbox-button\"], #editor [id^=\"headlessui-menu-button\"], #editor [id^=\"headlessui-popover-button\"]");
    if (el2) { console.log('getLanguageElement: selected #editor dropdown element'); return el2; }
    // Fallback for native <select> language dropdown (assessment pages)
    const selectEl = document.querySelector('select');
    if (selectEl) { console.log('getLanguageElement: selected <select> element'); return selectEl; }
    console.log('getLanguageElement: no language element found');
    return null;
  }
  function getSourceCodeElement() {
    // Monaco view-lines container
    const sc1 = document.querySelector('.view-lines');
    if (sc1) { console.log('getSourceCodeElement: selected .view-lines'); return sc1; }
    // Editor-scoped view-lines
    const sc2 = document.querySelector('#editor .view-lines');
    if (sc2) { console.log('getSourceCodeElement: selected #editor .view-lines'); return sc2; }
    // Insert early CodeMirror detection for assessment pages
    const cmLines = document.querySelector('.CodeMirror-lines');
    if (cmLines) { console.log('getSourceCodeElement: selected .CodeMirror-lines'); return cmLines; }
    // Legacy textarea inside editor
    const sc3 = document.querySelector('#editor textarea');
    if (sc3) { console.log('getSourceCodeElement: selected #editor textarea'); return sc3; }
    // Fallback any textarea
    const sc4 = document.querySelector('textarea');
    if (sc4) { console.log('getSourceCodeElement: selected textarea fallback'); return sc4; }
    // Re-add contenteditable fallback for code containers
    const ce = document.querySelector('[contenteditable="true"]');
    if (ce) { console.log('getSourceCodeElement: selected contenteditable element'); return ce; }
    // Final fallback: extract initial code from Next.js page data
    const nextScript = document.getElementById('__NEXT_DATA__');
    if (nextScript) {
      try {
        const data = JSON.parse(nextScript.textContent);
        // Recursively search for code stubs
        const findCode = obj => {
          if (!obj || typeof obj !== 'object') return null;
          if (typeof obj.initialCode === 'string') return obj.initialCode;
          if (typeof obj.defaultCode === 'string') return obj.defaultCode;
          for (const key in obj) {
            const found = findCode(obj[key]);
            if (found) return found;
          }
          return null;
        };
        const codeString = findCode(data.props?.pageProps) || findCode(data);
        if (codeString) {
          console.log('getSourceCodeElement: selected __NEXT_DATA__ fallback');
          const fake = document.createElement('div');
          fake.innerText = codeString;
          return fake;
        }
      } catch (e) {}
    }
    console.log('getSourceCodeElement: no source code element found');
    return null;
  }

  // SPA navigation detection: re-init observer on route changes
  // Wrap solver observer logic
  const intervalTime = 100;
  let interval;
  function startObserver() {
    // Reset flag and clear any existing interval
    runSolverInitiated = false;
    if (interval) clearInterval(interval);
    interval = setInterval(observeAndRun, intervalTime);
  }
  // Core observation logic extracted
  function observeAndRun() {
    // Skip if solution already generated
    if (solutionActive) {
      return;
    }
    // Skip solver detection on description-only pages
    if (descPagePattern.test(window.location.pathname)) {
      return;
    }
    const descriptionElement = getDescriptionElement();
    const languageElement = getLanguageElement();
    const sourceCodeElement = getSourceCodeElement();

    if (descriptionElement && sourceCodeElement && !runSolverInitiated) {
      runSolverInitiated = true;
      // Delay capture so the editor and full stub have time to render
      setTimeout(() => {
        const descElem = getDescriptionElement();
        const langElem = getLanguageElement();
        const srcElem = getSourceCodeElement();

        // Bail if elements missing to avoid null.innerText errors; allow retry
        if (!descElem || !srcElem) {
          runSolverInitiated = false;
          console.warn('Missing description or source element, retrying detection', { descElem, srcElem });
          return;
        }

        // Determine language: prefer dropdown text, else fallback by inspecting code
        const rawLang = langElem && langElem.innerText.trim();
        let selectedLanguage = rawLang && rawLang !== "Choose a type" ? rawLang : null;
        if (!selectedLanguage) {
          const codeText = srcElem.innerText;
          if (/vector<|std::/.test(codeText)) {
            selectedLanguage = "C++";
          } else if (/\bdef\s+/.test(codeText)) {
            selectedLanguage = "Python";
          } else if (/public static void main/.test(codeText)) {
            selectedLanguage = "Java";
          } else {
            selectedLanguage = "JavaScript";
          }
        }
        problemText = descElem.innerText;
        languageText = selectedLanguage;
        // Extract code text; if CodeMirror editor, collect line content to avoid gutter numbers
        let codeText;
        if (srcElem.classList && srcElem.classList.contains('CodeMirror-lines')) {
          // Get each code line element
          const lineEls = srcElem.querySelectorAll('.CodeMirror-line');
          codeText = Array.from(lineEls).map(el => el.innerText).join('\n');
        } else {
          codeText = srcElem.innerText;
        }
        sourceCodeText = codeText;
        problemLink = window.location.href;
        // Capture the problem title from the page
        const titleEl = document.querySelector('h1');
        problemTitle = titleEl ? titleEl.innerText.trim() : '';
        runSolver();
        // Stop this interval until next navigation
        clearInterval(interval);
      }, 500);
    }
  }

  // Watch for UI stub or language changes and re-run observer
  function initUIObservers() {
    const langEl = getLanguageElement();
    const codeEl = getSourceCodeElement();
    if (langEl) {
      new MutationObserver(() => {
        console.log('Detected language dropdown change, restarting solver observer');
        startObserver();
      }).observe(langEl, { childList: true, subtree: true });
    }
    if (codeEl) {
      new MutationObserver(() => {
        if (ignoreCodeChange) {
          ignoreCodeChange = false;
          return;
        }
        console.log('Detected code stub change, restarting solver observer');
        startObserver();
      }).observe(codeEl, { childList: true, subtree: true, characterData: true });
    }
  }

  // Monkey-patch history methods to detect SPA route changes
  ['pushState','replaceState'].forEach(method => {
    const original = history[method];
    history[method] = function() {
      const result = original.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
  });
  window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));

  // On every SPA navigation, clear the active-solution state so new problems load
  window.addEventListener('locationchange', () => {
    solutionActive = false;
    enableDescriptionTab();
  });

  // Only start the solver observer on pages with an editor (not description-only)
  if (!isDescriptionOnly) {
    window.addEventListener('locationchange', startObserver);
    startObserver();
  }

  // Initialize UI observers only on code pages
  if (!isDescriptionOnly) {
    initUIObservers();
    window.addEventListener('locationchange', initUIObservers);
  }

  // Enhanced disable/enable for Description tab
  function disableDescriptionTab() {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const descTab = tabs.find(t => /description/i.test(t.textContent));
    if (!descTab) return;
    leetxDescTab = descTab;
    leetxDescTab.style.pointerEvents = 'none';
    leetxDescTab.style.opacity = '0.5';
    leetxDescTab.title = 'Switch to Code tab to paste solution';
    leetxDescTabHandler = e => e.preventDefault();
    leetxDescTab.addEventListener('click', leetxDescTabHandler, true);
  }

  function enableDescriptionTab() {
    if (!leetxDescTab) return;
    leetxDescTab.style.pointerEvents = '';
    leetxDescTab.style.opacity = '';
    leetxDescTab.title = '';
    if (leetxDescTabHandler) {
      leetxDescTab.removeEventListener('click', leetxDescTabHandler, true);
      leetxDescTabHandler = null;
    }
    leetxDescTab = null;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Popup signals solution ready or cleared
      if (message.type === 'leetx-solution-ready') {
        solutionActive = true;
        disableDescriptionTab();
        sendResponse({});
        return false;
      }
      if (message.type === 'leetx-solution-cleared') {
        solutionActive = false;
        enableDescriptionTab();
        sendResponse({});
        return false;
      }
      // Respond directly to popup requests for the current problem
      if (message.type === "get-current-problem") {
          sendResponse({ problemText, languageText, sourceCodeText });
          return true;
      }
      console.log(message)
      if (message.type === "autoPaste") {
        // Skip next code observer restart since we're pasting solution
        ignoreCodeChange = true;
        window.dispatchEvent(new CustomEvent("sendChromeData", {detail: { sourceCode: message.sourceCode, type: "autoPaste" } }));
        // Respond to popup to avoid message port closed error
        sendResponse({});
        return false;
      } else if (message.type === "autoType") {
        // Skip next code observer restart since we're auto-typing solution
        ignoreCodeChange = true;
        window.dispatchEvent(new CustomEvent("sendChromeData", {detail: { sourceCode: message.sourceCode, type: "autoType" } }));
        // Respond to popup to avoid message port closed error
        sendResponse({});
        return false;
      }

      return false
  });
})();


