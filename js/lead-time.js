/* Client-facing production terms. Purchase costs are never exposed. */
(function(root){
'use strict';
var STANDARD=1500, EXPRESS=1650, MAX_SHORT=1600, MAX_LONG=2500, STANDARD_SHORT=2000, STANDARD_LONG=3000;
function el(id){return document.getElementById(id);}
function mm(id){
  var field=el(id); if(!field)return NaN;
  if(root.MirrorSize && typeof root.MirrorSize.read==='function') return Number(root.MirrorSize.read(field));
  var value=Number(String(field.value).replace(',','.'));return Number.isFinite(value)?value*10:NaN;
}
function fits(w,h,longSide,shortSide){return Math.min(w,h)<=shortSide && Math.max(w,h)<=longSide;}
function eligibilityFor(longSide,shortSide){
  var w=mm('width'),h=mm('height'),choice=document.querySelector('input[name="shape"]:checked');
  var shape=choice?choice.value:'rect';
  if(shape==='circle')h=w;
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<400||h<400)return null;
  if(shape==='double'||shape==='semidouble'){
    var h2=mm('height2');
    if(!Number.isFinite(h2)||h2<400)return null;
    return fits(w,h,longSide,shortSide)&&fits(w,h2,longSide,shortSide);
  }
  return fits(w,h,longSide,shortSide);
}
function eligibility(){return eligibilityFor(MAX_LONG,MAX_SHORT);}
function standardEligibility(){return eligibilityFor(STANDARD_LONG,STANDARD_SHORT);}
var manualStandard=false;
function selected(){var x=document.querySelector('input[name="leadTime"]:checked');return x?x.value:'standard';}
function refresh(){
  var can=eligibility(),rush=el('lead-time-express'),normal=el('lead-time-standard'),note=el('lead-time-note');
  if(!rush||!normal)return;
  rush.disabled=can===false;
  normal.disabled=standardEligibility()===false;
  if(normal.disabled){normal.checked=false;rush.checked=false;}
  else if(can===false){rush.checked=false;normal.checked=true;}
  else if(!manualStandard){normal.checked=false;rush.checked=true;}
  else{rush.checked=false;normal.checked=true;}
  [rush,normal].forEach(function(input){var card=input.closest('.lead-time-card');if(card)card.classList.toggle('lead-time-selected',input.checked);});
  if(note)note.textContent=can===false
    ?(normal.disabled?'Размер более 300 × 200 см — нужна индивидуальная смета.':'Для выбранных размеров доступно до 10 дней. До 7 дней — максимум 250 × 160 см.')
    :'Срок и итоговая стоимость зависят от выбранного варианта. Цена будет показана после расчёта.';
  var field=el('lead-time-field');
  if(field)field.classList.toggle('lead-time-restricted',can===false);
}
function purchaseRate(){refresh();return eligibility()===false?STANDARD:(selected()==='express'?EXPRESS:STANDARD);}
function currentLabel(){refresh();return selected()==='express'?'до 7 дней':'до 10 дней';}
function recalcVisible(){
  var result=el('calc-result');
  if(result&&result.classList.contains('show')&&typeof root.calculateMirrorInPlace==='function')
    root.calculateMirrorInPlace();
}
function mount(){
  var h=el('height'),form=el('quote-form');
  if(!form||!h||el('lead-time-field'))return;
  var row=h.closest('.form-row') || h.closest('.field');
  var target=document.createElement('div');
  target.id='lead-time-field'; target.className='field lead-time-field';
  target.innerHTML='<div class="lead-time-heading"><span>Срок изготовления</span><small>Выберите удобный вариант</small></div>'+
    '<div class="lead-time-options" role="radiogroup" aria-label="Срок изготовления">'+
    '<label class="lead-time-card"><input type="radio" name="leadTime" id="lead-time-standard" value="standard"><span><strong>До 10 дней</strong><small>Стандартный срок</small></span></label>'+
    '<label class="lead-time-card"><input type="radio" name="leadTime" id="lead-time-express" value="express" checked><span><strong>До 7 дней</strong><small>Ускоренное изготовление</small></span></label>'+
    '</div><p id="lead-time-note" class="lead-time-note form-hint" aria-live="polite"></p>';
  row.insertAdjacentElement('afterend',target);
  var css=document.createElement('style');
  css.id='lead-time-style';
  css.textContent='.lead-time-field{margin:16px 0 20px}.lead-time-heading{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px;flex-wrap:wrap}.lead-time-heading span{font-weight:650;font-size:15px}.lead-time-heading small,.lead-time-card small{opacity:.73;font-size:12px}.lead-time-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.lead-time-card{display:block;position:relative;cursor:pointer;min-width:0}.lead-time-card input{position:absolute;opacity:0;width:1px;height:1px}.lead-time-card>span{height:100%;display:flex;flex-direction:column;gap:5px;min-height:76px;padding:14px 13px;border:1px solid rgba(156,145,127,.48);border-radius:13px;transition:border-color .18s,background-color .18s;box-sizing:border-box}.lead-time-card strong{font-size:16px;line-height:1.25}.lead-time-field .lead-time-card.lead-time-selected>span,.lead-time-field .lead-time-card input:checked+span{border:2px solid #af8a55!important;padding:13px 12px;background:rgba(181,141,74,.14)!important;box-shadow:0 0 0 1px rgba(175,138,85,.22)}.lead-time-card input:focus-visible+span{outline:2px solid #af8a55;outline-offset:3px}.lead-time-card input:disabled+span{opacity:.42;cursor:not-allowed}.lead-time-restricted .lead-time-note{color:#b87842}.lead-time-note{min-height:1.5em;margin-top:9px!important;line-height:1.4;font-size:12px}@media(max-width:360px){.lead-time-card>span{padding:11px 9px;min-height:80px}.lead-time-card input:checked+span{padding:10px 8px}.lead-time-card strong{font-size:15px}}';
  document.head.appendChild(css);
  target.addEventListener('change',function(event){if(event.target.name==='leadTime')manualStandard=event.target.value==='standard';refresh();recalcVisible();});
  form.addEventListener('input',function(event){if(['width','height','height2'].indexOf(event.target.id)>=0){refresh();recalcVisible();}});
  form.addEventListener('change',function(event){if(event.target.name==='shape'||['width','height','height2'].indexOf(event.target.id)>=0){refresh();recalcVisible();}});
  form.addEventListener('click',function(event){if(event.target.closest('.stepper-btn'))queueMicrotask(refresh);});
  refresh();
}
root.MirrorLeadTime={purchaseRate:purchaseRate,currentLabel:currentLabel,isExpressEligible:eligibility,isStandardEligible:standardEligibility,refresh:refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(window);
