importScripts('lib/platforms.js');

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

// ═══ CANCELLATION ALERT POLLING ═══
// Uses chrome.alarms (works in MV3 service workers, unlike Web Push)

const ALERT_ALARM = 'check-alerts';
const DEFAULT_API = 'https://alphacamper.com';

// Start polling when user has registered for watching
chrome.storage.local.get(['watchUserId'], (result) => {
  if (result.watchUserId) {
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
  }
});

// Also start polling when watchUserId is set (e.g., after registration)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.watchUserId?.newValue) {
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
  }
  if (changes.watchUserId && !changes.watchUserId.newValue) {
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

  const { watchUserId: userId } = await chrome.storage.local.get('watchUserId');
  if (!userId) return;

  const notifiedIds = await getNotifiedIds();

  try {
    const res = await fetch(`${DEFAULT_API}/api/alerts?userId=${userId}`);
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

  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      setTimeout(async () => {
        const { profile } = await chrome.storage.local.get('profile');
        if (profile) {
          chrome.tabs.sendMessage(tabId, { action: 'fill_forms', profile });
        }
      }, 2000);
    }
  });

  if (data.alertId) {
    fetch(`${DEFAULT_API}/api/alerts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: data.alertId }),
    }).catch(() => {});
  }
});

// Clean up tab references when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  launchedTabs = launchedTabs.filter(t => t.tabId !== tabId);
});
