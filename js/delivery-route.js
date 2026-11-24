/* One customer address and one road route for the whole order. */
(function(){
'use strict';
var origin='ГК Рубеж, Ставрополь, улица 45-я Параллель, 44',point=[41.9110926,45.0011119],route=null,revision=0,busy=false,lastSearch=0;
var form=document.getElementById('quote-form'),option=document.querySelector('input[name="option"][value="delivery"]');
var panel=document.createElement('div');panel.id='delivery-address-panel';panel.className='delivery-address-panel';
panel.innerHTML='<label for="delivery-address">Укажите адрес доставки</label><input id="delivery-address" type="text" autocomplete="street-address" placeholder="Город, село, посёлок, улица, дом"><button type="button" class="button" id="delivery-search">Рассчитать доставку</button><div id="delivery-candidates"></div><p id="delivery-route-status" role="status" aria-live="polite"></p><div id="delivery-map-slot"></div><small class="delivery-attribution">© 2ГИС · © OpenStreetMap</small>';
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
function updatePrice(){if(route)status.textContent='Ориентировочная доставка: '+describe()+' ('+String(route.km).replace('.',',')+' км)'+(route.approx?' — до выбранной улицы или населённого пункта; точный адрес уточним':'');}
function emit(){updatePrice();window.dispatchEvent(new Event('mirror-delivery-change'));}
function warmAddresses(){/* Bundled offline address data covers St Petersburg, not Stavropol. */}
function visibility(){panel.hidden=!option.checked;if(option.checked)warmAddresses();}
window.MirrorDelivery={describe:describe,getRoute:function(){return route;},updateVisibility:function(){visibility();updatePrice();},origin:{label:origin,point:point},withinArea:inRegion,searchNearby:searchNearby,
 // Lets the map and address suggestions set the destination directly.
 choose:function(f){if(!f||!f.geometry)return;var token=++revision;route=null;results.replaceChildren();input.value=address(f);busy=true;button.disabled=true;emit();choose(f,token);}};
visibility();option.addEventListener('change',visibility);
function reset(){revision++;route=null;busy=false;button.disabled=false;results.replaceChildren();status.textContent='';emit();}
input.addEventListener('focus',warmAddresses);
input.addEventListener('input',reset);
input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();button.click();}});
async function json(url,options,timeout){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},timeout||22000);try{var response=await fetch(url,Object.assign({},options,{signal:controller.signal}));if(!response.ok){var error=Error('HTTP '+response.status);error.code='HTTP_'+response.status;throw error;}return await response.json();}finally{clearTimeout(timer);}}
function address(f){var p=f.properties;if(p.label)return p.label;return [p.city||p.town||p.locality,p.street,p.housenumber].filter(Boolean).join(', ');}
// Search for exact buildings first; only offer a labelled street estimate when the building is missing.
function normalizedAddress(q){return q.replace(/стругатского|стругадского/gi,'Стругацкого').trim();}
function houseOf(q){var m=q.match(/(?:^|[,\s])(?:д(?:ом)?\.?\s*)?(\d+[а-яa-z]?(?:\s*[\/-]\s*\d+[а-яa-z]?)*)\s*$/iu);return m?m[1].toLowerCase().replace(/\s+/g,''):'';}
function withoutHouse(q){return q.replace(/[,\s]+(?:д(?:ом)?\.?\s*)?\d+[а-яa-z]?(?:\s*[\/-]\s*\d+[а-яa-z]?)*\s*$/iu,'').trim();}
function lower(q){return q.toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]+/g,' ').trim();}
var DELIVERY_LIMIT_KM=50;
function inRegion(f){
 var c=f&&f.geometry&&f.geometry.coordinates;
 if(!c||!Number.isFinite(c[0])||!Number.isFinite(c[1]))return false;
 var rad=Math.PI/180,dlat=(c[1]-point[1])*rad,dlon=(c[0]-point[0])*rad;
 var a=Math.sin(dlat/2)**2+Math.cos(point[1]*rad)*Math.cos(c[1]*rad)*Math.sin(dlon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,a)))<=DELIVERY_LIMIT_KM+0.5;
}
function words(q){
 return lower(q).split(/\s+/).filter(function(w){return w&&!/^(с|г|п|пос|поселок|село|город|станица|ст|хутор|х|деревня|дер|ул|улица|пр|проспект|пер|переулок|проезд|шоссе|край|ставропольский|район|округ|р-н)$/.test(w);});
}
function matchesPlace(f,q){
 if(!inRegion(f))return false;
 var label=words(address(f)),wanted=words(withoutHouse(q));
 return wanted.length>0&&wanted.every(function(w){return label.includes(w);});
}
function photonFeature(f){
 var p=f.properties||{},c=f.geometry&&f.geometry.coordinates;
 var loc=p.village||p.hamlet||p.town||p.city||p.locality||p.district;
 var isPlace=p.osm_key==='place'||/^(city|town|village|hamlet|suburb|locality|isolated_dwelling|neighbourhood|quarter)$/.test(p.type||'');
 var parts=p.housenumber?[loc,p.street||p.name,p.housenumber]:isPlace?[p.name,p.county||p.state]:[loc,p.street||p.name];
 var label=parts.filter(function(x,i){return x&&parts.indexOf(x)===i;}).join(', ');
 if(!label||!c)return null;
 return {properties:{label:label,housenumber:p.housenumber},geometry:{coordinates:c},approx:!p.housenumber,source:'photon',settlement:isPlace&&!p.housenumber};
}
async function searchNearby(query){
 var url='https://photon.komoot.io/api/?q='+encodeURIComponent(query)+'&lang=ru&limit=20&lat='+point[1]+'&lon='+point[0]+'&bbox=41.24,44.54,42.59,45.46';
 var data=await json(url,{credentials:'omit'},8000),seen={};
 var features=(data.features||[]).map(photonFeature).filter(function(f){if(!inRegion(f)||seen[address(f)])return false;seen[address(f)]=true;return true;});
 return {features:features,source:'photon'};
}
function selectMatches(data,query,kind){
 var wanted=kind==='street'?'':houseOf(query),seen={};
 var features=(data.features||[]).filter(function(f){
  var label=address(f),number=houseOf(label);
  if(!label||!matchesPlace(f,query)||seen[label])return false;
  if(wanted&&(f.approx||number!==wanted))return false;
  if(!wanted&&number&&!f.approx)return false;
  seen[label]=true;return true;
 }).map(function(f){return wanted?f:Object.assign({},f,{approx:true});});
 features.sort(function(a,b){return Number(!!b.settlement)-Number(!!a.settlement);});
 return {features:features.slice(0,8)};
}
async function searchAddress(query,market,token,kind){
 var key='mirror.stav.area50.v1.'+(kind||'auto')+'.'+query.toLowerCase().replace(/ё/g,'е').trim(),saved;
 try{saved=JSON.parse(localStorage.getItem(key));if(saved&&Date.now()-saved.at<86400000&&saved.data.features.length)return saved.data;}catch(e){}
 var wanted=kind==='street'?'':houseOf(query);
 var url='https://zerkalo-address-api.vercel.app/api/geocode?q='+encodeURIComponent(query)+'&market=stav'+(!wanted?'&kind=street':'');
 function valid(data){var result=selectMatches(data,query,kind);if(!result.features.length)throw Error('No matching address');return result;}
 var photon=searchNearby(query).then(valid);
 var remote=json(url,{credentials:'omit'},6000).then(valid);
 // A settlement or street is preferred over a random building; for houses, either verified source can win.
 var result;
 if(!wanted){remote.catch(function(){});try{result=await photon;}catch(e){try{result=await remote;}catch(e){result={features:[]};}}}
 else{try{result=await Promise.any([remote,photon]);}catch(e){result={features:[]};}}
 if(result.features.length){try{localStorage.setItem(key,JSON.stringify({at:Date.now(),data:result}));}catch(e){}}
 return result;
}
async function searchStreet(query,token){
 var base=withoutHouse(query);if(!base||base===query)return {features:[]};
 return searchAddress(base,'stav',token,'street');
}
function showMatches(matches,token){
 status.textContent=matches.some(function(f){return f.approx;})?'Выберите улицу или населённый пункт для ориентировочной стоимости:':'Выберите адрес:';
 matches.forEach(function(f){var item=document.createElement('button');item.type='button';item.className='delivery-candidate'+(f.approx?' delivery-candidate--approx':'');item.textContent=address(f);if(f.approx){var note=document.createElement('small');note.textContent='Расчёт до улицы или центра населённого пункта';item.appendChild(note);}item.onclick=function(){if(token!==revision)return;busy=true;button.disabled=true;choose(f,token);};results.appendChild(item);});
}
async function choose(f,token){
 var destination=f.geometry.coordinates;results.replaceChildren();status.textContent='Считаем доставку…';
 try{
  if(!inRegion(f)){var outside=Error('Out of area');outside.code='OUT_OF_AREA';throw outside;}
  var path=point.join(',')+';'+destination.join(',');
  var routeKey='mirror.road.v2.'+path,cached;
  try{cached=JSON.parse(localStorage.getItem(routeKey));}catch(e){}
  var data=cached&&Date.now()-cached.at<86400000&&cached.data?cached.data:await json('https://router.project-osrm.org/route/v1/driving/'+path+'?overview=simplified&geometries=geojson&alternatives=false&steps=false');
  if(token!==revision)return;
  if(data.code!=='Ok'||!data.routes||!data.routes.length||!Number.isFinite(data.routes[0].distance))throw Error('No route');
  var metres=data.routes[0].distance;
  if(metres<0)throw Error('Invalid route');
  if(metres>DELIVERY_LIMIT_KM*1000){var outside=Error('Out of area');outside.code='OUT_OF_AREA';throw outside;}
  try{localStorage.setItem(routeKey,JSON.stringify({at:Date.now(),data:data}));}catch(e){}
  route={origin:origin,address:f.requestedAddress||address(f),km:Math.round(metres/100)/10,point:destination,approx:Boolean(f.approx),geometry:data.routes[0].geometry||null};input.value=route.address;
  updatePrice();
  emit();
 }catch(e){if(token===revision){route=null;status.textContent=e.code==='OUT_OF_AREA'?'Адрес за пределами зоны автоматической доставки (50 км по дороге). Согласуйте стоимость с мастером.':'Не удалось построить маршрут. Проверьте адрес и повторите. Укажите адрес для уточнения стоимости.';emit();}}
 finally{if(token===revision){busy=false;button.disabled=false;}}
}
button.addEventListener('click',async function(){
 if(busy)return;var query=normalizedAddress(input.value.trim());if(query.length<3){status.textContent='Укажите населённый пункт или полный адрес.';return;}
 if(Date.now()-lastSearch<1100)return;lastSearch=Date.now();busy=true;button.disabled=true;var token=++revision;route=null;results.replaceChildren();status.textContent='Ищем адрес…';emit();
 try{
  var data;
  try{data=await searchAddress(query,'stav',token);}catch(primaryError){data={features:[]};}
  if(token!==revision)return;
  var wanted=houseOf(query),matches=data.features||[];
  if(!matches.length&&wanted){
   status.textContent='Точный дом не найден, ищем улицу…';
   var approx=await searchStreet(query,token);
   if(token!==revision)return;
   matches=approx.features||[];
   matches.forEach(function(f){f.requestedAddress=query;});
  }
  if(!matches.length){status.textContent='Адрес не найден в зоне 50 км. Укажите населённый пункт, улицу и дом или согласуйте доставку с мастером.';return;}
  showMatches(matches,token);
 }catch(e){if(token===revision)status.textContent='Не удалось связаться с поиском адресов. Повторите поиск. Код: '+(e.code||(e.name==='AbortError'?'TIMEOUT':'NETWORK'))+'.';}
 finally{if(token===revision){busy=false;button.disabled=false;}}
});
})();
