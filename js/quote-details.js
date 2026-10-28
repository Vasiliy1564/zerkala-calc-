/* Presentation and quote copying only. All amounts come from the site's pricing engine. */
(function(){
'use strict';
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';}
function exact(n){return Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽';}
function refresh(data){return window.MirrorOrderPricing.refreshServices?window.MirrorOrderPricing.refreshServices(data):data;}
function entries(items,t){
 var running=0,shown=0;
 return items.map(function(item,i){
  var data=refresh(item.data),base=data.total,installation=0;
  data.rows.forEach(function(row){if(row.key==='purchase-trip'||row.key==='customer-delivery')base-=row.sale;if(row.key==='installation')installation+=row.sale;});
  var before=base*item.qty,discount=installation*item.qty*t.discountRate/100,subtotal=before-discount;
  running+=subtotal+(t.trip+t.delivery)*item.qty/t.count;var display=Math.round(running)-shown;
  if(i===items.length-1)display=t.total-shown;
  shown+=display;
  return {item:item,data:data,before:before,installation:installation*item.qty,discount:discount,subtotal:subtotal,display:display};
 });
}
function params(item){
 var m=item.data.mirror,lines=[m.name+' — '+item.qty+' шт.','Размеры: '+m.size+'.','Полотно: '+m.materialLabel+'.','Кромка: '+m.edgeLabel+'.','Подсветка: '+(m.light?'да':'нет')+'.'];
 if(m.light)lines.push('Цвет света: '+({warm:'тёплый',neutral:'нейтральный',cold:'холодный'}[m.clr]||m.clr)+'.','Управление: '+({wave:'взмах рукой',touch:'сенсор',remote:'пульт',smart:'Wi-Fi'}[m.ctrl]||m.ctrl)+'.');
 lines.push('Установка: '+(m.install?'да':'нет')+'.','Бронеплёнка: '+(m.film?'да':'нет')+'.','Подогрев: '+(m.heat?'да':'нет')+'.');
 if(m.aluFrame)lines.push('Каркас из алюминиевого уголка: да.');
 if(m.ledProfile)lines.push('LED-лента в алюминиевом профиле: да.');
 if(m.faceFrame&&m.faceFrame!=='none')lines.push('Лицевая рама: '+({black:'чёрная',white:'белая',gold:'золотая'}[m.faceFrame]||m.faceFrame)+'.');
 return lines;
}
function itemText(entry,index){var lines=params(entry.item);if(index!==undefined)lines[0]=(index+1)+'. '+lines[0];lines.push('Стоимость позиции: '+money(entry.display)+'.');return lines.join('\n');}
function quote(items,t,title){
 if(!items.length||t.mixedRegions||t.needsQuote)return '';
 var list=entries(items,t),lines=[title||'Расчёт заказа зеркал','Количество: '+t.count+' шт.',''];
 list.forEach(function(entry,i){lines.push(itemText(entry,i),'');});
 if(t.externalDelivery)lines.push('Доставка по адресу согласуется отдельно и не включена в итог.');
 if(!items.some(function(item){return item.data.mirror.install||item.data.mirror.delivery;}))lines.push('Доставка клиенту не выбрана.');
 lines.push('','Итоговая стоимость: '+money(t.total)+'.');
 if(items.some(function(item){return item.data.mirror.estimate;}))lines.push('Стоимость фигурного контура уточняется после согласования.');

 return lines.join('\n');
}
window.MirrorOrderView={entries:entries,quote:quote,itemText:itemText,money:money};
})();
