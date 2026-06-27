const EDITOR_SELECTORS = [
  "#prompt-textarea",
  "textarea[data-id='root']",
  "textarea[placeholder]",
  "form div[contenteditable='true'][data-lexical-editor='true']",
  "form div[contenteditable='true']",
];

const SEND_BUTTON_SELECTORS = [
  "button[data-testid='send-button']",
  "button[aria-label='Send prompt']",
  "button[aria-label='Send message']",
  "button[aria-label='プロンプトを送信する']",
  "button[aria-label='メッセージを送信']",
];

function findVisibleElement(selectors) {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      if (element.getClientRects().length > 0) return element;
    }
  }
  return null;
}

function waitForElement(selectors, timeoutMs = 60_000) {
  return new Promise((resolve) => {
    const existing = findVisibleElement(selectors);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = findVisibleElement(selectors);
      if (!element) return;
      observer.disconnect();
      clearTimeout(timeout);
      resolve(element);
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

function setNativeTextareaValue(textarea, text) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  setter?.call(textarea, text);
  textarea.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: text,
  }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function insertIntoEditor(editor, text) {
  editor.focus();

  if (editor instanceof HTMLTextAreaElement) {
    setNativeTextareaValue(editor, text);
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);

  if (!document.execCommand("insertText", false, text)) {
    editor.textContent = text;
    editor.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: text,
    }));
  }
}

function waitUntilEnabled(element, timeoutMs = 10_000) {
  return new Promise((resolve) => {
    if (!element.disabled && element.getAttribute("aria-disabled") !== "true") {
      resolve(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (element.disabled || element.getAttribute("aria-disabled") === "true") return;
      observer.disconnect();
      clearTimeout(timeout);
      resolve(true);
    });

    observer.observe(element, { attributes: true });
    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeoutMs);
  });
}

async function sendText(text) {
  const editor = await waitForElement(EDITOR_SELECTORS);
  if (!editor) return false;

  insertIntoEditor(editor, text);

  const button = await waitForElement(SEND_BUTTON_SELECTORS, 10_000);
  if (!button || !(await waitUntilEnabled(button))) return false;

  button.click();
  return true;
}

chrome.runtime.sendMessage({ action: "getPendingTransfer" }, async (transfer) => {
  if (chrome.runtime.lastError || !transfer?.text) return;

  if (await sendText(transfer.text)) {
    chrome.runtime.sendMessage({ action: "transferComplete" });
  }
});
