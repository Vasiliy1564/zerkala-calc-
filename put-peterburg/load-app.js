/* Load compact, lossless data before the unchanged planner scripts. */
(async()=>{
 const banner=document.getElementById('siteLoading');
 const controls=[...document.querySelectorAll('input,button')];controls.forEach(n=>n.disabled=true);
 function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Не удалось загрузить '+src));document.body.append(s)})}
 const cfg=self.PUT_OFFLINE;
 const cacheName='put-peterburg:'+new URL('.',location.href).pathname+':v'+cfg.version;
 // Fix 0.45: база лежит в отдельном кэше и переживает обновления программы.
 const dataCacheName='put-peterburg:'+new URL('.',location.href).pathname+':data-'+cfg.dataVersion;
 let dataCache=null;try{dataCache=await caches.open(dataCacheName)}catch(e){}
 // Новая версия установилась, пока страница открыта: предлагаем перезагрузить, а не молча работаем на старой.
 // 0.48: обновление ставится само. Если человек ничего не вводит и не едет по маршруту — страница перезагружается сразу, иначе показываем кнопку.
 if('serviceWorker' in navigator){const hadController=!!navigator.serviceWorker.controller;let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;const busy=document.body.classList.contains('travelling')||['from','to'].some(id=>document.getElementById(id)?.value);if(!busy){reloading=true;location.reload();return}if(document.getElementById('updateNotice'))return;const box=document.createElement('p');box.id='updateNotice';box.className='status';box.setAttribute('role','status');box.textContent='Вышло обновление приложения. ';const b=document.createElement('button');b.textContent='Обновить сейчас';b.className='mapButton';b.onclick=()=>location.reload();box.append(b);document.querySelector('header').after(box)})}
 const registration='serviceWorker' in navigator?navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>null):Promise.resolve(null);
 // Проверяем новую версию при каждом запуске и при возвращении в приложение.
 registration.then(reg=>{if(!reg)return;const check=()=>reg.update().catch(()=>{});check();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()})});
 async function resource(file){
  const url=new URL(file,location.href).href;const saved=await dataCache?.match(url);if(saved)return saved;
  for(let attempt=0;attempt<3;attempt++){
   try{const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);try{await dataCache?.put(url,response.clone())}catch(e){}return response}
   catch(e){if(attempt<2)await new Promise(r=>setTimeout(r,700*(attempt+1)));if(attempt===2)throw Error('Не удалось скачать «'+file+'». Проверьте связь и нажмите «Повторить загрузку». Уже скачанные части сохранятся.')}
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
 gpsControls=function(){const box=document.getElementById('gpsTools');box.replaceChildren(node('p','Разрешите приложению доступ к местоположению. Точность зависит от браузера, устройства и условий приёма.'));if(gpsBusy){const cancel=node('button','Остановить определение','mapButton');cancel.onclick=()=>Phone.cancelLocation();box.append(cancel)}};
 controls.forEach(n=>n.disabled=false);banner.remove();
 for(const f of ['from','to']){const list=document.getElementById(f+'List');list.setAttribute('aria-label','Подсказки: '+(f==='from'?'откуда':'куда'));document.getElementById(f).setAttribute('aria-controls',f+'List')}
 document.getElementById('siteLoading')?.remove();
 window.siteReady=true;
 const offline=document.createElement('p');offline.id='offlineStatus';offline.className='status';offline.setAttribute('role','status');document.querySelector('header').after(offline);
 offline.textContent='Сохраняем приложение для работы без интернета…';
 async function checkOffline(){
  try{const reg=await registration;if(!reg)throw Error('worker');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),30000))]);const cache=await caches.open(cacheName),data=await caches.open(dataCacheName);const available=await Promise.all(cfg.files.map(async f=>{const u=new URL(f,location.href).href;return await cache.match(u)||await data.match(u)}));if(available.some(r=>!r))throw Error('partial');
   offline.textContent='✓ Готово без интернета: поиск по скачанной базе и маршруты. Новые пешие указания и поиск в интернете требуют связи.';navigator.storage?.persist?.().catch(()=>{});
  }catch(e){offline.textContent='Маршруты готовы. Сохранение для работы без интернета не завершено — откройте приложение при хорошей связи и дождитесь отметки «Готово без интернета».'}
 }
 checkOffline();
 }catch(e){controls.forEach(n=>n.disabled=true);banner.setAttribute('role','alert');banner.textContent=e.message||'Не удалось загрузить приложение. Проверьте интернет.';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.onclick=()=>location.reload();banner.append(document.createElement('br'),retry);console.error(e)}
})();
