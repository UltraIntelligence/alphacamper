(function attachExtensionEvents(global) {
  const DEFAULT_EVENTS_API_BASE = "https://alphacamper.com";

  function getEventsApiBase() {
    if (typeof global.SIDEPANEL_API_BASE === "string" && global.SIDEPANEL_API_BASE) {
      return global.SIDEPANEL_API_BASE;
    }

    if (typeof global.DEFAULT_API === "string" && global.DEFAULT_API) {
      return global.DEFAULT_API;
    }

    return DEFAULT_EVENTS_API_BASE;
  }

  async function getExtensionAuthToken() {
    try {
      const result = await chrome.storage.local.get("extensionAuthToken");
      return result.extensionAuthToken || null;
    } catch {
      return null;
    }
  }

  async function postEvent(name, metadata) {
    const eventName = typeof name === "string" ? name.trim() : "";
    if (!eventName) return false;

    const authToken = await getExtensionAuthToken();
    if (!authToken) return false;

    const payload = metadata && typeof metadata === "object" ? { ...metadata } : {};
    const watchId = typeof payload.watchId === "string" && payload.watchId ? payload.watchId : null;
    if (watchId) delete payload.watchId;

    try {
      await fetch(`${getEventsApiBase()}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          event_name: eventName,
          watch_id: watchId,
          metadata: payload,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  global.emitEvent = function emitEvent(name, metadata) {
    return Promise.resolve()
      .then(() => postEvent(name, metadata))
      .catch(() => false);
  };
})(globalThis);
