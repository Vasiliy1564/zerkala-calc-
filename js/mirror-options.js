/* Customer choices: decorative pattern, edge, facet and optional sandblasting. */
(function(root){
'use strict';
var patterns=['КЛАССИКА (лабиринт)','КОЛОТЫЙ ЛЕД','ФУДЖИ','ТУРКУЗАН','ЛИТЕУС','РОУЗ','КОКО','БАРОККО','АЛЛАДИН','СИТЕЦ','ВИНТАЖ','ТЕАРА','ОМУТ','ЮТА','ФЕНИКС','ФЬЮЗИ'];
function selected(name,fallback){var el=document.querySelector('input[name="'+name+'"]:checked');return el?el.value:fallback;}
function read(){return {decor:document.getElementById('mirror-decor').value,machine:'auto',facet:selected('mirror-facet','0'),sand:selected('mirror-sand','none'),sandArea:document.getElementById('mirror-sand-area').value,sandComplexity:document.getElementById('mirror-sand-complexity').value,sandPaint:document.getElementById('mirror-sand-paint').value,sandSketch:document.getElementById('mirror-sand-sketch').value==='1'};}
function restore(o){
 o=o||{};document.getElementById('mirror-decor').value=o.decor||patterns[0];
 ['facet','sand'].forEach(function(k){var v=String(o[k]||(k==='facet'?'0':'none'));document.querySelectorAll('input[name="mirror-'+k+'"]').forEach(function(el){el.checked=el.value===v;});});
 document.getElementById('mirror-sand-area').value=o.sandArea||'';document.getElementById('mirror-sand-complexity').value=o.sandComplexity||'1';document.getElementById('mirror-sand-paint').value=String(o.sandPaint||'0');document.getElementById('mirror-sand-sketch').value=o.sandSketch?'1':'0';visible();
}
function facetCost(o,q){var rate=({0:0,10:180,15:200,20:220})[o.facet||0];if(rate===undefined)throw Error('Выберите фацет');return q.billedMetres*rate*(q.shapeRate?1.5:1);}
// RIAL price list 14.10.2026, "Пескоструйная обработка": matte 900 (whole surface),
// pattern 1900, painting 1900 per colour, sketch 1000; pattern complexity +50/+100 %; minimum 500.
function sandCost(o,q){
 if(!o.sand||o.sand==='none')return 0;
 if(o.sand==='matte')return Math.max(500,q.area*900);
 if(o.sand!=='pattern')throw Error('Выберите пескоструйную обработку');
 var area=Number(String(o.sandArea||'').replace(',','.')),complexity=Number(o.sandComplexity||1),paint=Number(o.sandPaint||0);
 if(!Number.isFinite(area)||area<=0)throw Error('Укажите площадь пескоструйного рисунка в м²');
 if(area>q.area+1e-8)throw Error('Площадь рисунка не может быть больше площади зеркала');
 if([1,1.5,2].indexOf(complexity)<0)throw Error('Выберите сложность рисунка');
 if([0,1,2,3].indexOf(paint)<0)throw Error('Выберите покраску рисунка');
 return Math.max(500,area*1900*complexity+area*1900*paint)+(o.sandSketch?1000:0);
}
function sandLabel(o){
 if(!o.sand||o.sand==='none')return '';
 if(o.sand==='matte')return 'Пескоструйная матировка всей поверхности';
 var c=Number(o.sandComplexity),p=Number(o.sandPaint||0);
 return 'Пескоструйный рисунок · '+String(o.sandArea).replace('.',',')+' м²'+(c>1?' · '+(c===1.5?'сложный':'особо сложный')+' рисунок':'')+(p?' · покраска в '+p+(p===1?' цвет':' цвета'):'')+(o.sandSketch?' · отрисовка эскиза':'');
}
function edgeLabel(label,o,q){return label+(Number(o.facet)?'; фацет '+(o.facet==='10'?'5–10':o.facet)+' мм':'');}
function visible(){
 var m=document.querySelector('input[name="material"]:checked');document.getElementById('mirror-decor-field').hidden=!m||m.value!=='decorative';
 var sand=selected('mirror-sand','none');document.getElementById('mirror-sand-details').hidden=sand!=='pattern';var hint=document.getElementById('mirror-sand-hint');hint.hidden=sand==='none';hint.textContent=sandHints[sand]||'';
}
var sandHints={matte:'Вся поверхность становится матовой, отражения не остаётся.',pattern:'Матовый рисунок на зеркале: полосы, рамка, надпись, логотип или орнамент. Остальная поверхность остаётся зеркальной.'};
var api={read:read,restore:restore,facetCost:facetCost,sandCost:sandCost,sandLabel:sandLabel,edgeLabel:edgeLabel};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorCalcOptions=api;
if(!root.document)return;
function choices(name,items){return '<div class="options options--grid">'+items.map(function(item,i){return '<label><input type="radio" name="'+name+'" value="'+item[0]+'"'+(i===0?' checked':'')+'><span>'+item[1]+'</span></label>';}).join('')+'</div>';}
var decor=document.createElement('div');decor.className='field';decor.id='mirror-decor-field';decor.hidden=true;decor.innerHTML='<label for="mirror-decor">Рисунок декоративного зеркала</label><select class="mirror-option-select" id="mirror-decor">'+patterns.map(function(p){return '<option>'+p+'</option>';}).join('')+'</select>';
document.querySelector('input[name="material"]').closest('.field').after(decor);
var edge=document.querySelector('input[name="edge"]').closest('.field');
var facet=document.createElement('fieldset');facet.className='field mirror-choice-field';facet.id='mirror-facet-field';facet.innerHTML='<legend>Выберите фацет</legend><p class="form-hint">Фацет — декоративный скошенный край зеркала. Можно выбрать зеркало без фацета.</p>'+choices('mirror-facet',[['0','Без фацета'],['10','Фацет 5–10 мм'],['15','Фацет 15 мм'],['20','Фацет 20 мм']]);edge.after(facet);
var sand=document.createElement('fieldset');sand.className='field mirror-choice-field';sand.id='mirror-sand-field';sand.innerHTML='<legend>Пескоструйная обработка</legend>'+choices('mirror-sand',[['none','Без пескоструя'],['matte','Матировка всей поверхности'],['pattern','Пескоструйный рисунок']])+'<p class="form-hint" id="mirror-sand-hint" hidden></p><div id="mirror-sand-details" hidden><label for="mirror-sand-area">Площадь рисунка, м²</label><input class="mirror-option-select" id="mirror-sand-area" type="text" inputmode="decimal" placeholder="Например, 0,3"><div id="mirror-sand-complexity-field"><label for="mirror-sand-complexity">Сложность рисунка</label><select class="mirror-option-select" id="mirror-sand-complexity"><option value="1">Обычный рисунок</option><option value="1.5">Сложный рисунок</option><option value="2">Особо сложный рисунок</option></select><p class="form-hint">Обычный подходит для полос, рамок, надписей и логотипов. Сложный и особо сложный нужны для рисунков с мелкими деталями. Категорию подтвердим по эскизу.</p></div><label for="mirror-sand-paint">Покраска рисунка</label><select class="mirror-option-select" id="mirror-sand-paint"><option value="0">Без покраски, матовый рисунок</option><option value="1">В один цвет: золото, белый или чёрный</option><option value="2">В два цвета</option><option value="3">В три цвета</option></select><label for="mirror-sand-sketch">Эскиз рисунка</label><select class="mirror-option-select" id="mirror-sand-sketch"><option value="0">Есть готовый макет в векторе</option><option value="1">Нужна отрисовка эскиза</option></select><p class="form-hint">Отрисовка нужна, если готового макета нет. Расположение рисунка согласуем при заказе.</p></div>';facet.after(sand);
[decor,facet,sand].forEach(function(el){function update(){visible();if(root.calculateMirrorInPlace)root.calculateMirrorInPlace();}el.addEventListener('change',update);if(el===sand)el.addEventListener('input',function(e){if(e.target.id==='mirror-sand-area')update();});});
document.querySelectorAll('input[name="material"]').forEach(function(el){el.addEventListener('change',visible);});visible();
})(typeof window==='object'?window:globalThis);
