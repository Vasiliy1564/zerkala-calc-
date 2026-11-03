/* Presentation and quote copying only. All amounts come from the site's pricing engine. */
(function(){
'use strict';
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';}
function exact(n){return Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽';}
function refresh(data){return window.MirrorOrderPricing.refreshServices?window.MirrorOrderPricing.refreshServices(data):data;}
function breakdown(t){
 var installation=Math.round(t.installationAfterDiscount),delivery=Math.round(t.delivery);
 return {mirror:t.total-installation-delivery,installation:installation,delivery:delivery,total:t.total};
}
function priceRows(t){
 var p=breakdown(t);
 return '<div class="row"><span>Стоимость '+(t.count===1?'зеркала':'зеркал')+'</span><i class="dash"></i><span>'+money(p.mirror)+'</span></div>'+
  '<div class="row"><span>Установка'+(t.discount?' (со скидкой '+t.discountRate+'%)':'')+'</span><i class="dash"></i><span>'+(t.installedCount?money(p.installation):'не выбрана')+'</span></div>'+
  (p.delivery?'<div class="row"><span>Доставка</span><i class="dash"></i><span>'+money(p.delivery)+'</span></div>':'');
}
function entries(items,t){
 var running=0,shown=0,installRunning=0,installShown=0,deliveryRunning=0,deliveryShown=0;
 return items.map(function(item,i){
  var data=refresh(item.data),base=data.total,installation=0;
  data.rows.forEach(function(row){if(row.key==='purchase-trip'||row.key==='customer-delivery')base-=row.sale;if(row.key==='installation')installation+=row.sale;});
  var before=base*item.qty,discount=installation*item.qty*t.discountRate/100,subtotal=before-discount;
  running+=subtotal+(t.trip+t.delivery)*item.qty/t.count;var display=Math.round(running)-shown;
  if(i===items.length-1)display=t.total-shown;
  shown+=display;
  installRunning+=installation*item.qty-discount;deliveryRunning+=t.delivery*item.qty/t.count;
  var installPrice=Math.round(installRunning)-installShown,deliveryPrice=Math.round(deliveryRunning)-deliveryShown;
  installShown+=installPrice;deliveryShown+=deliveryPrice;
  return {item:item,data:data,before:before,installation:installation*item.qty,discount:discount,subtotal:subtotal,display:display,mirrorPrice:display-installPrice-deliveryPrice,installationPrice:installPrice,deliveryPrice:deliveryPrice};
 });
}
function params(item){
 var m=item.data.mirror,lines=[m.name+' — '+item.qty+' шт.','Размеры: '+window.MirrorSize.dimensions(m.size)+'.','Полотно: '+m.materialLabel+'.','Кромка: '+m.edgeLabel+'.','Подсветка: '+(m.light?'да':'нет')+'.'];
 if(m.mirrorOptions&&window.MirrorCalcOptions.sandLabel(m.mirrorOptions))lines.push('Пескоструйная обработка: '+window.MirrorCalcOptions.sandLabel(m.mirrorOptions)+'.');
 if(m.light)lines.push('Цвет света: '+({warm:'тёплый',neutral:'нейтральный',cold:'холодный'}[m.clr]||m.clr)+'.','Управление: '+({wave:'взмах рукой',touch:'сенсор',remote:'пульт',smart:'Wi-Fi'}[m.ctrl]||m.ctrl)+'.');
 lines.push('Бронеплёнка: '+(m.film?'да':'нет')+'.','Подогрев: '+(m.heat?'да':'нет')+'.');
 if(m.aluFrame)lines.push('Каркас из алюминиевого уголка: да.');
 if(m.ledProfile)lines.push('Светодиодная лента в профиле: да.');
 if(m.faceFrame&&m.faceFrame!=='none')lines.push('Лицевая рама: '+({black:'чёрная',white:'белая',gold:'золотая'}[m.faceFrame]||m.faceFrame)+'.');
 return lines;
}
function itemText(entry,index){var lines=params(entry.item);if(index!==undefined)lines[0]=(index+1)+'. '+lines[0];lines.push('Стоимость '+(entry.item.qty===1?'зеркала':'зеркал')+': '+money(entry.mirrorPrice)+'.','Установка: '+(entry.item.data.mirror.install?money(entry.installationPrice):'не выбрана')+'.');if(entry.deliveryPrice)lines.push('Доставка: '+money(entry.deliveryPrice)+'.');lines.push('Итого по позиции: '+money(entry.display)+'.');return lines.join('\n');}
function quote(items,t,title){
 if(!items.length||t.mixedRegions||t.needsQuote)return '';
 var list=entries(items,t),lines=[title||'Расчёт заказа зеркал','Количество: '+t.count+' шт.',''];
 list.forEach(function(entry,i){lines.push(itemText(entry,i),'');});
 if(t.externalDelivery)lines.push('Доставка по адресу согласуется отдельно и не включена в итог.');
 if(!items.some(function(item){return item.data.mirror.install||item.data.mirror.delivery;}))lines.push('Доставка не включена.');
 var p=breakdown(t);
 if(items.length>1)lines.push('','Стоимость зеркал: '+money(p.mirror)+'.','Установка'+(t.discount?' (со скидкой '+t.discountRate+'%)':'')+': '+(t.installedCount?money(p.installation):'не выбрана')+'.');
 if(items.length>1&&p.delivery)lines.push('Доставка: '+money(p.delivery)+'.');
 lines.push('','Итоговая стоимость: '+money(p.total)+'.');
 if(items.some(function(item){return item.data.mirror.estimate;}))lines.push('Стоимость фигурного контура уточняется после согласования.');

 return lines.join('\n');
}
window.MirrorOrderView={entries:entries,quote:quote,itemText:itemText,money:money,breakdown:breakdown,priceRows:priceRows};
})();


