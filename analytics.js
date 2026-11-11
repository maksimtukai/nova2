(() => {
  const API_ROOT = location.protocol === "file:" ? "http://localhost:43219" : "";
  const ENDPOINT = `${API_ROOT}/api/analytics`;
  const VISITOR_KEY = "nova_visitor_id";
  const SESSION_KEY = "nova_analytics_session";
  const SESSION_STARTED_KEY = "nova_analytics_started";
  const pageStart = Date.now();
  let _isUnloading = false;
  let _pageviewSent = false;
  const _pendingBeacons = [];

  window.addEventListener("beforeunload", () => { _isUnloading = true; });
  window.addEventListener("pagehide", flushBeaconsAndStop);

  function flushBeaconsAndStop() {
    _isUnloading = true;
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    try {
      track("session_end", {
        duration: Math.round((Date.now() - pageStart) / 1000)
      }, { beacon: true });
    } catch (e) {}
    let payload;
    while ((payload = _pendingBeacons.shift())) {
      try { navigator.sendBeacon(ENDPOINT, payload); } catch (e) {}
    }
  }

  let heartbeat = null;

  function randomId(prefix) {
    const chunk = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${Date.now().toString(36)}-${chunk}`;
  }

  function getVisitorId() {
    try {
      let value = localStorage.getItem(VISITOR_KEY);
      if (!value) {
        value = randomId("visitor");
        localStorage.setItem(VISITOR_KEY, value);
      }
      return value;
    } catch {
      return randomId("visitor");
    }
  }

  function getSessionId() {
    try {
      let value = sessionStorage.getItem(SESSION_KEY);
      if (!value) {
        value = randomId("session");
        sessionStorage.setItem(SESSION_KEY, value);
      }
      return value;
    } catch {
      return randomId("session");
    }
  }

  function getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }

  function getDeviceType() {
    const ua = String(navigator.userAgent || "").toLowerCase();
    if (/bot|spider|crawler|headless/.test(ua)) return "Bot";
    if (/ipad|tablet/.test(ua)) return "Tablet";
    if (/iphone|ipod|mobile|windows phone/.test(ua)) return "Mobile";
    if (/android/.test(ua)) return "Tablet";
    if (/macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "Tablet";
    return "Desktop";
  }

  function getPagePath() {
    if (location.protocol === "file:") {
      const fileName = location.pathname.split("/").filter(Boolean).pop() || "local-file";
      try {
        return `/${decodeURIComponent(fileName)}`;
      } catch {
        return `/${fileName}`;
      }
    }
    return location.pathname || "/";
  }

  function getPageUrl() {
    return location.protocol === "file:" ? getPagePath() : location.href;
  }

  function getContext(extra = {}) {
    return Object.assign({
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      path: getPagePath(),
      url: getPageUrl(),
      title: document.title,
      ref: document.referrer || "",
      language: navigator.language || "",
      timezone: getTimezone(),
      deviceType: getDeviceType(),
      screen: {
        width: window.screen && window.screen.width ? window.screen.width : 0,
        height: window.screen && window.screen.height ? window.screen.height : 0
      }
    }, extra);
  }

  function sendPayload(payload, preferBeacon = false) {
    const body = JSON.stringify(payload);
    if (preferBeacon || _isUnloading) {
      if (navigator && navigator.sendBeacon) {
        try {
          const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
          if (ok) return true;
        } catch (e) {}
      }
      try {
        _pendingBeacons.push(new Blob([body], { type: "application/json" }));
      } catch (e) {}
      return false;
    }

    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const signal = controller ? controller.signal : undefined;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        signal
      }).then(() => {
        if (timeoutId) clearTimeout(timeoutId);
      }).catch(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function track(event, meta = {}, options = {}) {
    if (_isUnloading && !options.beacon) return false;
    const payload = getContext(Object.assign({ event }, meta));
    return sendPayload(payload, Boolean(options.beacon));
  }

  function trackPageview(meta = {}) {
    if (_pageviewSent) return false;
    _pageviewSent = true;
    return track("pageview", meta);
  }

  function trackClick(target) {
    if (!target) return;
    const text = (target.dataset.analyticsLabel || target.getAttribute("aria-label") || target.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const href = target.getAttribute("href") || "";
    track("click", {
      meta: {
        tag: target.tagName.toLowerCase(),
        label: text,
        href,
        id: target.id || "",
        className: target.className || ""
      }
    });
  }

  try {
    if (sessionStorage.getItem(SESSION_STARTED_KEY) !== getSessionId()) {
      sessionStorage.setItem(SESSION_STARTED_KEY, getSessionId());
      track("session_start");
    }
  } catch {
    track("session_start");
  }

  const trackInitialPageview = () => trackPageview();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackInitialPageview, { once: true });
  } else {
    trackInitialPageview();
  }

  document.addEventListener("click", (event) => {
    const target = event.target && event.target.closest
      ? event.target.closest("a, button, [role='button'], [data-analytics-label]")
      : null;
    if (!target) return;
    if (target.hasAttribute("data-analytics-ignore")) return;
    trackClick(target);
  }, true);

  heartbeat = setInterval(() => {
    if (!_isUnloading) track("heartbeat");
  }, 60000);

  window.NovaAnalytics = {
    track,
    trackPageview
  };
})();
