/* One plain-text itinerary, shared only after a user's tap. */
function routePointText(point){
 if(!point)return '';
 if(point.source==='device-location')return 'Моё местоположение ('+point.lat.toFixed(6)+', '+point.lon.toFixed(6)+')';
 return point.name;
}
function routeMessage(plan){
 if(!plan||!points.from||!points.to)throw Error('Сначала постройте маршрут.');
 const text=['Путь Петербург','Откуда: '+routePointText(points.from),'Куда: '+routePointText(points.to)];
 if(plan.metrics)text.push('Примерно '+timeRange(plan.metrics.time)+' · '+transferCountText(plan.metrics.transfers));
 const steps=guidanceSteps(plan);
 if(steps.length)steps.forEach((s,i)=>text.push((i+1)+'. '+s.title+'\n'+s.text));
 else text.push('Пешком от «'+points.from.name+'» до «'+points.to.name+'».');
 text.push('Время — ориентир без ожидания транспорта и пробок.');
 if(Number.isFinite(points.to.lat)&&Number.isFinite(points.to.lon))text.push('Место назначения в 2ГИС: https://2gis.ru/geo/'+points.to.lon+','+points.to.lat);
 return text.join('\n\n');
}
function routeShareFeedback(message,failedText){
 const status=$('routeShareStatus');if(status)status.textContent=message;
 if(failedText){let box=$('routeShareManual');if(!box){box=node('textarea');box.id='routeShareManual';box.readOnly=true;box.setAttribute('aria-label','Текст маршрута для копирования');$('routeShareActions').after(box)}box.value=failedText;box.focus();box.select();}
}
async function copyRouteMessage(text){
 if(typeof Phone!=='undefined'&&typeof Phone.copyRoute==='function'){Phone.copyRoute(text);return;}
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
  else{const area=node('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);try{area.select();if(!document.execCommand('copy'))throw Error('copy')}finally{area.remove()}}
  routeShareFeedback('Маршрут скопирован. Вставьте его в сообщение.');
 }catch{routeShareFeedback('Выделите и скопируйте текст маршрута.',text)}
}
async function shareRouteMessage(text){
 if(typeof Phone!=='undefined'&&typeof Phone.shareRoute==='function'){Phone.shareRoute(text);return;}
 if(navigator.share){try{await navigator.share({title:'Маршрут · Путь Петербург',text});return}catch(e){if(e.name==='AbortError')return;}}
 await copyRouteMessage(text);
}
const receiveBeforeRouteShare=receive;
receive=function(type,data){
 if(type==='routeCopyResult'){routeShareFeedback(data.ok?'Маршрут скопирован. Вставьте его в сообщение.':'Не удалось скопировать маршрут.',data.ok?null:routeMessage(guidancePlan||activePlan));return;}
 if(type==='routeShareError'){routeShareFeedback('Не удалось открыть отправку. Нажмите «Скопировать маршрут».');return;}
 receiveBeforeRouteShare(type,data);
};
const renderBeforeRouteShare=renderPlan;
renderPlan=function(plan){
 renderBeforeRouteShare(plan);if($('bus667Result')||!$('results').firstChild)return;
 const actions=node('div',undefined,'routeShareActions');actions.id='routeShareActions';
 const copy=node('button','Скопировать маршрут','mapButton'),share=node('button','Поделиться','mapButton');
 copy.type=share.type='button';copy.onclick=()=>copyRouteMessage(routeMessage(plan));share.onclick=()=>shareRouteMessage(routeMessage(plan));
 const status=node('p',undefined,'hint');status.id='routeShareStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 actions.append(copy,share);const summary=$('results').querySelector('.tripSummary');if(summary)summary.append(actions,status);else $('results').prepend(actions,status);
};
