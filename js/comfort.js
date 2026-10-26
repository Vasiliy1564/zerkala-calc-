(function(){
 'use strict';
 var form=document.getElementById('quote-form'),quantity=document.getElementById('order-quantity'),field=document.getElementById('quantity-field');
 if(!form||!quantity||!field)return;

 // Text + numeric keyboard supports reliable select-all on Android WebView.
 quantity.type='text';quantity.inputMode='numeric';quantity.pattern='[0-9]*';quantity.maxLength=3;
 quantity.autocomplete='off';quantity.enterKeyHint='done';quantity.setAttribute('aria-label','Количество зеркал, от 1 до 999');
 var stepper=document.createElement('div');stepper.className='quantity-stepper';
 quantity.before(stepper);stepper.appendChild(quantity);
 function quantityButton(text,label,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;}
 function setQuantity(n){quantity.value=String(Math.max(1,Math.min(999,n)));quantity.dispatchEvent(new Event('input',{bubbles:true}));}
 var minus=quantityButton('−','Уменьшить количество',function(){setQuantity((Number(quantity.value)||1)-1);});minus.id='quantity-minus';stepper.prepend(minus);
 var plus=quantityButton('+','Увеличить количество',function(){setQuantity((Number(quantity.value)||0)+1);});plus.id='quantity-plus';stepper.appendChild(plus);
 var presets=document.createElement('div');presets.className='quantity-presets';presets.setAttribute('role','group');presets.setAttribute('aria-label','Быстро выбрать количество');
 [1,2,3].forEach(function(n){var b=quantityButton(n+' шт.','Выбрать '+n+' шт.',function(){setQuantity(n);});b.dataset.quantityPreset=String(n);presets.appendChild(b);});field.appendChild(presets);
 function syncQuantity(){var n=Number(quantity.value);minus.disabled=n<=1;plus.disabled=n>=999;presets.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.quantityPreset)===n));});}
 quantity.addEventListener('input',syncQuantity);syncQuantity();
 var selectOnClick=false;
 function revealQuantity(){if(document.activeElement===quantity)quantity.scrollIntoView({behavior:'auto',block:'center'});}
 quantity.addEventListener('focus',function(){selectOnClick=true;document.body.classList.add('quantity-editing');quantity.select();revealQuantity();setTimeout(revealQuantity,150);setTimeout(revealQuantity,400);});
 quantity.addEventListener('click',function(){if(selectOnClick){quantity.select();selectOnClick=false;}});
 quantity.addEventListener('blur',function(){document.body.classList.remove('quantity-editing');selectOnClick=false;syncQuantity();});
 quantity.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();quantity.blur();window.calculateMirrorInPlace();}});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',revealQuantity);
 window.addEventListener('resize',revealQuantity);

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
 function updateGuides(){var bottom=document.documentElement.scrollHeight-(window.scrollY+window.innerHeight);guides.hidden=bottom<100||document.activeElement===quantity;}
 window.addEventListener('scroll',updateGuides,{passive:true});window.addEventListener('resize',updateGuides);
 document.addEventListener('focusin',updateGuides);document.addEventListener('focusout',function(){setTimeout(updateGuides,0);});
 if(window.ResizeObserver)new ResizeObserver(updateGuides).observe(document.body);updateGuides();
})();
