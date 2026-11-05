/* Exit-to-platform guidance. Coordinates come from the selected directed trip;
   no nearest-stop replacement, road-side inference, or fabricated crossings. */
let transferFix=null,transferMapView=null;
function transferContext(step){
 const station=METRO.get((step.stationFrom||step.from)?.metroId||(step.stationFrom||step.from)?.id);
 const ride=step.boardingRide||step.nextRide;
 if(!ride||ride.line)return null;
 const pattern=patternById.get(ride.route),stop=BUS.get(ride.from);
 if(!pattern||!stop||stop.id!==step.point?.id||stop.pickup===false)return null;
 const next=BUS.get(ride.stops[1]);
 const nearby=TRANSIT.busStops.filter(s=>s.id!==stop.id&&s.transport!=='rail'&&distance(stop,s)<140&&norm(s.name)===norm(stop.name));
 return {station,ride,pattern,stop,next,nearby,service:transportName(ride.transport||pattern.transport||'bus')+' № '+pattern.ref,direction:ride.direction||pattern.to};
}
function transferGps(){
 if(!transferFix)return null;
 const age=(Date.now()-transferFix.received)/1000+(transferFix.ageSeconds||0);
 return !transferFix.cached&&!transferFix.conflict&&age<=12&&Number.isFinite(transferFix.accuracy)&&transferFix.accuracy<=50?{...transferFix,age}:null;
}
function transferReceipt(ctx,container){
 const box=node('section',undefined,'boardingReceipt');box.append(node('div','ВАША ОСТАНОВКА','eyebrow'),node('h3',ctx.service),node('strong','«'+ctx.stop.name+'»'),node('p','В сторону «'+ctx.direction+'»','boardingDirection'));
 if(ctx.next)box.append(node('p','Следующая после посадки: «'+ctx.next.name+'»','nextStopCheck'));
 const landmark=nearestHouse(ctx.stop,90);if(landmark)box.append(node('p','Рядом с точкой посадки: '+landmark.address+' (адрес-ориентир, около '+landmark.distanceMeters+' м).','hint'));
 const check=node('p','Сверьте номер и направление на табличке транспорта.','hint');box.append(check);
 const near=node('p','Включите «Где я», чтобы увидеть своё место на карте.','transferPosition');near.setAttribute('role','status');box.append(near);
 box.dataset.stopId=ctx.stop.id;container.append(box);return box;
}
function updateTransferLocation(){
 const fix=transferGps();
 for(const el of document.querySelectorAll('.boardingReceipt')){
  const stop=BUS.get(el.dataset.stopId),p=el.querySelector('.transferPosition');if(!stop||!p)continue;
  if(!fix){p.textContent=transferFix?'Свежей точной позиции нет. Нажмите «Где я» на улице.':'Нажмите «Где я», чтобы увидеть своё место на карте.';p.classList.remove('nearStop');continue;}
  const d=distance(fix,stop),opposite=TRANSIT.busStops.some(s=>s.id!==stop.id&&norm(s.name)===norm(stop.name)&&distance(s,stop)<140&&distance(fix,s)<=d+fix.accuracy);
  const near=d+fix.accuracy<=35&&!opposite;
  p.textContent=(near?'Вы рядом с нужной точкой посадки. ':'До точки посадки ≈ '+walkingMeters(d)+' по прямой. ')+(opposite?'GPS не различает соседние остановки. ':'')+'Точность ±'+Math.round(fix.accuracy)+' м. Сверьте направление.';p.classList.toggle('nearStop',near);
 }
 transferMapView?.updateFix(fix);
}
function makeTransferMap(ctx,state){
 const section=node('section',undefined,'transferMapSection'),toolbar=node('div',undefined,'transferMapToolbar');toolbar.append(node('strong','Выход → ваша остановка'),node('span','Север ↑'));
 const frame=node('div',undefined,'transferMap'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 360 300');svg.setAttribute('role','img');svg.setAttribute('aria-label','Карта выхода метро и остановки '+ctx.stop.name+' для '+ctx.service+' в сторону '+ctx.direction);frame.append(svg);
 const caption=node('p','Загружаем карту улиц…','transferMapStatus');caption.setAttribute('role','status');
 const route=state?.state==='ready'?state.route:null,origin=state?.a||ctx.stop,exit=state?.exit;
 const base=[origin,ctx.stop,...(route?.coordinates||[]).map(p=>({lon:p[0],lat:p[1]}))];
 const world=(p,z)=>{const n=256*2**z,s=Math.sin(p.lat*Math.PI/180);return [n*(p.lon+180)/360,n*(.5-Math.log((1+s)/(1-s))/(4*Math.PI))]};
 const unworld=(p,z)=>{const n=256*2**z;return {lon:p[0]/n*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*p[1]/n)))*180/Math.PI}};
 let zoom=17,center,fix=transferGps(),layers={};
 function fit(){zoom=18;for(;zoom>12;zoom--){const ps=base.map(p=>world(p,zoom));if(Math.max(...ps.map(p=>p[0]))-Math.min(...ps.map(p=>p[0]))<250&&Math.max(...ps.map(p=>p[1]))-Math.min(...ps.map(p=>p[1]))<190)break;}const ps=base.map(p=>world(p,zoom));center=unworld([(Math.min(...ps.map(p=>p[0]))+Math.max(...ps.map(p=>p[0])))/2,(Math.min(...ps.map(p=>p[1]))+Math.max(...ps.map(p=>p[1])))/2],zoom);}
 function element(parent,tag,attrs={},text){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;parent.append(e);return e;}
 function project(p){const a=world(p,zoom),c=world(center,zoom);return [a[0]-c[0]+180,a[1]-c[1]+150]}
 function mark(p,label,color,r=15,parent=layers.marks){const [x,y]=project(p);element(parent,'circle',{cx:x,cy:y,r,fill:color,stroke:'#fff','stroke-width':3});if(label)element(parent,'text',{x,y:y+4,'text-anchor':'middle',fill:'#fff','font-size':12,'font-weight':800},label);}
 function drawFix(){if(!layers.gps)return;layers.gps.replaceChildren();if(!fix)return;const [x,y]=project(fix),mpp=156543.03392*Math.cos(fix.lat*Math.PI/180)/2**zoom;const radius=Math.min(200,fix.accuracy/mpp);element(layers.gps,'circle',{cx:x,cy:y,r:radius,fill:'#2573eb','fill-opacity':.1,stroke:'#2573eb','stroke-opacity':.3});mark(fix,'Я','#1764ce',12,layers.gps);}
 function paint(){
  svg.replaceChildren();layers={tiles:element(svg,'g'),route:element(svg,'g'),marks:element(svg,'g'),gps:element(svg,'g')};const c=world(center,zoom),left=c[0]-180,top=c[1]-150;let loaded=0,failed=0,total=0;const generation=layers.tiles;
  const status=()=>{if(generation!==layers.tiles)return;caption.textContent=loaded?'Карта улиц · М — выход, С — сесть, Я — ваше место. Перетаскивайте карту; масштаб — кнопками.':failed===total?'Карта улиц недоступна. Показана только схема точек'+(route?' и рассчитанного пути':'')+'. Откройте 2ГИС для проверки переходов.':'Загружаем карту улиц…';};
  for(let x=Math.floor(left/256);x<=Math.floor((left+360)/256);x++)for(let y=Math.floor(top/256);y<=Math.floor((top+300)/256);y++){
   total++;const tile=element(layers.tiles,'image',{x:x*256-left,y:y*256-top,width:256,height:256,href:'https://tile.openstreetmap.org/'+zoom+'/'+x+'/'+y+'.png'});tile.addEventListener('load',()=>{loaded++;status()});tile.addEventListener('error',()=>{failed++;status()});
  }
  if(route)element(layers.route,'path',{d:route.coordinates.map((p,i)=>(i?'L':'M')+project({lon:p[0],lat:p[1]}).join(' ')).join(' '),stroke:'#fff','stroke-width':9,fill:'none','stroke-linejoin':'round'});
  if(route)element(layers.route,'path',{d:route.coordinates.map((p,i)=>(i?'L':'M')+project({lon:p[0],lat:p[1]}).join(' ')).join(' '),stroke:'#175ed0','stroke-width':5,fill:'none','stroke-linejoin':'round'});
  for(const stop of ctx.nearby)mark(stop,'','#a8b5aa',7);
  if(ctx.station)for(const e of WALKING_ENTRANCES[ctx.station.name]||[])if(e.osmId!==exit?.osmId&&e.entrance!=='entrance'&&!['no','private'].includes(e.access))mark(e,'','#8065aa',6);
  if(route?.steps[walkingIndex]?.location&&walkingIndex>0){const xy=route.steps[walkingIndex].location;mark({lon:xy[0],lat:xy[1]},String(walkingIndex+1),'#a56512',11);}
  if(ctx.next){const a=project(ctx.stop),b=project(ctx.next),d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>1){const v=[(b[0]-a[0])/d,(b[1]-a[1])/d],tip=[a[0]+v[0]*52,a[1]+v[1]*52],end=[tip[0]-v[0]*10,tip[1]-v[1]*10];element(layers.route,'path',{d:'M'+a.join(' ')+'L'+tip.join(' ')+'M'+[end[0]-v[1]*6,end[1]+v[0]*6].join(' ')+'L'+tip.join(' ')+'L'+[end[0]+v[1]*6,end[1]-v[0]*6].join(' '),stroke:'#c33223','stroke-width':4,fill:'none'});}}
  if(state){mark(origin,exit?'М':ctx.station&&!stepOriginIsGps(state)?'?':'А',exit?'#bf3528':'#655b4c');}
  mark(ctx.stop,'С','#c33223',17);drawFix();
 }
 function stepOriginIsGps(s){return s.a?.name==='Моё место на улице'}
 const controls=node('div',undefined,'transferMapControls');
 function button(label,aria,fn){const b=node('button',label);b.type='button';b.setAttribute('aria-label',aria);b.onclick=fn;controls.append(b);}
 button('+','Увеличить карту',()=>{zoom=Math.min(19,zoom+1);paint()});button('−','Уменьшить карту',()=>{zoom=Math.max(12,zoom-1);paint()});button('Весь путь','Показать весь пеший путь',()=>{fit();paint()});button('Где я','Показать моё место',()=>{const p=transferGps();if(p){center=p;zoom=18;paint()}else if(typeof Phone!=='undefined'){Phone.locate();say('Определяем ваше место на улице.')}});
 let drag=null;svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,center:world(center,zoom)};svg.setPointerCapture?.(e.pointerId)});svg.addEventListener('pointermove',e=>{if(!drag)return;const scale=360/(svg.getBoundingClientRect().width||360);center=unworld([drag.center[0]-(e.clientX-drag.x)*scale,drag.center[1]-(e.clientY-drag.y)*scale],zoom);layers.tiles.setAttribute('opacity','.6');});svg.addEventListener('pointerup',()=>{if(drag){drag=null;paint()}});svg.addEventListener('pointercancel',()=>{drag=null;paint()});
 const attribution=node('a','© OpenStreetMap');attribution.href='https://www.openstreetmap.org/copyright';attribution.className='transferAttribution';frame.append(attribution);section.append(toolbar,frame,controls,caption);
 const legend=node('p','Красная стрелка — направление к следующей остановке по базе рейса; изгибы дороги она не показывает. Серые точки — соседние одноимённые остановки; фиолетовые — другие выходы метро.','hint');section.append(legend);
 if(state&&!exit&&ctx.station&&origin.name!=='Моё место на улице')section.append(node('p','? — координата станции, дверь выхода пока не подтверждена. На улице нажмите «Где я» и «Путь от моего места».','routeCaution'));
 fit();paint();transferMapView={updateFix(p){fix=p;drawFix()}};return section;
}
const transferWalkingPanel=walkingPanel;
walkingPanel=function(guide,step){
 const ctx=transferContext(step);if(!ctx){transferWalkingPanel(guide,step);return;}
 const state=requestWalking(step),wrap=node('div',undefined,'transferGuide');transferReceipt(ctx,wrap);
 if(state.exit)wrap.append(node('p','Выйдите из метро: '+(state.exit.ref?'выход № '+state.exit.ref:'дверь выхода')+' · «'+(ctx.station?.name||step.from.name)+'».','exitInstruction'));
 wrap.append(makeTransferMap(ctx,state));guide.append(wrap);transferWalkingPanel(guide,step);
 guide.querySelector('.walkingScheme')?.remove();
 const intro=guide.querySelector('.walkIntro');if(intro&&state.exit)for(const p of intro.querySelectorAll('p'))p.textContent=p.textContent.replace('Точка А на схеме.','М — выбранный выход на карте.');
 const external=guide.querySelector('.navigationButton');if(external)external.textContent='Вести к этой остановке в 2ГИС';
 updateTransferLocation();
};
const transferDrawGuidance=drawGuidance;
drawGuidance=function(){transferMapView=null;transferDrawGuidance();const step=guidancePlan&&guidanceSteps(guidancePlan)[guidanceIndex];if(!step?.boardingRide||step.boardingRide.line)return;const ctx=transferContext(step),guide=$('tripGuide');if(!ctx||!guide)return;const wrap=node('div');transferReceipt(ctx,wrap);wrap.append(makeTransferMap(ctx,null));guide.insertBefore(wrap,guide.querySelector('.guideActions'));updateTransferLocation();};
const receiveBeforeTransfer=receive;
receive=function(type,data){if(type==='gps'&&Number.isFinite(data?.lat)&&Number.isFinite(data?.lon))transferFix={...data,received:Date.now()};receiveBeforeTransfer(type,data);if(type==='gps'||type==='gpsError'||type==='gpsFinished')updateTransferLocation();};
const transferClearGuidance=clearGuidance;
clearGuidance=function(){transferMapView=null;transferClearGuidance()};
setInterval(updateTransferLocation,1000);
// Preserve a chosen mapped exit across steps and resume; GPS origin takes precedence.
const transferGuidanceSteps=guidanceSteps;
guidanceSteps=function(p){return transferGuidanceSteps(p).map(s=>{const station=METRO.get(s.from?.metroId||s.from?.id);return station&&p.exitChoices?.[station.id]?{...s,exitChoice:p.exitChoices[station.id]}:s})};
const transferWalkingEndpoints=walkingEndpoints;
walkingEndpoints=function(step){const result=transferWalkingEndpoints(step),station=METRO.get(step.from?.metroId||step.from?.id);if(!station||!step.exitChoice)return result;const exit=(WALKING_ENTRANCES[station.name]||[]).find(e=>e.osmId===step.exitChoice&&e.entrance!=='entrance'&&e.entrance!=='no'&&!['no','private'].includes(e.access));return exit?{...result,a:exit,exit}:result};
const walkingPanelWithMap=walkingPanel;
walkingPanel=function(guide,step){walkingPanelWithMap(guide,step);const ctx=transferContext(step);if(!ctx?.station||step.from.name==='Моё место на улице')return;const exits=(WALKING_ENTRANCES[ctx.station.name]||[]).filter(e=>e.entrance!=='entrance'&&e.entrance!=='no'&&!['no','private'].includes(e.access));if(!exits.length)return;const section=node('details',undefined,'transferExitChoices');section.append(node('summary','Выход метро на карте · '+exits.length+' '+(exits.length===1?'точка':'точки')),node('p','Координаты выходов из OpenStreetMap. Список может быть неполным; открытие дверей сейчас не проверено. По умолчанию выбрана ближайшая к остановке точка по прямой.','hint'));const state=requestWalking(step);for(const exit of exits){const row=node('div',undefined,'exitChoiceRow'),b=node('button',(exit.ref?'Выход № '+exit.ref:'Выход без номера')+' · '+exit.lat.toFixed(5)+', '+exit.lon.toFixed(5),'secondaryWide');const house=nearestHouse(exit,90);if(house)b.append(node('small','Ориентир рядом: '+house.address));b.setAttribute('aria-pressed',String(state.exit?.osmId===exit.osmId));b.onclick=()=>{guidancePlan.exitChoices={...guidancePlan.exitChoices,[ctx.station.id]:exit.osmId};delete guidancePlan.walkOrigins?.[guidanceIndex];walkingIndex=0;walkingActiveKey='';rememberJourney();drawGuidance()};const link=node('a','Источник точки');link.href=exit.source||'https://www.openstreetmap.org/node/'+exit.osmId;row.append(b,link);section.append(row)}const before=guide.querySelector('.walkIntro');guide.insertBefore(section,before||null)};
