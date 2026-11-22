/* One customer address and one road route for the whole order. */
(function(){
'use strict';
var origin='ГК Рубеж, Ставрополь, улица 45-я Параллель, 44',point=[41.9110926,45.0011119],route=null,revision=0,busy=false,lastSearch=0;
var form=document.getElementById('quote-form'),option=document.querySelector('input[name="option"][value="delivery"]');
var panel=document.createElement('div');panel.id='delivery-address-panel';panel.className='delivery-address-panel';
panel.innerHTML='<label for="delivery-address">Укажите адрес доставки</label><input id="delivery-address" type="text" autocomplete="street-address" placeholder="Город, улица, дом"><button type="button" class="button" id="delivery-search">Рассчитать доставку</button><div id="delivery-candidates"></div><p id="delivery-route-status" role="status" aria-live="polite"></p><div id="delivery-map-slot"></div><small class="delivery-attribution">© 2ГИС · © OpenStreetMap</small>';
// Keep expanding details outside the option grid so its buttons never reflow.
var group=document.getElementById('deliveryOpt').closest('.options'),details=document.createElement('div');details.id='mirror-service-details';group.after(details);details.appendChild(panel);
var input=document.getElementById('delivery-address'),status=document.getElementById('delivery-route-status'),results=document.getElementById('delivery-candidates'),button=document.getElementById('delivery-search');
function describe(){
 var installed=form.querySelector('input[name=option][value=install]').checked,requested=option.checked||installed;
 if(!requested)return 'не включена';
 var v=window.MirrorSize,shape=form.querySelector('input[name=shape]:checked'),w=v?v.read(document.getElementById('width')):0,h=v?v.read(document.getElementById('height')):0;
 if(shape&&shape.value==='circle')h=w;
 if(shape&&/double/.test(shape.value))h+=v.read(document.getElementById('height2'));
 var engine=window.MirrorOrderPricing,base=engine.deliveryBase(requested,installed),total=engine.deliveryPrice(Math.max(w,h),route?route.km:null,requested,installed),extra=Math.max(0,total-base);
 if(!route)return 'укажите адрес';
 return (base?extra:total).toLocaleString('ru-RU')+' ₽';
}
function updatePrice(){if(route)status.textContent='Ориентировочная доставка: '+describe()+' ('+String(route.km).replace('.',',')+' км)'+(route.approx?' — до выбранной улицы (точный дом не определён), уточним при согласовании':'');}
function emit(){updatePrice();window.dispatchEvent(new Event('mirror-delivery-change'));}
function warmAddresses(){/* Bundled offline address data covers St Petersburg, not Stavropol. */}
function visibility(){panel.hidden=!option.checked;if(option.checked)warmAddresses();}
window.MirrorDelivery={describe:describe,getRoute:function(){return route;},updateVisibility:function(){visibility();updatePrice();},origin:{label:origin,point:point},
 // Lets the map and address suggestions set the destination directly.
 choose:function(f){if(!f||!f.geometry)return;var token=++revision;route=null;results.replaceChildren();input.value=address(f);busy=true;button.disabled=true;emit();choose(f,token);}};
visibility();option.addEventListener('change',visibility);
function reset(){revision++;route=null;busy=false;button.disabled=false;results.replaceChildren();status.textContent='';emit();}
input.addEventListener('focus',warmAddresses);
input.addEventListener('input',reset);
input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();button.click();}});
async function json(url,options,timeout){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},timeout||22000);try{var response=await fetch(url,Object.assign({},options,{signal:controller.signal}));if(!response.ok){var error=Error('HTTP '+response.status);error.code='HTTP_'+response.status;throw error;}return await response.json();}finally{clearTimeout(timer);}}
async function searchAddress(query,market,token){
 var key='mirror.2gis.'+market+'.'+query.toLowerCase().replace(/ё/g,'е').trim(),saved;
 try{saved=JSON.parse(localStorage.getItem(key));if(saved&&Date.now()-saved.at<86400000&&Array.isArray(saved.data.features)&&saved.data.features.length)return saved.data;}catch(e){}
 var url='https://zerkalo-address-api.vercel.app/api/geocode?q='+encodeURIComponent(query)+'&market='+market;
 var finished=false;
 function remember(data){if(data.features&&data.features.length){try{localStorage.setItem(key,JSON.stringify({at:Date.now(),data:data}));}catch(e){}}return data;}
 var remote=json(url,{credentials:'omit'},6000).then(remember);
 var jobs=[remote];
 // OpenStreetMap search covers villages and points the main provider misses or fails on.
 if(window.MirrorPhoton){var osm=window.MirrorPhoton.search(query);osm.catch(function(){});
  // Starts at once, but yields to the main provider if it answers with matches within 2.5 s.
  jobs.push(Promise.race([remote.then(function(d){return d.features&&d.features.length?'hit':'miss';},function(){return 'miss';}),new Promise(function(r){setTimeout(function(){r('miss');},2500);})]).then(function(s){if(s==='hit')throw {data:{features:[]}};return osm;}));}
 if(market!=='stav'&&window.MirrorAddressFallback)jobs.push(window.MirrorAddressFallback.search(query,function(done,total){if(!finished&&token===revision)status.textContent='Загружаем адресную базу: '+done+' / '+total+'…';}).then(remember));
 // Both sources start together; an empty answer must not hide a valid slower answer.
 try{return await Promise.any(jobs.map(function(job){return job.then(function(data){if(data.features&&data.features.length)return data;throw {data:data};});}));}
 catch(group){
  var errors=group.errors||[group],empty=errors.find(function(e){return e&&e.data;});
  if(empty)return empty.data;
  throw errors.find(function(e){return e&&e.code;})||errors[0]||Error('Search failed');
 }finally{finished=true;}

}
function address(f){var p=f.properties;if(p.label)return p.label;return [p.city||p.town||p.locality,p.street,p.housenumber].filter(Boolean).join(', ');}
// Search for exact buildings first; only offer a labelled street estimate when the building is missing.
function normalizedAddress(q){return q.replace(/стругатского|стругадского/gi,'Стругацкого').trim();}
function houseOf(q){var m=q.match(/(?:^|[,\s])(?:д(?:ом)?\.?\s*)?(\d+[а-яa-z]?(?:\s*[\/-]\s*\d+[а-яa-z]?)*)\s*$/iu);return m?m[1].toLowerCase().replace(/\s+/g,''):'';}
function withoutHouse(q){return q.replace(/[,\s]+(?:д(?:ом)?\.?\s*)?\d+[а-яa-z]?(?:\s*[\/-]\s*\d+[а-яa-z]?)*\s*$/iu,'').trim();}
function lower(q){return q.toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]+/g,' ').trim();}
function streetWords(q){
 var base=withoutHouse(q),m=base.match(/(?:улица|ул\.?|проспект|пр\.?|переулок|пер\.?|проезд|шоссе)\s+(.+)$/iu);
 return lower(m?m[1]:base.split(',').pop()).split(/\s+/).filter(function(w){return w.length>1&&!/^(улица|город|край|дом)$/.test(w);});
}
function inRegion(f){var c=f.geometry&&f.geometry.coordinates;return c&&Number.isFinite(c[0])&&Number.isFinite(c[1])&&c[0]>=40.3&&c[0]<=46.3&&c[1]>=43.4&&c[1]<=46.5;}
function matchesPlace(f,q){
 if(!inRegion(f))return false;
 var label=lower(address(f)),city=q.match(/(?:^|[,\s])(?:город|г\.?|пос[её]лок|село|станица)\s+([а-яё-]+)/iu);
 if(city&&!label.includes(lower(city[1])))return false;
 var words=streetWords(q);
 return words.length>0&&words.every(function(w){return label.split(' ').includes(w);});
}
async function searchStreet(query,token){
 var base=withoutHouse(query);if(!base||base===query)return {features:[]};
 var jobs=[json('https://zerkalo-address-api.vercel.app/api/geocode?q='+encodeURIComponent(base)+'&market=stav&kind=street',{credentials:'omit'},6000)];
 if(window.MirrorPhoton)jobs.push(window.MirrorPhoton.search(base));
 try{return await Promise.any(jobs.map(function(job){return job.then(function(data){
  var features=(data.features||[]).filter(function(f){return matchesPlace(f,query)&&(!houseOf(address(f))||f.approx);}).map(function(f){return Object.assign({},f,{approx:true});});
  if(!features.length)throw Error('No street match');
  return {features:features.slice(0,8)};
 });}));}catch(e){return {features:[]};}
}
function showMatches(matches,token){
 status.textContent=matches.some(function(f){return f.approx;})?'Точный дом не найден. Выберите улицу для ориентировочной стоимости или точку на карте:':'Выберите адрес:';
 matches.forEach(function(f){var item=document.createElement('button');item.type='button';item.className='delivery-candidate'+(f.approx?' delivery-candidate--approx':'');item.textContent=address(f);if(f.approx){var note=document.createElement('small');note.textContent='Расчёт до улицы, не до конкретного дома';item.appendChild(note);}item.onclick=function(){if(token!==revision)return;busy=true;button.disabled=true;choose(f,token);};results.appendChild(item);});
}
async function choose(f,token){
 var destination=f.geometry.coordinates;results.replaceChildren();status.textContent='Считаем доставку…';
 try{
  var path=point.join(',')+';'+destination.join(',');
  var routeKey='mirror.road.v2.'+path,cached;
  try{cached=JSON.parse(localStorage.getItem(routeKey));}catch(e){}
  var data=cached&&Date.now()-cached.at<86400000&&cached.data?cached.data:await json('https://router.project-osrm.org/route/v1/driving/'+path+'?overview=simplified&geometries=geojson&alternatives=false&steps=false');
  if(token!==revision)return;
  if(data.code!=='Ok'||!data.routes||!data.routes.length||!Number.isFinite(data.routes[0].distance))throw Error('No route');
  var metres=data.routes[0].distance;
  if(metres<0||metres>900000)throw Error('Out of area');
  try{localStorage.setItem(routeKey,JSON.stringify({at:Date.now(),data:data}));}catch(e){}
  route={origin:origin,address:f.requestedAddress||address(f),km:Math.round(metres/100)/10,point:destination,approx:Boolean(f.approx),geometry:data.routes[0].geometry||null};input.value=route.address;
  updatePrice();
  emit();
 }catch(e){if(token===revision){route=null;status.textContent='Не удалось построить маршрут. Проверьте адрес и повторите. Укажите адрес для уточнения стоимости.';emit();}}
 finally{if(token===revision){busy=false;button.disabled=false;}}
}
button.addEventListener('click',async function(){
 if(busy)return;var query=normalizedAddress(input.value.trim());if(query.length<5){status.textContent='Укажите город, улицу и номер дома.';return;}
 if(Date.now()-lastSearch<1100)return;lastSearch=Date.now();busy=true;button.disabled=true;var token=++revision;route=null;results.replaceChildren();status.textContent='Ищем адрес…';emit();
 try{
  var data;
  try{data=await searchAddress(query,'stav',token);}catch(primaryError){data={features:[]};}
  if(token!==revision)return;
  var wanted=houseOf(query),seen={};
  var matches=(data.features||[]).filter(function(f){
   var label=address(f),number=houseOf(label);
   if(!matchesPlace(f,query)||!label||seen[label]|| (wanted&&number!==wanted))return false;
   seen[label]=true;return true;
  });
  if(!matches.length&&wanted){
   status.textContent='Точный дом не найден, ищем улицу…';
   var approx=await searchStreet(query,token);
   if(token!==revision)return;
   matches=approx.features||[];
   matches.forEach(function(f){f.requestedAddress=query;});
  }
  if(!matches.length){status.textContent='Адрес не определён. Проверьте написание или укажите точку на карте для расчёта маршрута.';return;}
  showMatches(matches,token);
 }catch(e){if(token===revision)status.textContent='Не удалось связаться с поиском адресов. Повторите поиск. Код: '+(e.code||(e.name==='AbortError'?'TIMEOUT':'NETWORK'))+'.';}
 finally{if(token===revision){busy=false;button.disabled=false;}}
});
})();
