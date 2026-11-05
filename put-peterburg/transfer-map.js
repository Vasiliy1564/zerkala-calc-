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
 return {boarding:true,station,ride,pattern,stop,next,nearby,service:transportName(ride.transport||pattern.transport||'bus')+' № '+pattern.ref,direction:ride.direction||pattern.to};
}
function walkingMapContext(step){
 const from=step.stationFrom||step.from,station=METRO.get(from?.metroId||from?.id),entry=METRO.get(step.point?.metroId||step.point?.id);
 return {boarding:false,station,entry,stop:step.point,nearby:[],title:entry?'Пешком ко входу в метро':BUS.has(from?.id)?'Остановка → конечный адрес':station?'Выход метро → адрес':'Пешком до места назначения'};
}
function destinationReceipt(ctx,step,container){
 const box=node('section',undefined,'boardingReceipt walkDestinationReceipt');box.dataset.lat=String(ctx.stop.lat);box.dataset.lon=String(ctx.stop.lon);
 box.append(node('div','КУДА ИДТИ','eyebrow'),node('h3',ctx.stop.name));
 const from=step.stationFrom||step.from;
 box.append(node('p',(BUS.has(from?.id)?'Выйдите на остановке: «':'Начало участка: «')+from.name+'».','walkingOriginLabel'));
 box.append(node('p',ctx.entry?'Метка М — вход в метро из доступной базы.':'Метка Б — выбранная точка адреса. Подъезд или вход в здание проверяйте на месте.','hint'));
 const position=node('p','Нажмите «Где я», чтобы увидеть себя на карте.','transferPosition');position.setAttribute('role','status');box.append(position);container.append(box);return box;
}
function locationProviderLabel(provider){return {gps:'Спутники GPS/ГЛОНАСС',network:'Сеть: Wi-Fi / вышки',fused:'Объединённый источник Android'}[provider]||'Система телефона'}
function transferGps(displayApproximate=false){
 if(!transferFix)return null;
 const age=(Date.now()-transferFix.received)/1000+(transferFix.ageSeconds||0);
 return !transferFix.cached&&!transferFix.conflict&&age>=0&&age<=12&&Number.isFinite(transferFix.lat)&&Math.abs(transferFix.lat)<=90&&Number.isFinite(transferFix.lon)&&Math.abs(transferFix.lon)<=180&&Number.isFinite(transferFix.accuracy)&&transferFix.accuracy>0&&transferFix.accuracy<=(displayApproximate?20000:50)?{...transferFix,age}:null;
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
 const fix=transferGps(true);
 for(const el of document.querySelectorAll('.boardingReceipt')){
  const isDestination=el.classList.contains('walkDestinationReceipt'),stop=isDestination?{lat:Number(el.dataset.lat),lon:Number(el.dataset.lon)}:BUS.get(el.dataset.stopId),p=el.querySelector('.transferPosition');if(!stop||!p)continue;
  if(!fix){p.textContent=transferFix?'Свежей точной позиции нет. Нажмите «Где я» на улице.':'Нажмите «Где я», чтобы увидеть своё место на карте.';p.classList.remove('nearStop');continue;}
  if(fix.accuracy>50){p.textContent='Приблизительное положение · погрешность около '+walkingMeters(fix.accuracy)+'. '+locationProviderLabel(fix.provider)+'. Круг показывает область возможного положения. Точную остановку или вход по этой точке определить нельзя.';p.classList.remove('nearStop');continue;}
  const d=distance(fix,stop),opposite=!isDestination&&TRANSIT.busStops.some(s=>s.id!==stop.id&&norm(s.name)===norm(stop.name)&&distance(s,stop)<140&&distance(fix,s)<=d+fix.accuracy);
  const near=d+fix.accuracy<=35&&!opposite;
  p.textContent=(near?(isDestination?'Вы рядом с выбранной точкой адреса. ':'Вы рядом с нужной точкой посадки. '):(isDestination?'До выбранной точки ≈ ':'До точки посадки ≈ ')+walkingMeters(d)+' по прямой. ')+(opposite?'GPS не различает соседние остановки. ':'')+'Точность ±'+Math.round(fix.accuracy)+' м. '+locationProviderLabel(fix.provider)+'. '+(isDestination?'Проверьте вход на месте.':'Сверьте направление.');p.classList.toggle('nearStop',near);
 }
 transferMapView?.updateFix(fix);
}
function makeTransferMap(ctx,state){return putMapRender(ctx,state)}
const transferWalkingPanel=walkingPanel;
walkingPanel=function(guide,step){
 const ctx=transferContext(step)||walkingMapContext(step);
 const state=requestWalking(step),wrap=node('div',undefined,'transferGuide');if(ctx.boarding)transferReceipt(ctx,wrap);else destinationReceipt(ctx,step,wrap);
 if(state.exit)wrap.append(node('p','Выйдите из метро: '+(state.exit.ref?'выход № '+state.exit.ref:'дверь выхода')+' · «'+(ctx.station?.name||step.from.name)+'».','exitInstruction'));
 wrap.append(makeTransferMap(ctx,state));guide.append(wrap);transferWalkingPanel(guide,step);
 guide.querySelector('.walkingScheme')?.remove();
 const intro=guide.querySelector('.walkIntro');if(intro&&state.exit)for(const p of intro.querySelectorAll('p'))p.textContent=p.textContent.replace('Точка А на схеме.','М — выбранный выход на карте.');
 const external=guide.querySelector('.navigationButton');if(external)external.textContent=ctx.boarding?'Вести к этой остановке в 2ГИС':'Вести до этого места в 2ГИС';
 updateTransferLocation();
};
const transferDrawGuidance=drawGuidance;
let transferDrawing=false,transferRedraw=false;
drawGuidance=function(){
 if(transferDrawing){transferRedraw=true;return;}
 transferDrawing=true;
 try{transferMapView=null;transferDrawGuidance();const step=guidancePlan&&guidanceSteps(guidancePlan)[guidanceIndex];if(!step?.boardingRide||step.boardingRide.line)return;const ctx=transferContext(step),guide=$('tripGuide');if(!ctx||!guide)return;const wrap=node('div');transferReceipt(ctx,wrap);wrap.append(makeTransferMap(ctx,null));guide.insertBefore(wrap,guide.querySelector('.guideActions'));updateTransferLocation();}
 finally{transferDrawing=false;if(transferRedraw){transferRedraw=false;drawGuidance();}}
};
const receiveBeforeTransfer=receive;
receive=function(type,data){if(type==='gps'&&Number.isFinite(data?.lat)&&Number.isFinite(data?.lon))transferFix={...data,received:Date.now()};receiveBeforeTransfer(type,data);if(type==='gps'||type==='gpsError'||type==='gpsFinished')updateTransferLocation();};
const transferClearGuidance=clearGuidance;
clearGuidance=function(){transferMapView=null;clearPutMaps();transferClearGuidance()};
setInterval(updateTransferLocation,1000);
// Preserve a chosen mapped exit across steps and resume; GPS origin takes precedence.
const transferGuidanceSteps=guidanceSteps;
guidanceSteps=function(p){return transferGuidanceSteps(p).map(s=>{const station=METRO.get(s.from?.metroId||s.from?.id);return station&&p.exitChoices?.[station.id]?{...s,exitChoice:p.exitChoices[station.id]}:s})};
const transferWalkingEndpoints=walkingEndpoints;
walkingEndpoints=function(step){const result=transferWalkingEndpoints(step),station=METRO.get(step.from?.metroId||step.from?.id);if(!station||!step.exitChoice)return result;const exit=(WALKING_ENTRANCES[station.name]||[]).find(e=>e.osmId===step.exitChoice&&e.entrance!=='entrance'&&e.entrance!=='no'&&!['no','private'].includes(e.access));return exit?{...result,a:exit,exit}:result};
const walkingPanelWithMap=walkingPanel;
walkingPanel=function(guide,step){walkingPanelWithMap(guide,step);const ctx=transferContext(step)||walkingMapContext(step);if(!ctx?.station||step.from.name==='Моё место на улице')return;const exits=(WALKING_ENTRANCES[ctx.station.name]||[]).filter(e=>e.entrance!=='entrance'&&e.entrance!=='no'&&!['no','private'].includes(e.access));if(!exits.length)return;const section=node('details',undefined,'transferExitChoices');section.append(node('summary','Выход метро на карте · '+exits.length+' '+(exits.length===1?'точка':'точки')),node('p','Координаты выходов из OpenStreetMap. Список может быть неполным; открытие дверей сейчас не проверено. По умолчанию выбрана ближайшая к остановке точка по прямой.','hint'));const state=requestWalking(step);for(const exit of exits){const row=node('div',undefined,'exitChoiceRow'),b=node('button',(exit.ref?'Выход № '+exit.ref:'Выход без номера')+' · '+exit.lat.toFixed(5)+', '+exit.lon.toFixed(5),'secondaryWide');const house=nearestHouse(exit,90);if(house)b.append(node('small','Ориентир рядом: '+house.address));b.setAttribute('aria-pressed',String(state.exit?.osmId===exit.osmId));b.onclick=()=>{guidancePlan.exitChoices={...guidancePlan.exitChoices,[ctx.station.id]:exit.osmId};delete guidancePlan.walkOrigins?.[guidanceIndex];walkingIndex=0;walkingActiveKey='';rememberJourney();drawGuidance()};const link=node('a','Источник точки');link.href=exit.source||'https://www.openstreetmap.org/node/'+exit.osmId;row.append(b,link);section.append(row)}const before=guide.querySelector('.walkIntro');guide.insertBefore(section,before||null)};
