(function(){
 'use strict';
 var form=document.getElementById('quote-form'),cta=document.getElementById('r-cta');
 if(!form||!cta)return;
 var status=document.createElement('p');status.id='copy-calculation-status';status.setAttribute('role','status');status.style.cssText='font-size:12px;margin:6px 0';
 cta.closest('.calc-cta').after(status);
 function fallback(text){
  var active=document.activeElement,x=window.scrollX,y=window.scrollY;
  var field=document.createElement('textarea');field.value=text;field.readOnly=true;field.setAttribute('aria-label','Расчёт для копирования');
  field.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px;pointer-events:none';document.body.appendChild(field);
  var ok=false;try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,text.length);ok=document.execCommand('copy');}catch(e){}finally{field.remove();if(active&&active.isConnected)active.focus({preventScroll:true});window.scrollTo({top:y,left:x,behavior:'instant'});}
  return ok;
 }
 async function copy(text,button,notice){
  if(!text){notice.textContent='Сначала укажите размеры и рассчитайте стоимость.';return;}
  var ok=false;try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);ok=true;}}catch(e){}
  if(!ok)ok=fallback(text);
  notice.textContent=ok?'Расчёт скопирован.':'Не удалось скопировать автоматически. Выделите текст ниже и скопируйте его.';
  var old=notice.querySelector('textarea');if(old)old.remove();
  if(!ok){var manual=document.createElement('textarea');manual.value=text;manual.readOnly=true;manual.setAttribute('aria-label','Расчёт для копирования вручную');manual.style.cssText='width:100%;min-height:160px;font-size:14px';notice.appendChild(manual);}
 }
 window.copyMirrorQuote=function(text,notice){return copy(text,null,notice);};
 function button(id,text){var b=document.createElement('button');b.id=id;b.type='button';b.className='calc-btn calc-btn-call';b.textContent=text;return b;}
 var single=button('copy-calculation','Скопировать расчёт');cta.before(single);
 single.onclick=function(){
  var valid=typeof form.reportValidity!=='function'||form.reportValidity();if(!valid)return;
  window.calculateMirrorInPlace();
  var text=window.getMirrorSelectionText?window.getMirrorSelectionText():'';
  if(!document.getElementById('r-sum').textContent.match(/\d/))text='';
  copy(text,single,status);
 };
 var price=document.getElementById('r-sum');
 if(price){price.setAttribute('role','button');price.tabIndex=0;price.title='Скопировать подробный расчёт';price.setAttribute('aria-label','Скопировать расчёт выбранного зеркала');price.addEventListener('click',function(){single.click();});price.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();single.click();}});}
 var send=document.getElementById('order-send');if(send){
  var all=button('copy-order','Скопировать заказ для клиента'),notice=document.createElement('p');notice.id='copy-order-status';notice.setAttribute('role','status');notice.style.fontSize='12px';send.before(all,notice);
  all.onclick=function(){copy(window.getMirrorOrderText?window.getMirrorOrderText():'',all,notice);};
  var summary=document.getElementById('order-summary');
  summary.addEventListener('click',function(e){if(e.target.closest('[data-copy-order]'))all.click();});
  summary.addEventListener('keydown',function(e){if(e.target.closest('[data-copy-order]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();all.click();}});
 }
})();
