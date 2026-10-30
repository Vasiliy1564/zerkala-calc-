/* Load compact, lossless data before the unchanged planner scripts. */
(async()=>{
 const banner=document.getElementById('siteLoading');
 const controls=[...document.querySelectorAll('input,button')];controls.forEach(n=>n.disabled=true);
 function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Не удалось загрузить '+src));document.body.append(s)})}
 const cfg=self.PUT_OFFLINE;
 const cacheName='put-peterburg:'+new URL('.',location.href).pathname+':v'+cfg.version;
 let dataCache=null;try{dataCache=await caches.open(cacheName)}catch(e){}
 const registration='serviceWorker' in navigator?navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>null):Promise.resolve(null);
 async function resource(file){
  const url=new URL(file,location.href).href;const saved=await dataCache?.match(url);if(saved)return saved;
  for(let attempt=0;attempt<3;attempt++){
   try{const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);try{await dataCache?.put(url,response.clone())}catch(e){}return response}
   catch(e){if(attempt===2)throw Error('Не удалось скачать «'+file+'». Проверьте связь и нажмите «Повторить загрузку». Уже скачанные части сохранятся.')}
  }
 }
 async function dataset(name,files){
  const list=Array.isArray(files)?files:[files],chunks=[];
  for(const file of list){banner.firstChild.textContent='Загружаем базу: '+name+' · '+(chunks.length+1)+' / '+list.length+'…';chunks.push(new Uint8Array(await (await resource(file)).arrayBuffer()))}
  const bytes=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length}
  let text;try{
   if(bytes[0]===31&&bytes[1]===139){if(typeof DecompressionStream==='undefined')throw Error('Обновите браузер для работы со сжатой базой.');text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}else text=new TextDecoder().decode(bytes);
   window[name]=JSON.parse(text);
  }catch(e){for(const file of list)await dataCache?.delete(new URL(file,location.href).href);throw Error('База «'+name+'» повреждена. Нажмите «Повторить загрузку» для повторного скачивания.')}
 }

 try{
 for(const [name,files] of Object.entries(cfg.datasets))await dataset(name,files);
 window.REGION_BOUNDARY=await (await resource('region-boundary.json')).json();
 for(const src of cfg.scripts)await script(src);

 // Do not expose Android-only settings in the web interface.
 gpsControls=function(){const box=document.getElementById('gpsTools');box.replaceChildren(node('p','Разрешите местоположение в настройках этого сайта. Точность зависит от браузера, устройства и условий приёма.'));if(gpsBusy){const cancel=node('button','Остановить определение','mapButton');cancel.onclick=()=>Phone.cancelLocation();box.append(cancel)}};
 controls.forEach(n=>n.disabled=false);banner.remove();
 for(const f of ['from','to']){const list=document.getElementById(f+'List');list.setAttribute('aria-label','Подсказки: '+(f==='from'?'откуда':'куда'));document.getElementById(f).setAttribute('aria-controls',f+'List')}
 document.getElementById('siteLoading')?.remove();
 window.siteReady=true;
 const offline=document.createElement('p');offline.id='offlineStatus';offline.className='status';offline.setAttribute('role','status');document.querySelector('header').after(offline);
 offline.textContent='Сохраняем сайт для работы без интернета…';
 async function checkOffline(){
  try{const reg=await registration;if(!reg)throw Error('worker');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),30000))]);const cache=await caches.open(cacheName);const available=await Promise.all(cfg.files.map(f=>cache.match(new URL(f,location.href).href)));if(available.some(r=>!r))throw Error('partial');
   offline.textContent='✓ Готово без интернета: поиск по скачанной базе и маршруты. Новые пешие указания и поиск в интернете требуют связи.';navigator.storage?.persist?.().catch(()=>{});
  }catch(e){offline.textContent='Маршруты готовы. Сохранение для работы без интернета не завершено — откройте сайт в обычном Chrome и дождитесь отметки «Готово без интернета».'}
 }
 checkOffline();
 }catch(e){controls.forEach(n=>n.disabled=true);banner.setAttribute('role','alert');banner.textContent=e.message||'Не удалось загрузить сайт. Проверьте интернет.';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.onclick=()=>location.reload();banner.append(document.createElement('br'),retry);console.error(e)}
})();
