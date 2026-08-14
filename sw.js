const C='diet-control-v4.0-evidence';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest-diet-control-v4.json','./icons/diet-control-icon-192-v3.png','./icons/diet-control-icon-512-v3.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);const fresh=e.request.mode==='navigate'||u.pathname.includes('manifest')||u.pathname.includes('/icons/')||u.pathname.endsWith('app.js')||u.pathname.endsWith('styles.css');if(fresh){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));return;}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
