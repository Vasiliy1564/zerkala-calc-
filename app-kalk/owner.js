/* Личный блок владельца поверх калькулятора сайта. Загружается только в приложении (/app-kalk/).
   Добавляет: световые полосы, покраску рисунка и отрисовку эскиза (прайс РИАЛ от 14.10.2026), закупку и наценку. */
(function(){
'use strict';
function start(){
 var O=window.MirrorCalcOptions,P=window.MirrorSupplierPricing,field=document.getElementById('mirror-sand-field');
 if(!O||!P||!field||field.dataset.ownerReady)return;field.dataset.ownerReady='1';
 var $=function(id){return document.getElementById(id);};
 var num=function(v){return Number(String(v||'').replace(',','.'));};
 var money=function(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';};
 var f2=function(x){return x.toFixed(2).replace('.',',');};
 var last={q:null,dims:null,facet:0,sand:0};
 var showCost=false;try{showCost=localStorage.getItem('mc_showCost')==='1';}catch(e){}

 /* ---- поля ---- */
 var grid=field.querySelector('.options');
 var lab=document.createElement('label');lab.innerHTML='<input type="radio" name="mirror-sand" value="stripes"><span>Световые полосы</span>';
 grid.insertBefore(lab,grid.children[1]||null);
 var box=document.createElement('div');box.id='owner-stripe-box';
 box.innerHTML='<p class="owner-hint">Светящиеся полосы на лице зеркала: на полосе зеркальный слой снимают, она становится матовой, и лента за ней светит сквозь стекло.</p>'+
  '<label for="owner-stripe-n">Сколько полос</label><select class="mirror-option-select" id="owner-stripe-n"><option>1</option><option selected>2</option><option>3</option><option>4</option></select>'+
  '<label for="owner-stripe-w">Ширина полосы, см</label><input class="mirror-option-select" id="owner-stripe-w" type="text" inputmode="decimal" value="3">'+
  '<label for="owner-stripe-dir">Как идут полосы</label><select class="mirror-option-select" id="owner-stripe-dir"><option value="h">сверху вниз, на всю высоту</option><option value="w">слева направо, на всю ширину</option><option value="p">рамкой по всему периметру</option></select>'+
  '<label for="owner-stripe-bill">Как посчитает поставщик</label><select class="mirror-option-select" id="owner-stripe-bill"><option value="mirror">за всё зеркало (дороже, с запасом)</option><option value="strips">только за сами полосы (дешевле)</option></select>'+
  '<p class="owner-hint" id="owner-stripe-hint"></p>';
 var details=$('mirror-sand-details');details.after(box);
 var extra=document.createElement('div');extra.className='owner-pattern-only';
 extra.innerHTML='<label for="owner-sand-paint">Покраска рисунка с амальгамы</label><select class="mirror-option-select" id="owner-sand-paint"><option value="0">нет, рисунок остаётся матовым</option><option value="1">1 цвет: золото, белый или чёрный</option><option value="2">2 цвета</option><option value="3">3 цвета</option></select>'+
  '<label for="owner-sand-sketch">Эскиз рисунка</label><select class="mirror-option-select" id="owner-sand-sketch"><option value="0">есть готовый макет в векторе</option><option value="1">нужна отрисовка эскиза</option></select>';
 details.appendChild(extra);

 function sandNow(){var el=document.querySelector('input[name="mirror-sand"]:checked');return el?el.value:'none';}
 function mark(){field.dataset.ownerSand=sandNow();}

 /* ---- расчёт ---- */
 function stripeOwn(o,d){
  var per=o.stripeDir==='p',n=per?1:Number(o.stripeN),wcm=num(o.stripeW),W=d.w/1000,H=d.h/1000,t=wcm/100;
  if([1,2,3,4].indexOf(n)<0)throw Error('Укажите, сколько световых полос');
  if(!Number.isFinite(wcm)||wcm<=0)throw Error('Укажите ширину световой полосы в см');
  if(wcm>30)throw Error('Ширина световой полосы не больше 30 см');
  if(per){if(2*t>=Math.min(W,H))throw Error('Рамка шире самого зеркала');return 2*(W+H)*t-4*t*t;}
  return n*(o.stripeDir==='w'?W:H)*t;
 }
 var lookup=P.lookup;
 P.lookup=function(shape,material,width,height,edge,height2,options){
  var q=lookup.apply(this,arguments);
  if(options&&'machine' in options){last.q=q;last.dims={shape:shape,w:Number(width),h:Number(height)+(/double/.test(shape)?Number(height2||0):0)};}
  return q;
 };
 var read=O.read,restore=O.restore,sandCost=O.sandCost,sandLabel=O.sandLabel,facetCost=O.facetCost;
 O.read=function(){var o=read();o.stripeN=$('owner-stripe-n').value;o.stripeW=$('owner-stripe-w').value;o.stripeDir=$('owner-stripe-dir').value;o.stripeBill=$('owner-stripe-bill').value;o.sandPaint=$('owner-sand-paint').value;o.sandSketch=$('owner-sand-sketch').value==='1';return o;};
 O.restore=function(o){o=o||{};restore(o);
  if(o.sand==='stripes'){var r=field.querySelector('input[value="stripes"]');if(r)r.checked=true;}
  $('owner-stripe-n').value=o.stripeN||'2';$('owner-stripe-w').value=o.stripeW||'3';$('owner-stripe-dir').value=o.stripeDir||'h';$('owner-stripe-bill').value=o.stripeBill||'mirror';
  $('owner-sand-paint').value=String(o.sandPaint||'0');$('owner-sand-sketch').value=o.sandSketch?'1':'0';mark();};
 O.facetCost=function(o,q){var v=facetCost(o,q);last.facet=v;return v;};
 O.sandCost=function(o,q){
  var v;
  if(o.sand==='stripes'){var own=stripeOwn(o,last.dims||{w:0,h:0});if(own>q.area+1e-8)throw Error('Полосы не помещаются на зеркале');v=Math.max(500,(o.stripeBill==='strips'?own:q.area)*1900);}
  else{v=sandCost(o,q);if(o.sand==='pattern'){var paint=Number(o.sandPaint||0);if([0,1,2,3].indexOf(paint)<0)throw Error('Выберите покраску рисунка');v+=num(o.sandArea)*1900*paint+(o.sandSketch?1000:0);}}
  last.sand=v;return v;
 };
 O.sandLabel=function(o){
  if(o&&o.sand==='stripes')return 'Световые полосы · '+(o.stripeDir==='p'?'рамкой по периметру':o.stripeN+' шт.')+' · ширина '+String(o.stripeW).replace('.',',')+' см';
  var s=sandLabel(o);if(s&&o.sand==='pattern'){var p=Number(o.sandPaint||0);s+=(p?' · покраска в '+p+(p===1?' цвет':' цвета'):'')+(o.sandSketch?' · отрисовка эскиза':'');}
  return s;
 };
 // Профиль для ленты идёт по тем сторонам, где стоят световые полосы.
 window.MirrorProfileLength=function(len,d){
  if(sandNow()!=='stripes')return len;var dir=$('owner-stripe-dir').value,H=d.shape==='circle'?d.w:d.h+(/double/.test(d.shape)?d.h2:0);
  return dir==='p'?2*(d.w+H)/1000:dir==='w'?2*d.w/1000:len;
 };

 /* ---- блок владельца ---- */
 var panel=document.createElement('div');panel.id='owner-panel';
 panel.innerHTML='<h3>Только для меня</h3><label class="otoggle"><span>Показать закупку и наценку</span><input type="checkbox" id="owner-show-cost"></label><div id="owner-rows"></div><button type="button" id="owner-update" class="owner-btn">Обновить приложение</button><p class="owner-hint" id="owner-update-note"></p><p class="owner-hint"><a href="/app-kalk/classic.html">Открыть прежний калькулятор</a></p>';
 var res=$('calc-result');(res&&res.parentNode?res:field.closest('form')||field).after(panel);
 $('owner-show-cost').checked=showCost;
 $('owner-show-cost').addEventListener('change',function(){showCost=this.checked;try{localStorage.setItem('mc_showCost',showCost?'1':'0');}catch(e){}renderOwner();stripeHint();});
 /* Обновление: приложение открывается из сохранённой копии, кнопка скачивает свежую версию и перезапускает экран. */
 (function(){
  var btn=$('owner-update'),note=$('owner-update-note'),sw=navigator.serviceWorker;
  var stamp=null;try{stamp=localStorage.getItem('mc_updated');}catch(e){}
  note.textContent=stamp?'Последнее обновление: '+stamp+'.':'';
  if(!sw){btn.addEventListener('click',function(){location.reload();});return;}
  sw.addEventListener('message',function(e){
   if(!e.data||e.data.type!=='refreshed')return;
   if(e.data.ok&&!e.data.fail){try{localStorage.setItem('mc_updated',new Date().toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}));}catch(x){}location.reload();}
   else{btn.disabled=false;note.textContent=e.data.ok?'Обновилось не всё: нет связи с сайтом для '+e.data.fail+' файлов. Приложение работает на сохранённой копии, попробуйте ещё раз позже.':'Нет связи с сайтом. Приложение работает на сохранённой копии, попробуйте позже.';}
  });
  btn.addEventListener('click',function(){
   btn.disabled=true;note.textContent='Обновляю…';
   sw.ready.then(function(reg){if(reg.update)reg.update().catch(function(){});var w=reg.active||sw.controller;if(w)w.postMessage({type:'refresh'});else location.reload();})
    .catch(function(){btn.disabled=false;note.textContent='Не удалось обновить.';});
   setTimeout(function(){if(btn.disabled){btn.disabled=false;note.textContent='Сайт не ответил. Приложение работает на сохранённой копии, попробуйте позже.';}},40000);
  });
 })();
 var current=null;
 function orow(a,b,c){return '<div class="orow'+(c?' '+c:'')+'"><span>'+a+'</span><span>'+b+'</span></div>';}
 function renderOwner(){
  var box=$('owner-rows');if(!showCost||!current||!current.mirror||!last.q||last.q.cost==null){box.innerHTML=showCost?'<p class="owner-hint">Нажмите «Рассчитать стоимость».</p>':'';return;}
  var m=current.mirror,mk=P.markup(!!m.light,m.shape),buy=last.q.cost+last.facet+last.sand,trip=0;
  (current.rows||[]).forEach(function(r){if(r.key==='purchase-trip')trip=r.sale||0;});
  var c=orow('Закупка полотна и кромки (РИАЛ)',money(last.q.cost));
  if(last.facet)c+=orow('Закупка фацета',money(last.facet));
  if(last.sand)c+=orow('Закупка пескоструя',money(last.sand));
  c+=orow('Закупка всего',money(buy),'total')+orow('Наценка на полотно и обработку ×'+(mk*100).toFixed(0)+'%',money(buy*mk),'sub');
  if(trip)c+=orow('Поездка за полотном',money(trip),'sub');
  box.innerHTML=c;
 }
 var prior=window.onPersonalCalculation;
 window.onPersonalCalculation=function(data){current=data;if(prior)prior(data);renderOwner();stripeHint();drawStripes();};

 function stripeHint(){
  var el=$('owner-stripe-hint');if(sandNow()!=='stripes'){el.textContent='';return;}
  var o=O.read(),t='';
  try{if(last.dims&&last.q&&last.q.area){var own=stripeOwn(o,last.dims);
   t=(o.stripeDir==='p'?'Рамка по периметру: ':'Сами полосы: ')+f2(own)+' м². Всё зеркало: '+f2(last.q.area)+' м². ';
   if(showCost)t+='Закупка у РИАЛ (1 900 ₽/м², минимум 500 ₽): за сами полосы '+money(Math.max(500,own*1900))+', за всё зеркало '+money(Math.max(500,last.q.area*1900))+'. В заказе № 17591 РИАЛ считал за всё зеркало. ';}}catch(e){}
  var light=document.querySelector('input[name="light"]:checked'),prof=document.querySelector('input[name="option"][value="led-profile"]');
  if((light&&light.value!=='on')||(prof&&!prof.checked))t+='Чтобы полосы светились, включите подсветку и «Светодиодная лента в профиле».';
  el.textContent=t;
 }

 /* ---- полосы на картинке зеркала ---- */
 var svg=$('mirrorSvg'),drawing=false;
 function drawStripes(){
  if(!svg||drawing)return;drawing=true;
  try{
   var old=svg.querySelector('#owner-stripes');if(old)old.remove();
   if(sandNow()==='stripes'&&last.dims){
    var bodies=svg.querySelectorAll('[stroke="#707a74"]'),x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    bodies.forEach(function(b){var bb=b.getBBox();x0=Math.min(x0,bb.x);y0=Math.min(y0,bb.y);x1=Math.max(x1,bb.x+bb.width);y1=Math.max(y1,bb.y+bb.height);});
    var o=O.read(),sw=num(o.stripeW),dw=x1-x0,dh=y1-y0;
    if(bodies.length&&dw>0&&dh>0&&sw>0){
     var k=dw/last.dims.w,t=Math.max(1,sw*10*k),ins=Math.min(30*k,Math.min(dw,dh)/8),n=Number(o.stripeN)||2,g='',i,pos;
     var lightOn=(document.querySelector('input[name="light"]:checked')||{}).value==='on',clr=(document.querySelector('input[name="clr"]:checked')||{}).value;
     var col=lightOn?({warm:'#ffe2a6',neutral:'#fff6e6',cold:'#dcecff'}[clr]||'#ffe2a6'):'#eeece6';
     var bar=function(bx,by,bw,bh){return '<rect x="'+bx.toFixed(2)+'" y="'+by.toFixed(2)+'" width="'+Math.max(0,bw).toFixed(2)+'" height="'+Math.max(0,bh).toFixed(2)+'" fill="'+col+'"/>';};
     if(o.stripeDir==='p')g=bar(x0+ins,y0+ins,dw-2*ins,t)+bar(x0+ins,y1-ins-t,dw-2*ins,t)+bar(x0+ins,y0+ins,t,dh-2*ins)+bar(x1-ins-t,y0+ins,t,dh-2*ins);
     else if(o.stripeDir==='w'){for(i=0;i<n;i++){pos=n===1?(dh-t)/2:ins+i*(dh-2*ins-t)/(n-1);g+=bar(x0+ins,y0+pos,dw-2*ins,t);}}
     else{for(i=0;i<n;i++){pos=n===1?(dw-t)/2:ins+i*(dw-2*ins-t)/(n-1);g+=bar(x0+pos,y0+ins,t,dh-2*ins);}}
     svg.insertAdjacentHTML('beforeend','<g id="owner-stripes" clip-path="url(#realMirrorClip)"'+(lightOn?' style="filter:drop-shadow(0 0 1.5px '+col+')"':'')+'>'+g+'</g>');
    }
   }
  }catch(e){}
  drawing=false;
 }
 if(svg&&window.MutationObserver)new MutationObserver(function(){if(!drawing&&!svg.querySelector('#owner-stripes'))setTimeout(drawStripes,0);}).observe(svg,{childList:true});

 function recalc(){mark();if(window.calculateMirrorInPlace)window.calculateMirrorInPlace();stripeHint();drawStripes();}
 field.addEventListener('change',function(){mark();setTimeout(function(){stripeHint();drawStripes();},0);});
 $('owner-stripe-w').addEventListener('input',recalc);
 document.addEventListener('change',function(e){if(e.target&&(e.target.name==='light'||e.target.name==='clr'||e.target.name==='option'))setTimeout(function(){stripeHint();drawStripes();},0);});
 mark();renderOwner();
}
if(document.readyState==='complete')start();else window.addEventListener('load',start);
document.addEventListener('DOMContentLoaded',function(){setTimeout(start,0);});
})();
