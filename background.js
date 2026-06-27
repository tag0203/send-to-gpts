const MENU_PREFIX = "send-to-gpt:";
const PARENT_MENU_ID = "send-to-gpts";
const EMPTY_MENU_ID = "send-to-gpts:settings";
const STORAGE_KEY = "gpts";
const TRANSFER_PREFIX = "transfer:";

function transferKey(tabId) {
  return `${TRANSFER_PREFIX}${tabId}`;
}

function isAllowedGptUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === "https://chatgpt.com" && url.pathname.startsWith("/g/g-");
  } catch {
    return false;
  }
}

function buildMenus(gpts) {
  chrome.contextMenus.removeAll(() => {
    if (gpts.length === 0) {
      chrome.contextMenus.create({
        id: EMPTY_MENU_ID,
        title: "GPTsへ送る（送信先を設定）",
        contexts: ["selection"],
      });
      return;
    }

    if (gpts.length === 1) {
      chrome.contextMenus.create({
        id: `${MENU_PREFIX}0`,
        title: `${gpts[0].name}へ送る`,
        contexts: ["selection"],
      });
      return;
    }

    chrome.contextMenus.create({
      id: PARENT_MENU_ID,
      title: "GPTsへ送る",
      contexts: ["selection"],
    });

    gpts.forEach((gpt, index) => {
      chrome.contextMenus.create({
        id: `${MENU_PREFIX}${index}`,
        parentId: PARENT_MENU_ID,
        title: gpt.name,
        contexts: ["selection"],
      });
    });
  });
}

function loadAndBuildMenus() {
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    buildMenus(Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : []);
  });
}

chrome.runtime.onInstalled.addListener(loadAndBuildMenus);
chrome.runtime.onStartup.addListener(loadAndBuildMenus);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes[STORAGE_KEY]) {
    const nextValue = changes[STORAGE_KEY].newValue;
    buildMenus(Array.isArray(nextValue) ? nextValue : []);
  }
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === EMPTY_MENU_ID) {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (typeof info.menuItemId !== "string" || !info.menuItemId.startsWith(MENU_PREFIX)) {
    return;
  }

  const index = Number(info.menuItemId.slice(MENU_PREFIX.length));
  const text = info.selectionText;
  if (!Number.isInteger(index) || !text?.trim()) return;

  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    const gpts = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    const gpt = gpts[index];
    if (!gpt?.url || !isAllowedGptUrl(gpt.url)) return;

    // 先に空タブを作り、転送データの保存完了後にGPTへ遷移させる。
    // 高速なページロード時にcontent scriptの問い合わせが保存を追い越すのを防ぐ。
    chrome.tabs.create({ url: "about:blank" }, (tab) => {
      if (chrome.runtime.lastError || tab.id === undefined) return;

      chrome.storage.session.set(
        {
          [transferKey(tab.id)]: {
            text,
            createdAt: Date.now(),
          },
        },
        () => {
          if (!chrome.runtime.lastError) chrome.tabs.update(tab.id, { url: gpt.url });
        },
      );
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;

  if (message?.action === "getPendingTransfer") {
    const key = transferKey(tabId);
    chrome.storage.session.get(key, (data) => {
      const transfer = data[key];
      const maxAgeMs = 10 * 60 * 1000;

      if (transfer && Date.now() - transfer.createdAt > maxAgeMs) {
        chrome.storage.session.remove(key);
        sendResponse(null);
        return;
      }

      sendResponse(transfer || null);
    });
    return true;
  }

  if (message?.action === "transferComplete") {
    chrome.storage.session.remove(transferKey(tabId));
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(transferKey(tabId));
});
