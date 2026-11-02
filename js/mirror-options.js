/* Only material pattern, edge processing and facet are exposed on the website. */
(function(root){
'use strict';
var patterns=['КЛАССИКА (лабиринт)','КОЛОТЫЙ ЛЕД','ФУДЖИ','ТУРКУЗАН','ЛИТЕУС','РОУЗ','КОКО','БАРОККО','АЛЛАДИН','СИТЕЦ','ВИНТАЖ','ТЕАРА','ОМУТ','ЮТА','ФЕНИКС','ФЬЮЗИ'];
function read(){return {decor:document.getElementById('mirror-decor').value,machine:document.getElementById('mirror-edge-method').value,facet:document.getElementById('mirror-facet').value};}
function restore(o){o=o||{};document.getElementById('mirror-decor').value=o.decor||patterns[0];document.getElementById('mirror-edge-method').value=o.machine||'auto';document.getElementById('mirror-facet').value=o.facet||'0';visible();}
function facetCost(o,q){var rate=({0:0,10:180,15:200,20:220})[o.facet||0];if(rate===undefined)throw Error('Неизвестный фацет');return q.billedMetres*rate*(q.shapeRate?1.5:1);}
function edgeLabel(label,o,q){return label+(q.edgeRate>=270?' (ЧПУ)':'')+(Number(o.facet)?'; фацет '+(o.facet==='10'?'5–10':o.facet)+' мм':'');}
function visible(){var m=document.querySelector('input[name="material"]:checked');document.getElementById('mirror-decor-field').hidden=!m||m.value!=='decorative';}
var api={read:read,restore:restore,facetCost:facetCost,edgeLabel:edgeLabel};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorCalcOptions=api;
if(!root.document)return;
var decor=document.createElement('div');decor.className='field';decor.id='mirror-decor-field';decor.hidden=true;decor.innerHTML='<label for="mirror-decor">Рисунок декоративного зеркала</label><select class="mirror-option-select" id="mirror-decor">'+patterns.map(function(p){return '<option>'+p+'</option>';}).join('')+'</select>';
document.querySelector('input[name="material"]').closest('.field').after(decor);
var edge=document.querySelector('input[name="edge"]').closest('.field');
var method=document.createElement('div');method.className='mirror-edge-method';method.innerHTML='<label for="mirror-edge-method">Способ обработки</label><select class="mirror-option-select" id="mirror-edge-method"><option value="auto">Автоматически по форме зеркала</option><option value="standard">Обычная обработка</option><option value="cnc">Обработка на ЧПУ</option></select>';edge.appendChild(method);
var facet=document.createElement('div');facet.className='field';facet.id='mirror-facet-field';facet.innerHTML='<label for="mirror-facet">Фацет</label><select class="mirror-option-select" id="mirror-facet"><option value="0">Без фацета</option><option value="10">5–10 мм</option><option value="15">15 мм</option><option value="20">20 мм</option></select>';edge.after(facet);
[decor,method,facet].forEach(function(el){el.addEventListener('change',function(){if(root.calculateMirrorInPlace)root.calculateMirrorInPlace();});});
document.querySelectorAll('input[name="material"]').forEach(function(el){el.addEventListener('change',visible);});visible();
})(typeof window==='object'?window:globalThis);
