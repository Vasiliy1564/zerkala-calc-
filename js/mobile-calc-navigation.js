(function(){
'use strict';
var fields=['width','height','height2'].map(function(id){return document.getElementById(id)}).filter(Boolean);
var root=document.documentElement;
var viewport=window.visualViewport;
var focusField=null,focusTimers=[],origin=null,lastPreviewJump=0;
var preview=document.querySelector('.calculator .calc-preview');
var returnButton=document.getElementById('return-to-calculator');
if(!returnButton){
 returnButton=document.createElement('button');returnButton.id='return-to-calculator';returnButton.type='button';
 returnButton.textContent='← Назад к настройкам';returnButton.hidden=true;document.body.appendChild(returnButton);
}
function clearFocusTimers(){focusTimers.forEach(clearTimeout);focusTimers=[]}
function keyboardOpen(){
 return !!(viewport&&viewport.height<window.innerHeight-110);
}
function revealField(){
 if(!focusField||document.activeElement!==focusField)return;
 var visibleHeight=viewport?viewport.height:window.innerHeight;
 var visibleTop=viewport?viewport.offsetTop:0;
 var rect=focusField.getBoundingClientRect();
 var minTop=visibleTop+Math.min(105,visibleHeight*.22);
 var maxBottom=visibleTop+visibleHeight-75;
 var shift=rect.top<minTop?rect.top-minTop:(rect.bottom>maxBottom?rect.bottom-maxBottom:0);
 if(Math.abs(shift)>3)window.scrollBy({top:shift,behavior:'instant'});
}
function queueReveal(){
 clearFocusTimers();
 [80,200,380,600].forEach(function(delay){focusTimers.push(setTimeout(revealField,delay))});
}
fields.forEach(function(field){
 field.addEventListener('focus',function(){
  focusField=field;root.classList.add('size-input-editing');
  returnButton.hidden=true;queueReveal();
 });
 field.addEventListener('blur',function(){
  if(focusField===field)focusField=null;
  clearFocusTimers();
  setTimeout(function(){if(!fields.includes(document.activeElement))root.classList.remove('size-input-editing')},100);
 });
});
if(viewport)viewport.addEventListener('resize',function(){if(focusField)queueReveal()});
function showReturn(target){
 if(!target||!preview||root.classList.contains('size-input-editing'))return;
 origin=target;
 returnButton.hidden=false;
 var bar=document.querySelector('.action-bar');
 var h=bar&&getComputedStyle(bar).display!=='none'?bar.getBoundingClientRect().height:0;
 returnButton.style.bottom='calc('+(h+12)+'px + env(safe-area-inset-bottom,0px))';
 lastPreviewJump=Date.now();
}
returnButton.addEventListener('click',function(){
 returnButton.hidden=true;
 var target=origin;
 if(!target)return;
 var anchor=target.closest('.field')||target.closest('.options')||target;
 anchor.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
});
var recentInteraction=null,recentAt=0;
document.addEventListener('pointerdown',function(e){
 var target=e.target.closest('#quote-form input,#quote-form button,#quote-form select,#quote-form label');
 if(target){recentInteraction=target;recentAt=Date.now()}
},true);
document.addEventListener('change',function(e){
 if(e.target.closest('#quote-form')){recentInteraction=e.target;recentAt=Date.now()}
},true);
if(preview){
 window.addEventListener('scroll',function(){
  if(!recentInteraction||Date.now()-recentAt>1600||Date.now()-lastPreviewJump<1200||root.classList.contains('size-input-editing'))return;
  var r=preview.getBoundingClientRect();
  if(r.top>=-50&&r.top<110&&Math.abs(window.scrollY-(recentInteraction.getBoundingClientRect().top+window.scrollY))>200)showReturn(recentInteraction);
 },{passive:true});
}
})();
