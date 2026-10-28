(function(){
'use strict';
var items=[],current=null,key='zerkalo-spb-public-order-v1';
function quantityOptions(value){var html='';if(Number(value)>10)html='<option value="'+Number(value)+'" selected disabled>'+Number(value)+' шт. (сохранено)</option>';for(var i=1;i<=10;i++)html+='<option value="'+i+'"'+(i===Number(value)?' selected':'')+'>'+i+' шт.</option>';return html;}
var money=function(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';};
var safe=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var box=document.createElement('section');box.id='mirror-order';box.className='mirror-order';
box.innerHTML='<h3>Несколько зеркал в одном заказе</h3><p>Выберите форму, размеры и опции выше, затем добавьте зеркало в заказ. Для одинаковых зеркал укажите количество.</p><label for="order-quantity">Количество выбранного зеркала</label><select id="order-quantity" aria-label="Количество зеркал от 1 до 10">'+quantityOptions(1)+'</select><button type="button" class="button" id="order-add">Добавить зеркало в заказ</button><p id="order-status" role="status"></p><div id="order-items"></div><div id="order-controls" hidden><button type="button" class="button" id="order-calculate">Рассчитать весь заказ</button><div id="order-summary" aria-live="polite"></div><button type="button" class="button button--light" id="order-send">Заказать в MAX</button><button type="button" class="order-clear" id="order-clear">Очистить заказ</button></div>';
document.getElementById('quote-form').after(box);
var $=function(id){return document.getElementById(id);};
var form=$('quote-form'),field=document.createElement('label');field.id='quantity-field';field.className='field';field.htmlFor='order-quantity';
var oldLabel=box.querySelector('label[for="order-quantity"]');oldLabel.remove();field.appendChild(document.createTextNode('Количество зеркал'));field.appendChild($('order-quantity'));
form.insertBefore(field,form.querySelector('button[type="submit"]'));
var addRow=document.createElement('div');addRow.className='order-add-row';addRow.appendChild($('order-add'));form.querySelector('button[type="submit"]').after(addRow);
var view=document.createElement('button');view.type='button';view.id='order-view';view.className='button button--light';view.hidden=true;addRow.appendChild(view);view.onclick=function(){box.scrollIntoView({behavior:'smooth',block:'start'});};
var countLabel=document.createElement('div');countLabel.id='r-quantity';countLabel.className='calc-result-size';$('r-size').after(countLabel);
function quantity(){var q=Number($('order-quantity').value);return Number.isInteger(q)&&q>=1&&q<=10?q:null;}
window.updateSelectedMirrorTotal=function(){
 var qty=quantity();if(!qty){$('r-sum').textContent='—';$('r-quantity').textContent='';return;}if(!current)return;
 var total=window.MirrorOrderPricing.calculate([{qty:qty,data:current}],{}).total;
 $('r-sum').textContent=money(total);$('r-quantity').textContent='Количество: '+qty+' шт.';
 var m=current.mirror,lines=['Здравствуйте! Хочу заказать '+m.name.toLowerCase()+(m.light?' с подсветкой':'')+'.','Размеры: '+m.size+'.','Количество: '+qty+' шт.','Полотно: '+m.materialLabel+'.','Кромка: '+m.edgeLabel+'.'];
 if(m.light)lines.push('Цвет света: '+({warm:'тёплый',neutral:'нейтральный',cold:'холодный'}[m.clr]||m.clr)+'.','Управление: '+({wave:'взмах рукой',touch:'сенсор',remote:'пульт',smart:'Wi-Fi'}[m.ctrl]||m.ctrl)+'.');if(m.ledProfile)lines.push('Светодиодная лента в алюминиевом профиле: да.');
 if(m.install)lines.push('Установка: включена.');if(m.film)lines.push('Бронеплёнка: да.');if(m.heat)lines.push('Подогрев: да.');if(m.faceFrame!=='none')lines.push('Рама: '+({black:'чёрная',white:'белая',gold:'золотая'}[m.faceFrame]||m.faceFrame)+'.');
 lines.push('Доставка: '+((m.delivery||m.install)?m.region==='murino'?'включена в итоговую стоимость':'по согласованию, не включена в итоговую стоимость':'не включена в расчёт')+'.','',(m.estimate?'Ориентировочная стоимость: ':'Итоговая стоимость: ')+money(total)+'.');
 if(m.estimate)lines.push('Точная стоимость после согласования контура.');
 var base=$('r-cta').href.split('?')[0];$('r-cta').href=base+'?text='+encodeURIComponent(lines.join('\n'));
};
$('order-quantity').addEventListener('change',function(){window.calculateMirrorInPlace();});

function calculate(){return window.MirrorOrderPricing.calculate(items,{});}
function save(){try{localStorage.setItem(key,JSON.stringify(items));}catch(e){$('order-status').textContent='Заказ рассчитан, но не сохранён на устройстве.';}}
function render(){
 box.hidden=!items.length;view.hidden=!items.length;view.textContent='Корзина ('+items.reduce(function(n,item){return n+item.qty;},0)+')';
 $('order-controls').hidden=!items.length;
 $('order-items').innerHTML=items.map(function(item,i){var m=item.data.mirror;return '<article class="order-item"><strong>'+safe(m.name)+'</strong><p>'+safe(m.size)+' · '+safe(m.materialLabel)+'<br>'+safe(m.light?'С подсветкой':'Без подсветки')+' · '+safe(m.edgeLabel)+(m.install?' · С установкой':'')+'</p><label>Количество<select aria-label="Количество зеркал" data-quantity="'+i+'">'+quantityOptions(item.qty)+'</select></label><button type="button" data-remove="'+i+'">Удалить</button></article>';}).join('');
 if(items.length){var t=calculate();$('order-send').disabled=t.mixedRegions||t.needsQuote;
 var note=t.needsQuote?'Стоимость сложной формы нужно согласовать с производителем.':t.mixedRegions?'Для одного заказа укажите одинаковый регион доставки у всех зеркал.':t.externalDelivery?'Доставка по адресу согласуется отдельно и не включена в итоговую стоимость.':'';
 $('order-summary').innerHTML='<p>'+safe(note)+'</p><p>Зеркал в заказе: '+t.count+'</p>'+'<p>Итоговая стоимость заказа<strong id="order-total">'+(t.needsQuote?'Уточните цену сложной формы':t.mixedRegions?'Уточните регион доставки':money(t.total))+'</strong></p>'+(items.some(function(item){return item.data.mirror.estimate;})?'<p>Стоимость фигурного контура уточняется после согласования.</p>':'');
 }else $('order-summary').innerHTML='';save();
}
window.onPersonalCalculation=function(data){current=data&&data.mirror?JSON.parse(JSON.stringify(data)):null;};
$('order-add').onclick=function(){var qty=Number($('order-quantity').value);if(!Number.isInteger(qty)||qty<1||qty>10){$('order-status').textContent='Укажите целое количество от 1 до 10.';return;}current=null;window.calculateMirrorInPlace();if(!current){$('order-status').textContent='Укажите допустимые размеры и рассчитайте зеркало.';return;}items.push({qty:qty,data:current});$('order-status').textContent='Зеркало добавлено. Можно выбрать другую форму и добавить следующее.';render();};
$('order-items').addEventListener('click',function(e){var button=e.target.closest('[data-remove]');if(button){items.splice(Number(button.dataset.remove),1);render();}});
$('order-items').addEventListener('change',function(e){if(!e.target.matches('[data-quantity]'))return;var i=Number(e.target.dataset.quantity),n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=10){items[i].qty=n;render();}else e.target.value=items[i].qty;});
$('order-calculate').onclick=function(){render();$('order-summary').scrollIntoView({behavior:'smooth',block:'center'});};
$('order-clear').onclick=function(){if(window.confirm('Очистить все зеркала в заказе?')){items=[];render();$('order-status').textContent='Заказ очищен.';}};
window.getMirrorOrderText=function(){var t=calculate();if(t.mixedRegions||t.needsQuote||!items.length)return;var lines=['Здравствуйте! Хочу заказать зеркала: '+t.count+' шт.',''];items.forEach(function(item,i){var m=item.data.mirror;lines.push((i+1)+'. '+m.name+' — '+item.qty+' шт.','Размеры: '+m.size+'.','Полотно: '+m.materialLabel+'.','Кромка: '+m.edgeLabel+'.','Подсветка: '+(m.light?'да':'нет')+'.');if(m.light){lines.push('Цвет света: '+({warm:'тёплый',neutral:'нейтральный',cold:'холодный'}[m.clr]||m.clr)+'.','Управление: '+({wave:'взмах',touch:'сенсор',remote:'пульт',smart:'Wi-Fi'}[m.ctrl]||m.ctrl)+'.');}if(m.install)lines.push('Установка: включена.');if(m.film)lines.push('Бронеплёнка: да.');if(m.heat)lines.push('Подогрев: да.');if(m.ledProfile)lines.push('Светодиодная лента в алюминиевом профиле: да.');if(m.faceFrame!=='none')lines.push('Рама: '+({black:'чёрная',white:'белая',gold:'золотая'}[m.faceFrame]||m.faceFrame)+'.');lines.push('');});lines.push('Доставка: '+(t.externalDelivery?'по согласованию, не включена в итоговую стоимость':items.some(function(item){return item.data.mirror.delivery||item.data.mirror.install;})?'включена':'не выбрана')+'.','', 'Итоговая стоимость заказа: '+money(t.total)+'.');if(items.some(function(item){return item.data.mirror.estimate;}))lines.push('Стоимость фигурного контура уточняется после согласования.');return lines.join('\n');};
$('order-send').onclick=function(){var text=window.getMirrorOrderText();if(text)window.open('https://max.ru/u/f9LHodD0cOJCsHfbfog1RuUGjeMCEw_wI5D3w-uzWYe4wj6KqPXR9YOSHA8?text='+encodeURIComponent(text),'_blank','noopener');};
try{var saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))items=saved.filter(function(item){return item&&Number.isInteger(item.qty)&&item.qty>0&&item.qty<=999&&item.data&&item.data.mirror&&Array.isArray(item.data.rows)&&Number.isFinite(item.data.total);});}catch(e){items=[];}render();
})();

