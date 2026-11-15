/* Калькулятор зеркал. Как в «Путь Петербург»: приложение сразу открывается из сохранённой копии и не ждёт сеть.
   Свежие файлы подтягиваются в фоне и по кнопке «Обновить приложение».
   Работает только для страниц приложения (/app-kalk/); сохраняет и файлы сайта, которые они загружают. */
const CACHE='app-kalk-v3';
const SHELL=['./','./classic.html','./owner.js','./owner.css','/index.html'];
function fresh(req,ms){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),ms||20000);
 return fetch(req,{cache:'no-store',signal:ctl.signal}).finally(()=>clearTimeout(timer));
}
async function save(req,res){if(res&&res.ok&&res.status===200){const c=await caches.open(CACHE);await c.put(req,res.clone());}return res;}
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>fresh(u).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('app-kalk-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==location.origin||req.headers.has('range'))return;
 e.respondWith((async()=>{
  const c=await caches.open(CACHE),saved=await c.match(req)||await c.match(req,{ignoreSearch:true});
  if(saved){e.waitUntil(fresh(req.url).then(r=>save(req.url,r)).catch(()=>{}));return saved;}
  return save(req.url,await fresh(req.url,30000));
 })());
});
// Кнопка «Обновить приложение»: заново скачать всё сохранённое и сообщить странице результат.
self.addEventListener('message',e=>{
 if(!e.data||e.data.type!=='refresh')return;
 e.waitUntil((async()=>{
  const c=await caches.open(CACHE),keys=await c.keys(),urls=[...new Set(keys.map(k=>k.url).concat(SHELL.map(u=>new URL(u,self.registration.scope).href)))];
  let ok=0,fail=0;
  await Promise.all(urls.map(u=>fresh(u,25000).then(r=>{if(r.ok&&r.status===200){ok++;return c.put(u,r);}fail++;}).catch(()=>{fail++;})));
  if(e.source)e.source.postMessage({type:'refreshed',ok:ok,fail:fail});
 })());
});
