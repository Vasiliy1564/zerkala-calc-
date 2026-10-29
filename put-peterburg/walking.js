/* Walking instructions are rendered only from pedestrian routing responses. */
const WALKING_ENTRANCES={"Проспект Большевиков": [{"lat": 59.9196409, "lon": 30.4670319, "osmId": "1479478805", "entrance": "entrance", "ref": null, "name": "Проспект Большевиков"}, {"lat": 59.9196162, "lon": 30.4669363, "osmId": "4222817895", "entrance": "exit", "ref": null, "name": "Проспект Большевиков"}]};
const walkMemory=new Map(),walkPending=new Map();let walkingSerial=0;
function walkingKey(a,b){return [a.lat,a.lon,b.lat,b.lon].map(n=>Number(n).toFixed(6)).join(',')}
function walkingEntrance(p,toward,entering=false){
 const station=METRO.get(p.metroId||p.id);if(!station)return null;
 const candidates=WALKING_ENTRANCES[station.name]||[];
 return candidates.filter(e=>Number.isFinite(e.lat)&&Number.isFinite(e.lon)&&e.access!=='no'&&e.access!=='private'&&(entering?e.entrance!=='exit':e.entrance!=='entrance')).sort((a,b)=>distance(a,toward)-distance(b,toward))[0]||null;
}
function walkingEndpoints(step){const exit=walkingEntrance(step.from,step.point),entry=walkingEntrance(step.point,step.from,true);return {a:exit||step.from,b:entry||step.point,exit,entry}}
function walkingMeters(n){return n<1000?Math.round(n)+' м':(n/1000).toFixed(1).replace('.',',')+' км'}
function walkingBearing(n){return ['на север','на северо-восток','на восток','на юго-восток','на юг','на юго-запад','на запад','на северо-запад'][Math.round((Number(n)||0)/45)%8]}
function walkingInstruction(step){
 const m=step.maneuver||{},type=m.type,modifier=m.modifier,street=String(step.name||'').trim(),road=street?' на «'+street+'»':'';
 const turn={'left':'Поверните налево','right':'Поверните направо','slight left':'Держитесь левее','slight right':'Держитесь правее','sharp left':'Резко поверните налево','sharp right':'Резко поверните направо','uturn':'Развернитесь','straight':'Продолжайте прямо'};
 let title;
 if(type==='depart')title='Начните движение '+walkingBearing(m.bearing_after)+(street?' по «'+street+'»':' по линии на схеме');
 else if(type==='arrive')title='Вы у конца пешеходного участка';
 else if(type==='roundabout'||type==='rotary')title='На круговом перекрёстке '+(Number.isInteger(m.exit)?'используйте '+m.exit+'-й выход':'следуйте линии маршрута');
 else if(type==='roundabout turn'||type==='exit roundabout'||type==='exit rotary')title=(turn[modifier]||'Продолжайте путь')+road;
 else if(type==='fork')title=(modifier?.includes('left')?'На развилке держитесь левее':modifier?.includes('right')?'На развилке держитесь правее':'На развилке продолжайте прямо')+road;
 else if(type==='new name'||type==='notification')title='Продолжайте движение'+(street?' по «'+street+'»':'');
 else title=(turn[modifier]||'Следуйте линии маршрута')+road;
 return {title,meters:Math.max(0,Number(step.distance)||0),location:m.location,type,modifier,bearing:m.bearing_after};
}
function validateWalking(data,a,b){
 if(data?.code!=='Ok'||!data.routes?.length||data.waypoints?.length!==2)throw Error('Пешеходный маршрут не найден.');
 const r=data.routes[0],xy=r.geometry?.coordinates;
 if(!Number.isFinite(r.distance)||r.distance<0||r.distance>15000||!Array.isArray(xy)||xy.length<2||xy.some(p=>!Array.isArray(p)||p.length<2||!p.every(Number.isFinite)))throw Error('Сервис вернул неполный маршрут.');
 for(const [i,p] of [a,b].entries()){const w=data.waypoints[i];if(!Number.isFinite(w.distance)||w.distance>60||!Array.isArray(w.location)||w.location.length!==2||distance(p,{lon:w.location[0],lat:w.location[1]})>65)throw Error('Начало или конец пути далеко от пешеходной сети. Уточните точку.');}
 const raw=r.legs?.flatMap(l=>l.steps||[])||[];
 if(!raw.length||raw.some(s=>s.mode!=='walking'||!s.maneuver||!Array.isArray(s.maneuver.location)))throw Error('Пешеходные указания не подтверждены.');
 return {distance:r.distance,duration:r.duration,coordinates:xy,steps:raw.map(walkingInstruction),savedAt:Number(data.savedAt)||Date.now(),cached:!!data.cached,snaps:data.waypoints.map(w=>w.distance)};
}
function requestWalking(step,refresh=false){
 const endpoints=walkingEndpoints(step),{a,b}=endpoints,key=walkingKey(a,b);
 if(!refresh&&walkMemory.has(key)){const v=walkMemory.get(key);if(v.state==='pending'||v.state==='error'||Date.now()-(v.route?.savedAt||0)<86400000)return v;}
 const state={state:'pending',...endpoints,key};walkMemory.set(key,state);
 if(typeof Phone==='undefined'||typeof Phone.walking!=='function'){state.state='error';state.error='Пешие указания доступны в обновлённом Android-приложении.';return state;}
 const id=++walkingSerial;walkPending.set(id,state);state.timer=setTimeout(()=>finishWalking(id,null,'Расчёт не ответил. Повторите попытку или откройте участок в 2ГИС.'),35000);
 Phone.walking(a.lat,a.lon,b.lat,b.lon,id);return state;
}
function finishWalking(id,data,error){
 const state=walkPending.get(id);if(!state)return;clearTimeout(state.timer);walkPending.delete(id);
 try{if(error)throw Error(error);state.route=validateWalking(data,state.a,state.b);state.state='ready';}catch(e){state.state='error';state.error=e.message;}
 if(typeof drawGuidance==='function'&&guidancePlan)drawGuidance();
}
const receiveBeforeWalking=receive;
receive=function(type,data){if(type==='walking'){finishWalking(data.id,data.data,data.error);return;}receiveBeforeWalking(type,data);};
function walkingSvg(route,index=0){
 const svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 340 230');svg.setAttribute('role','img');svg.setAttribute('aria-label','Схема пешего пути. Север сверху. Начало А, конец Б.');
 const points=route.coordinates,lat=points.reduce((s,p)=>s+p[1],0)/points.length,cos=Math.cos(lat*Math.PI/180),xs=points.map(p=>p[0]*cos),ys=points.map(p=>-p[1]),minX=Math.min(...xs),minY=Math.min(...ys),dx=Math.max(.00008,Math.max(...xs)-minX),dy=Math.max(.00008,Math.max(...ys)-minY),scale=Math.min(275/dx,165/dy),ox=(340-dx*scale)/2,oy=(230-dy*scale)/2;
 const project=p=>[ox+(p[0]*cos-minX)*scale,oy+(-p[1]-minY)*scale];
 function element(tag,attrs,text){const e=document.createElementNS(svgNS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);return e;}
 for(let x=20;x<340;x+=30)element('path',{d:'M'+x+' 0V230',stroke:'#dce7e6','stroke-width':.6});for(let y=20;y<230;y+=30)element('path',{d:'M0 '+y+'H340',stroke:'#dce7e6','stroke-width':.6});
 element('path',{d:points.map((p,i)=>(i?'L':'M')+project(p).join(' ')).join(' '),stroke:'#087e76','stroke-width':6,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'});
 for(const [p,label] of [[points[0],'А'],[points.at(-1),'Б']]){const [x,y]=project(p);element('circle',{cx:x,cy:y,r:13,fill:label==='А'?'#182d34':'#087e76',stroke:'white','stroke-width':3});element('text',{x,y:y+4,'text-anchor':'middle',fill:'white','font-size':12,'font-weight':700},label);}
 const step=route.steps[index];if(step?.location&&index>0&&index<route.steps.length-1){const [x,y]=project(step.location);element('circle',{cx:x,cy:y,r:8,fill:'#e5a82f',stroke:'white','stroke-width':3});}
 element('text',{x:316,y:22,'text-anchor':'middle',fill:'#617771','font-size':11},'С ↑');return svg;
}
