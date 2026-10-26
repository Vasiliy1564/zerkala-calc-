(function(){
 'use strict';
 var form=document.getElementById('quote-form'),quantity=document.getElementById('order-quantity'),field=document.getElementById('quantity-field');
 if(!form||!quantity||!field)return;
 form.querySelectorAll('.options').forEach(function(group){var input=group.querySelector('input');if(input)group.dataset.kind=input.name;});

 // A bounded native picker avoids keyboard entry and accidental 13 instead of 3.
 function quantityButton(text,label,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;}
 quantity.addEventListener('focus',function(){quantity.scrollIntoView({behavior:'auto',block:'center'});});

 // The same controls and pricing path as the main light selector; no copy of rates.
 var quick=document.createElement('section');quick.id='quick-light';quick.className='quick-light';
 var title=document.createElement('p');title.textContent='Сравнить стоимость';quick.appendChild(title);
 var choices=document.createElement('div');choices.className='quick-light-options';choices.setAttribute('role','group');choices.setAttribute('aria-label','Подсветка для расчёта');
 ['on','off'].forEach(function(value){var b=quantityButton(value==='on'?'С подсветкой':'Без подсветки',value==='on'?'Рассчитать с подсветкой':'Рассчитать без подсветки',function(){
  var anchor=quick.getBoundingClientRect().top;
  var radio=form.querySelector('input[name="light"][value="'+value+'"]');
  radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));syncLight();window.calculateMirrorInPlace();
  var shift=quick.getBoundingClientRect().top-anchor;if(shift)window.scrollBy({top:shift,behavior:'auto'});
 });b.dataset.quickLight=value;choices.appendChild(b);});quick.appendChild(choices);field.before(quick);
 function syncLight(){var selected=form.querySelector('input[name="light"]:checked');choices.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(selected&&selected.value===b.dataset.quickLight));});}
 form.addEventListener('change',function(e){if(e.target.name==='light')syncLight();});syncLight();

 var guides=document.createElement('div');guides.id='scroll-down-guides';
 ['left','right'].forEach(function(side){var button=quantityButton('↓','Прокрутить вниз: ниже есть дополнительные настройки',function(){
  var viewport=window.visualViewport?window.visualViewport.height:window.innerHeight;
  window.scrollBy({top:Math.max(180,Math.round(viewport*0.65)),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 });button.className='scroll-guide scroll-guide-'+side;var label=document.createElement('small');label.textContent='Ещё';button.appendChild(label);guides.appendChild(button);});document.body.appendChild(guides);
 function updateGuides(){var bottom=document.documentElement.scrollHeight-(window.scrollY+window.innerHeight);guides.hidden=bottom<100;}
 window.addEventListener('scroll',updateGuides,{passive:true});window.addEventListener('resize',updateGuides);
 document.addEventListener('focusin',updateGuides);document.addEventListener('focusout',function(){setTimeout(updateGuides,0);});
 if(window.ResizeObserver)new ResizeObserver(updateGuides).observe(document.body);updateGuides();
})();
