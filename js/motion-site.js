/* Approved photographic presentation; existing pricing and order engines are retained. */
(()=>{'use strict';
const $=s=>document.querySelector(s),form=$('#quote-form'),stage=$('#stage'),mirror=$('#motion-mirror'),source=$('#mirrorSvg'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(!form||!stage||!mirror||!source)return;
const names={rect:'Прямоугольник',rounded:'Скруглённые углы',arch:'Арка',circle:'Круг',oval:'Овал',capsule:'Овал с прямыми боками',curved:'Волна',semicircle:'Полукруг',double:'Из двух частей',semidouble:'Полукруг из двух частей'};
const pending=new Map();let scrolling=false,frame=0,changeTimer=0,replaying=false,latest='';
function checked(name){return form.querySelector('[name="'+name+'"]:checked');}
function mm(id){return window.MirrorSize?window.MirrorSize.read(document.getElementById(id)):Number(document.getElementById(id).value)*10;}
function ignite(container,on){window.dispatchEvent(new CustomEvent('mirror-light-scene',{detail:{id:container.id,on}}));}
function render(){
 const shape=checked('shape')?.value||'rect',material=checked('material')?.value||'silver',light=checked('light')?.value==='on',tone=checked('clr')?.value||'warm';
 let w=mm('width'),h=shape==='circle'?w:mm('height');if(shape==='double'||shape==='semidouble')h+=mm('height2');
 if(!(w>0&&h>0))return;
 const ratio=w/h,maxW=stage.clientWidth*.7||280,maxH=stage.clientHeight*.76||310,width=Math.min(maxW,maxH*ratio),height=width/ratio;
 mirror.style.width=width+'px';mirror.style.height=height+'px';mirror.style.borderRadius=shape==='rect'?'2px':shape==='rounded'?'16px':shape==='arch'?(width/2)+'px '+(width/2)+'px 2px 2px':shape==='circle'||shape==='oval'?'50%':Math.min(width/2,height/2)+'px';
 stage.classList.toggle('lit',light);mirror.dataset.material=material;
 document.documentElement.style.setProperty('--led-rgb',({warm:'255,237,196',neutral:'239,248,255',cold:'194,224,255'})[tone]||'255,237,196');
 const materialText=checked('material')?.parentElement.textContent.trim()||'Серебро';
 $('#motion-caption').textContent=(names[shape]||shape)+' · '+materialText.toLowerCase()+' · '+(light?'с подсветкой':'без подсветки');
 $('#motion-dimensions').textContent=shape==='circle'?'Ø '+(w/10)+' см':(w/10)+' × '+(h/10)+' см';
 // The exact generated geometry and material treatment are reused for every shape.
 let markup=source.innerHTML;
 const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 for(const id of ids){markup=markup.replaceAll('id="'+id+'"','id="motion_'+id+'"').replaceAll('url(#'+id+')','url(#motion_'+id+')');}
 let model=mirror.querySelector('.motion-model');if(!model){model=document.createElementNS('http://www.w3.org/2000/svg','svg');model.classList.add('motion-model');model.setAttribute('aria-hidden','true');mirror.prepend(model);}
 const changed=latest!==shape+'|'+material+'|'+tone;latest=shape+'|'+material+'|'+tone;
 model.innerHTML=markup;model.setAttribute('viewBox','0 0 170 240');
 // Show the selected luminous strips on the actual mirror geometry.
 const stripes=checked('mirror-sand')?.value==='stripes';
 if(stripes){
   const clip=source.querySelector('#realMirrorClip > *');
   if(clip){try{
     const b=clip.getBBox(), cm=Math.max(.1,Math.min(30,Number(($('#atelier-stripe-width')?.value||$('#owner-stripe-w')?.value||'3').replace(',','.'))||3));
     const band=Math.min(b.width*.22,Math.max(1,b.width*cm/(w/10)));
     const layout=$('#atelier-stripe-layout')?.value||$('#owner-side-preset')?.value||'lr';
     const rect=(x,y,rw,rh)=>'<rect x="'+x+'" y="'+y+'" width="'+rw+'" height="'+rh+'"/>';
     let bands=''; const inset=Math.max(2,band*.7);
     const selectedSide=id=>!$(id)||$(id).checked;
     if((layout==='lr'||layout==='p')&&selectedSide('#owner-side-l'))bands+=rect(b.x+inset,b.y+inset,band,b.height-2*inset);
     if((layout==='lr'||layout==='p')&&selectedSide('#owner-side-r'))bands+=rect(b.x+b.width-inset-band,b.y+inset,band,b.height-2*inset);
     if((layout==='tb'||layout==='p')&&selectedSide('#owner-side-t'))bands+=rect(b.x+inset,b.y+inset,b.width-2*inset,band);
     if((layout==='tb'||layout==='p')&&selectedSide('#owner-side-b'))bands+=rect(b.x+inset,b.y+b.height-inset-band,b.width-2*inset,band);
     const g=document.createElementNS('http://www.w3.org/2000/svg','g');
     const color=light?({warm:'#ffe3aa',neutral:'#f7f8f0',cold:'#d9ecff'}[tone]||'#ffe3aa'):'#d9d5cd';
     g.innerHTML='<g clip-path="url(#motion_realMirrorClip)" class="sand-stripes '+(light?'sand-stripes--lit':'')+'" fill="'+color+'" stroke="#fff8e8" stroke-width=".28">'+bands+'</g>';
     model.appendChild(g);
   }catch(_){}}
 }
 else if(checked('mirror-sand')?.value==='matte'){
   const clip=source.querySelector('#realMirrorClip > *');
   if(clip){try{const b=clip.getBBox(),g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.width+'" height="'+b.height+'" clip-path="url(#motion_realMirrorClip)" fill="#f3f0e8" opacity=".48"/>';model.appendChild(g);}catch(_){}}
 }else if(checked('mirror-sand')?.value==='pattern'){
   const clip=source.querySelector('#realMirrorClip > *');
   if(clip){try{const b=clip.getBBox(),g=document.createElementNS('http://www.w3.org/2000/svg','g');g.innerHTML='<path d="M '+(b.x+b.width*.22)+' '+(b.y+b.height*.75)+' Q '+(b.x+b.width*.72)+' '+(b.y+b.height*.53)+' '+(b.x+b.width*.4)+' '+(b.y+b.height*.25)+'" clip-path="url(#motion_realMirrorClip)" fill="none" stroke="#e9e5dc" stroke-width="3" opacity=".8"/>';model.appendChild(g);}catch(_){}}
 }

 try{let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;source.querySelectorAll('#realMirrorClip > *').forEach(el=>{const b=el.getBBox();minX=Math.min(minX,b.x);minY=Math.min(minY,b.y);maxX=Math.max(maxX,b.x+b.width);maxY=Math.max(maxY,b.y+b.height);});if(Number.isFinite(minX)&&maxX>minX)model.setAttribute('viewBox',[minX-2,minY-2,maxX-minX+4,maxY-minY+4].join(' '));}catch(_){}
 if(changed&&!reduced.matches&&model.animate)model.animate([{opacity:.35,filter:'blur(1.5px)'},{opacity:1,filter:'blur(0px)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
}
const observer=new MutationObserver(()=>{cancelAnimationFrame(changeTimer);changeTimer=requestAnimationFrame(render);});observer.observe(source,{childList:true,subtree:false});
function focusPreview(key,action){
 pending.set(key,action);if(scrolling)return;window.dispatchEvent(new Event('mirror-preview-start'));scrolling=true;
 if(window.MIRROR_APP_MODE){scrolling=false;const updates=[...pending.values()];pending.clear();replaying=true;try{updates.forEach(fn=>fn());}finally{replaying=false;}render();return;}
 // In the embedded calculator, the parent page owns the actual scroll position.
 if(window.parent!==window){window.parent.postMessage({type:'mirror-focus-preview',top:stage.getBoundingClientRect().top},location.origin);setTimeout(()=>{scrolling=false;const updates=[...pending.values()],keys=[...pending.keys()];pending.clear();replaying=true;try{updates.forEach(fn=>fn());}finally{replaying=false;}render();window.dispatchEvent(new CustomEvent('mirror-preview-applied',{detail:{id:'stage',changes:keys}}));},reduced.matches?0:560);return;}
 const start=scrollY,top=Math.max(0,Math.min(document.documentElement.scrollHeight-innerHeight,stage.getBoundingClientRect().top+start-18)),delta=top-start,duration=Math.min(680,Math.max(420,Math.abs(delta)*.32));let began=null;
 const old=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';
 function clean(){cancelAnimationFrame(frame);scrolling=false;document.documentElement.style.scrollBehavior=old;['wheel','touchstart','keydown'].forEach(type=>removeEventListener(type,cancel,true));}
 function cancel(e){if(e.type==='keydown'&&!['ArrowDown','ArrowUp','PageDown','PageUp','Escape',' '].includes(e.key))return;pending.clear();clean();}
 function apply(){clean();const updates=[...pending.values()],keys=[...pending.keys()];pending.clear();replaying=true;try{updates.forEach(fn=>fn());}finally{replaying=false;}render();window.dispatchEvent(new CustomEvent('mirror-preview-applied',{detail:{id:'stage',changes:keys}}));}
 if(reduced.matches||Math.abs(delta)<10){scrollTo({top,behavior:'instant'});frame=requestAnimationFrame(apply);return;}
 ['wheel','touchstart','keydown'].forEach(type=>addEventListener(type,cancel,{capture:true,passive:true}));
 function step(now){if(began===null)began=now;const t=Math.min(1,(now-began)/duration),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;scrollTo({top:start+delta*ease,behavior:'instant'});if(t<1)frame=requestAnimationFrame(step);else apply();}frame=requestAnimationFrame(step);
}
const previewNames=new Set(['shape','material','light','clr','ctrl','mirror-sand','face-frame']);
document.addEventListener('click',event=>{
 if(replaying||event.button!==0||event.ctrlKey||event.metaKey)return;
 const label=event.target.closest('#quote-form label'),input=event.target.matches('#quote-form input')?event.target:label?.querySelector('input');
 if(!input||input.type!=='radio'||!previewNames.has(input.name)||input.disabled)return;
 event.preventDefault();event.stopImmediatePropagation();
 focusPreview(input.name,()=>{input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));if(window.calculateMirrorInPlace)window.calculateMirrorInPlace();});
},true);
form.addEventListener('input',event=>{if(['width','height','height2'].includes(event.target.id))requestAnimationFrame(render);});
form.addEventListener('change',event=>{requestAnimationFrame(render);if(event.target.id==='atelier-stripe-layout')focusPreview('stripe-layout',()=>render());});
form.addEventListener('input',event=>{if(event.target.id==='atelier-stripe-width')requestAnimationFrame(render);});
form.addEventListener('change',event=>{if(event.target.id?.startsWith('owner-side-')||event.target.id==='owner-side-preset')requestAnimationFrame(render);});
form.addEventListener('input',event=>{if(event.target.id==='owner-stripe-w')requestAnimationFrame(render);});
$('#brightness').addEventListener('input',event=>{$('#brightnessValue').textContent=event.target.value+'%';});
$('#brightness').addEventListener('change',()=>focusPreview('brightness',()=>{document.documentElement.style.setProperty('--led-power',Number($('#brightness').value)/100);ignite(stage,stage.classList.contains('lit'));}));
$('#replayLight').onclick=()=>focusPreview('light',()=>{const input=form.querySelector('[name=light][value=on]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));render();ignite(stage,true);});
$('#heroLight').onclick=function(){const on=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',on);$('#heroRoom').classList.toggle('lit',on);ignite($('#heroRoom'),on);};
window.addEventListener('mirror-preview-applied',event=>{if(event.detail.id==='stage')setTimeout(()=>ignite(stage,stage.classList.contains('lit')),650);});
window.addEventListener('resize',render);
// Preserve all routes to the calculator and show its live preview first.
document.addEventListener('click',event=>{const link=event.target.closest('a[href="#calculator"],a[href="#quote-form"]');if(!link||event.button!==0)return;event.preventDefault();event.stopImmediatePropagation();stage.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});},true);
if('IntersectionObserver'in window){const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('motion-visible');reveal.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.section-head,.product,.project,.avito-review').forEach(el=>reveal.observe(el));}
render();
})();
