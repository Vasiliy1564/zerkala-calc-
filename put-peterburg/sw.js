/* Offline cache is restricted to this application directory. Release 051 — меняйте номер при каждом выпуске, чтобы обновление находилось сразу. */
importScripts('./offline-config.js');
const PREFIX='put-peterburg:'+new URL('.',self.location.href).pathname+':';
const CACHE=PREFIX+'v'+self.PUT_OFFLINE.version;
// Fix 0.45: база адресов и маршрутов (≈15 МБ) хранится отдельно и не скачивается заново при каждом обновлении программы.
const DATA=PREFIX+'data-'+self.PUT_OFFLINE.dataVersion;
const assetURLs=new Set(self.PUT_OFFLINE.files.map(p=>new URL(p,self.location.href).href));
const dataURLs=new Set(Object.values(self.PUT_OFFLINE.datasets).flat().map(p=>new URL(p,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for(const file of self.PUT_OFFLINE.shell){const response=await fetch(new URL(file,self.location.href),{cache:'reload'});if(!response.ok)throw Error('Shell unavailable');await cache.put(new URL(file,self.location.href),response)}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const data=await caches.open(DATA);
 for(const name of await caches.keys()){
  if(!name.startsWith(PREFIX)||name===CACHE||name===DATA)continue;
  // Старый кэш версии: переносим уже скачанную базу, остальное удаляем. Старые базы (data-*) не переносим.
  if(!name.startsWith(PREFIX+'data-')){try{const old=await caches.open(name);for(const url of dataURLs){if(await data.match(url))continue;const saved=await old.match(url);if(saved)await data.put(url,saved)}}catch(e){}}
  await caches.delete(name);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);url.search='';url.hash='';
 if(!assetURLs.has(url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(dataURLs.has(url.href)?DATA:CACHE),saved=await cache.match(url.href);
  if(saved)return saved;
  const response=await fetch(event.request);if(response.ok)await cache.put(url.href,response.clone());return response;
 })());
});
