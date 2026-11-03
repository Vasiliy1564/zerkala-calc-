(function(){
'use strict';
var items=[],current=null,editing=-1,key='zerkalo-spb-public-order-v1';
function quantityOptions(value){var html='';if(Number(value)>10)html='<option value="'+Number(value)+'" selected disabled>'+Number(value)+' шт. (сохранено)</option>';for(var i=1;i<=10;i++)html+='<option value="'+i+'"'+(i===Number(value)?' selected':'')+'>'+i+' шт.</option>';return html;}
var money=function(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';};
var safe=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var box=document.createElement('section');box.id='mirror-order';box.className='mirror-order';
box.innerHTML='<h3>Ваш заказ</h3><p class="order-intro">В итоговой стоимости учтены выбранные опции, услуги и скидка на установку.</p><label for="order-quantity">Количество выбранного зеркала</label><select id="order-quantity" aria-label="Количество зеркал от 1 до 10">'+quantityOptions(1)+'</select><button type="button" class="button" id="order-add">Добавить зеркало в заказ</button><p id="order-status" role="status"></p><div id="order-items"></div><div id="order-controls" hidden><button type="button" class="button" id="order-calculate">Рассчитать весь заказ</button><div id="order-summary" aria-live="polite"></div><button type="button" class="button button--light" id="order-send">Заказать в MAX</button><button type="button" class="order-clear" id="order-clear">Очистить заказ</button></div>';
document.getElementById('quote-form').after(box);
var $=function(id){return document.getElementById(id);};
var form=$('quote-form'),field=document.createElement('label');field.id='quantity-field';field.className='field';field.htmlFor='order-quantity';
var oldLabel=box.querySelector('label[for="order-quantity"]');oldLabel.remove();field.appendChild(document.createTextNode('Количество зеркал'));field.appendChild($('order-quantity'));
form.insertBefore(field,form.querySelector('button[type="submit"]'));
var addRow=document.createElement('div');addRow.className='order-add-row';addRow.appendChild($('order-add'));form.querySelector('button[type="submit"]').after(addRow);
var cancel=document.createElement('button');cancel.type='button';cancel.id='order-cancel';cancel.className='button button--light';cancel.textContent='Отменить изменение';cancel.hidden=true;addRow.appendChild(cancel);
var view=document.createElement('button');view.type='button';view.id='order-view';view.className='button button--light';view.hidden=true;addRow.appendChild(view);view.onclick=function(){box.scrollIntoView({behavior:'smooth',block:'start'});};
var countLabel=document.createElement('div');countLabel.id='r-quantity';countLabel.className='calc-result-size';$('r-size').after(countLabel);
var selectedPrices=document.createElement('div');selectedPrices.id='r-price-breakdown';selectedPrices.className='calc-included';selectedPrices.hidden=true;$('r-sum').after(selectedPrices);
function quantity(){var q=Number($('order-quantity').value);return Number.isInteger(q)&&q>=1&&q<=10?q:null;}
window.updateSelectedMirrorTotal=function(){
 var qty=quantity();if(!qty){$('r-sum').textContent='—';$('r-quantity').textContent='';selectedPrices.hidden=true;return;}if(!current){selectedPrices.hidden=true;return;}
 var totals=window.MirrorOrderPricing.calculate([{qty:qty,data:current}],{}),total=totals.total;
 $('r-sum').textContent=money(total);$('r-quantity').textContent='Количество: '+qty+' шт.';
 document.querySelector('.calc-result-label').textContent=current.mirror.estimate?'Ориентировочная стоимость':totals.deliveryPending?'Предварительная стоимость':'Итоговая стоимость';
 selectedPrices.innerHTML=window.MirrorOrderView.priceRows(totals);selectedPrices.hidden=false;if(totals.carryPending)document.querySelector('.calc-result-label').textContent='Итого без несогласованного подъёма';
 var m=current.mirror,lines=['Здравствуйте! Хочу заказать '+m.name.toLowerCase()+(m.light?' с подсветкой':'')+'.','Размеры: '+window.MirrorSize.dimensions(m.size)+'.','Количество: '+qty+' шт.','Полотно: '+m.materialLabel+'.','Кромка: '+m.edgeLabel+'.'];
 if(m.light)lines.push('Цвет света: '+({warm:'тёплый',neutral:'нейтральный',cold:'холодный'}[m.clr]||m.clr)+'.','Управление: '+({wave:'взмах рукой',touch:'сенсор',remote:'пульт',smart:'Wi-Fi'}[m.ctrl]||m.ctrl)+'.');if(m.ledProfile)lines.push('Светодиодная лента в профиле: да.');
 var prices=window.MirrorOrderView.breakdown(totals);
 lines.push('Стоимость '+(qty===1?'зеркала':'зеркал')+': '+money(prices.mirror)+'.','Установка'+(totals.discount?' (со скидкой '+totals.discountRate+'%)':'')+': '+(m.install?money(prices.installation):'не выбрана')+'.');if(prices.delivery)lines.push((totals.deliveryBase?'Доплата за доставку: ':'Доставка: ')+money(prices.delivery)+'.');if(m.film)lines.push('Бронеплёнка: да.');if(m.heat)lines.push('Подогрев: да.');if(m.faceFrame!=='none')lines.push('Рама: '+({black:'чёрная',white:'белая',gold:'золотая'}[m.faceFrame]||m.faceFrame)+'.');
 if(totals.carryRequested)lines.push('Подъём до квартиры ('+m.carry.floor+'-й этаж, '+(m.carry.method==='lift'?'на лифте':'пешком')+'): '+(totals.carryPending?'по согласованию, не включён':money(prices.carry))+'.');
 lines.push(window.MirrorOrderView.deliveryText(totals),'',(totals.carryPending?'Итого без несогласованного подъёма: ':m.estimate?'Ориентировочная стоимость: ':'Итоговая стоимость: ')+money(total)+'.');
 if(m.estimate)lines.push('Точная стоимость после согласования контура.');
 var base=$('r-cta').href.split('?')[0];$('r-cta').href=base+'?text='+encodeURIComponent(lines.join('\n'));
};
$('order-quantity').addEventListener('change',function(){window.calculateMirrorInPlace();});

window.addEventListener('mirror-delivery-change',function(){window.calculateMirrorInPlace();render();});
function calculate(){return window.MirrorOrderPricing.calculate(items,{});}
function save(){try{localStorage.setItem(key,JSON.stringify(items));}catch(e){$('order-status').textContent='Заказ рассчитан, но не сохранён на устройстве.';}}
function render(){
 items=items.map(function(item){return Object.assign({},item,{data:window.MirrorOrderPricing.refreshServices(item.data)});});
 box.hidden=!items.length;view.hidden=!items.length;view.textContent='Корзина ('+items.reduce(function(n,item){return n+item.qty;},0)+')';
 $('order-controls').hidden=!items.length;$('order-calculate').hidden=true;
 var totals=calculate(),entries=window.MirrorOrderView.entries(items,totals);
 $('order-items').innerHTML=entries.map(function(entry,i){var item=entry.item,m=item.data.mirror,needsQuote=m.shape==='curved'&&m.supplierCategory==='quoted'&&!(Number(m.supplierCost)>0);return '<article class="order-item"><div class="order-item-heading"><strong>'+safe(m.name)+'</strong><strong class="order-item-price">'+safe(needsQuote?'По запросу':money(entry.display))+'</strong></div><p>'+safe(window.MirrorSize.dimensions(m.size))+' · '+safe(m.materialLabel)+'<br>'+safe(m.light?'С подсветкой':'Без подсветки')+' · '+safe(m.edgeLabel)+(m.install?' · С установкой':'')+(m.carry&&m.carry.enabled?' · Подъём: '+safe(m.carry.floor)+'-й этаж':'')+'</p><div class="order-item-toolbar"><label><span class="order-sr-only">Количество</span><select aria-label="Количество: '+safe(m.name)+'" data-quantity="'+i+'">'+quantityOptions(item.qty)+'</select></label><div class="order-item-actions"><button type="button" data-edit="'+i+'">Изменить</button><button type="button" data-remove="'+i+'">Удалить</button></div></div></article>';}).join('');
 if(items.length){var t=calculate();$('order-send').disabled=t.mixedRegions||t.needsQuote;
 var note=t.carryPending?'Подъём требует согласования и не включён полностью в итог.':t.needsQuote?'Стоимость сложной формы нужно согласовать с производителем.':t.mixedRegions?'Для одного заказа укажите одинаковый регион доставки у всех зеркал.':t.deliveryPending?'Укажите адрес доставки для уточнения итоговой стоимости.':'';
 $('order-summary').innerHTML=(note?'<p class="account-note">'+safe(note)+'</p>':'')+(!t.needsQuote&&!t.mixedRegions?'<div class="calc-included">'+window.MirrorOrderView.priceRows(t)+'</div>':'')+'<div class="order-final"><span>'+(t.carryPending?'Итого без несогласованного подъёма · ':'Итого · ')+t.count+' шт.</span><strong id="order-total" role="button" tabindex="0" data-copy-order title="Скопировать подробный расчёт заказа" aria-label="Скопировать подробный расчёт заказа">'+(t.needsQuote?'Уточните цену сложной формы':t.mixedRegions?'Уточните регион доставки':money(t.total))+'</strong></div>'+(items.some(function(item){return item.data.mirror.estimate;})?'<p class="account-note">Стоимость фигурного контура уточняется после согласования.</p>':'');
 var copyButton=$('copy-order');if(copyButton)copyButton.disabled=!!(t.mixedRegions||t.needsQuote);

 }else $('order-summary').innerHTML='';save();
}
window.onPersonalCalculation=function(data){current=data&&data.mirror?JSON.parse(JSON.stringify(data)):null;if(!current){selectedPrices.hidden=true;selectedPrices.innerHTML='';}};
window.getMirrorSelectionText=function(){var qty=quantity();if(!current||!qty)return '';var selected=[{qty:qty,data:current}];return window.MirrorOrderView.quote(selected,window.MirrorOrderPricing.calculate(selected,{}),'Расчёт выбранного зеркала');};
function resetEdit(){editing=-1;$('order-add').textContent='Добавить в корзину';cancel.hidden=true;}
function edit(index){
 var item=items[index],m=item.data.mirror;if(window.MirrorCarry)window.MirrorCarry.restore(m.carry);
 function radio(name,value){var el=form.querySelector('input[name="'+name+'"][value="'+value+'"]');if(el){el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}}
 radio('shape',m.shape);radio('material',m.material);radio('light',m.light?'on':'off');radio('facet',m.edge);radio('edge',m.edge&&m.edge.indexOf('grind')!==-1?'grind':'polish');radio('clr',m.clr);radio('ctrl',m.ctrl);radio('face-frame',m.faceFrame);
 ['width','height','height2'].forEach(function(id){var el=$(id);if(el)window.MirrorSize.write(el,m[id]||0);});
 [['install',m.install],['delivery',m.delivery],['film',m.film],['heat',m.heat],['alu-frame',m.aluFrame],['led-profile',m.ledProfile]].forEach(function(pair){var el=form.querySelector('input[name="option"][value="'+pair[0]+'"]');if(el)el.checked=!!pair[1];});
 if($('delivery-region'))$('delivery-region').value=m.region;
 if($('supplier-category'))$('supplier-category').value=m.supplierCategory==='quoted'?'quoted':'rial';if($('supplier-cost'))$('supplier-cost').value=m.supplierCost||'';
 window.MirrorCalcOptions.restore(m.mirrorOptions);
 $('height').dispatchEvent(new Event('input',{bubbles:true}));
 $('order-quantity').innerHTML=quantityOptions(item.qty);$('order-quantity').value=item.qty;window.calculateMirrorInPlace();
 editing=index;$('order-add').textContent='Сохранить изменения';cancel.hidden=false;form.scrollIntoView({behavior:'smooth',block:'start'});
}
$('order-add').onclick=function(){var qty=Number($('order-quantity').value);if(!Number.isInteger(qty)||qty<1||qty>10){$('order-status').textContent='Укажите целое количество от 1 до 10.';return;}current=null;window.calculateMirrorInPlace();if(!current){$('order-status').textContent='Укажите допустимые размеры и рассчитайте зеркало.';return;}var item={qty:qty,data:current};if(editing>=0)items[editing]=item;else items.push(item);$('order-status').textContent=editing>=0?'Позиция обновлена.':'Зеркало добавлено.';resetEdit();render();};
cancel.onclick=function(){resetEdit();$('order-status').textContent='Изменение отменено.';};
$('order-items').addEventListener('click',function(e){
 var remove=e.target.closest('[data-remove]'),editButton=e.target.closest('[data-edit]');
 if(remove){items.splice(Number(remove.dataset.remove),1);resetEdit();render();}
 if(editButton)edit(Number(editButton.dataset.edit));
});
$('order-items').addEventListener('change',function(e){if(!e.target.matches('[data-quantity]'))return;var i=Number(e.target.dataset.quantity),n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=10){items[i].qty=n;resetEdit();render();}else e.target.value=items[i].qty;});
$('order-calculate').onclick=function(){render();$('order-summary').scrollIntoView({behavior:'smooth',block:'center'});};
$('order-clear').onclick=function(){if(window.confirm('Очистить все зеркала в заказе?')){items=[];resetEdit();render();$('order-status').textContent='Заказ очищен.';}};
window.getMirrorOrderText=function(){return window.MirrorOrderView.quote(items,calculate(),'Заказ зеркал');};
$('order-send').onclick=function(){var text=window.getMirrorOrderText();if(text)window.open('https://max.ru/u/f9LHodD0cOJCsHfbfog1RuUGjeMCEw_wI5D3w-uzWYe4wj6KqPXR9YOSHA8?text='+encodeURIComponent(text),'_blank','noopener');};
try{var saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))items=saved.filter(function(item){return item&&Number.isInteger(item.qty)&&item.qty>0&&item.qty<=999&&item.data&&item.data.mirror&&Array.isArray(item.data.rows)&&Number.isFinite(item.data.total);});}catch(e){items=[];}resetEdit();render();
})();



