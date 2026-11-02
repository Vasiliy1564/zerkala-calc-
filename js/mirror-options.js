/* Customer choices: decorative pattern, edge, facet and optional sandblasting. */
(function(root){
'use strict';
var patterns=['КЛАССИКА (лабиринт)','КОЛОТЫЙ ЛЕД','ФУДЖИ','ТУРКУЗАН','ЛИТЕУС','РОУЗ','КОКО','БАРОККО','АЛЛАДИН','СИТЕЦ','ВИНТАЖ','ТЕАРА','ОМУТ','ЮТА','ФЕНИКС','ФЬЮЗИ'];
function selected(name,fallback){var el=document.querySelector('input[name="'+name+'"]:checked');return el?el.value:fallback;}
function read(){return {decor:document.getElementById('mirror-decor').value,machine:document.getElementById('mirror-edge-method').value,facet:selected('mirror-facet','0'),sand:selected('mirror-sand','none'),sandArea:document.getElementById('mirror-sand-area').value,sandComplexity:document.getElementById('mirror-sand-complexity').value};}
function restore(o){
 o=o||{};document.getElementById('mirror-decor').value=o.decor||patterns[0];document.getElementById('mirror-edge-method').value=o.machine||'auto';
 ['facet','sand'].forEach(function(k){var v=String(o[k]||(k==='facet'?'0':'none'));document.querySelectorAll('input[name="mirror-'+k+'"]').forEach(function(el){el.checked=el.value===v;});});
 document.getElementById('mirror-sand-area').value=o.sandArea||'';document.getElementById('mirror-sand-complexity').value=o.sandComplexity||'1';visible();
}
function facetCost(o,q){var rate=({0:0,10:180,15:200,20:220})[o.facet||0];if(rate===undefined)throw Error('Выберите фацет');return q.billedMetres*rate*(q.shapeRate?1.5:1);}
function sandCost(o,q){
 if(!o.sand||o.sand==='none')return 0;
 var rate=({matte:900,pattern:1900})[o.sand],area=Number(String(o.sandArea||'').replace(',','.')),complexity=o.sand==='pattern'?Number(o.sandComplexity||1):1;
 if(!rate)throw Error('Выберите пескоструйную обработку');
 if(!Number.isFinite(area)||area<=0)throw Error('Укажите площадь пескоструйной обработки в м²');
 if(area>q.area+1e-8)throw Error('Площадь обработки не может быть больше площади зеркала');
 if([1,1.5,2].indexOf(complexity)<0)throw Error('Выберите сложность рисунка');
 return Math.max(500,area*rate*complexity);
}
function sandLabel(o){if(!o.sand||o.sand==='none')return '';return (o.sand==='matte'?'Сплошная матировка':'Пескоструйный рисунок')+' · '+String(o.sandArea).replace('.',',')+' м²'+(o.sand==='pattern'&&Number(o.sandComplexity)>1?' · '+(Number(o.sandComplexity)===1.5?'сложный':'особо сложный')+' рисунок':'');}
function edgeLabel(label,o,q){return label+(q.edgeRate>=270?' (ЧПУ)':'')+(Number(o.facet)?'; фацет '+(o.facet==='10'?'5–10':o.facet)+' мм':'');}
function visible(){
 var m=document.querySelector('input[name="material"]:checked');document.getElementById('mirror-decor-field').hidden=!m||m.value!=='decorative';
 var sand=selected('mirror-sand','none');document.getElementById('mirror-sand-details').hidden=sand==='none';document.getElementById('mirror-sand-complexity-field').hidden=sand!=='pattern';
}
var api={read:read,restore:restore,facetCost:facetCost,sandCost:sandCost,sandLabel:sandLabel,edgeLabel:edgeLabel};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorCalcOptions=api;
if(!root.document)return;
function choices(name,items){return '<div class="options options--grid">'+items.map(function(item,i){return '<label><input type="radio" name="'+name+'" value="'+item[0]+'"'+(i===0?' checked':'')+'><span>'+item[1]+'</span></label>';}).join('')+'</div>';}
var decor=document.createElement('div');decor.className='field';decor.id='mirror-decor-field';decor.hidden=true;decor.innerHTML='<label for="mirror-decor">Рисунок декоративного зеркала</label><select class="mirror-option-select" id="mirror-decor">'+patterns.map(function(p){return '<option>'+p+'</option>';}).join('')+'</select>';
document.querySelector('input[name="material"]').closest('.field').after(decor);
var edge=document.querySelector('input[name="edge"]').closest('.field');
var method=document.createElement('div');method.className='mirror-edge-method';method.innerHTML='<label for="mirror-edge-method">Способ обработки</label><select class="mirror-option-select" id="mirror-edge-method"><option value="auto">Автоматически по форме зеркала</option><option value="standard">Обычная обработка</option><option value="cnc">Обработка на ЧПУ</option></select>';edge.appendChild(method);
var facet=document.createElement('fieldset');facet.className='field mirror-choice-field';facet.id='mirror-facet-field';facet.innerHTML='<legend>Выберите фацет</legend><p class="form-hint">Фацет — декоративный скошенный край зеркала. Можно выбрать зеркало без фацета.</p>'+choices('mirror-facet',[['0','Без фацета'],['10','Фацет 5–10 мм'],['15','Фацет 15 мм'],['20','Фацет 20 мм']]);edge.after(facet);
var sand=document.createElement('fieldset');sand.className='field mirror-choice-field';sand.id='mirror-sand-field';sand.innerHTML='<legend>Пескоструйная обработка</legend>'+choices('mirror-sand',[['none','Без пескоструя'],['matte','Сплошная матировка'],['pattern','Пескоструйный рисунок']])+'<div id="mirror-sand-details" hidden><label for="mirror-sand-area">Площадь обработки, м²</label><input class="mirror-option-select" id="mirror-sand-area" type="text" inputmode="decimal" placeholder="Например, 0,3"><div id="mirror-sand-complexity-field" hidden><label for="mirror-sand-complexity">Сложность рисунка</label><select class="mirror-option-select" id="mirror-sand-complexity"><option value="1">Обычный рисунок</option><option value="1.5">Сложный рисунок</option><option value="2">Особо сложный рисунок</option></select></div><p class="form-hint">Расположение и эскиз рисунка согласуем при заказе.</p></div>';facet.after(sand);
[decor,method,facet,sand].forEach(function(el){function update(){visible();if(root.calculateMirrorInPlace)root.calculateMirrorInPlace();}el.addEventListener('change',update);if(el===sand)el.addEventListener('input',function(e){if(e.target.id==='mirror-sand-area')update();});});
document.querySelectorAll('input[name="material"]').forEach(function(el){el.addEventListener('change',visible);});visible();
})(typeof window==='object'?window:globalThis);
