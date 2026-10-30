/* Offline cache is restricted to this application directory. */
importScripts('./offline-config.js');
const PREFIX='put-peterburg:'+new URL('.',self.location.href).pathname+':';
const CACHE=PREFIX+'v'+self.PUT_OFFLINE.version;
const assetURLs=new Set(self.PUT_OFFLINE.files.map(p=>new URL(p,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for(const file of self.PUT_OFFLINE.shell){const response=await fetch(new URL(file,self.location.href),{cache:'reload'});if(!response.ok)throw Error('Shell unavailable');await cache.put(new URL(file,self.location.href),response)}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);url.search='';url.hash='';
 if(!assetURLs.has(url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),saved=await cache.match(url.href);
  if(saved)return saved;
  const response=await fetch(event.request);if(response.ok)await cache.put(url.href,response.clone());return response;
 })());
});
