importScripts('lib/platforms.js');

// Alphacamper Background Service Worker

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Persist launched mission tabs because MV3 service workers are ephemeral.
const LAUNCHED_TABS_KEY = 'launchedTabs';
const PENDING_AUTOFILL_TABS_KEY = 'pendingAutofillTabIds';

function getSessionStorageArea() {
  return chrome.storage.session || chrome.storage.local;
}

async function getLaunchedTabs() {
  const storage = getSessionStorageArea();
  const result = await storage.get(LAUNCHED_TABS_KEY);
  return result[LAUNCHED_TABS_KEY] || [];
}

async function setLaunchedTabs(tabs) {
  const storage = getSessionStorageArea();
  await storage.set({ [LAUNCHED_TABS_KEY]: tabs || [] });
}

async function clearLaunchedTabs() {
  const storage = getSessionStorageArea();
  await storage.remove(LAUNCHED_TABS_KEY);
}

async function getPendingAutofillTabIds() {
  const storage = getSessionStorageArea();
  const result = await storage.get(PENDING_AUTOFILL_TABS_KEY);
  return result[PENDING_AUTOFILL_TABS_KEY] || [];
}

async function setPendingAutofillTabIds(tabIds) {
  const storage = getSessionStorageArea();
  await storage.set({ [PENDING_AUTOFILL_TABS_KEY]: tabIds || [] });
}

async function scheduleTabAutofill(tabId) {
  const tabIds = await getPendingAutofillTabIds();
  if (!tabIds.includes(tabId)) {
    tabIds.push(tabId);
    await setPendingAutofillTabIds(tabIds);
  }
}

async function clearPendingAutofillTab(tabId) {
  const tabIds = await getPendingAutofillTabIds();
  await setPendingAutofillTabIds(tabIds.filter((id) => id !== tabId));
}

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
    void (async () => {
      await setLaunchedTabs(message.tabs || []);
      sendResponse({ success: true });
    })();
    return true;
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
    void (async () => {
      const launchedTabs = await getLaunchedTabs();
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
    })();
    return true;
  }

  // Get launched tabs status
  if (message.action === 'get_launch_status') {
    void (async () => {
      const launchedTabs = await getLaunchedTabs();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0]?.id;
        const status = launchedTabs.map(t => ({
          ...t,
          isActive: t.tabId === activeTabId
        }));
        sendResponse({ tabs: status });
      });
    })();
    return true;
  }

  // Clear launched tabs
  if (message.action === 'clear_launch') {
    void (async () => {
      await clearLaunchedTabs();
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'schedule_tab_fill') {
    void (async () => {
      if (typeof message.tabId !== 'number') {
        sendResponse({ success: false, error: 'tabId required' });
        return;
      }
      await scheduleTabAutofill(message.tabId);
      sendResponse({ success: true });
    })();
    return true;
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
    void (async () => {
      const launchedTabs = await getLaunchedTabs();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || launchedTabs.length === 0) return;
        const currentIndex = launchedTabs.findIndex(t => t.tabId === tabs[0].id);
        const nextIndex = currentIndex + 1;
        if (nextIndex < launchedTabs.length) {
          chrome.tabs.update(launchedTabs[nextIndex].tabId, { active: true });
        }
      });
    })();
  }
});

// ═══ CANCELLATION ALERT POLLING ═══
// Uses chrome.alarms (works in MV3 service workers, unlike Web Push)

const ALERT_ALARM = 'check-alerts';
const DEFAULT_API = 'https://alphacamper.com';

// Start polling when extension auth has been established.
chrome.storage.local.get(['extensionAuthToken'], (result) => {
  if (result.extensionAuthToken) {
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
  }
});

// Also start polling when extension auth is set.
chrome.storage.onChanged.addListener((changes) => {
  if (changes.extensionAuthToken?.newValue) {
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
  }
  if (changes.extensionAuthToken && !changes.extensionAuthToken.newValue) {
    chrome.alarms.clear(ALERT_ALARM);
  }
});

// Persist notified alert IDs in chrome.storage.local so they survive
// service worker restarts (MV3 workers are ephemeral — shut down after ~30s idle)
async function getNotifiedIds() {
  const { notifiedAlertIds = [] } = await chrome.storage.local.get('notifiedAlertIds');
  return new Set(notifiedAlertIds);
}

async function addNotifiedId(id) {
  const ids = await getNotifiedIds();
  ids.add(id);
  // Keep only last 200 IDs to avoid unbounded growth
  const arr = [...ids].slice(-200);
  await chrome.storage.local.set({ notifiedAlertIds: arr });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALERT_ALARM) return;

  const { extensionAuthToken } = await chrome.storage.local.get('extensionAuthToken');
  if (!extensionAuthToken) return;

  const notifiedIds = await getNotifiedIds();

  try {
    const res = await fetch(`${DEFAULT_API}/api/alerts`, {
      headers: { Authorization: `Bearer ${extensionAuthToken}` }
    });
    if (!res.ok) return;

    const { alerts } = await res.json();
    if (!alerts?.length) return;

    for (const alert of alerts) {
      if (alert.claimed || notifiedIds.has(alert.id)) continue;
      await addNotifiedId(alert.id);

      const siteCount = alert.site_details?.sites?.length || 0;
      const campgroundName = alert.watched_targets?.campground_name || 'A campground';
      const platform = alert.watched_targets?.platform || '';
      const campgroundId = alert.watched_targets?.campground_id || '';

      const notifId = JSON.stringify({
        alertId: alert.id,
        platform,
        campgroundId,
        watchId: alert.watched_target_id,
      });

      chrome.notifications.create(notifId, {
        type: 'basic',
        iconUrl: 'assets/icon-128.png',
        title: 'Campsite Available!',
        message: `${campgroundName} has ${siteCount} site${siteCount !== 1 ? 's' : ''} open`,
        priority: 2,
        requireInteraction: true,
      });
    }
  } catch (err) {
    console.warn('[alerts] Polling failed:', err);
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action !== 'store_extension_auth' || typeof message.token !== 'string') {
    return;
  }

  void (async () => {
    await chrome.storage.local.set({
      extensionAuthToken: message.token,
      extensionUserEmail: typeof message.email === 'string' ? message.email : null,
    });
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
    sendResponse({ success: true });
  })();

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status !== 'complete') return;

  void (async () => {
    const pendingTabIds = await getPendingAutofillTabIds();
    if (!pendingTabIds.includes(tabId)) return;

    const { profile } = await chrome.storage.local.get('profile');
    if (profile) {
      chrome.tabs.sendMessage(tabId, { action: 'fill_forms', profile }, () => {
        if (chrome.runtime.lastError) {
          console.warn('[autofill] Failed to reach content script:', chrome.runtime.lastError.message);
        }
      });
    }

    await clearPendingAutofillTab(tabId);
  })();
});

// Handle notification click → open booking page + trigger autofill
chrome.notifications.onClicked.addListener(async (notificationId) => {
  chrome.notifications.clear(notificationId);

  let data;
  try {
    data = JSON.parse(notificationId);
  } catch {
    return;
  }

  if (!data.platform || !data.campgroundId) return;

  const p = PLATFORMS[data.platform];
  let deepLink = '';
  if (p?.deepLinkTemplate) {
    deepLink = p.deepLinkTemplate
      .replace('{campgroundId}', data.campgroundId)
      .replace('{locationId}', data.campgroundId)
      .replace('{parkSlug}', data.campgroundId.split('/')[0] || data.campgroundId)
      .replace('{campgroundSlug}', data.campgroundId.split('/')[1] || data.campgroundId);
  }

  if (!deepLink) return;

  const tab = await chrome.tabs.create({ url: deepLink, active: true });
  await scheduleTabAutofill(tab.id);

  if (data.alertId) {
    const { extensionAuthToken } = await chrome.storage.local.get('extensionAuthToken');
    fetch(`${DEFAULT_API}/api/alerts`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(extensionAuthToken ? { Authorization: `Bearer ${extensionAuthToken}` } : {})
      },
      body: JSON.stringify({ id: data.alertId }),
    }).catch(() => {});
  }
});

// Clean up tab references when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  void (async () => {
    const launchedTabs = await getLaunchedTabs();
    await setLaunchedTabs(launchedTabs.filter(t => t.tabId !== tabId));
    await clearPendingAutofillTab(tabId);
  })();
});
