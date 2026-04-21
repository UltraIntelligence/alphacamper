importScripts('lib/platforms.js', 'lib/missions.js', 'lib/events.js');

// Alphacamper Background Service Worker

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Persist launched mission tabs because MV3 service workers are ephemeral.
const LAUNCHED_TABS_KEY = 'launchedTabs';
const PENDING_AUTOFILL_TABS_KEY = 'pendingAutofillTabIds';
const PENDING_ASSIST_PLANS_KEY = 'pendingAssistPlans';

function describeAssistState(plan) {
  const stage = plan?.assistStage || plan?.lastStage || 'idle';
  if (stage === 'booking_open') {
    return {
      code: 'booking_open',
      tone: 'info',
      message: 'Booking window is open. Alphacamper is still working the best tab.',
    };
  }
  if (stage === 'warming') {
    return {
      code: 'warming',
      tone: 'info',
      message: `Warming ${PLATFORMS?.[plan?.platform]?.name || 'booking'} session. Keep this tab open.`,
    };
  }
  if (stage === 'targeting') {
    return {
      code: 'targeting',
      tone: 'info',
      message: 'Opening the booking page now.',
    };
  }
  if (stage === 'waf_detected') {
    return {
      code: 'warming',
      tone: 'info',
      message: 'Protected page detected. Alphacamper is retrying safely.',
    };
  }
  if (stage === 'search_submitted' || stage === 'search_complete') {
    return {
      code: 'searching',
      tone: 'info',
      message: 'Checking your dates and equipment now.',
    };
  }
  if (stage === 'grid_waiting' || stage === 'site_selected') {
    return {
      code: 'selecting',
      tone: 'info',
      message: 'Looking for the best matching site.',
    };
  }
  if (stage === 'forms_filled') {
    return {
      code: 'forms_filled',
      tone: 'success',
      message: 'Forms are filled. Moving toward review.',
    };
  }
  if (stage === 'handoff_ready') {
    return {
      code: 'ready',
      tone: 'success',
      message: 'Review page is ready. Final confirm stays with you.',
    };
  }
  if (stage === 'profile_needed') {
    return {
      code: 'profile_needed',
      tone: 'muted',
      message: 'Your profile is needed before Alphacamper can keep helping.',
    };
  }
  if (stage === 'manual_takeover') {
    return {
      code: 'manual_takeover',
      tone: 'muted',
      message: 'Automatic retries paused. Stay on this page or take over manually.',
    };
  }
  if (stage === 'completed') {
    return {
      code: 'completed',
      tone: 'success',
      message: 'The booking site says this reservation reached confirmation.',
    };
  }
  return {
    code: 'idle',
    tone: 'muted',
    message: 'Standing by to help with the next step.',
  };
}

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

async function getPendingAssistPlans() {
  const storage = getSessionStorageArea();
  const result = await storage.get(PENDING_ASSIST_PLANS_KEY);
  return result[PENDING_ASSIST_PLANS_KEY] || {};
}

async function setPendingAssistPlans(plans) {
  const storage = getSessionStorageArea();
  await storage.set({ [PENDING_ASSIST_PLANS_KEY]: plans || {} });
}

function applyAssistStatus(plan) {
  const status = describeAssistState(plan);
  return {
    ...plan,
    statusCode: status.code,
    statusTone: status.tone,
    statusMessage: status.message,
  };
}

async function updatePendingAssistPlan(tabId, updates) {
  const plans = await getPendingAssistPlans();
  const key = String(tabId);
  if (!plans[key]) return null;
  plans[key] = applyAssistStatus({
    ...plans[key],
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
  });
  await setPendingAssistPlans(plans);
  return plans[key];
}

async function scheduleBookingAssist(tabId, plan) {
  const plans = await getPendingAssistPlans();
  plans[String(tabId)] = applyAssistStatus({
    source: plan?.source || 'manual',
    platform: plan?.platform || null,
    campgroundName: plan?.campgroundName || '',
    campgroundId: plan?.campgroundId || null,
    arrivalDate: plan?.arrivalDate || null,
    departureDate: plan?.departureDate || null,
    exactSiteNumber: plan?.exactSiteNumber || null,
    preferredSiteNumbers: Array.isArray(plan?.preferredSiteNumbers) ? plan.preferredSiteNumbers : [],
    preferredSiteIds: Array.isArray(plan?.preferredSiteIds) ? plan.preferredSiteIds : [],
    targetUrl: plan?.targetUrl || null,
    warmupUrl: plan?.warmupUrl || null,
    assistStage: plan?.assistStage || 'direct',
    lastStage: plan?.lastStage || null,
    aggressiveAssist: plan?.aggressiveAssist !== false,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    attempts: Number(plan?.attempts || 0),
  });
  await setPendingAssistPlans(plans);
}

async function clearPendingAssistPlan(tabId) {
  const plans = await getPendingAssistPlans();
  delete plans[String(tabId)];
  await setPendingAssistPlans(plans);
}

async function buildDeepLink(platform, campgroundId, campgroundName = '') {
  if (!platform || !campgroundId) return '';
  return Missions.generateDeepLink(platform, campgroundId, campgroundName);
}

function shouldWarmAssistSession(platform) {
  return ['ontario_parks', 'parks_canada', 'bc_parks'].includes(platform);
}

function getWarmupUrl(platform) {
  return PLATFORMS?.[platform]?.searchUrl || null;
}

async function openBookingAssistTab({ deepLink, active = true, plan = {} }) {
  if (!deepLink) return null;

  const warmupUrl = shouldWarmAssistSession(plan.platform) ? getWarmupUrl(plan.platform) : null;
  const initialUrl = warmupUrl || deepLink;
  const tab = await chrome.tabs.create({ url: initialUrl, active });

  await scheduleBookingAssist(tab.id, {
    ...plan,
    targetUrl: deepLink,
    warmupUrl,
    assistStage: warmupUrl ? 'warming' : 'targeting',
  });

  return tab;
}

async function sendAssistToTab(tabId, plan) {
  const { profile, settings } = await chrome.storage.local.get(['profile', 'settings']);
  if (!profile) {
    await scheduleBookingAssist(tabId, {
      ...plan,
      assistStage: 'profile_needed',
      lastStage: 'profile_needed',
    });
    return {
      success: false,
      error: 'Set up your profile first',
      keepArmed: true,
      stage: 'profile_needed',
      platform: plan?.platform || null,
    };
  }

  const mergedPlan = {
    ...plan,
    aggressiveAssist: settings?.aggressiveAssist !== false && plan?.aggressiveAssist !== false,
  };

  const MAX_RETRIES = 4;
  const RETRY_DELAY_MS = 700;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
    const response = await new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, { action: 'run_booking_assist', profile, plan: mergedPlan }, (message) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message, keepArmed: true });
        } else {
          resolve(message || { success: false, keepArmed: true });
        }
      });
    });

    if (response?.success || attempt === MAX_RETRIES - 1) {
      if (!response?.keepArmed) {
        await clearPendingAssistPlan(tabId);
      } else {
        await scheduleBookingAssist(tabId, {
          ...mergedPlan,
          attempts: Number(plan?.attempts || 0) + 1,
        });
      }
      return response;
    }
  }

  return { success: false, keepArmed: true };
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

  if (message.action === 'schedule_booking_assist') {
    void (async () => {
      if (typeof message.tabId !== 'number') {
        sendResponse({ success: false, error: 'tabId required' });
        return;
      }
      await scheduleBookingAssist(message.tabId, message.plan || {});
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'open_booking_assist_tab') {
    void (async () => {
      const tab = await openBookingAssistTab({
        deepLink: message.deepLink || '',
        active: message.active !== false,
        plan: message.plan || {},
      });
      const plans = await getPendingAssistPlans();
      const statusPlan = tab?.id ? plans[String(tab.id)] || null : null;
      sendResponse({
        success: Boolean(tab?.id),
        tabId: tab?.id || null,
        status: statusPlan ? {
          code: statusPlan.statusCode,
          tone: statusPlan.statusTone,
          message: statusPlan.statusMessage,
          platform: statusPlan.platform || null,
          stage: statusPlan.assistStage || statusPlan.lastStage || null,
        } : null,
      });
    })();
    return true;
  }

  if (message.action === 'assist_active_tab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'No active tab' });
        return;
      }
      void (async () => {
        const plans = await getPendingAssistPlans();
        const existingPlan = plans[String(tabId)] || {};
        const response = await sendAssistToTab(tabId, {
          ...existingPlan,
          ...(message.plan || {}),
          source: message?.plan?.source || existingPlan.source || 'manual_active_tab',
        });
        sendResponse(response);
      })();
    });
    return true;
  }

  if (message.action === 'get_assist_status') {
    void (async () => {
      const plans = await getPendingAssistPlans();
      let tabId = typeof message.tabId === 'number' ? message.tabId : null;
      if (!tabId) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tabs[0]?.id || null;
      }
      const plan = tabId ? plans[String(tabId)] || null : null;
      sendResponse({
        success: true,
        tabId,
        status: plan ? {
          code: plan.statusCode || 'idle',
          tone: plan.statusTone || 'muted',
          message: plan.statusMessage || describeAssistState(plan).message,
          platform: plan.platform || null,
          stage: plan.assistStage || plan.lastStage || null,
        } : null,
      });
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
        campgroundName,
        watchId: alert.watched_target_id,
        arrivalDate: alert.watched_targets?.arrival_date || null,
        departureDate: alert.watched_targets?.departure_date || null,
        exactSiteNumber: alert.watched_targets?.site_number || null,
        siteNames: (alert.site_details?.sites || []).map((site) => site.siteName).filter(Boolean).slice(0, 5),
        siteIds: (alert.site_details?.sites || []).map((site) => site.siteId).filter(Boolean).slice(0, 5),
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
    const assistPlans = await getPendingAssistPlans();
    const assistPlan = assistPlans[String(tabId)];
    if (assistPlan) {
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      const currentUrl = String(tab?.url || '');
      const attempts = Number(assistPlan.attempts || 0);
      if (attempts >= 8) {
        await updatePendingAssistPlan(tabId, {
          assistStage: 'manual_takeover',
          lastStage: 'manual_takeover',
          attempts,
        });
        void emitEvent('booking_failed', {
          watchId: assistPlan.watchId || null,
          source: assistPlan.source || 'background_retry',
          platform: assistPlan.platform || null,
          campgroundId: assistPlan.campgroundId || null,
          reason: 'manual_takeover',
          attempts,
        });
      } else {
        if (
          assistPlan.assistStage === 'warming' &&
          assistPlan.targetUrl &&
          currentUrl &&
          !currentUrl.startsWith(String(assistPlan.targetUrl))
        ) {
          await updatePendingAssistPlan(tabId, {
            assistStage: 'targeting',
            lastStage: 'targeting',
          });
          await chrome.tabs.update(tabId, { url: assistPlan.targetUrl });
          return;
        }

        const response = await sendAssistToTab(tabId, assistPlan);
        if (response?.stage) {
          await updatePendingAssistPlan(tabId, {
            assistStage: response.keepArmed ? response.stage : assistPlan.assistStage,
            lastStage: response.stage,
          });
        }
        if (
          (
            response?.stage === 'waf_detected' ||
            (
              response?.success === false &&
              assistPlan.warmupUrl &&
              assistPlan.targetUrl &&
              currentUrl &&
              currentUrl.startsWith(String(assistPlan.targetUrl))
            )
          ) &&
          assistPlan.warmupUrl &&
          assistPlan.targetUrl &&
          attempts < 8
        ) {
          await scheduleBookingAssist(tabId, {
            ...assistPlan,
            assistStage: 'warming',
            lastStage: response?.stage || 'waf_detected',
            attempts: attempts + 1,
          });
          await chrome.tabs.update(tabId, { url: assistPlan.warmupUrl });
        }
      }
      return;
    }

    const pendingTabIds = await getPendingAutofillTabIds();
    if (!pendingTabIds.includes(tabId)) return;

    const { profile } = await chrome.storage.local.get('profile');
    if (!profile) {
      await clearPendingAutofillTab(tabId);
      return;
    }

    // Content scripts (run_at: document_idle) may not be ready immediately
    // when tabs.onUpdated fires status:'complete'. Retry a few times.
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 500;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
      const success = await new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, { action: 'fill_forms', profile }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`[autofill] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, chrome.runtime.lastError.message);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      if (success) break;
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

  let deepLink = '';
  deepLink = await buildDeepLink(data.platform, data.campgroundId, data.campgroundName || '');

  if (!deepLink) return;

  await openBookingAssistTab({
    deepLink,
    active: true,
    plan: {
      source: 'alert_notification',
      watchId: data.watchId || null,
      platform: data.platform,
      campgroundId: data.campgroundId,
      campgroundName: data.campgroundName || '',
      arrivalDate: data.arrivalDate || null,
      departureDate: data.departureDate || null,
      exactSiteNumber: data.exactSiteNumber || null,
      preferredSiteNumbers: [data.exactSiteNumber, ...(Array.isArray(data.siteNames) ? data.siteNames : [])].filter(Boolean),
      preferredSiteIds: Array.isArray(data.siteIds) ? data.siteIds : [],
    },
  });

  void emitEvent('sms_tapped', {
    watchId: data.watchId || null,
    alertId: data.alertId || null,
    source: 'alert_notification',
    platform: data.platform,
    campgroundId: data.campgroundId,
    campgroundName: data.campgroundName || '',
  });

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
    await clearPendingAssistPlan(tabId);
  })();
});
