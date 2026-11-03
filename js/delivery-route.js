/* One customer address and one road route for the whole order. */
(function(){
'use strict';
var origin='Мурино, улица Шувалова, 16/9',point=[30.4290869,60.0565448],route=null,revision=0,busy=false,lastSearch=0;
var form=document.getElementById('quote-form'),option=document.querySelector('input[name="option"][value="delivery"]');
var panel=document.createElement('div');panel.id='delivery-address-panel';panel.className='delivery-address-panel';
panel.innerHTML='<label for="delivery-address">Укажите адрес доставки</label><input id="delivery-address" type="text" autocomplete="street-address" placeholder="Город, улица, дом"><button type="button" class="button" id="delivery-search">Рассчитать доставку</button><div id="delivery-candidates"></div><p id="delivery-route-status" role="status" aria-live="polite"></p><small class="delivery-attribution">© OpenStreetMap</small>';
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
function updatePrice(){if(route)status.textContent='Доставка: '+describe();}
function emit(){updatePrice();window.dispatchEvent(new Event('mirror-delivery-change'));}
function visibility(){panel.hidden=!option.checked;}
window.MirrorDelivery={describe:describe,getRoute:function(){return route;},updateVisibility:function(){visibility();updatePrice();}};
visibility();option.addEventListener('change',visibility);
function reset(){revision++;route=null;busy=false;button.disabled=false;results.replaceChildren();status.textContent='';emit();}
input.addEventListener('input',reset);
input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();button.click();}});
async function json(url){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},18000);try{var response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return await response.json();}finally{clearTimeout(timer);}}
function address(f){var p=f.properties;return [p.city||p.town||p.locality,p.street,p.housenumber].filter(Boolean).join(', ');}
// Address and entrance verified in 2GIS on 03.11.2026.
// Keep exact house matches available even when the external geocoder is unavailable.
function confirmedAddress(query){
 var q=String(query).toLowerCase().replace(/ё/g,'е').replace(/[.,]/g,' ').replace(/пр-т|пр-кт/g,'проспект').replace(/\s+/g,' ').trim();
 if(!/^(?:мурино )?(?:(?:проспект|пр) )?ручьевский(?: (?:проспект|пр))? 8$/.test(q))return [];
 return [{properties:{city:'Мурино',street:'Ручьёвский проспект',housenumber:'8'},geometry:{coordinates:[30.438703,60.066601]},source:'2gis',sourceUrl:'https://2gis.ru/spb/geo/70030076545819045'}];
}
function showMatches(matches,token){
 status.textContent='Выберите адрес:';
 matches.forEach(function(f){var item=document.createElement('button');item.type='button';item.className='delivery-candidate';item.textContent=address(f);item.onclick=function(){if(token!==revision)return;busy=true;button.disabled=true;choose(f,token);};results.appendChild(item);});
}
async function choose(f,token){
 var destination=f.geometry.coordinates;results.replaceChildren();status.textContent='Считаем доставку…';
 try{
  var attribution=panel.querySelector('.delivery-attribution');
  attribution.replaceChildren(document.createTextNode('© OpenStreetMap'));
  if(f.source==='2gis'){var sourceLink=document.createElement('a');sourceLink.href=f.sourceUrl;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.textContent=' · Адрес: 2ГИС';attribution.appendChild(sourceLink);}
  var path=point.join(',')+';'+destination.join(',');
  var data=await json('https://router.project-osrm.org/route/v1/driving/'+path+'?overview=false&alternatives=false&steps=false');
  if(token!==revision)return;
  if(data.code!=='Ok'||!data.routes||!data.routes.length||!Number.isFinite(data.routes[0].distance))throw Error('No route');
  var metres=data.routes[0].distance;
  if(metres<0||metres>500000)throw Error('Out of area');
  route={origin:origin,address:address(f),km:Math.round(metres/100)/10};input.value=route.address;
  updatePrice();
  emit();
 }catch(e){if(token===revision){route=null;status.textContent='Не удалось построить маршрут. Проверьте адрес и повторите. Укажите адрес для уточнения стоимости.';emit();}}
 finally{if(token===revision){busy=false;button.disabled=false;}}
}
button.addEventListener('click',async function(){
 if(busy)return;var query=input.value.trim();if(query.length<5){status.textContent='Укажите город, улицу и номер дома.';return;}
 if(Date.now()-lastSearch<1100)return;lastSearch=Date.now();busy=true;button.disabled=true;var token=++revision;route=null;results.replaceChildren();status.textContent='Ищем адрес…';emit();
 try{
  var known=confirmedAddress(query);
  if(known.length){showMatches(known,token);return;}
  // Bias by coordinates and regional bounds; never replace an omitted city with Saint Petersburg.
  var data=await json('https://photon.komoot.io/api/?q='+encodeURIComponent(query)+'&limit=6&lat='+point[1]+'&lon='+point[0]+'&bbox=29,59,32,61');
  if(token!==revision)return;
  var seen={};var matches=(data.features||[]).filter(function(f){var p=f.properties||{},c=f.geometry&&f.geometry.coordinates,key=address(f);if(!c||!p.housenumber||!p.street||c[0]<29||c[0]>32||c[1]<59||c[1]>61||seen[key])return false;seen[key]=true;return true;});
  if(!matches.length){status.textContent='Дом не найден. Уточните город, улицу и номер дома. Укажите адрес для уточнения стоимости.';return;}
  showMatches(matches,token);
 }catch(e){if(token===revision)status.textContent='Поиск адреса недоступен. Повторите позже. Укажите адрес для уточнения стоимости.';}
 finally{if(token===revision){busy=false;button.disabled=false;}}
});
})();
