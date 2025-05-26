async function timeout(miliseconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, miliseconds)
    })
}

function parseCode(code) {
  // Extract code between triple backticks, supporting optional language tag (e.g. ```python)
  const fenceRegex = /```(?:[a-zA-Z0-9_+-]*\n)?([\s\S]*?)```/;
  const match = fenceRegex.exec(code);
  if (match) {
    console.log('Parsed code via fenceRegex:', match[1]);
    return match[1];
  }
  // Fallback: return raw code if no fences found
  return code;
}

window.addEventListener("sendChromeData", async function(evt){
    console.log(evt);

    const { sourceCode, type } = evt.detail;
    // Only attempt to paste/type if Monaco editor is initialized
    if (!window.monaco || !window.monaco.editor || !window.monaco.editor.getModels) {
        console.warn('Monaco editor not found; skipping auto-paste/auto-type');
        return;
    }
    console.log("Auto Paste!");

    let parsedSourceCode = parseCode(sourceCode)
    console.log('Using code:', parsedSourceCode);
    if (type === "autoPaste") {
        window.monaco.editor.getModels()[0].setValue(parsedSourceCode)
    } else if (type === "autoType") {
        let addedChars = ''
        const codeCharSplit = parsedSourceCode.split("")
        while (codeCharSplit.length > 0) {
            let _char = codeCharSplit.shift()
            addedChars += _char

            // randomness to typing
            await timeout(100 + Math.round(Math.random() * 150))
            window.monaco.editor.getModels()[0].setValue(addedChars)
        }

    }
    
    
});
