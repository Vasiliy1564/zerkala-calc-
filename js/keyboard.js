/* Keep editable dimensions in view above the Android/Yandex on-screen keyboard. */
(function () {
 'use strict';
 var form=document.getElementById('quote-form');
 if(!form)return;
 var active=null,token=0,timers=[],frame=0;
 var keyboard=navigator.virtualKeyboard;
 if(keyboard){try{keyboard.overlaysContent=false;}catch(e){}}
 function clear(){
   timers.forEach(clearTimeout);timers=[];
   if(frame)cancelAnimationFrame(frame);frame=0;
 }
 function viewportBounds(){
   var vp=window.visualViewport;
   var top=vp?vp.offsetTop:0;
   var bottom=top+(vp?vp.height:window.innerHeight);
   var kb=keyboard&&keyboard.boundingRect;
   if(kb&&kb.height>0&&kb.top>top)bottom=Math.min(bottom,kb.top);
   return {top:top,bottom:bottom};
 }
 function keepVisible(){
   if(!active||document.activeElement!==active||!active.isConnected||!active.getClientRects().length)return;
   var bounds=viewportBounds(),rect=active.getBoundingClientRect();
   var field=active.closest('.field');
   var label=field&&field.querySelector('label');
   var labelTop=label?label.getBoundingClientRect().top:rect.top-38;
   var desiredTop=Math.min(labelTop,rect.top-38);
   var minTop=bounds.top+16;
   var maxBottom=bounds.bottom-26;
   if(maxBottom<=minTop+50)return;
   var delta=0;
   if(rect.bottom>maxBottom)delta=rect.bottom-maxBottom;
   else if(desiredTop<minTop)delta=desiredTop-minTop;
   if(Math.abs(delta)>2)window.scrollBy({top:delta,left:0,behavior:'instant'});
 }
 function schedule(delay){
   if(!active)return;
   if(frame)cancelAnimationFrame(frame);
   frame=requestAnimationFrame(function(){frame=0;keepVisible();});
   if(delay!==undefined)timers.push(setTimeout(keepVisible,delay));
 }
 document.addEventListener('focusin',function(e){
   var el=e.target;
   if(!form.contains(el)||!el.matches('input:not([type=radio]):not([type=checkbox]):not([type=hidden]),textarea,select')||el.disabled||el.readOnly)return;
   clear();active=el;++token;
   document.documentElement.classList.add('size-input-editing');
   schedule(90);schedule(230);schedule(420);schedule(680);
 },true);
 document.addEventListener('focusout',function(e){
   if(e.target!==active)return;
   clear();active=null;++token;
   document.documentElement.classList.remove('size-input-editing');
 },true);
 window.addEventListener('resize',function(){schedule(100);});
 if(window.visualViewport){
   window.visualViewport.addEventListener('resize',function(){schedule(80);});
   window.visualViewport.addEventListener('scroll',function(){schedule(80);});
 }
 if(keyboard)keyboard.addEventListener('geometrychange',function(){schedule(70);});
})();