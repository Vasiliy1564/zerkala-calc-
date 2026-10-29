(function(){
 'use strict';
 var form=document.getElementById('quote-form'),quantity=document.getElementById('order-quantity'),field=document.getElementById('quantity-field');
 if(!form||!quantity||!field)return;
 form.querySelectorAll('.options').forEach(function(group){var input=group.querySelector('input');if(input)group.dataset.kind=input.name;});

 // A bounded native picker avoids keyboard entry and accidental 13 instead of 3.
 function quantityButton(text,label,action){var b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;}



 // Keep the edited field clear of the keyboard and fixed action buttons.
 var focusedSize=null,sizeTimer=0,focusToken=0,placeOnFocus=false;
 function sizeInput(el){return el&&el.matches&&el.matches('input:not([type=radio]):not([type=checkbox]):not([type=hidden]),textarea,select')&&!el.disabled&&!el.readOnly;}
 function keepSizeVisible(){
  if(!focusedSize||document.activeElement!==focusedSize)return;
  var vp=window.visualViewport,top=vp?vp.offsetTop:0,height=vp?vp.height:window.innerHeight;
  if(!(height>0))return;
  var bottom=top+height-28;
  document.querySelectorAll('.action-bar,#return-to-calculator').forEach(function(bar){
   if(bar.hidden||!bar.getClientRects().length)return;
   var r=bar.getBoundingClientRect();if(r.height>0&&r.top>top&&r.top<bottom)bottom=r.top-20;
  });
  var rect=focusedSize.getBoundingClientRect(),safeTop=top+32;
  // Place the control near the top once, even when a WebView reports no keyboard resize.
  // Later viewport notifications only correct an actual overlap.
  var field=focusedSize.closest('.field')||focusedSize;
  var label=field.querySelector&&field.querySelector('label');
  var labelHeight=label?label.getBoundingClientRect().height+12:0;
  var target=top+Math.max(72,labelHeight+32);
  if(placeOnFocus){placeOnFocus=false;if(rect.top>target){window.scrollBy({top:rect.top-target,left:0,behavior:'instant'});return;}}
  var delta=rect.bottom>bottom?rect.bottom-bottom:rect.top<safeTop?rect.top-safeTop:0;
  if(Math.abs(delta)>2)window.scrollBy({top:delta,left:0,behavior:'instant'});
 }
 function scheduleSizeVisibility(){clearTimeout(sizeTimer);sizeTimer=setTimeout(keepSizeVisible,100);}
 document.addEventListener('focusin',function(e){
  if(!sizeInput(e.target)||!form.contains(e.target))return;
  focusedSize=e.target;placeOnFocus=true;var token=++focusToken;
  document.documentElement.classList.add('size-input-editing');
  scheduleSizeVisibility();
  setTimeout(function(){if(token===focusToken)keepSizeVisible();},450);
 });
 document.addEventListener('focusout',function(e){
  if(e.target!==focusedSize)return;
  focusedSize=null;++focusToken;clearTimeout(sizeTimer);
  document.documentElement.classList.remove('size-input-editing');
 });
 window.addEventListener('resize',scheduleSizeVisibility);
 if(window.visualViewport){window.visualViewport.addEventListener('resize',scheduleSizeVisibility);}
 if(window.ResizeObserver)new ResizeObserver(scheduleSizeVisibility).observe(form);
 var activePosition=null;
 function beginPosition(anchor){
  if(activePosition)return activePosition;
  var hold={anchor:anchor,top:anchor.getBoundingClientRect().top};
  document.documentElement.classList.add('calc-position-hold');activePosition=hold;return hold;
 }
 function restorePosition(hold){
  if(activePosition!==hold||!hold.anchor.isConnected)return;
  var delta=hold.anchor.getBoundingClientRect().top-hold.top;
  if(Math.abs(delta)>0.5)window.scrollTo({top:window.scrollY+delta,left:window.scrollX,behavior:'instant'});
 }
 function settlePosition(hold){
  restorePosition(hold);
  requestAnimationFrame(function(){restorePosition(hold);requestAnimationFrame(function(){
   restorePosition(hold);if(activePosition===hold){activePosition=null;document.documentElement.classList.remove('calc-position-hold');}
  });});
 }
 form.addEventListener('pointerdown',function(e){
  var quickButton=e.target.closest('[data-quick-light],#quick-install');
  var label=e.target.closest('label');
  if(quickButton)beginPosition(quickButton);
  else if(label&&label.querySelector('input[name="light"]'))beginPosition(label);
 },true);
 form.addEventListener('change',function(e){
  if(e.target.name==='light')beginPosition(e.target.closest('label')||e.target);
 },true);
 form.addEventListener('change',function(e){if(e.target.name==='light'&&activePosition)settlePosition(activePosition);});

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
