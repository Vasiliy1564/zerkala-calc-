/* Калькулятор зеркал: сначала сеть (свежая версия), без сети — сохранённая копия. */
const CACHE='app-kalk-v1';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(new URL('./',location.href).pathname))return;
 e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(url.pathname.endsWith('/')?'./':req,copy)).catch(()=>{})}return r})
  .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
});
