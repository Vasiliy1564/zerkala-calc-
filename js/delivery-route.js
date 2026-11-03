/* One customer address and one road route for the whole order. */
(function(){
'use strict';
var origin='Мурино, улица Шувалова, 16/9',point=[30.4290869,60.0565448],route=null,revision=0,busy=false,lastSearch=0;
var form=document.getElementById('quote-form'),option=document.querySelector('input[name="option"][value="delivery"]');
var panel=document.createElement('div');panel.id='delivery-address-panel';panel.className='delivery-address-panel';
panel.innerHTML='<p>Откуда: <strong>'+origin+'</strong></p><label for="delivery-address">Адрес клиента</label><input id="delivery-address" type="text" autocomplete="street-address" placeholder="Город, улица, дом"><button type="button" class="button" id="delivery-search">Найти адрес</button><div id="delivery-candidates"></div><p id="delivery-route-status" role="status" aria-live="polite">Укажите адрес и выберите найденный дом.</p><small>Стоимость за весь заказ: до 180 см — 30 ₽/км; свыше 180 до 200 см — 45 ₽/км; свыше 200 см — 55 ₽/км. Размер — по большей стороне. Расчёт по дорогам в одну сторону, без учёта пробок; платные дороги и подъём согласуются отдельно.</small><small>Адрес отправляется в Photon для поиска. Маршрут — OSRM. Данные © OpenStreetMap.</small>';
document.getElementById('deliveryOpt').after(panel);
var input=document.getElementById('delivery-address'),status=document.getElementById('delivery-route-status'),results=document.getElementById('delivery-candidates'),button=document.getElementById('delivery-search');
function emit(){window.dispatchEvent(new Event('mirror-delivery-change'));}
function visibility(){panel.hidden=!option.checked;}
window.MirrorDelivery={getRoute:function(){return route;},updateVisibility:visibility};
visibility();option.addEventListener('change',visibility);
function reset(){revision++;route=null;busy=false;button.disabled=false;results.replaceChildren();status.textContent='Адрес изменён. Найдите и выберите дом; доставка пока не включена.';emit();}
input.addEventListener('input',reset);
input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();button.click();}});
async function json(url){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},18000);try{var response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return await response.json();}finally{clearTimeout(timer);}}
function address(f){var p=f.properties;return [p.city||p.town||p.locality,p.street,p.housenumber].filter(Boolean).join(', ');}
async function choose(f,token){
 var destination=f.geometry.coordinates;results.replaceChildren();status.textContent='Считаем путь по дорогам…';
 try{
  var path=point.join(',')+';'+destination.join(',');
  var data=await json('https://router.project-osrm.org/route/v1/driving/'+path+'?overview=false&alternatives=false&steps=false');
  if(token!==revision)return;
  if(data.code!=='Ok'||!data.routes||!data.routes.length||!Number.isFinite(data.routes[0].distance))throw Error('No route');
  var metres=data.routes[0].distance;
  if(metres<0||metres>500000)throw Error('Out of area');
  route={origin:origin,address:address(f),km:Math.round(metres/100)/10};input.value=route.address;
  status.textContent=origin+' → '+route.address+' · '+route.km.toLocaleString('ru-RU')+' км по дорогам. Стоимость добавлена в расчёт.';
  emit();
 }catch(e){if(token===revision){route=null;status.textContent='Не удалось построить маршрут. Проверьте адрес и повторите. Доставка не включена в итог.';emit();}}
 finally{if(token===revision){busy=false;button.disabled=false;}}
}
button.addEventListener('click',async function(){
 if(busy)return;var query=input.value.trim();if(query.length<5){status.textContent='Укажите город, улицу и номер дома.';return;}
 if(Date.now()-lastSearch<1100)return;lastSearch=Date.now();busy=true;button.disabled=true;var token=++revision;route=null;results.replaceChildren();status.textContent='Ищем адрес…';emit();
 try{
  if(!/петербург|мурино|бугры|девяткино|всеволож|парголово|кудрово|ленинград/i.test(query))query='Санкт-Петербург, '+query;
  var data=await json('https://photon.komoot.io/api/?q='+encodeURIComponent(query)+'&limit=6&lat='+point[1]+'&lon='+point[0]+'&bbox=29,59,32,61');
  if(token!==revision)return;
  var seen={};var matches=(data.features||[]).filter(function(f){var p=f.properties||{},c=f.geometry&&f.geometry.coordinates,key=address(f);if(!c||!p.housenumber||!p.street||c[0]<29||c[0]>32||c[1]<59||c[1]>61||seen[key])return false;seen[key]=true;return true;});
  if(!matches.length){status.textContent='Дом не найден. Уточните город, улицу и номер дома. Доставка не включена.';return;}
  status.textContent='Выберите нужный дом — маршрут и цена рассчитаются автоматически.';
  matches.forEach(function(f){var item=document.createElement('button');item.type='button';item.className='delivery-candidate';item.textContent=address(f);item.onclick=function(){if(token!==revision)return;busy=true;button.disabled=true;choose(f,token);};results.appendChild(item);});
 }catch(e){if(token===revision)status.textContent='Поиск адреса недоступен. Повторите позже. Доставка не включена в итог.';}
 finally{if(token===revision){busy=false;button.disabled=false;}}
});
})();
