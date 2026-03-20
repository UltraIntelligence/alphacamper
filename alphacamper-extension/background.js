// Alphacamper Background Service Worker

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Track launched mission tabs
let launchedTabs = [];

// Alarm notifications
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('mission-')) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title: 'Alphacamper',
      message: 'Your booking window opens in 5 minutes. Get ready!'
    });
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Register tabs opened during launch
  if (message.action === 'register_launch_tabs') {
    launchedTabs = message.tabs || [];
    sendResponse({ success: true });
  }

  // Fill forms on active tab
  if (message.action === 'fill_forms_active') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'fill_forms',
          profile: message.profile
        }, (response) => {
          sendResponse(response || { success: false, error: 'No response from content script' });
        });
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true;
  }

  // Next fallback tab
  if (message.action === 'next_fallback') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || launchedTabs.length === 0) {
        sendResponse({ switched: false, reason: 'No launched tabs' });
        return;
      }
      const currentIndex = launchedTabs.findIndex(t => t.tabId === tabs[0].id);
      const nextIndex = currentIndex + 1;
      if (nextIndex < launchedTabs.length) {
        chrome.tabs.update(launchedTabs[nextIndex].tabId, { active: true });
        sendResponse({ switched: true, target: launchedTabs[nextIndex], index: nextIndex });
      } else {
        sendResponse({ switched: false, reason: 'No more fallbacks' });
      }
    });
    return true;
  }

  // Get launched tabs status
  if (message.action === 'get_launch_status') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      const status = launchedTabs.map(t => ({
        ...t,
        isActive: t.tabId === activeTabId
      }));
      sendResponse({ tabs: status });
    });
    return true;
  }

  // Clear launched tabs
  if (message.action === 'clear_launch') {
    launchedTabs = [];
    sendResponse({ success: true });
  }
});

// Keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'fill_forms') {
    chrome.storage.local.get('profile', (result) => {
      const profile = result.profile;
      if (!profile) return;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'fill_forms', profile });
        }
      });
    });
  }

  if (command === 'next_fallback') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || launchedTabs.length === 0) return;
      const currentIndex = launchedTabs.findIndex(t => t.tabId === tabs[0].id);
      const nextIndex = currentIndex + 1;
      if (nextIndex < launchedTabs.length) {
        chrome.tabs.update(launchedTabs[nextIndex].tabId, { active: true });
      }
    });
  }
});

// Clean up tab references when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  launchedTabs = launchedTabs.filter(t => t.tabId !== tabId);
});
