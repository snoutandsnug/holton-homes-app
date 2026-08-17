const CACHE="holton-homes-people-select-size-2026-08-17-v5";
const ASSETS=[
  "./",
  "./index.html",
  "./styles.css",
  "./v13.css",
  "./v14.css?v=topnav-recovery",
  "./holton-ai.css?v=2",
  "./app.js",
  "./holton-ai.js?v=2",
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
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response.ok && new URL(event.request.url).origin===self.location.origin){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then(response=>response||caches.match("./index.html")))
  );
});
