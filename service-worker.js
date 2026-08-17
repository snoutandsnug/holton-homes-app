const CACHE="holton-homes-os-v14-8-full-product-pass-2026-08-16";
const ASSETS=[
  "./",
  "./index.html",
  "./styles.css",
  "./v13.css",
  "./v14.css",
  "./app.js",
  "./v14-agent.js",
  "./v14-crm.js",
  "./cloud-config.js",
  "./manifest.webmanifest",
  "./assets/Holton-Homes-Primary-Full-Color.svg",
  "./pip-default.webp",
  "./pip-thinking.webp",
  "./pip-celebrate.webp",
  "./pip-work.webp",
  "./pip-concerned.webp"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      return response;
    }).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html")))
  );
});
