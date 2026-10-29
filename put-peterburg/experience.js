/* Journey-first interface. Existing transport/address engines remain the source of truth. */
let walkingIndex=0,walkingActiveKey='',journeyFinished=false;
function rememberJourney(){try{if(guidancePlan&&!journeyFinished)localStorage.setItem('put.journey.v24',JSON.stringify({plan:guidancePlan,points,index:guidanceIndex,walkingIndex,time:Date.now()}));}catch(e){}}
function forgetJourney(){try{localStorage.removeItem('put.journey.v24')}catch(e){}}
function changeJourneyStep(n){guidanceIndex=n;walkingIndex=0;walkingActiveKey='';rememberJourney();drawGuidance();$('tripGuide')?.scrollIntoView({behavior:'smooth',block:'start'})}
const originalClearGuidance=clearGuidance;
clearGuidance=function(){originalClearGuidance();walkingIndex=0;walkingActiveKey='';journeyFinished=false;document.body.classList.remove('travelling');$('editJourney')?.setAttribute('hidden','');};
const originalGuidanceSteps=guidanceSteps;
guidanceSteps=function(p){return originalGuidanceSteps(p).map(s=>{
 if(s.kind==='pedestrian'){
  const fromMetro=!!METRO.get(s.from?.metroId||s.from?.id),toMetro=!!METRO.get(s.point?.metroId||s.point?.id);
  s.title=fromMetro?'Из метро к '+(BUS.has(s.point.id)?'остановке':'месту назначения'):toMetro?'Пешком ко входу в метро':BUS.has(s.point.id)?'Пешком к остановке':'Пешком до адреса';
  s.text='От «'+s.from.name+'» до «'+s.point.name+'».';
 }
 return s;
});};
function walkingPanel(guide,step){
 const state=requestWalking(step),{a,b}=state;
 if(state.key!==walkingActiveKey){walkingActiveKey=state.key;walkingIndex=0;}
 const intro=node('div',undefined,'walkIntro');
 intro.append(node('p',step.text,'walkEndpoints'));
 if(state.exit)intro.append(node('p','Начало: '+(state.exit.ref?'выход № '+state.exit.ref:'выход метро')+(state.exit.name?' · '+state.exit.name:'')+'. Точка А на схеме.','exitInstruction'));
 else if(METRO.has(step.from.id))intro.append(node('p','Начало показано у станции. Конкретная дверь выхода в базе не подтверждена; сверьте точку А или постройте путь от своего места.','routeCaution'));
 if(state.entry)intro.append(node('p','Конец: '+(state.entry.ref?'вход № '+state.entry.ref:'вход в метро')+'. Точка Б на схеме.','hint'));
 guide.append(intro);
 if(state.state==='pending'){const loading=node('div','Рассчитываем путь по улицам и дорожкам…','walkLoading');loading.setAttribute('role','status');guide.append(loading);}
 else if(state.state==='error'){
  guide.append(node('p',state.error,'routeCaution'));
  const retry=node('button','Повторить расчёт','secondaryWide');retry.onclick=()=>{requestWalking(step,true);drawGuidance()};guide.append(retry);
 }else{
  const r=state.route;walkingIndex=Math.max(0,Math.min(walkingIndex,r.steps.length-1));const current=r.steps[walkingIndex];
  guide.append(node('p',walkingMeters(r.distance)+' по пешеходному маршруту · ≈ '+Math.max(1,Math.ceil(r.duration/60))+' мин','walkDistance'));
  const maneuver=node('div',undefined,'maneuver');maneuver.append(node('div',walkingIndex===0?'НАЧАЛО ПЕШЕГО ПУТИ':current.type==='arrive'?'КОНЕЦ ПЕШЕГО ПУТИ':'УКАЗАНИЕ '+(walkingIndex+1)+' ИЗ '+r.steps.length,'eyebrow'),node('h3',current.title));if(current.meters>0)maneuver.append(node('p','Затем пройдите '+walkingMeters(current.meters)));if(r.steps[walkingIndex+1])maneuver.append(node('p','Далее: '+r.steps[walkingIndex+1].title,'nextManeuver'));guide.append(maneuver);
  if(current.location){const landmark=nearestHouse({lon:current.location[0],lat:current.location[1]},80);if(landmark)guide.append(node('p','Адрес-ориентир рядом: '+landmark.address+' (около '+landmark.distanceMeters+' м от точки указания).','landmark'));}
  const scheme=node('div',undefined,'walkingScheme');scheme.append(walkingSvg(r,walkingIndex),node('p','Схема пути · север сверху · А → Б','schemeCaption'));guide.append(scheme);
  if(walkingIndex===0)guide.append(node('p','Первый поворот отсчитывается от направления движения. Сначала совместите начало пути со схемой.','hint'));
  if(r.snaps.some(n=>n>15))guide.append(node('p','Начало или конец расчётной линии смещены до '+Math.ceil(Math.max(...r.snaps))+' м от заданной точки. Проверьте подход на месте.','routeCaution'));
  const directions=node('details',undefined,'walkingList');directions.append(node('summary','Все пешие указания ('+r.steps.length+')'));
  const list=node('ol');r.steps.forEach((s,i)=>{const li=node('li'),button=node('button',s.title+(s.meters?' · '+walkingMeters(s.meters):''));button.className=i===walkingIndex?'current':'';button.onclick=()=>{walkingIndex=i;rememberJourney();drawGuidance()};li.append(button);list.append(li)});directions.append(list);guide.append(directions);
  const turnActions=node('div',undefined,'turnActions'),back=node('button','← Поворот'),next=node('button',walkingIndex<r.steps.length-1?'Дальше по пути →':'Пеший участок пройден','nextTurn');back.disabled=walkingIndex===0;back.onclick=()=>{walkingIndex--;rememberJourney();drawGuidance()};next.onclick=()=>{if(walkingIndex<r.steps.length-1){walkingIndex++;rememberJourney();drawGuidance()}else completeJourneyStep()};turnActions.append(back,next);guide.append(turnActions);
  guide.append(node('p',(r.cached?'Сохранённый расчёт · ':'')+'Путь: FOSSGIS / OpenStreetMap. Подход ко входу в дом и временные перекрытия могут отсутствовать в карте.','hint'));
 }
 const location=node('button','Я уже на улице — путь от моего места','secondaryWide');location.onclick=()=>walkingFromLocation(step);guide.append(location,navigationButton(a,b,'pedestrian','Открыть этот участок в 2ГИС'));
 const source=node('div',undefined,'walkAttribution');for(const [label,url] of [['© OpenStreetMap','https://www.openstreetmap.org/copyright'],['Исправить карту','https://www.openstreetmap.org/'],['О расчёте пути','https://routing.openstreetmap.de/about.html']]){const link=node('a',label);link.href=url;source.append(link)}guide.append(source);
}
let walkingGpsRequest=null;
function walkingFromLocation(step){
 if(typeof Phone==='undefined'){say('Местоположение доступно в Android-приложении.');return;}
 walkingGpsRequest={plan:guidancePlan,index:guidanceIndex,target:step.point,until:Date.now()+35000};Phone.locate();say('Определяем начало пешего пути. Дождитесь свежих координат на улице.');
}
const receiveBeforeExperience=receive;
receive=function(type,data){receiveBeforeExperience(type,data);
 if(type==='gps'&&walkingGpsRequest){const q=walkingGpsRequest;
  if(Date.now()>q.until||q.plan!==guidancePlan||q.index!==guidanceIndex){walkingGpsRequest=null;return;}
  if(data.cached||data.conflict||!Number.isFinite(data.accuracy)||data.accuracy>50||(data.ageSeconds||0)>15)return;
  walkingGpsRequest=null;const steps=guidanceSteps(guidancePlan),s=steps[guidanceIndex];if(!s||s.kind!=='pedestrian')return;
  guidancePlan.walkOrigins=guidancePlan.walkOrigins||{};guidancePlan.walkOrigins[guidanceIndex]={name:'Моё место на улице',lat:data.lat,lon:data.lon};walkingIndex=0;walkingActiveKey='';drawGuidance();say('Начало пешего участка обновлено по вашему местоположению.');
 }
};
const stepsBeforeGps=guidanceSteps;
guidanceSteps=function(p){return stepsBeforeGps(p).map((s,i)=>p.walkOrigins?.[i]?{...s,from:p.walkOrigins[i],text:'От вашего места до «'+s.point.name+'».'}:s)};
function completeJourneyStep(){
 const steps=guidanceSteps(guidancePlan);if(guidanceIndex<steps.length-1){changeJourneyStep(guidanceIndex+1);return;}
 journeyFinished=true;forgetJourney();const guide=$('tripGuide');guide.replaceChildren(node('div','ВЫ ПРИШЛИ','eyebrow'),node('h2','Поездка завершена'),node('p',points.to.name));const again=node('button','Построить новый маршрут','primary');again.onclick=()=>{clearRoute();document.querySelector('h1').scrollIntoView({behavior:'smooth'})};guide.append(again);
}
drawGuidance=function(){
 const guide=$('tripGuide');if(!guide||!guidancePlan||journeyFinished)return;
 const steps=guidanceSteps(guidancePlan),step=steps[guidanceIndex];if(!step)return;
 guide.replaceChildren();const progress=node('div',undefined,'journeyProgress');progress.append(node('span','ШАГ '+(guidanceIndex+1)+' / '+steps.length),node('span',step.kind==='pedestrian'?'ПЕШКОМ':step.leg?'В ПУТИ':'ПОЕЗДКА'));
 const bar=node('div',undefined,'progressTrack'),fill=node('div');fill.style.width=((guidanceIndex+1)/steps.length*100)+'%';bar.append(fill);
 guide.append(progress,bar,node('h2',step.title));
 if(step.kind==='pedestrian')walkingPanel(guide,step);else{
  guide.append(node('p',step.text,'currentInstruction'));
  if(step.leg){const stops=node('details',undefined,'stopDetails');stops.append(node('summary','Остановки по пути'),makeJourney(step.leg,planTable(step.leg),step.leg.transport));guide.append(stops)}
  guide.append(mapButton(step.point,'Где находится это место'));
 }
 const actions=node('div',undefined,'guideActions'),prev=node('button','← Шаг назад'),next=node('button',step.done,'nextStep');prev.disabled=guidanceIndex===0;prev.onclick=()=>changeJourneyStep(guidanceIndex-1);next.onclick=completeJourneyStep;actions.append(prev,next);guide.append(actions,node('p','Отмечайте пройденные шаги кнопками.','hint guideNotice'));rememberJourney();
};
renderPlan=function(p){
 detailedRender(p);if(!p.legs.some(l=>l.type==='ride')||$('bus667Result'))return;
 guidancePlan=p;guidanceIndex=0;walkingIndex=0;walkingActiveKey='';journeyFinished=false;
 const results=$('results'),technical=node('details',undefined,'card routeDetails');technical.append(node('summary','Остановки, пересадки и данные маршрута'));while(results.firstChild)technical.append(results.firstChild);
 const summary=node('section',undefined,'tripSummary');summary.append(node('div','ВАША ПОЕЗДКА','eyebrow'),node('h2',shortRoute(p)),node('p',points.from.name+' → '+points.to.name,'routeEndpoints'),node('p','≈ '+timeRange(p.metrics.time)+' · '+transferCountText(p.metrics.transfers),'routeEstimate'),node('p','Оценка времени без ожидания и пробок. Пешие участки уточняются отдельно.','hint'));
 const guide=node('section',undefined,'card guideCard');guide.id='tripGuide';guide.setAttribute('aria-live','polite');
 const itinerary=node('details',undefined,'card fullItinerary');itinerary.append(node('summary','Весь путь по шагам'));
 const list=node('ol',undefined,'compactItinerary');guidanceSteps(p).forEach((s,i)=>{const li=node('li'),b=node('button',s.title);b.onclick=()=>{changeJourneyStep(i);document.body.classList.add('travelling')};li.append(b);list.append(li)});itinerary.append(list);
 results.append(summary,guide,itinerary,technical);document.body.classList.add('travelling');$('editJourney').hidden=false;$('editJourney').textContent='Изменить маршрут';drawGuidance();
};
// Keep the same input elements and listeners when switching between search and trip.
const planner=node('section');planner.id='planner';const first=document.querySelector('main>h1'),resultsStart=$('choices');let part=first;while(part&&part!==resultsStart){const next=part.nextSibling;if(part!==$('status'))planner.append(part);part=next;}document.querySelector('header').after(planner);
const edit=node('button','Изменить маршрут','editJourney');edit.id='editJourney';edit.hidden=true;edit.onclick=()=>{const travelling=document.body.classList.toggle('travelling');edit.textContent=travelling?'Изменить маршрут':'К поездке →';if(!travelling)$('from').scrollIntoView({behavior:'smooth',block:'center'})};document.querySelector('header').append(edit);
try{const saved=JSON.parse(localStorage.getItem('put.journey.v24')||'null');if(saved&&Date.now()-saved.time<86400000&&saved.points?.from&&saved.points?.to&&Array.isArray(saved.plan?.legs)){
 const resume=node('section',undefined,'card resumeJourney');resume.append(node('strong','Продолжить поездку?'),node('p',saved.points.to.name));const yes=node('button','Продолжить с последнего шага','primary'),no=node('button','Новый маршрут','secondaryWide');yes.onclick=()=>{try{points=saved.points;for(const f of ['from','to'])$(f).value=points[f].name;renderPlan(saved.plan);activePlan=saved.plan;guidanceIndex=Math.max(0,Math.min(saved.index||0,guidanceSteps(saved.plan).length-1));walkingIndex=saved.walkingIndex||0;const restoredStep=guidanceSteps(saved.plan)[guidanceIndex];if(restoredStep?.kind==='pedestrian'){const end=walkingEndpoints(restoredStep);walkingActiveKey=walkingKey(end.a,end.b)}drawGuidance();resume.remove()}catch(e){forgetJourney();resume.remove();clearRoute();say('Сохранённую поездку не удалось восстановить. Постройте маршрут заново.')}};no.onclick=()=>{forgetJourney();resume.remove()};resume.append(yes,no);planner.prepend(resume);
}}catch(e){forgetJourney()}

const example=document.querySelector('.quickRoute');if(example)document.querySelector('.otherTransport').append(example);
