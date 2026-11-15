(function(){
  var d=document,root=d.documentElement;
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window&&!rm){
    root.classList.add('js-reveal');
    var els=d.querySelectorAll('.section-head,.projects-showcase figure,.products article,.process li,.faq details,.stat,.ba-wrap');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(el,i){el.classList.add('reveal');el.style.transitionDelay=Math.min(i%4,3)*70+'ms';io.observe(el)});
    setTimeout(function(){els.forEach(function(el){var r=el.getBoundingClientRect();if(r.top<innerHeight)el.classList.add('in')})},60);
  }
  var box=d.getElementById('baBox'),rng=d.getElementById('baRange');
  if(box&&rng){var set=function(){box.style.setProperty('--pos',rng.value+'%')};rng.addEventListener('input',set);set()}
  var nums=d.querySelectorAll('[data-count]');
  if(nums.length&&'IntersectionObserver' in window&&!rm){
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io2.unobserve(e.target);var el=e.target,end=+el.dataset.count,suf=el.dataset.suffix||'',t0=performance.now();
      (function tick(t){var p=Math.min((t-t0)/1200,1);el.textContent=Math.round(end*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(tick)})(t0)})},{threshold:.5});
    nums.forEach(function(n){io2.observe(n)});
  }
})();
