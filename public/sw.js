// Installable + offline. Network-first for app files so updates show right away; fonts cache-first.
const CACHE = "latent-v16";
const SHELL = ["./", "index.html", "app.js", "content.js", "styles.css", "manifest.webmanifest", "data/briefs.json", "data/models.json", "data/lessons.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
const put = (req, res) => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return res; };
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const font = url.hostname.endsWith("gstatic.com") || url.hostname === "fonts.googleapis.com";
  if (url.origin !== location.origin && !font) return;
  if (font) e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => put(req, r))));
  else e.respondWith(fetch(req).then((r) => put(req, r)).catch(() => caches.match(req).then((hit) => hit || caches.match("index.html"))));
});
