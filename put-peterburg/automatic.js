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
     const m=metroPlan({...station,metroId:station.id},{...near.s,metroId:near.s.id});
     const metro=reverse?metroPlan({...near.s,metroId:near.s.id},{...station,metroId:station.id}):m;
     const ride={type:'ride',route:r.id,transport:r.transport||'bus',from:r.stops[i],to:r.stops[j],stops:r.stops.slice(i,j+1)};
     const walk={type:'walk',from:reverse?gateway.id:near.s.id,stopTo:reverse?near.s.id:gateway.id,meters:near.d,pointFrom:reverse?gateway:near.s,pointTo:reverse?near.s:gateway,unverified:true};
     const p=routeMetrics({mode:'all',start:reverse?placeId:metro.start,end:reverse?metro.end:placeId,access:reverse?ends.get(placeId):distance(from,station),egress:reverse?distance(to,station):ends.get(placeId),legs:reverse?[ride,walk,...metro.legs]:[...metro.legs,walk,ride]});
     if(!best||p.metrics.walk<best.metrics.walk||p.metrics.walk===best.metrics.walk&&p.metrics.stops<best.metrics.stops)best=p;
    }catch(e){}
   }
   if(best)save(best);
  }
 }
}
function smartRouteOptions(rawFrom,rawTo,preference='all'){
 const from=autoPoint(rawFrom,true),to=autoPoint(rawTo,false),out=[],seen=new Set();
 const save=p=>{if(!p)return;routeMetrics(p);if(p.metrics.walk>3500)return;const key=routeKey(p);if(!seen.has(key)){seen.add(key);out.push(p)}};
 try{const p=simpleMetroPlan(from,to);if(p.access<=1000&&p.egress<=1000)save(p)}catch(e){}
 directPlans(from,to,AUTO_KINDS).forEach(save);
 for(const profile of ['time','transfers','walk','stops']){try{save(advancedPlan(from,to,AUTO_KINDS,true,profile))}catch(e){}}
 addConnectorPlans(from,to,save);
 if(preference==='metro'&&distance(from,to)>100)for(const maxWalk of [700,Infinity]){let found=null;for(const profile of ['time','transfers']){try{found=advancedPlan(from,to,AUTO_KINDS,true,profile,new Set(),'metro',maxWalk)}catch(e){}if(found)break}if(found){save(found);break}}

 const hasPreference=p=>p.legs.some(l=>l.type==='ride'&&(l.transport|| (l.line?'metro':'bus'))===preference);
 const compare=(a,b)=>(a.metrics.time.min+a.metrics.time.max)-(b.metrics.time.min+b.metrics.time.max)||a.metrics.transfers-b.metrics.transfers||a.metrics.walk-b.metrics.walk||Number(hasPreference(b))-Number(hasPreference(a));
 // Metro is the core of this mode; buses remain available at both ends.
 const metroPlans=out.filter(p=>hasPreference(p));
 const assisted=preference==='metro'&&metroPlans.some(p=>p.access<=700&&p.egress<=700);
 out.sort((a,b)=>(preference==='metro'?Number(hasPreference(b))-Number(hasPreference(a)):0)||(assisted?Number(b.access<=700&&b.egress<=700)-Number(a.access<=700&&a.egress<=700):0)||compare(a,b));
 return out.slice(0,6);
}

function shortRoute(p){return p.legs.filter(l=>l.type==='ride').map(l=>l.line?'Метро '+l.line:transportName(l.transport)+' '+patternById.get(l.route).ref).join(' → ')}
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
   b.append(node('strong',shortRoute(p)),node('small','≈ '+timeRange(p.metrics.time)+' · '+transferCountText(p.metrics.transfers)));
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
 if(p.access>=35)steps.push({title:'Дойдите до места посадки',text:firstStop.name+'. Около '+Math.round(p.access)+' м по прямой; путь по улицам может быть длиннее.',point:firstStop,from:points.from,kind:'pedestrian',done:'Я на месте посадки'});
 for(let i=0;i<p.legs.length;i++){
  const leg=p.legs[i],next=p.legs.slice(i+1).find(l=>l.type==='ride');
  if(leg.type==='transfer'){steps.push({title:'Пересадка в метро',text:leg.instruction,point:METRO.get(leg.to),done:'Я перешёл на нужную линию'});continue}
  if(leg.type==='walk'){
   const a=leg.pointFrom||BUS.get(leg.from)||METRO.get(leg.from),b=leg.pointTo||BUS.get(leg.stopTo)||METRO.get(leg.stopTo);if(!a||!b)continue;
   steps.push({title:METRO.has(a.id)?'Выйдите из метро к остановке':METRO.has(b.id)?'Пройдите к метро':'Перейдите на следующую остановку',text:(METRO.has(a.id)?stationExitHint(a,next)+' ':'')+a.name+' → '+b.name+'. Около '+Math.round(leg.meters)+' м по прямой. Пешеходный путь проверьте на карте.',point:b,from:a,kind:'pedestrian',done:'Я у места пересадки'});continue;
  }
  if(leg.type!=='ride')continue;
  const table=planTable(leg),a=table.get(leg.from),b=table.get(leg.to),r=leg.route?patternById.get(leg.route):null;
  const service=leg.line?'метро, линия № '+leg.line:transportName(leg.transport)+(leg.transport==='rail'?'':' № '+r.ref);
  const direction=leg.direction||r?.to;
  const boarding=leg.boardPlatform?' Зал «'+leg.boardPlatform.station+'-'+leg.boardPlatform.hall+'».':'';
  const metroHint=' Выходите: «'+b.name+'».';
  steps.push({title:'Сядьте: '+service,text:'Откуда: «'+a.name+'».'+boarding+' В сторону «'+direction+'».'+metroHint,point:a,done:'Я сел — что дальше?'});
  steps.push({title:'Выходите: «'+b.name+'»',text:'Ехать '+(leg.stops.length-1)+' остановок. '+(next?'Здесь выйдите и следуйте следующему шагу пересадки.':'Здесь выйдите — дальше к месту назначения.'),point:b,leg,done:'Я вышел'});
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
