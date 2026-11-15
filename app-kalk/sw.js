/* Калькулятор зеркал: сначала сеть (свежая версия), без сети — сохранённая копия.
   Работает только для страниц приложения (/app-kalk/); сохраняет и файлы сайта, которые они загружают. */
const CACHE='app-kalk-v2';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./classic.html','/index.html'])).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==location.origin||req.headers.has('range'))return;
 e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{})}return r})
  .catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||Response.error())));
});
