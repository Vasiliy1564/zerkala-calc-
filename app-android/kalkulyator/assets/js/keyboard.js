/* Let the browser resize for the keyboard; scroll only the obscured part of a field. */
(function(){
 'use strict';
 var form=document.getElementById('quote-form');if(!form)return;
 var active=null,timer=0,token=0;
 var keyboard=navigator.virtualKeyboard;
 if(keyboard){try{keyboard.overlaysContent=false;}catch(e){}}
 function visible(){
  if(!active||document.activeElement!==active)return;
  var vp=window.visualViewport,top=vp?vp.offsetTop:0,height=vp?vp.height:window.innerHeight;
  if(!(height>0))return;
  var bottom=top+height-12;
  // Use actual keyboard geometry too when supplied by a supporting browser.
  var kb=keyboard&&keyboard.boundingRect;
  if(kb&&kb.height>0&&kb.top>top)bottom=Math.min(bottom,kb.top-12);
  var rect=active.getBoundingClientRect();
  var delta=Math.max(0,rect.bottom-bottom);
  if(delta>2)window.scrollBy({top:delta,left:0,behavior:'instant'});
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(visible,100);}
 document.addEventListener('focusin',function(e){
  var el=e.target;
  if(!form.contains(el)||!el.matches('input:not([type=radio]):not([type=checkbox]):not([type=hidden]),textarea,select')||el.disabled||el.readOnly)return;
  active=el;var current=++token;
  document.documentElement.classList.add('size-input-editing');schedule();
  setTimeout(function(){if(current===token)visible();},450);
 });
 document.addEventListener('focusout',function(e){
  if(e.target!==active)return;
  active=null;++token;clearTimeout(timer);
  document.documentElement.classList.remove('size-input-editing');
 });
 window.addEventListener('resize',schedule);
 if(window.visualViewport){window.visualViewport.addEventListener('resize',schedule);window.visualViewport.addEventListener('scroll',schedule);}
 if(keyboard)keyboard.addEventListener('geometrychange',schedule);
 if(window.ResizeObserver)new ResizeObserver(schedule).observe(form);
})();
