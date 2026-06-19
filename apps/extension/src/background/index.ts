chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    return;
  }

  await chrome.sidePanel.open({ tabId: tab.id });
});
