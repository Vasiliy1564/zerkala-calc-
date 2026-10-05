(()=>{
const scene=document.querySelector('.studio-scene');if(!scene)return;
const forms={rect:['M150 65H450V497H150Z','Прямоугольник'],circle:['M490 282A190 190 0 1 1 110 282A190 190 0 1 1 490 282Z','Круг'],oval:['M453 282A153 216 0 1 1 147 282A153 216 0 1 1 453 282Z','Овал'],semicircle:['M195 65A216 216 0 0 1 195 497Z','Полукруг'],double:['M195 65H405V347H195Z M195 358H405V497H195Z','Прямоугольник из двух частей']};
function render(shape){const [d,label]=forms[shape];scene.dataset.shape=shape;scene.querySelectorAll('#mirrorClipPath,.mirror-body,.mirror-edge,.mirror-halo').forEach(p=>p.setAttribute('d',d));scene.querySelector('.scene-caption').textContent=label;scene.querySelector('svg').setAttribute('aria-label',label+(scene.classList.contains('lit')?' с подсветкой':' без подсветки'));}
document.querySelectorAll('[data-silhouette]').forEach(b=>b.addEventListener('click',()=>{render(b.dataset.silhouette);document.querySelectorAll('[data-silhouette]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}));
const toggle=document.querySelector('.light-toggle');toggle.addEventListener('click',()=>{const on=scene.classList.toggle('lit');toggle.setAttribute('aria-pressed',String(on));toggle.innerHTML=(on?'Подсветка включена':'Включить подсветку')+' <span>↗</span>';render(scene.dataset.shape)});
render('rect');
const link=document.querySelector('.atelier a[href="#calculator"]');link.addEventListener('click',()=>{const input=document.querySelector('#quote-form input[name="shape"][value="'+scene.dataset.shape+'"]');if(input){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}const light=document.querySelector('#quote-form input[name="light"][value="'+(scene.classList.contains('lit')?'on':'off')+'"]');if(light){light.checked=true;light.dispatchEvent(new Event('change',{bubbles:true}));}});
if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('studio-reveal');observer.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.section-head,.product,.story-copy,.atelier-grid').forEach(e=>observer.observe(e))}
})();




