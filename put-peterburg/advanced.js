/* Ranking scores below are dimensionless. No score is shown as minutes or ETA. */
function metroDirection(leg){const l=LINES.get(leg.line),sign=Math.sign(l.stations.indexOf(leg.to)-l.stations.indexOf(leg.from));return {sign,terminus:METRO.get(l.stations[sign>0?l.stations.length-1:0]).name}}
function platformFor(id,sign){const t=TRANSIT.platforms.technology;if(t.stationIds.includes(id))return {station:'Технологический институт',hall:t.hallByDirection[String(sign)],line:METRO.get(id).line,direction:sign};return null}
function decorateMetro(p){for(const leg of p.legs){if(leg.type!=='ride'||!leg.line)continue;const d=metroDirection(leg);leg.transport='metro';leg.direction=d.terminus;leg.directionSign=d.sign;leg.boardPlatform=platformFor(leg.from,d.sign);leg.arrivalPlatform=platformFor(leg.to,d.sign);leg.platforms=leg.stops.map(id=>platformFor(id,d.sign));}for(let i=0;i<p.legs.length;i++){const t=p.legs[i];if(t.type!=='transfer')continue;const a=p.legs.slice(0,i).reverse().find(x=>x.type==='ride'),b=p.legs.slice(i+1).find(x=>x.type==='ride');t.arrivalPlatform=a?.arrivalPlatform||null;t.boardPlatform=b?.boardPlatform||null;if(t.arrivalPlatform&&t.boardPlatform)t.instruction=t.arrivalPlatform.hall===t.boardPlatform.hall?`Оставайтесь в зале «Технологический институт-${t.arrivalPlatform.hall}». Перейдите на другую сторону платформы к поездам линии № ${b.line}, в сторону «${b.direction}».`:`Из зала «Технологический институт-${t.arrivalPlatform.hall}» пройдите по переходу в зал «Технологический институт-${t.boardPlatform.hall}». Линия № ${b.line}, в сторону «${b.direction}».`;else t.instruction=`По указателям перейдите со станции «${METRO.get(t.from).name}» (линия № ${METRO.get(t.from).line}) на «${METRO.get(t.to).name}» (линия № ${METRO.get(t.to).line}).`;}
return p}
const originalMetroPlan=metroPlan;metroPlan=function(from,to,profile='transfers'){let best=null;for(const a of from.metroIds||[from.metroId])for(const b of to.metroIds||[to.metroId]){const p=originalMetroPlan({...from,metroId:a},{...to,metroId:b},profile);if(!best||p.cost<best.cost)best=p}decorateMetro(best);if(from.requestedHall){const leg=best.legs.find(l=>l.type==='ride');if(leg?.boardPlatform&&leg.boardPlatform.hall!==from.requestedHall)best.originHallInstruction='Из зала «Технологический институт-'+from.requestedHall+'» перейдите в зал «Технологический институт-'+leg.boardPlatform.hall+'» к поездам в сторону «'+leg.direction+'».'}return best};
// Fix 0.45: «1 остановку / 2 остановки / 5 остановок».
function stopsText(n,accusative=false){const a=n%10,b=n%100;return n+' '+(a===1&&b!==11?(accusative?'остановку':'остановка'):a>=2&&a<=4&&(b<12||b>14)?'остановки':'остановок')}
// Fix 0.45: если точка — адрес, поездка не начинается и не заканчивается переходом между станциями:
// идём сразу ко входу нужной станции. Выбранная вручную станция остаётся как есть.
function trimEdgeTransfers(p,from,to){
 if(!p||!Array.isArray(p.legs)||!p.legs.some(l=>l.type==='ride'))return p;
 const explicit=x=>!!x.metroId||x.kind==='bus'||x.kind==='rail',table=id=>METRO.get(id)||BUS.get(id);
 if(!explicit(from)){const i=p.legs.findIndex(l=>l.type==='ride');if(i>0){p.legs.splice(0,i);const s=table(p.legs[0].from);if(s){p.start=s.id;p.access=distance(from,s)}}}
 if(!explicit(to)){const i=p.legs.findLastIndex(l=>l.type==='ride');if(i<p.legs.length-1){p.legs.splice(i+1);const s=table(p.legs[i].to);if(s){p.end=s.id;p.egress=distance(to,s)}}}
 // Переход между станциями одного узла не подменяется «выйдите к остановке и вернитесь в метро».
 for(let i=1;i<p.legs.length-1;i++){
  if(p.legs[i].type!=='walk')continue;let j=i;while(j<p.legs.length&&p.legs[j].type==='walk')j++;
  const a=p.legs[i-1],b=p.legs[j];
  if(a?.type==='ride'&&a.line&&b?.type==='ride'&&b.line&&a.to!==b.from&&TRANSIT.transfers.some(g=>g.includes(a.to)&&g.includes(b.from))){p.legs.splice(i,j-i,{type:'transfer',from:a.to,to:b.from});decorateMetro(p)}
  else i=j-1;
 }
 // Два пеших перехода подряд — один шаг.
 const spot=(l,end)=>end?(l.pointTo||BUS.get(String(l.stopTo||'').replace(/^w/,''))||METRO.get(l.stopTo)):(l.pointFrom||BUS.get(String(l.from||'').replace(/^w/,''))||METRO.get(l.from));
 for(let i=0;i<p.legs.length-1;i++){const x=p.legs[i],y=p.legs[i+1];if(x.type!=='walk'||y.type!=='walk')continue;const a=spot(x,false),b=spot(y,true);if(!a||!b)continue;p.legs.splice(i,2,{type:'walk',from:a.id,stopTo:b.id,pointFrom:a,pointTo:b,meters:distance(a,b),unverified:true});i--}
 return p;
}
function planTable(leg){return leg.line?METRO:BUS}
function transportName(kind){return {bus:'Автобус',tram:'Трамвай',trolley:'Троллейбус',metro:'Метро',rail:'Электричка'}[kind]||'Транспорт'}
// Offline heuristic, deliberately independent of topology ranking costs.
// These ranges are model assumptions, not measured times or timetable data.
function estimateRideTime(leg){
 const table=planTable(leg);let km=0;
 for(let i=1;i<leg.stops.length;i++){const a=table.get(leg.stops[i-1]),b=table.get(leg.stops[i]);if(a&&b)km+=distance(a,b)/1000;}
 const n=Math.max(0,leg.stops.length-1);
 if(leg.transport==='rail')return {min:Math.max(n*1.5,km/70*60),max:Math.max(n*3,km/35*60)};
 if(leg.line)return {min:Math.max(n*1.5,km/55*60),max:Math.max(n*2.7,km/32*60)};
 return {min:km*1.15/30*60+n*0.3,max:km*1.35/17*60+n*0.6};
}
function estimateTravelTime(p){
 const rides=p.legs.filter(l=>l.type==='ride'),ride={min:0,max:0};
 for(const leg of rides){leg.estimatedTime=estimateRideTime(leg);ride.min+=leg.estimatedTime.min;ride.max+=leg.estimatedTime.max;}
 const meters=(p.access||0)+(p.egress||0)+p.legs.filter(l=>l.type==='walk').reduce((n,l)=>n+(l.meters||0),0);
 const walk={min:meters*1.15/85,max:meters*1.5/65};
 const transfers=Math.max(p.legs.filter(l=>l.type==='transfer').length,rides.length-1);
 const stationAccess=rides.some(l=>l.line)?{min:4,max:10}:{min:0,max:0};
 return {ride,walk,min:ride.min+walk.min+transfers*3+stationAccess.min,max:ride.max+walk.max+transfers*7+stationAccess.max};
}
function timeRange(t){const lo=Math.max(1,Math.floor(t.min/5)*5),hi=Math.max(lo+4,Math.ceil(t.max/5)*5);return lo+'–'+hi+' мин';}
function routeMetrics(p){const rides=p.legs.filter(l=>l.type==='ride');p.metrics={transfers:p.mode==='metro'?p.legs.filter(l=>l.type==='transfer').length:Math.max(0,rides.length-1)+p.legs.slice(p.legs.findLastIndex(l=>l.type==='ride')+1).filter(l=>l.type==='transfer').length,stops:rides.reduce((n,l)=>n+l.stops.length-1,0),walk:Math.round((p.access||0)+(p.egress||0)+p.legs.filter(l=>l.type==='walk').reduce((n,l)=>n+l.meters,0)),time:estimateTravelTime(p),wait:null};return p}
function routeKey(p){if(!p.legs.some(l=>l.type==='ride'))return 'walk:'+p.start+':'+p.end;return p.legs.filter(l=>l.type==='ride').map(l=>(l.line?'m'+l.line:l.route)+':'+l.from+':'+l.to).join('|')}
// Keep nearby stops and additional service alternatives up to 2.5 km away.
// Distances are straight-line estimates; this does not certify a pedestrian path.
const ENDPOINT_WALK_RADIUS=2500;
function endpointCandidates(point,pickup,includeMetro){
 if(point.kind==='bus'||point.kind==='rail'){const s=BUS.get(point.id);if(s&&s[pickup?'pickup':'dropoff']!==false)return [{s,d:0}];}
 const field=pickup?'pickup':'dropoff',nearby=nearest(point,TRANSIT.busStops.filter(s=>s.transport!=='rail'&&s[field]!==false),ENDPOINT_WALK_RADIUS,Infinity);
 const surface=nearby.slice(0,100),kept=new Set(surface.map(x=>x.s.id)),covered=new Set();
 const services=stopServices();
 for(const x of surface)for(const id of services.get(x.s.id)||[])covered.add(id);
 for(const x of nearby){const ids=services.get(x.s.id)||[];if(ids.some(id=>!covered.has(id))){if(!kept.has(x.s.id)){surface.push(x);kept.add(x.s.id)}for(const id of ids)covered.add(id)}}
 surface.push(...nearest(point,TRANSIT.busStops.filter(s=>s.transport==='rail'&&s[field]!==false),3000,4));
 if(includeMetro){const underground=point.metroId?[{s:METRO.get(point.metroId),d:0}]:nearest(point,TRANSIT.metro.filter(s=>!s.closed),1000,4);return surface.concat(underground)}return surface;
}
let cachedStopServices=null;
function stopServices(){if(cachedStopServices)return cachedStopServices;const out=new Map();for(const r of TRANSIT.busRoutes)for(const id of r.stops){if(!out.has(id))out.set(id,[]);out.get(id).push(r.id)}cachedStopServices=out;return out}
function planTimeScore(p){return (p.metrics.time.min+p.metrics.time.max)/2}
function directPlans(from,to,kinds){const starts=new Map(endpointCandidates(from,true,false).map(x=>[x.s.id,x.d])),ends=new Map(endpointCandidates(to,false,false).map(x=>[x.s.id,x.d])),out=[];for(const r of TRANSIT.busRoutes){if(!kinds.includes(r.transport||'bus'))continue;let candidates=[];for(let i=0;i<r.stops.length-1;i++){if(!starts.has(r.stops[i]))continue;for(let j=i+1;j<r.stops.length;j++){if(!ends.has(r.stops[j]))continue;const stops=r.stops.slice(i,j+1);candidates.push(routeMetrics({mode:'surface',start:stops[0],end:stops.at(-1),access:starts.get(stops[0]),egress:ends.get(stops.at(-1)),legs:[{type:'ride',route:r.id,transport:r.transport||'bus',from:stops[0],to:stops.at(-1),stops}]}))}}candidates.sort((a,b)=>planTimeScore(a)-planTimeScore(b)||a.metrics.walk-b.metrics.walk);if(candidates[0])out.push(candidates[0])}return out}
function multimodalGraph(kinds,includeMetro,profile,excluded=new Set()){
 const timed=profile==='time',walkRate=1.5/65;
 const g=new Map(),boarding=profile==='transfers'?1e7:profile==='walk'?20000:1500,walking=profile==='walk'?50:1,stopCost=profile==='stops'?100:10;
 const base=makeBusGraph();for(const [u,edges] of base){for(const e of edges){const route=e.route&&patternById.get(e.route);if(route&&(!kinds.includes(route.transport||'bus')||excluded.has(route.id)))continue;let cost=e.type==='board'?(timed?8:boarding):e.type==='busRide'?(timed?estimateRideTime({transport:route.transport||'bus',stops:route.stops.slice(e.index,e.index+2)}).max:stopCost):e.type==='walk'?(timed?e.meters*walkRate:(e.meters+100)*walking):0;add(g,u,e.to,cost,e.type,e);g.get(u).at(-1).c=cost;}}
 if(includeMetro){for(const l of TRANSIT.lines){const ids=l.stations.filter(id=>!METRO.get(id).closed);for(const sign of [-1,1])for(let i=0;i<ids.length;i++){const id=ids[i],v='train:'+l.id+':'+sign+':'+i;if(i+sign>=0&&i+sign<ids.length){add(g,id,v,timed?5:boarding,'metroBoard',{line:l.id,index:i,sign});add(g,v,'train:'+l.id+':'+sign+':'+(i+sign),timed?estimateRideTime({line:l.id,stops:[id,ids[i+sign]]}).max:stopCost,'metroRide',{line:l.id,index:i,sign,stationFrom:id,stationTo:ids[i+sign]});}add(g,v,id,0,'metroAlight',{line:l.id,index:i,sign});}}
 for(const group of TRANSIT.transfers)for(const a of group)for(const b of group)if(a!==b&&!METRO.get(a).closed&&!METRO.get(b).closed)add(g,a,b,timed?5:walking*30,'transfer',{});
 for(const s of TRANSIT.metro.filter(s=>!s.closed))for(const x of nearest(s,TRANSIT.busStops,450,24)){add(g,s.id,x.s.id,(timed?x.d*walkRate:(x.d+100)*walking),'walk',{meters:x.d,pointFrom:s,pointTo:x.s,unverified:true});add(g,x.s.id,s.id,(timed?x.d*walkRate:(x.d+100)*walking),'walk',{meters:x.d,pointFrom:x.s,pointTo:s,unverified:true});}}
 return g
}
// Track actual use of the requested transport without cutting either endpoint.
function solveWithTransport(graph,starts,ends,kind){
 if(!kind)return solve(graph,starts,ends);
 const used=e=>e.type==='metroRide'?kind==='metro':e.type==='busRide'&&(patternById.get(e.route)?.transport||'bus')===kind;
 const layered={get(key){const done=key[0]==='1',id=key.slice(2);return (graph.get(id)||[]).map(e=>({...e,to:(done||used(e)?'1:':'0:')+e.to}))}};
 const p=solve(layered,starts.map(x=>({...x,id:'0:'+x.id})),ends.map(x=>({...x,id:'1:'+x.id})));
 if(!p)return null;p.start=p.start.slice(2);p.end=p.end.slice(2);p.edges=p.edges.map(e=>({...e,from:e.from.slice(2),to:e.to.slice(2)}));return p;
}
function advancedPlan(from,to,kinds,includeMetro,profile,excluded=new Set(),requiredKind=null,maxEndpointWalk=Infinity){
 const starts=endpointCandidates(from,true,includeMetro).filter(x=>x.d<=maxEndpointWalk),ends=endpointCandidates(to,false,includeMetro).filter(x=>x.d<=maxEndpointWalk);if(!starts.length||!ends.length)return null;
 const p=solveWithTransport(multimodalGraph(kinds,includeMetro,profile,excluded),starts.map(x=>({id:x.s.id,d:x.d*(profile==='time'?1.5/65:profile==='walk'?50:1)})),ends.map(x=>({id:x.s.id,d:x.d*(profile==='time'?1.5/65:profile==='walk'?50:1)})),requiredKind);if(!p)return null;
 const table=id=>METRO.get(id)||BUS.get(id);p.access=distance(from,table(p.start));p.egress=distance(to,table(p.end));p.mode=includeMetro?'all':'surface';p.legs=[];let ride=null;
 for(const e of p.edges){if(e.type==='board')ride={type:'ride',route:e.route,transport:patternById.get(e.route).transport||'bus',begin:e.index,finish:e.index};else if(e.type==='busRide'&&ride)ride.finish=e.index+1;else if(e.type==='alight'&&ride){if(ride.finish>ride.begin){ride.stops=patternById.get(ride.route).stops.slice(ride.begin,ride.finish+1);ride.from=ride.stops[0];ride.to=ride.stops.at(-1);p.legs.push(ride)}ride=null}else if(e.type==='metroBoard')ride={type:'ride',line:e.line,transport:'metro',stops:[]};else if(e.type==='metroRide'&&ride){if(!ride.stops.length)ride.stops.push(e.stationFrom);ride.stops.push(e.stationTo)}else if(e.type==='metroAlight'&&ride){if(ride.stops.length>1){ride.from=ride.stops[0];ride.to=ride.stops.at(-1);p.legs.push(ride)}ride=null}else if(['transfer','walk'].includes(e.type))p.legs.push(e)}
 if(p.legs.filter(l=>l.type==='ride').length>4)return null;decorateMetro(p);return routeMetrics(p)
}
function routeOptions(from,to,mode){const list=[],seen=new Set();const save=p=>{if(!p||(!p.legs.some(l=>l.type==='ride')&&p.mode!=='metro'))return;routeMetrics(p);const k=routeKey(p);if(!seen.has(k)){seen.add(k);list.push(p)}};if(mode==='metro'){save(metroPlan(from,to));for(const a of from.metroId?[{s:METRO.get(from.metroId)}]:nearest(from,TRANSIT.metro.filter(s=>!s.closed),4000,5))for(const b of to.metroId?[{s:METRO.get(to.metroId)}]:nearest(to,TRANSIT.metro.filter(s=>!s.closed),4000,5)){try{const p=metroPlan({...a.s,metroId:a.s.id},{...b.s,metroId:b.s.id});p.access=from.metroId?0:distance(from,a.s);p.egress=to.metroId?0:distance(to,b.s);save(p)}catch(e){}}}else{const kinds=mode==='rail'?['rail']:mode==='bus'?['bus']:mode==='tram'?['tram']:mode==='trolley'?['trolley']:['bus','tram','trolley','rail'];directPlans(from,to,kinds).forEach(save);for(const profile of ['transfers','walk','stops']){try{save(advancedPlan(from,to,kinds,mode==='all',profile))}catch(e){}}if(mode==='all'){try{save(metroPlan(from,to))}catch(e){}}}
 list.sort((a,b)=>a.metrics.transfers-b.metrics.transfers||a.metrics.walk-b.metrics.walk||a.metrics.stops-b.metrics.stops);return list}

// Address routing: lock the nearest operating station at each endpoint before routing.
// Walking estimates use stored station coordinates, not a verified pedestrian graph.
function closestMetroEndpoint(point){
 if(point.metroId){const station=METRO.get(point.metroId);if(!station||station.closed)throw Error('Эта станция закрыта. Выберите другую станцию.');return {...station,metroId:station.id,metroIds:point.metroIds,requestedHall:point.requestedHall};}
 const nearestStation=nearest(point,TRANSIT.metro.filter(s=>!s.closed),4000,1)[0];
 if(!nearestStation)throw Error('До этого адреса одним метро не доехать. Нужен автобус или электричка.');
 const station=nearestStation.s,ids=TRANSIT.metro.filter(s=>!s.closed&&(s.name===station.name||Math.abs(distance(point,s)-nearestStation.d)<1)).map(s=>s.id);
 return {...station,metroId:station.id,metroIds:ids.length>1?ids:undefined};
}
function simpleMetroPlan(from,to){const entry=closestMetroEndpoint(from),exit=closestMetroEndpoint(to),p=metroPlan(entry,exit);p.access=from.metroId?0:distance(from,METRO.get(p.start));p.egress=to.metroId?0:distance(to,METRO.get(p.end));p.simple=true;return routeMetrics(p)}
