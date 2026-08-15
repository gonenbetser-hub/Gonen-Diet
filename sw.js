const C='diet-control-v3.1';
const CORE=['./','./index.html','./styles.css','./app.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  const fresh=e.request.mode==='navigate'||u.pathname.includes('manifest')||u.pathname.includes('/icons/');
  if(fresh){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(C).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(C).then(c=>c.put(e.request,copy));return resp})));
});
