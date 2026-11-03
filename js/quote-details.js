/* Presentation and quote copying only. All amounts come from the site's pricing engine. */
(function(){
'use strict';
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';}
function exact(n){return Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽';}
function refresh(data){return window.MirrorOrderPricing.refreshServices?window.MirrorOrderPricing.refreshServices(data):data;}
function breakdown(t){
 var installation=Math.round(t.installationAfterDiscount),delivery=Math.round(t.delivery),carry=Math.round(t.carry||0);
 return {mirror:t.total-installation-delivery-carry,carry:carry,installation:installation,delivery:delivery,total:t.total};
}
function safe(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function deliveryText(t){return !t.deliveryRequested?'Доставка не включена.':t.deliveryPending?'Доставка: укажите адрес, не включена в итог.':'Адрес доставки: '+t.deliveryAddress+'. Доставка: '+money(t.delivery)+'.';}
function priceRows(t){
 var p=breakdown(t);
 return '<div class="row"><span>Стоимость '+(t.count===1?'зеркала':'зеркал')+'</span><i class="dash"></i><span>'+money(p.mirror)+'</span></div>'+
  '<div class="row"><span>Установка'+(t.discount?' (со скидкой '+t.discountRate+'%)':'')+'</span><i class="dash"></i><span>'+(t.installedCount?money(p.installation):'не выбрана')+'</span></div>'+
  (t.carryRequested?'<div class="row"><span>Подъём до квартиры</span><i class="dash"></i><span>'+(t.carryPending?(p.carry?money(p.carry)+' + по согласованию':'по согласованию — не включён'):money(p.carry))+'</span></div>':'')+
  (t.deliveryRequested?'<div class="row"><span>Доставка</span><i class="dash"></i><span>'+(t.deliveryPending?'не включена — укажите адрес':money(p.delivery))+'</span></div>':'');
}
function entries(items,t){
 var running=0,shown=0,installRunning=0,installShown=0,deliveryRunning=0,deliveryShown=0;
 return items.map(function(item,i){
  var data=refresh(item.data),base=data.total,installation=0,carryPrice=0;
  data.rows.forEach(function(row){if(row.key==='purchase-trip'||row.key==='customer-delivery')base-=row.sale;if(row.key==='installation')installation+=row.sale;if(row.key==='carry')carryPrice+=row.sale*item.qty;});
  var before=base*item.qty,discount=installation*item.qty*t.discountRate/100,subtotal=before-discount;
  running+=subtotal+(t.trip+t.delivery)*item.qty/t.count;var display=Math.round(running)-shown;
  if(i===items.length-1)display=t.total-shown;
  shown+=display;
  installRunning+=installation*item.qty-discount;deliveryRunning+=t.delivery*item.qty/t.count;
  var installPrice=Math.round(installRunning)-installShown,deliveryPrice=Math.round(deliveryRunning)-deliveryShown;
  installShown+=installPrice;deliveryShown+=deliveryPrice;
  return {item:item,data:data,before:before,installation:installation*item.qty,discount:discount,subtotal:subtotal,display:display,carryPrice:carryPrice,mirrorPrice:display-installPrice-deliveryPrice-carryPrice,installationPrice:installPrice,deliveryPrice:deliveryPrice};
 });
}
function params(item){
 var m=item.data.mirror,lines=[m.name+' — '+item.qty+' шт.','Размеры: '+window.MirrorSize.dimensions(m.size)+'.','Полотно: '+m.materialLabel+'.','Кромка: '+m.edgeLabel+'.','Подсветка: '+(m.light?'да':'нет')+'.'];
 if(m.mirrorOptions&&window.MirrorCalcOptions&&window.MirrorCalcOptions.sandLabel(m.mirrorOptions))lines.push('Пескоструйная обработка: '+window.MirrorCalcOptions.sandLabel(m.mirrorOptions)+'.');
 if(m.light)lines.push('Цвет света: '+({warm:'тёплый',neutral:'нейтральный',cold:'холодный'}[m.clr]||m.clr)+'.','Управление: '+({wave:'взмах рукой',touch:'сенсор',remote:'пульт',smart:'Wi-Fi'}[m.ctrl]||m.ctrl)+'.');
 lines.push('Бронеплёнка: '+(m.film?'да':'нет')+'.','Подогрев: '+(m.heat?'да':'нет')+'.');
 if(m.carry&&m.carry.enabled)lines.push('Подъём: '+m.carry.floor+'-й этаж, '+(m.carry.method==='lift'?'на лифте (зеркало помещается)':'пешком')+'.');
 if(m.aluFrame)lines.push('Каркас из алюминиевого уголка: да.');
 if(m.ledProfile)lines.push('Светодиодная лента в профиле: да.');
 if(m.faceFrame&&m.faceFrame!=='none')lines.push('Лицевая рама: '+({black:'чёрная',white:'белая',gold:'золотая'}[m.faceFrame]||m.faceFrame)+'.');
 return lines;
}
function itemText(entry,index){var lines=params(entry.item);if(index!==undefined)lines[0]=(index+1)+'. '+lines[0];lines.push('Стоимость '+(entry.item.qty===1?'зеркала':'зеркал')+': '+money(entry.mirrorPrice)+'.','Установка: '+(entry.item.data.mirror.install?money(entry.installationPrice):'не выбрана')+'.');if(entry.item.data.mirror.carry&&entry.item.data.mirror.carry.enabled)lines.push('Подъём: '+(window.MirrorOrderPricing.carryPrice(window.MirrorOrderPricing.maxSide(entry.item.data.mirror),entry.item.data.mirror.carry).pending?'по согласованию, не включён':money(entry.carryPrice))+'.');if(entry.deliveryPrice)lines.push('Доставка: '+money(entry.deliveryPrice)+'.');lines.push('Итого по позиции: '+money(entry.display)+'.');return lines.join('\n');}
function quote(items,t,title){
 if(!items.length||t.mixedRegions||t.needsQuote)return '';
 var list=entries(items,t),lines=[title||'Расчёт заказа зеркал','Количество: '+t.count+' шт.',''];
 list.forEach(function(entry,i){lines.push(itemText(entry,i),'');});
 lines.push(deliveryText(t));
 
 var p=breakdown(t);
 if(items.length>1)lines.push('','Стоимость зеркал: '+money(p.mirror)+'.','Установка'+(t.discount?' (со скидкой '+t.discountRate+'%)':'')+': '+(t.installedCount?money(p.installation):'не выбрана')+'.');
 if(items.length>1&&p.delivery)lines.push('Доставка: '+money(p.delivery)+'.');
 if(items.length>1&&t.carryRequested)lines.push('Подъём до квартиры: '+money(p.carry)+'.');
 if(t.carryPending)lines.push('Подъём требует согласования; его несогласованная стоимость не включена.');
 lines.push('',(t.carryPending?'Итого без несогласованного подъёма: ':'Итоговая стоимость: ')+money(p.total)+'.');
 if(items.some(function(item){return item.data.mirror.estimate;}))lines.push('Стоимость фигурного контура уточняется после согласования.');

 return lines.join('\n');
}
window.MirrorOrderView={entries:entries,quote:quote,itemText:itemText,money:money,deliveryText:deliveryText,breakdown:breakdown,priceRows:priceRows};
})();


