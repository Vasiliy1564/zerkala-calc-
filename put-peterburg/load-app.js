/* Load compact, lossless data before the unchanged planner scripts. */
(async()=>{
 const banner=document.getElementById('siteLoading');
 const controls=[...document.querySelectorAll('input,button')];controls.forEach(n=>n.disabled=true);
 function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Не удалось загрузить '+src));document.body.append(s)})}
 async function dataset(name,url){const r=await fetch(url);if(!r.ok)throw Error('Не удалось загрузить базу.');let bytes=new Uint8Array(await r.arrayBuffer());let text;if(bytes[0]===31&&bytes[1]===139){if(typeof DecompressionStream==='undefined')throw Error('Обновите браузер для работы со сжатой базой.');text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}else text=new TextDecoder().decode(bytes);window[name]=JSON.parse(text)}
 try{
 const datasets={"TRANSIT": "transit.json.gz", "STREETS": "streets.json.gz", "HOUSE_DATA": "houses.json.gz", "PLACE_DATA": "places.json.gz", "REGION_SEARCH_INDEX": "region-index.json.gz"};
 await Promise.all([...Object.entries(datasets).map(([name,url])=>dataset(name,url)),fetch('region-boundary.json').then(r=>{if(!r.ok)throw Error('Не удалось загрузить область поиска');return r.json()}).then(data=>window.REGION_BOUNDARY=data)]);
 await script('browser-bridge.js');
 for(const src of ["rail-data.js", "router.js", "address.js", "journey.js", "advanced.js", "exits.js", "nearest-house.js", "local-address.js", "ui.js", "bus667.js", "automatic.js", "walking.js", "experience.js"])await script(src);
 // Do not expose Android-only settings in the web interface.
 gpsControls=function(){const box=document.getElementById('gpsTools');box.replaceChildren(node('p','Разрешите местоположение в настройках этого сайта. Точность зависит от браузера, устройства и условий приёма.'));if(gpsBusy){const cancel=node('button','Остановить определение','mapButton');cancel.onclick=()=>Phone.cancelLocation();box.append(cancel)}};
 controls.forEach(n=>n.disabled=false);banner.remove();
 for(const f of ['from','to']){const list=document.getElementById(f+'List');list.setAttribute('aria-label','Подсказки: '+(f==='from'?'откуда':'куда'));document.getElementById(f).setAttribute('aria-controls',f+'List')}
 document.getElementById('siteLoading')?.remove();
 window.siteReady=true;
 }catch(e){controls.forEach(n=>n.disabled=true);banner.setAttribute('role','alert');banner.textContent=e.message||'Не удалось загрузить сайт. Проверьте интернет.';const retry=document.createElement('button');retry.textContent='Повторить загрузку';retry.onclick=()=>location.reload();banner.append(document.createElement('br'),retry);console.error(e)}
})();
