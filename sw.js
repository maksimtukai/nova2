const CACHE_NAME = "nova-cache-v23";
const STATIC_SHELL = [
  "/style.css",
  "/cabinet.css",
  "/script.js",
  "/cabinet.js",
  "/panel.js",
  "/enhancements.js",
  "/interactions.js",
  "/mobile-menu.js",
  "/analytics.js",
  "/manifest.webmanifest",
  "/launcher.webmanifest",
  "/app-icon.svg",
  "/analytics-icon.svg",
  "/background.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/nova/style.css",
  "/nova/cabinet.css",
  "/nova/script.js",
  "/nova/cabinet.js",
  "/nova/panel.js",
  "/nova/enhancements.js",
  "/nova/interactions.js",
  "/nova/mobile-menu.js",
  "/nova/analytics.js",
  "/nova/manifest.webmanifest",
  "/nova/launcher.webmanifest",
  "/nova/app-icon.svg",
  "/nova/analytics-icon.svg",
  "/nova/background.svg",
  "/nova/icon-192.png",
  "/nova/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isHtmlRequest(pathname) {
  const hasNoExt = !/\.[a-zA-Z0-9]+$/.test(pathname.split("/").pop() || "");
  return (
    pathname.endsWith(".html") ||
    pathname === "/" ||
    pathname === "" ||
    pathname === "/nova/" ||
    pathname === "/nova" ||
    (pathname.startsWith("/nova/") && hasNoExt) ||
    (pathname.startsWith("/") && !pathname.startsWith("/nova/") && hasNoExt && pathname !== "/sw.js" && pathname !== "/nova/sw.js")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const pathname = url.pathname;

  if (pathname.endsWith("/sw.js") || pathname.endsWith("/nova/sw.js")) return;

  if (isHtmlRequest(pathname)) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((res) => res)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (pathname.includes("/api/") || pathname.endsWith(".log")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) cache.put(event.request, response.clone()).catch(() => {});
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
