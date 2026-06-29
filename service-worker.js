const CACHE = "lezen-v2";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    // network-first for the app shell, so a redeploy reaches the device when online
    e.respondWith(
      fetch(req).then((resp) => {
        const cp = resp.clone();
        caches.open(CACHE).then((c) => c.put("index.html", cp));
        return resp;
      }).catch(() => caches.match("index.html").then((r) => r || caches.match("./")))
    );
    return;
  }
  // cache-first for static assets
  e.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((resp) => {
      const cp = resp.clone();
      caches.open(CACHE).then((c) => c.put(req, cp));
      return resp;
    }))
  );
});
