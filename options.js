const STORAGE_KEY = "gpts";
let gpts = [];

function normalizeGptUrl(input) {
  const value = input.trim();

  if (/^g-[A-Za-z0-9_-]+$/.test(value)) {
    return `https://chatgpt.com/g/${value}`;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !["chatgpt.com", "www.chatgpt.com"].includes(url.hostname)) {
    return null;
  }

  const match = url.pathname.match(/^\/g\/(g-[A-Za-z0-9_-]+)(?:\/|$)/);
  if (!match) return null;

  return `https://chatgpt.com/g/${match[1]}`;
}

function renderTable() {
  const tbody = document.getElementById("gpt-list");
  tbody.replaceChildren();

  if (gpts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.className = "empty";
    cell.textContent = "GPTが登録されていません";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  gpts.forEach((gpt, index) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const urlCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    nameCell.textContent = gpt.name;
    urlCell.textContent = gpt.url;
    urlCell.className = "url-cell";
    deleteButton.type = "button";
    deleteButton.className = "delete";
    deleteButton.textContent = "削除";
    deleteButton.setAttribute("aria-label", `${gpt.name}を削除`);
    deleteButton.addEventListener("click", () => {
      gpts.splice(index, 1);
      renderTable();
    });

    actionCell.appendChild(deleteButton);
    row.append(nameCell, urlCell, actionCell);
    tbody.appendChild(row);
  });
}

document.getElementById("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = document.getElementById("new-name");
  const urlInput = document.getElementById("new-url");
  const error = document.getElementById("form-error");
  const name = nameInput.value.trim();
  const url = normalizeGptUrl(urlInput.value);

  if (!name || !url) {
    error.textContent = "表示名と、有効なChatGPTのGPT URL（または g- から始まるID）を入力してください。";
    return;
  }

  if (gpts.some((gpt) => gpt.url === url)) {
    error.textContent = "このGPTはすでに登録されています。";
    return;
  }

  gpts.push({ name, url });
  nameInput.value = "";
  urlInput.value = "";
  error.textContent = "";
  renderTable();
  nameInput.focus();
});

document.getElementById("save-btn").addEventListener("click", () => {
  chrome.storage.sync.set({ [STORAGE_KEY]: gpts }, () => {
    const message = document.getElementById("save-message");
    message.textContent = chrome.runtime.lastError
      ? "保存できませんでした"
      : "保存しました";
    setTimeout(() => { message.textContent = ""; }, 2500);
  });
});

chrome.storage.sync.get(STORAGE_KEY, (data) => {
  gpts = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  renderTable();
});
