(()=>{
 'use strict';
 const section=document.getElementById('projects');if(!section)return;
 const cards=[...section.querySelectorAll('.project')],more=section.querySelector('.gallery-more'),filters=[...section.querySelectorAll('[data-filter]')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let expanded=false,category='all';
 function update(){let count=0;cards.forEach(card=>{const matches=category==='all'||(card.dataset.category||'').split(/\s+/).includes(category);card.hidden=!matches||(!expanded&&count>=4);if(matches)count++;});more.hidden=count<=4;more.setAttribute('aria-expanded',String(expanded));more.textContent=expanded?'Свернуть работы':'Показать все работы ('+count+')';filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));}
 more.addEventListener('click',()=>{expanded=!expanded;update();if(!expanded&&more.getBoundingClientRect().top<0)section.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});
 filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;expanded=false;update();}));
 update();
})();
