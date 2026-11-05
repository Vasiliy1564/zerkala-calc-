/* Resolve category requests before address geocoding. Coordinates and services
   come exclusively from the bundled transit snapshot. */
function airportQuery(q){return /^(?:аэропорт(?:\s+пулково)?|пулково(?:\s+аэропорт)?)$/i.test(q.trim())}
function metroCategoryQuery(q){return /^(?:(?:ближайш(?:ее|ая|ие)|красн(?:ое|ая|ую)|син(?:ее|яя|юю)|зел[её]н(?:ое|ая|ую))\s+)?метро$|^метро\s+(?:рядом|ближайшее|красн(?:ое|ая)|син(?:ее|яя)|зел[её]н(?:ое|ая))$/i.test(q.trim())}
function categoryLine(q){return /красн/i.test(q)?1:/син/i.test(q)?2:/зел[её]н/i.test(q)?3:0}
const METRO_COLOR_NAMES={1:'Красная',2:'Синяя',3:'Зелёная',4:'Оранжевая',5:'Фиолетовая',6:'Коричневая'};
let nearbyMetroCache=null;
function nearbyMetroStations(origin,line=0){
 const key=origin.lat+':'+origin.lon+':'+(origin.metroId||'');
 if(!nearbyMetroCache||nearbyMetroCache.key!==key){
  const candidates=[];
  for(const l of TRANSIT.lines){
   for(const x of nearest(origin,TRANSIT.metro.filter(s=>!s.closed&&s.line===l.id),Infinity,3)){
    const target={...x.s,metroId:x.s.id,kind:'metro'};
    let plans=directPlans(autoPoint(origin,true),target,AUTO_KINDS).filter(p=>{routeMetrics(p);return p.metrics.walk<=2000&&p.egress<=650});
    // Nearby stations can also be reached on foot. This is a straight-line
    // estimate; street walking is calculated by the existing walking service.
    const walkTime=x.d<=1000?x.d/75:Infinity;
    plans.sort((a,b)=>planTimeScore(a)-planTimeScore(b));
    const plan=plans[0],time=Math.min(walkTime,plan?planTimeScore(plan):Infinity);
    candidates.push({station:target,meters:Math.round(x.d),time,plan:walkTime<=time?null:plan});
   }
  }
  // Only if direct access is absent, try connecting surface services.
  for(const l of TRANSIT.lines){if(candidates.some(x=>x.station.line===l.id&&Number.isFinite(x.time)))continue;
   const x=candidates.filter(x=>x.station.line===l.id).sort((a,b)=>a.meters-b.meters)[0];if(!x)continue;
   try{const p=advancedPlan(autoPoint(origin,true),x.station,AUTO_KINDS,false,'time');routeMetrics(p);if(p.metrics.walk<=2000&&p.egress<=650){x.plan=p;x.time=planTimeScore(p)}}catch(e){}
  }
  nearbyMetroCache={key,items:candidates.filter(x=>Number.isFinite(x.time)).sort((a,b)=>a.time-b.time||a.meters-b.meters)};
 }
 return nearbyMetroCache.items.filter(x=>!line||x.station.line===Number(line));
}
function offerNearbyMetro(line=0){
 const box=$('toList');box.replaceChildren();
 if(!points.from){say('Сначала выберите точку «Откуда», затем ближайшее метро.');return []}
 const panel=node('section',undefined,'nearbyMetro');panel.append(node('strong','До какой станции метро доехать?'));
 const label=node('label','Ветка метро: '),select=node('select');select.id='nearbyMetroLine';select.setAttribute('aria-label','Ветка метро');
 for(const [value,text] of [[0,'Все ветки'],...TRANSIT.lines.map(l=>[l.id,METRO_COLOR_NAMES[l.id]+' · линия '+l.id])]){const option=node('option',text);option.value=value;select.append(option)}select.value=String(line);label.append(select);panel.append(label);
 select.onchange=()=>offerNearbyMetro(Number(select.value));
 panel.append(node('small','Сначала станции с меньшим расчётным временем подъезда. Без ожидания и пробок.'));
 const items=nearbyMetroStations(points.from,line);
 const visible=items.slice(0,6);if(!line)for(const l of TRANSIT.lines){const x=items.find(x=>x.station.line===l.id);if(x&&!visible.includes(x))visible.push(x)}
 for(const x of visible){const b=node('button',undefined,'nearbyMetroChoice');const title=node('strong',x.station.name+' · '+METRO_COLOR_NAMES[x.station.line]+' ветка','metroLine');title.style.setProperty('--metro-line-color',LINES.get(x.station.line).color);b.append(title,node('small',x.plan?shortRoute(x.plan)+' · ≈ '+timeRange(x.plan.metrics.time):'Пешком · ≈ '+Math.ceil(x.time)+' мин'),node('small','До станции по прямой: '+(x.meters/1000).toFixed(1)+' км'));b.onclick=()=>{pick('to',x.station);buildRoute()};panel.append(b)}
 if(!visible.length)panel.append(node('p','Подъезд к этой ветке во встроенной базе не найден. Выберите другую ветку или станцию по названию.'));
 box.append(panel);say('Выберите станцию и ветку метро.');return items.map(x=>x.station);
}
const previousSuggest=suggest;
suggest=function(f){const q=$(f).value.trim();if(f==='to'&&metroCategoryQuery(q))return offerNearbyMetro(categoryLine(q));if(airportQuery(q)){const box=$(f+'List');box.replaceChildren();const b=node('button');b.append(node('strong',AIRPORT.name),node('small','Пассажирский терминал · автобусы 39, 39Э, 82Э'));b.onclick=()=>pick(f,AIRPORT);box.append(b);return [AIRPORT]}return previousSuggest(f)};
const previousSearchPlace=searchPlace;
searchPlace=function(f,...args){const q=$(f).value.trim();if(airportQuery(q)){pick(f,AIRPORT);return}if(f==='to'&&metroCategoryQuery(q)){offerNearbyMetro(categoryLine(q));pendingBuild=false;return}return previousSearchPlace(f,...args)};
const previousResolve=resolve;
resolve=function(f){if(!points[f]&&airportQuery($(f).value)){points[f]={...AIRPORT};$(f).value=AIRPORT.name;showSelectedAddress(f,AIRPORT);$(f+'List').replaceChildren();return true}if(!points[f]&&f==='to'&&metroCategoryQuery($(f).value)){offerNearbyMetro(categoryLine($(f).value));pendingBuild=false;$('go').disabled=false;return false}return previousResolve(f)};
const nearbyButton=node('button','М · Ближайшее метро','gps');nearbyButton.id='findNearbyMetro';nearbyButton.type='button';nearbyButton.onclick=()=>{if(!points.from){if(!resolve('from'))return}clearRoute();points.to=null;showSelectedAddress('to',null);$('to').value='Ближайшее метро';offerNearbyMetro()};$('to').before(nearbyButton);
