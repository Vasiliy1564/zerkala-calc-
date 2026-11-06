(()=>{
 'use strict';
 const section=document.getElementById('projects');if(!section)return;
 const cards=[...section.querySelectorAll('.project')],more=section.querySelector('.gallery-more'),motion=section.querySelector('.gallery-motion'),filters=[...section.querySelectorAll('[data-filter]')],reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 let expanded=false,category='all',enabled=!reduced.matches;
 function update(){let count=0;cards.forEach(card=>{const matches=category==='all'||(card.dataset.category||'').split(/\s+/).includes(category);card.hidden=!matches||(!expanded&&count>=4);if(matches)count++;});more.hidden=count<=4;more.setAttribute('aria-expanded',String(expanded));more.textContent=expanded?'Свернуть работы':'Показать все работы ('+count+')';filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));}
 more.addEventListener('click',()=>{expanded=!expanded;update();if(!expanded&&more.getBoundingClientRect().top<0)section.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});
 filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;expanded=false;update();}));
 function reset(card){card.style.removeProperty('--work-rx');card.style.removeProperty('--work-ry');}
 function syncMotion(){document.documentElement.classList.toggle('gallery-still',!enabled);motion.setAttribute('aria-pressed',String(enabled));motion.textContent=enabled?'Анимация включена':'Анимация выключена';cards.forEach(reset);}
 motion.hidden=false;motion.addEventListener('click',()=>{enabled=!enabled&&!reduced.matches;syncMotion();});reduced.addEventListener('change',()=>{enabled=!reduced.matches;syncMotion();});
 cards.forEach(card=>{let frame=0;card.addEventListener('pointermove',e=>{if(!enabled||!fine.matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect();card.style.setProperty('--work-rx',((.5-(e.clientY-r.top)/r.height)*5)+'deg');card.style.setProperty('--work-ry',(((e.clientX-r.left)/r.width-.5)*7)+'deg');});});card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);reset(card);});});
 if('IntersectionObserver'in window){const seen=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){if(enabled)e.target.classList.add('work-pass');seen.unobserve(e.target);}}),{threshold:.35});cards.forEach(c=>{seen.observe(c);c.addEventListener('animationend',e=>{if(e.animationName==='work-light-pass')c.classList.remove('work-pass');});});}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cards.forEach(c=>{c.classList.remove('work-pass');reset(c);});});
 update();syncMotion();
})();
