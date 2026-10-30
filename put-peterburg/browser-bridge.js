/* Browser implementation of the Android bridge. No keys, location tracking or queries until a user action. */
(() => {
 const jobs=new Map();let watch=null,gpsTimer=null,gpsGeneration=0,searchQueue=Promise.resolve(),lastSearch=0;
 const emit=(type,data)=>{if(typeof window.receive==='function')window.receive(type,data)};
 const point=(lat,lon)=>Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
 const cachePrefix='put.web.cache.';
 function getCache(key){try{const x=JSON.parse(localStorage.getItem(cachePrefix+key));return x&&Date.now()-x.time<86400000?x.value:null}catch{return null}}
 function setCache(key,value){try{const text=JSON.stringify({time:Date.now(),value});if(text.length>400000)return;const keys=Object.keys(localStorage).filter(k=>k.startsWith(cachePrefix));if(keys.length>=40)keys.slice(0,keys.length-39).forEach(k=>localStorage.removeItem(k));localStorage.setItem(cachePrefix+key,text)}catch{}}
 function ringContains(r,x,y){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside}return inside}
 function inRegion(lat,lon){const g=window.REGION_BOUNDARY;if(!g)return false;const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;return polys.some(p=>ringContains(p[0],lon,lat)&&!p.slice(1).some(r=>ringContains(r,lon,lat)))}
 function regionBbox(){const xy=[];function collect(a){if(typeof a[0]==='number')xy.push(a);else a.forEach(collect)}collect(window.REGION_BOUNDARY.coordinates);return [Math.min(...xy.map(p=>p[0])),Math.min(...xy.map(p=>p[1])),Math.max(...xy.map(p=>p[0])),Math.max(...xy.map(p=>p[1]))].join(',')}
 async function jsonFetch(url,signal){const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(abort,14000);try{const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});if(!r.ok)throw Error('Сервис временно недоступен ('+r.status+').');return await r.json()}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}}
 function limitedSearch(work){const task=searchQueue.catch(()=>{}).then(async()=>{await new Promise(r=>setTimeout(r,Math.max(0,1100-(Date.now()-lastSearch))));lastSearch=Date.now();return work()});searchQueue=task;return task}
 function open(url){const w=window.open(url,'_blank','noopener,noreferrer');return w}
 function stopGps(message){gpsGeneration++;if(watch!==null)navigator.geolocation?.clearWatch(watch);watch=null;clearTimeout(gpsTimer);if(message)emit('gpsFinished',message)}
 window.Phone={
  async geocode(field,query,id){
   if(!['from','to'].includes(field)||typeof query!=='string'||query.trim().length<2||query.length>250)return;
   jobs.get(field)?.abort();const controller=new AbortController();jobs.set(field,controller);const key='search:piers-v1:'+query.toLowerCase().replace(/ё/g,'е').trim();
   try{const pierQuery=isPierQuery(query),known=pierQuery?pierMatches(query):[];if(known.length){emit('places',{field,id,items:known});return}const cached=getCache(key);if(cached){emit('places',{field,id,items:cached});return}
    const params=new URLSearchParams({q:pierQuery?query.replace(/пирс[а-я]*|пристан[а-я]*/giu,'причал'):query,limit:'20',lat:'59.94',lon:'30.31',bbox:regionBbox()});
    const data=await limitedSearch(()=>{if(controller.signal.aborted)throw Error('cancelled');return jsonFetch('https://photon.komoot.io/api/?'+params,controller.signal)});
    const seen=new Set(),items=[];for(const f of data.features||[]){const xy=f.geometry?.coordinates,p=f.properties||{};if(!Array.isArray(xy)||!point(xy[1],xy[0])||!inRegion(xy[1],xy[0]))continue;const pier=p.osm_value==='pier'||p.osm_value==='ferry_terminal'||isPierQuery(p.name||'');if(pierQuery&&!pier)continue;const name=[p.name,p.city,p.district,p.street,p.housenumber].filter((v,i,a)=>typeof v==='string'&&v&&a.indexOf(v)===i).join(', ');if(!name)continue;const key=name+':'+xy.map(n=>n.toFixed(5)).join(',');if(seen.has(key))continue;seen.add(key);items.push({name,kind:pier?'pier':'address',lon:xy[0],lat:xy[1],house:p.housenumber||'',source:'photon-osm',osmId:String(p.osm_type||'')+String(p.osm_id||'')})}
    if(controller.signal.aborted)return;if(items.length)setCache(key,items);emit('places',{field,id,items});
   }catch(e){if(!controller.signal.aborted)emit('places',{field,id,error:'Интернет-поиск не ответил. Проверьте подключение. Можно выбрать станцию, адрес из базы или ввести координаты.'})}finally{if(jobs.get(field)===controller)jobs.delete(field)}
  },
  locate(){stopGps();if(!navigator.geolocation){emit('gpsError','Этот браузер не поддерживает определение местоположения. Введите адрес вручную.');return}const generation=gpsGeneration;emit('gpsStarted',{});gpsTimer=setTimeout(()=>stopGps('Определение местоположения завершено. Проверьте найденный адрес.'),45000);
   watch=navigator.geolocation.watchPosition(p=>{if(generation!==gpsGeneration)return;const c=p.coords;if(!point(c.latitude,c.longitude))return;emit('gps',{lat:c.latitude,lon:c.longitude,accuracy:Math.round(c.accuracy),ageSeconds:Math.max(0,Math.round((Date.now()-p.timestamp)/1000)),cached:false});},e=>{if(generation!==gpsGeneration)return;stopGps();emit('gpsError',e.code===1?'Разрешите доступ к местоположению в настройках сайта браузера или введите адрес вручную.':e.code===3?'Не удалось определить местоположение вовремя. Попробуйте на улице или введите адрес.':'Местоположение недоступно. Включите геолокацию телефона или введите адрес.');},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  },
  cancelLocation(){stopGps('Определение местоположения остановлено.')},
  locationSettings(){emit('mapError','Откройте настройки этого сайта в адресной строке браузера → Разрешения → Местоположение. На телефоне также включите геолокацию.')},
  permissionSettings(){this.locationSettings()},
  nearbyAddress(lat,lon,id){setTimeout(()=>emit('gpsAddress',{id,complete:false}),0)},
  async copyAddress(address){try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(address);else{const t=document.createElement('textarea');t.value=address;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error()}emit('copyResult',{ok:true})}catch{emit('copyResult',{ok:false})}},
  openEntrance(id){if(/^[0-9]{10,20}$/.test(id))open('https://2gis.ru/spb/stationEntrance/'+id)},
  openDestination(lat,lon){if(point(lat,lon))open('https://2gis.ru/geo/'+lon+','+lat)},
  openMap(lat,lon){if(point(lat,lon))open('https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lon+'#map=18/'+lat+'/'+lon)},
  openNavigation(kind,fromLat,fromLon,toLat,toLon){if(['bus','pedestrian'].includes(kind)&&point(fromLat,fromLon)&&point(toLat,toLon))open('https://2gis.ru/directions/tab/'+kind+'/points/'+fromLon+','+fromLat+'|'+toLon+','+toLat)},
  async walking(a,b,c,d,id){if(!point(a,b)||!point(c,d))return;const key='walking:'+JSON.stringify([a,b,c,d].map(n=>n.toFixed(6)));try{const cached=getCache(key);if(cached){emit('walking',{id,data:{...cached,cached:true}});return}const coords=b+','+a+';'+d+','+c;const data=await jsonFetch('https://routing.openstreetmap.de/routed-foot/route/v1/foot/'+coords+'?steps=true&geometries=geojson&overview=full&radiuses=60;60&generate_hints=false');if(data.code!=='Ok')throw Error();data.savedAt=Date.now();setCache(key,data);emit('walking',{id,data})}catch{emit('walking',{id,error:'Пеший путь сейчас не рассчитан. Повторите попытку или откройте участок в 2ГИС.'})}}
 };
 window.addEventListener('pagehide',()=>stopGps());
})();
