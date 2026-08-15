const CACHE='diet-control-v5.1';
const CORE=['./','./index.html','./styles.css?v=5.1','./app.js?v=5.1','./manifest-v5.1.json','./icons/diet-control-v51-192.png','./icons/diet-control-v51-512.png','./icons/diet-control-v51-maskable-512.png','./icons/apple-touch-icon-v51.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return}
  event.respondWith(fetch(req).then(r=>{if(r&&r.ok&&new URL(req.url).origin===self.location.origin){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r}).catch(()=>caches.match(req)));
});
