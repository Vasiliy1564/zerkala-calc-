/* A transport preference never prevents a necessary connecting service. */
const AUTO_KINDS=['bus','tram','trolley','rail'];
const airportStop=TRANSIT.busStops.find(s=>s.id==='g25208');
const AIRPORT={...airportStop,id:'pulkovo-terminal',kind:'address',name:'Аэропорт Пулково · пассажирский терминал',aliases:['Пулково','аэропорт','аэропорт Пулково']};
const baseMatches=matches;
matches=function(q,preference){const list=baseMatches(q,'all');if(/пулков|^аэропорт$/i.test(q)&&airportStop)return [AIRPORT,...list.filter(s=>!/^АЭРОПОРТ "ПУЛКОВО"/.test(s.name))].slice(0,14);return list};

function autoPoint(p,pickup){
 if(!BUS.has(p.id)||BUS.get(p.id)[pickup?'pickup':'dropoff']!==false)return p;
 return {...p,kind:'address',id:'place:'+p.id,metroId:undefined};
}
function addConnectorPlans(from,to,save){
 // Also enumerate direct first/last-mile services. This provides alternatives
 // that a single shortest-path profile could otherwise hide.
 for(const reverse of [false,true]){
  const metroPoint=reverse?to:from,surfacePoint=reverse?from:to;
  const station=metroPoint.metroId?METRO.get(metroPoint.metroId):nearest(metroPoint,TRANSIT.metro.filter(s=>!s.closed),1000,1)[0]?.s;
  if(!station||station.closed)continue;
  const ends=new Map(endpointCandidates(surfacePoint,reverse,false).map(x=>[x.s.id,x.d]));
  for(const r of TRANSIT.busRoutes){
   if(!r.stops.some(id=>ends.has(id)))continue;
   let best=null;
   for(let i=0;i<r.stops.length-1;i++)for(let j=i+1;j<r.stops.length;j++){
    const gatewayId=r.stops[reverse?j:i],placeId=r.stops[reverse?i:j];
    if(!ends.has(placeId))continue;
    const boarding=BUS.get(r.stops[i]),alighting=BUS.get(r.stops[j]);
    if(boarding.pickup===false||alighting.dropoff===false)continue;
    const gateway=BUS.get(gatewayId),near=nearest(gateway,TRANSIT.metro.filter(s=>!s.closed),450,1)[0];
    if(!near)continue;
    try{
     const m=metroPlan({...station,metroId:station.id},{...near.s,metroId:near.s.id},'time');
     const metro=reverse?metroPlan({...near.s,metroId:near.s.id},{...station,metroId:station.id},'time'):m;
     const ride={type:'ride',route:r.id,transport:r.transport||'bus',from:r.stops[i],to:r.stops[j],stops:r.stops.slice(i,j+1)};
     const walk={type:'walk',from:reverse?gateway.id:near.s.id,stopTo:reverse?near.s.id:gateway.id,meters:near.d,pointFrom:reverse?gateway:near.s,pointTo:reverse?near.s:gateway,unverified:true};
     const p=routeMetrics({mode:'all',start:reverse?placeId:metro.start,end:reverse?metro.end:placeId,access:reverse?ends.get(placeId):distance(from,station),egress:reverse?distance(to,station):ends.get(placeId),legs:reverse?[ride,walk,...metro.legs]:[...metro.legs,walk,ride]});
     if(!best||planTimeScore(p)<planTimeScore(best)||planTimeScore(p)===planTimeScore(best)&&p.metrics.walk<best.metrics.walk)best=p;
    }catch(e){}
   }
   if(best)save(best);
  }
 }
}
function smartRouteOptions(rawFrom,rawTo,preference='all'){
 const from=autoPoint(rawFrom,true),to=autoPoint(rawTo,false),out=[],seen=new Map();
 // Profiles can reach the same stops via different metro transfers. Keep the
 // better complete journey, rather than whichever profile happened to run first.
 const save=p=>{if(!p)return;trimEdgeTransfers(p,from,to);/* Fix 0.45: «автобус от метро Парнас до метро Парнас» — не вариант. */if(p.legs.some(l=>l.type==='ride'&&!l.line&&BUS.get(l.from)&&BUS.get(l.to)&&distance(BUS.get(l.from),BUS.get(l.to))<300))return;routeMetrics(p);if(p.metrics.walk>3500)return;const key=routeKey(p),index=seen.get(key);if(index===undefined){seen.set(key,out.length);out.push(p)}else{const previous=out[index];if(planTimeScore(p)<planTimeScore(previous)||planTimeScore(p)===planTimeScore(previous)&&p.metrics.walk<previous.metrics.walk)out[index]=p}};
 try{const p=simpleMetroPlan(from,to);if(p.access<=1000&&p.egress<=1000)save(p)}catch(e){}
 // Enumerate nearby metro endpoints instead of locking only the nearest station.
 for(const a of (from.metroId?[{s:METRO.get(from.metroId),d:0}]:nearest(from,TRANSIT.metro.filter(s=>!s.closed),1600,4)))for(const b of (to.metroId?[{s:METRO.get(to.metroId),d:0}]:nearest(to,TRANSIT.metro.filter(s=>!s.closed),1600,4))){for(const profile of ['time','transfers'])try{const p=metroPlan({...a.s,metroId:a.s.id},{...b.s,metroId:b.s.id},profile);p.access=a.d;p.egress=b.d;save(p)}catch(e){}}
 directPlans(from,to,AUTO_KINDS).forEach(save);
 for(const profile of ['time','transfers','walk','stops']){try{save(advancedPlan(from,to,AUTO_KINDS,true,profile))}catch(e){}}
 addConnectorPlans(from,to,save);
 if(preference==='metro'&&distance(from,to)>100)for(const maxWalk of [700,Infinity]){let found=null;for(const profile of ['time','transfers']){try{found=advancedPlan(from,to,AUTO_KINDS,true,profile,new Set(),'metro',maxWalk)}catch(e){}if(found)break}if(found){save(found);break}}

 const hasPreference=p=>p.legs.some(l=>l.type==='ride'&&(l.transport|| (l.line?'metro':'bus'))===preference);
 // Generalized ranking discourages extra changes and surface boardings.
 // Penalties are selection weights, not timetable or waiting-time predictions.
 const rank=p=>planTimeScore(p)+p.legs.filter(l=>l.type==='ride'&&!l.line).length*10;
 const compare=(a,b)=>rank(a)-rank(b)||a.metrics.transfers-b.metrics.transfers||a.metrics.walk-b.metrics.walk||Number(hasPreference(b))-Number(hasPreference(a));
 // Metro is the core of this mode; buses remain available at both ends.
 const metroPlans=out.filter(p=>hasPreference(p));
 const assisted=preference==='metro'&&metroPlans.some(p=>p.access<=700&&p.egress<=700);
 /* Fix 0.45: «Автобус», «Трамвай» и т. д. раньше не влияли на выбор: теперь маршрут с выбранным транспортом идёт первым, если он не более чем вдвое дольше лучшего. */const bestScore=Math.min(...out.map(rank)),preferred=p=>preference==='metro'?hasPreference(p):preference!=='all'&&hasPreference(p)&&rank(p)<=bestScore*2;
 out.sort((a,b)=>(Number(preferred(b))-Number(preferred(a)))||(assisted?Number(b.access<=700&&b.egress<=700)-Number(a.access<=700&&a.egress<=700):0)||compare(a,b));
 // First retain distinct services (101 and 101Э are different services).
 // Several boarding/alighting variants of one service must not fill every slot.
 const serviceKey=p=>p.legs.filter(l=>l.type==='ride').map(l=>l.line?'metro:'+l.line:(l.transport||'bus')+':'+patternById.get(l.route).ref).join('|');
 const selected=[],services=new Set();
 for(const p of out){const key=serviceKey(p);if(services.has(key))continue;services.add(key);selected.push(p);if(selected.length===6)break}
 if(selected.length<6)for(const p of out){if(!selected.includes(p))selected.push(p);if(selected.length===6)break}
 // Preserve a metro-only alternative even when many surface variants rank ahead.
 const underground=out.find(p=>p.legs.some(l=>l.type==='ride'&&l.line)&&p.legs.every(l=>l.type!=='ride'||l.line));
 if(underground&&!selected.includes(underground))selected[selected.length-1]=underground;
 const fewer=out.filter(p=>p.legs.some(l=>l.type==='ride'&&l.line)&&p.legs.every(l=>l.type!=='ride'||l.line)).sort((a,b)=>a.metrics.transfers-b.metrics.transfers||compare(a,b))[0];if(fewer&&!selected.includes(fewer))selected[selected.length-1]=fewer;
 return selected;
}

function arrivalLabel(p){const leg=p.legs.filter(l=>l.type==='ride').at(-1);return leg?'Выйти: «'+planTable(leg).get(leg.to).name+'»':'Пешком до места назначения'}
function shortRoute(p){return p.legs.filter(l=>l.type==='ride').map(l=>l.line?'Метро '+l.line:transportName(l.transport)+' '+patternById.get(l.route).ref).join(' → ')||'Пешком'}
function metroTransferSummary(p){
 const metro=p.legs.filter(l=>l.type==='ride'&&l.line);
 if(!metro.length)return '';
 const transfers=p.legs.filter(l=>l.type==='transfer');
 if(metro.length===1&&!transfers.length)return 'Метро по одной ветке, без пересадок · линия '+metro[0].line;
 return 'Метро с пересадкой: '+metro.map(l=>'линия '+l.line).join(' → ');
}
function transferCountText(n){return n+' '+(n%10===1&&n%100!==11?'пересадка':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'пересадки':'пересадок')}
function showSmartOptions(options){
 const choices=$('choices');$('results').after(choices);
 function alternatives(current){
  choices.replaceChildren();if(options.length<2)return;
  const more=node('details',undefined,'card alternativeRoutes');more.append(node('summary','Другие маршруты ('+(options.length-1)+')'));
  for(const [i,p] of options.entries()){
   if(i===current)continue;
   const b=node('button',undefined,'routeChoice');b.setAttribute('aria-pressed','false');
   b.append(coloredRoute(p,'strong'),node('small','≈ '+timeRange(p.metrics.time)+' · '+transferCountText(p.metrics.transfers)),node('small','Пешком суммарно: около '+p.metrics.walk+' м по прямой'),node('small',arrivalLabel(p)));
   b.onclick=()=>{more.open=false;renderPlan(p);alternatives(i);say('Маршрут выбран.');$('results').scrollIntoView({behavior:'smooth',block:'start'})};more.append(b);
  }
  choices.append(more);
 }
 renderPlan(options[0]);alternatives(0);
}
function useAirportExample(){setMode('all');pick('from',{...METRO.get('m1_0'),metroId:'m1_0',kind:'metro'});pick('to',AIRPORT);buildRoute()}

function stationExitHint(station,nextRide){
 if(!nextRide?.route)return '';
 const ref=patternById.get(nextRide.route).ref;
 if(station.name==='Московская'&&['39','39Э'].includes(ref))return 'По указателям к аэропорту: вестибюль № 2, к Алтайской улице. На улице найдите остановку автобуса № '+ref+' в сторону Пулково.';
 if(station.name==='Проспект Ветеранов'&&ref==='82Э')return 'Выход через вестибюль № 2 к проспекту Ветеранов. Найдите остановку № 82Э в сторону аэропорта Пулково.';
 return 'Выйдите из метро и найдите указанную остановку. Проверьте сторону дороги и конечную на табличке транспорта.';
}
function guidanceSteps(p){
 const steps=[],rides=p.legs.filter(l=>l.type==='ride');
 const first=rides[0];if(!first)return steps;
 const firstStop=planTable(first).get(first.from);
 if(p.access>=35)steps.push({title:'Дойдите до места посадки',text:firstStop.name+'. Около '+Math.round(p.access)+' м по прямой; путь по улицам может быть длиннее.',point:firstStop,from:points.from,nextRide:first,kind:'pedestrian',done:'Я на месте посадки'});
 for(let i=0;i<p.legs.length;i++){
  const leg=p.legs[i],next=p.legs.slice(i+1).find(l=>l.type==='ride');
  if(leg.type==='transfer'){steps.push({title:'Пересадка в метро',text:leg.instruction||('По указателям перейдите со станции «'+METRO.get(leg.from).name+'» на «'+METRO.get(leg.to).name+'», линия № '+METRO.get(leg.to).line+'.'),point:METRO.get(leg.to),line:METRO.get(leg.to).line,fromLine:METRO.get(leg.from).line,done:'Я перешёл на нужную линию'});continue}
  if(leg.type==='walk'){
   const a=leg.pointFrom||BUS.get(leg.from)||METRO.get(leg.from),b=leg.pointTo||BUS.get(leg.stopTo)||METRO.get(leg.stopTo);if(!a||!b)continue;
   steps.push({title:METRO.has(a.id)?'Выйдите из метро к остановке':METRO.has(b.id)?'Пройдите к метро':'Перейдите на следующую остановку',text:(METRO.has(a.id)?stationExitHint(a,next)+' ':'')+a.name+' → '+b.name+'. Около '+Math.round(leg.meters)+' м по прямой. Пешеходный путь проверьте на карте.',point:b,from:a,nextRide:next,kind:'pedestrian',done:'Я у места пересадки'});continue;
  }
  if(leg.type!=='ride')continue;
  const table=planTable(leg),a=table.get(leg.from),b=table.get(leg.to),r=leg.route?patternById.get(leg.route):null;
  const service=leg.line?'метро, линия № '+leg.line+' · '+LINES.get(leg.line).name:transportName(leg.transport)+(leg.transport==='rail'?'':' № '+r.ref);
  const direction=leg.line?metroDirection(leg).terminus:leg.direction||r?.to;
  const boarding=leg.boardPlatform?' Зал «'+leg.boardPlatform.station+'-'+leg.boardPlatform.hall+'».':'';
  steps.push({title:'Сядьте: '+service,text:(leg.line?'Станция посадки: «':'Остановка посадки: «')+a.name+'».'+boarding+'\nВ сторону конечной '+(leg.line?'станции':'остановки')+' «'+direction+'».\nЕхать '+stopsText(leg.stops.length-1,true)+'.\n'+(leg.line?'Выйти на станции: «':'Выйти на остановке: «')+b.name+'».',point:a,line:leg.line,boardingRide:leg,done:'Я сел — что дальше?'});
  steps.push({title:'Выходите: «'+b.name+'»',text:'Ехать '+stopsText(leg.stops.length-1,true)+'. '+(next?'Здесь выйдите и следуйте следующему шагу пересадки.':'Здесь выйдите — дальше к месту назначения.'),point:b,leg,line:leg.line,done:'Я вышел'});
 }
 steps.push({title:'Дойдите до места назначения',text:points.to.name+(p.egress>=35?'. Около '+Math.round(p.egress)+' м по прямой.':'. Вы у места назначения.'),point:points.to,from:planTable(rides.at(-1)).get(rides.at(-1).to),kind:'pedestrian',done:'Завершить поездку'});
 return steps;
}
let guidanceIndex=0,guidancePlan=null;
function clearGuidance(){guidancePlan=null;guidanceIndex=0}
const detailedRender=renderPlan;
renderPlan=function(p){
 detailedRender(p);
 if(!p.legs.some(l=>l.type==='ride')||$('bus667Result'))return;
 guidancePlan=p;guidanceIndex=0;
 const results=$('results'),details=node('details',undefined,'card');details.append(node('summary','Подробности, все остановки и время поездки'));
 while(results.firstChild)details.append(results.firstChild);
 const overview=node('section',undefined,'card routeOverview');overview.append(node('div','ВАШ МАРШРУТ','eyebrow'),node('h2',shortRoute(p)),node('p',points.from.name+' → '+points.to.name,'routeEndpoints'),node('p','≈ '+timeRange(p.metrics.time)+' · '+transferCountText(p.metrics.transfers),'routeEstimate'),node('p','Время без ожидания и пробок.','hint'));
 const list=node('ol',undefined,'itinerary');
 if(p.access>=35){const first=p.legs.find(l=>l.type==='ride'),item=node('li');item.append(node('strong','Пешком до «'+planTable(first).get(first.from).name+'»'),node('span','Около '+Math.round(p.access)+' м по прямой'));list.append(item)}
 for(const leg of p.legs){
  if(leg.type==='transfer'){const item=node('li');item.append(node('strong','Пересадка в метро'),node('span',leg.instruction));list.append(item);continue}
  if(leg.type==='walk'){
   const a=leg.pointFrom||BUS.get(leg.from)||METRO.get(leg.from),b=leg.pointTo||BUS.get(leg.stopTo)||METRO.get(leg.stopTo);
   if(a&&b&&leg.meters>=35){const item=node('li');item.append(node('strong',METRO.has(b.id)?'Пройдите к метро «'+b.name+'»':'Пройдите к остановке «'+b.name+'»'),node('span','Около '+Math.round(leg.meters)+' м по прямой'));list.append(item)}continue;
  }
  if(leg.type!=='ride')continue;
  const t=planTable(leg),r=leg.route?patternById.get(leg.route):null,item=node('li');
  item.append(node('strong',leg.line?'Метро · линия '+leg.line:transportName(leg.transport)+(leg.transport==='rail'?'':' № '+r.ref)),node('span','Сесть: «'+t.get(leg.from).name+'»'),node('span','В сторону: «'+(leg.direction||r?.to)+'»'),node('span','Выйти: «'+t.get(leg.to).name+'»','alightLabel'));list.append(item);
 }
 const finish=node('li');finish.append(node('strong',p.egress>=35?'Пешком до места назначения':'Вы на месте'),node('span',points.to.name.replace(/,?\s*(?:Санкт-Петербург|Россия|\d{6})(?=,|$)/g,'')));if(p.egress>=35)finish.append(node('span','Около '+Math.round(p.egress)+' м по прямой'));list.append(finish);
 overview.append(list);const rides=p.legs.filter(l=>l.type==='ride');if((p.access>700&&rides[0]?.line)||(p.egress>700&&rides.at(-1)?.line))overview.append(node('p','Есть длинный пеший участок: подходящий автобус для него в базе не найден. Проверьте путь в 2ГИС.','hint'));if(points.to.kind==='metro'||points.to.metroId)overview.append(node('p','Конечная точка — метро. Для поездки дальше укажите в «Куда» конечный адрес.','hint'));
 const guide=node('section',undefined,'card guideCard');guide.id='tripGuide';
 results.append(overview,guide,details);drawGuidance();
};
function drawGuidance(){
 const guide=$('tripGuide');if(!guide||!guidancePlan)return;
 const steps=guidanceSteps(guidancePlan),step=steps[guidanceIndex];guide.replaceChildren();
 guide.append(node('div','ШАГ '+(guidanceIndex+1)+' ИЗ '+steps.length,'guideProgress'),node('h2',step.title),node('p',step.text));
 if(step.leg){const stops=node('details');stops.append(node('summary','Остановки по пути'),makeJourney(step.leg,planTable(step.leg),step.leg.transport));guide.append(stops)};
 if(step.from)guide.append(navigationButton(step.from,step.point,step.kind,'Показать пеший участок в 2ГИС'));else guide.append(mapButton(step.point,'Показать место на карте'));
 const actions=node('div',undefined,'guideActions'),prev=node('button','← Назад'),next=node('button',step.done,'nextStep');prev.disabled=guidanceIndex===0;
 prev.onclick=()=>{guidanceIndex--;drawGuidance()};next.onclick=()=>{if(guidanceIndex<steps.length-1){guidanceIndex++;drawGuidance()}else{guide.replaceChildren(node('h2','Поездка завершена'),node('p',points.to.name));}guide.scrollIntoView({behavior:'smooth',block:'start'})};
 actions.append(prev,next);guide.append(actions,node('p','Шаги переключайте вручную.','hint guideNotice'));
}
// The service reference belongs after the actual route, not between search and result.
if($('bus667Guide'))document.querySelector('main').append($('bus667Guide'));
