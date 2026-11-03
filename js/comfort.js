(function(){
 'use strict';
 var form=document.getElementById('quote-form'),quantity=document.getElementById('order-quantity'),field=document.getElementById('quantity-field');
 if(!form||!quantity||!field)return;
 form.querySelectorAll('.options').forEach(function(group){var input=group.querySelector('input');if(input)group.dataset.kind=input.name;});

 // A bounded native picker avoids keyboard entry and accidental 13 instead of 3.
 function quantityButton(text,label,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;}



 var activePosition=null;
 function releasePosition(){activePosition=null;document.documentElement.classList.remove('calc-position-hold');}
 function beginPosition(anchor){
  if(activePosition&&activePosition.anchor===anchor)return activePosition;
  var hold={anchor:anchor,top:anchor.getBoundingClientRect().top,x:window.scrollX,y:window.scrollY,service:anchor.matches('#carry-option,#deliveryOpt,#installOpt,#quick-install')};
  document.documentElement.classList.add('calc-position-hold');activePosition=hold;return hold;
 }
 function restorePosition(hold){
  if(activePosition!==hold||!hold.anchor.isConnected)return;
  var top=hold.service?hold.y:window.scrollY+hold.anchor.getBoundingClientRect().top-hold.top;
  if(Math.abs(window.scrollY-top)>0.5)window.scrollTo({top:top,left:hold.x,behavior:'instant'});
 }
 function revealService(panel){
  if(!panel||panel.hidden)return;
  var viewport=window.visualViewport,top=(viewport?viewport.offsetTop:0)+96;
  var delta=Math.max(0,panel.getBoundingClientRect().top-top);
  if(delta>2)window.scrollTo({top:window.scrollY+delta,left:window.scrollX,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 function settlePosition(hold){
  restorePosition(hold);
  requestAnimationFrame(function(){restorePosition(hold);requestAnimationFrame(function(){
   restorePosition(hold);if(!hold.service&&activePosition===hold)releasePosition();
  });});
  if(hold.service){
   // Mobile focus/scroll anchoring can run after the checkbox change event.
   [80,180].forEach(function(delay){setTimeout(function(){restorePosition(hold);},delay);});
   setTimeout(function(){if(activePosition!==hold)return;restorePosition(hold);releasePosition();revealService(hold.reveal);},280);
  }
 }
 form.addEventListener('pointerdown',function(e){
  releasePosition();
  var quickButton=e.target.closest('[data-quick-light],#quick-install');
  var label=e.target.closest('label');
  if(quickButton)beginPosition(quickButton);
  else if(label&&label.querySelector('input[type="radio"]:not(:disabled),input[type="checkbox"]:not(:disabled)'))beginPosition(label);
 },true);
 form.addEventListener('keydown',function(e){
  if(e.key===' '&&e.target.matches('#carry-enabled,input[name="option"][value="delivery"],input[name="option"][value="install"]'))beginPosition(e.target.closest('label'));
  else if(e.key==='Tab'||e.key==='PageDown'||e.key==='PageUp'||e.key.indexOf('Arrow')===0)releasePosition();
 },true);
 // Respect deliberate scrolling and new interactions while a correction is pending.
 window.addEventListener('wheel',releasePosition,{passive:true});
 window.addEventListener('touchmove',releasePosition,{passive:true});
 document.addEventListener('pointerdown',function(e){if(!form.contains(e.target))releasePosition();},true);
 form.addEventListener('change',function(e){
  if(e.target.matches('input[type="radio"],input[type="checkbox"],select'))beginPosition(e.target.closest('label')||e.target);
 },true);
 form.addEventListener('change',function(e){
  if(!activePosition)return;
  if(e.target.checked&&e.target.matches('#carry-enabled,input[name="option"][value="delivery"],input[name="option"][value="install"]'))activePosition.reveal=document.getElementById(e.target.id==='carry-enabled'?'carry-fields':'delivery-address-panel');
  settlePosition(activePosition);
 });
 form.addEventListener('click',function(){if(activePosition)settlePosition(activePosition);});

 // The same controls and pricing path as the main light selector; no copy of rates.
 var quick=document.createElement('section');quick.id='quick-light';quick.className='quick-light';
 var title=document.createElement('p');title.textContent='Сравнить стоимость';quick.appendChild(title);
 var choices=document.createElement('div');choices.className='quick-light-options';choices.setAttribute('role','group');choices.setAttribute('aria-label','Подсветка и установка для расчёта');
 ['on','off'].forEach(function(value){var b=quantityButton(value==='on'?'С подсветкой':'Без подсветки',value==='on'?'Рассчитать с подсветкой':'Рассчитать без подсветки',function(){
  var position=beginPosition(this);
  var radio=form.querySelector('input[name="light"][value="'+value+'"]');
  radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));syncLight();window.calculateMirrorInPlace();
  settlePosition(position);
 });b.dataset.quickLight=value;choices.appendChild(b);});quick.appendChild(choices);field.before(quick);
 function syncLight(){var selected=form.querySelector('input[name="light"]:checked');choices.querySelectorAll('[data-quick-light]').forEach(function(b){b.setAttribute('aria-pressed',String(selected&&selected.value===b.dataset.quickLight));});}
 var installation=form.querySelector('input[name="option"][value="install"]');
 var installButton=quantityButton('Установить','Включить или выключить установку',function(){
  var position=beginPosition(this);
  installation.checked=!installation.checked;installation.dispatchEvent(new Event('change',{bubbles:true}));
  syncInstall();window.calculateMirrorInPlace();
  settlePosition(position);
 });installButton.id='quick-install';choices.appendChild(installButton);
 function syncInstall(){installButton.setAttribute('aria-pressed',String(installation.checked));}
 form.addEventListener('change',function(e){if(e.target.name==='light')syncLight();if(e.target===installation)syncInstall();});syncLight();syncInstall();

 var guides=document.createElement('div');guides.id='scroll-down-guides';
 ['left','right'].forEach(function(side){var button=quantityButton('↓','Прокрутить вниз: ниже есть дополнительные настройки',function(){
  var viewport=window.visualViewport?window.visualViewport.height:window.innerHeight;
  window.scrollBy({top:Math.max(180,Math.round(viewport*0.65)),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 });button.className='scroll-guide scroll-guide-'+side;button.title='Прокрутить вниз';var caption=document.createElement('small');caption.textContent='Прокрутите вниз';button.appendChild(caption);guides.appendChild(button);});document.body.appendChild(guides);
 function updateGuides(){var bottom=document.documentElement.scrollHeight-(window.scrollY+window.innerHeight);guides.hidden=bottom<100;}
 window.addEventListener('scroll',updateGuides,{passive:true});window.addEventListener('resize',updateGuides);
 document.addEventListener('focusin',updateGuides);document.addEventListener('focusout',function(){setTimeout(updateGuides,0);});
 if(window.ResizeObserver)new ResizeObserver(updateGuides).observe(document.body);updateGuides();
})();

