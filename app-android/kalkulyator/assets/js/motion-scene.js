/* Deliberately photo based. No WebGL or replacement scene. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const stages=[document.getElementById('heroRoom'),document.getElementById('stage')];
 const ns='http://www.w3.org/2000/svg';
 let evening=false,viewing=new Set(),waveTimers=new Map();
 const sun='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></svg>';
 const moon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.8 15.1A8.5 8.5 0 0 1 8.9 4.2a8.5 8.5 0 1 0 10.9 10.9Z"/></svg>';
 function sceneTime(next){
  evening=next;document.body.classList.toggle('evening',evening);
  document.querySelectorAll('[data-scene-time]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.sceneTime==='evening')===evening)));
  stages.forEach(stage=>{if(stage.classList.contains('lit')){if(evening)wave(stage);else sheen(stage);}});
 }
 function shapePath(mirror){
  const w=mirror.clientWidth+8,h=mirror.clientHeight+8,p=4;
  const hero=mirror.classList.contains('hero-mirror');
  const kind=hero?'rect':(document.querySelector('#quote-form [name=shape]:checked')||{}).value||'rect';
  const right=w-p,bottom=h-p,middle=w/2;
  if(kind==='circle'){const rx=(w-8)/2,ry=(h-8)/2;return {w,h,d:`M ${middle} ${p} A ${rx} ${ry} 0 1 1 ${middle-.01} ${p} Z`};}
  if(kind==='arch'){const r=Math.min((w-8)/2,h-8);return {w,h,d:`M ${p} ${bottom} L ${p} ${p+r} A ${r} ${r} 0 0 1 ${right} ${p+r} L ${right} ${bottom} Z`};}
  const r=kind==='capsule'?Math.min((w-8)/2,(h-8)/2):3;
  return {w,h,d:`M ${p+r} ${p} H ${right-r} Q ${right} ${p} ${right} ${p+r} V ${bottom-r} Q ${right} ${bottom} ${right-r} ${bottom} H ${p+r} Q ${p} ${bottom} ${p} ${bottom-r} V ${p+r} Q ${p} ${p} ${p+r} ${p} Z`};
 }
 function measure(mirror){const svg=mirror.querySelector('.perimeter-wave');if(!svg)return;const box=shapePath(mirror);svg.setAttribute('viewBox',`0 0 ${box.w} ${box.h}`);svg.querySelector('path').setAttribute('d',box.d);}
 function sheen(stage){const el=stage.querySelector('.mirror-sheen');if(!el||reduced.matches)return;el.classList.remove('sweeping');requestAnimationFrame(()=>el.classList.add('sweeping'));}
 function wave(stage){
  const mirror=stage.querySelector('.hero-mirror,.mirror'),svg=mirror.querySelector('.perimeter-wave'),flare=stage.querySelector('.scene-flare');
  clearTimeout(waveTimers.get(stage));measure(mirror);
  svg.classList.remove('tracing');flare.classList.remove('flashing');
  if(reduced.matches)return;
  requestAnimationFrame(()=>{if(!stage.classList.contains('lit'))return;svg.classList.add('tracing');flare.classList.add('flashing');});
  waveTimers.set(stage,setTimeout(()=>{if(stage.classList.contains('lit'))sheen(stage);},800));
 }
 for(const stage of stages){
  const switcher=document.createElement('div');switcher.className='scene-time';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Освещение интерьера');
  switcher.innerHTML=`<button type="button" data-scene-time="day" aria-pressed="true">${sun}День</button><button type="button" data-scene-time="evening" aria-pressed="false">${moon}Вечер</button>`;
  stage.appendChild(switcher);switcher.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>sceneTime(button.dataset.sceneTime==='evening')));
  const mirror=stage.querySelector('.hero-mirror,.mirror'),svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');svg.classList.add('perimeter-wave');svg.setAttribute('aria-hidden','true');path.setAttribute('pathLength','1');svg.appendChild(path);mirror.appendChild(svg);if('ResizeObserver'in window)new ResizeObserver(()=>measure(mirror)).observe(mirror);measure(mirror);
  stage.addEventListener('pointermove',event=>{
   if(reduced.matches||event.pointerType==='touch')return;const r=stage.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
   stage.style.setProperty('--scene-x',`${x*-10}px`);stage.style.setProperty('--scene-y',`${y*-6}px`);stage.style.setProperty('--scene-shift-x',`${x*6}px`);stage.style.setProperty('--scene-shift-y',`${y*4}px`);
  });
  stage.addEventListener('pointerleave',()=>{['--scene-x','--scene-y','--scene-shift-x','--scene-shift-y'].forEach(name=>stage.style.setProperty(name,'0px'));});
 }
 window.addEventListener('mirror-light-scene',event=>{const stage=document.getElementById(event.detail.id);if(!stages.includes(stage))return;if(event.detail.on)wave(stage);else{clearTimeout(waveTimers.get(stage));stage.querySelector('.perimeter-wave').classList.remove('tracing');stage.querySelector('.scene-flare').classList.remove('flashing');}});
 window.addEventListener('mirror-preview-applied',event=>{if(event.detail.id!=='stage'||!event.detail.changes.includes('shape'))return;clearTimeout(waveTimers.get(stages[1]));waveTimers.set(stages[1],setTimeout(()=>{if(stages[1].classList.contains('lit'))wave(stages[1]);},650));});
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&!viewing.has(entry.target)){viewing.add(entry.target);if(entry.target.classList.contains('lit'))wave(entry.target);}}),{threshold:.25});stages.forEach(stage=>observer.observe(stage));
 document.addEventListener('visibilitychange',()=>{if(document.hidden){waveTimers.forEach(clearTimeout);stages.forEach(stage=>{stage.querySelector('.perimeter-wave').classList.remove('tracing');stage.querySelector('.scene-flare').classList.remove('flashing');});}});
})();
