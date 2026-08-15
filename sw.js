const C='diet-control-v3.7';
const PRECACHE=['./icons/diet-control-icon-192-v3.png','./icons/diet-control-icon-512-v3.png','./icons/diet-control-apple-touch-v3.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(PRECACHE)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);const dynamic=['document','script','style','manifest'].includes(e.request.destination)||u.pathname.endsWith('/manifest.json');if(dynamic){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const clone=r.clone();caches.open(C).then(c=>c.put(e.request,clone));return r}).catch(()=>caches.match(e.request)));return}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
