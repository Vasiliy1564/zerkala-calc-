/* 667 has two services. The bundled OSM patterns are incomplete; never use
 * their three stored points as a complete itinerary or a stop countdown. */
const BUS667_SERVICES = [
 {key:'red',name:'667 (красный)',terminus:'ЖК «Энфилд», Бугры',note:'Обозначение «красный» есть в 2ГИС. Конечная подтверждена администрацией Мурино.'},
 {key:'second',name:'667 — второй вариант',terminus:'Воронцовский бульвар, 22',note:'В Яндекс Расписаниях указан отдельный № 667. Синий цвет независимо не подтверждён.'}
];
function bus667Link(text,url){const a=node('a',text,'mapButton');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function bus667Cards(parent){
 parent.append(node('h2','Два разных № 667'),node('p','Сверяйте конечную на табличке автобуса. Один номер не означает один маршрут.'));
 for(const service of BUS667_SERVICES){const card=node('section',undefined,'service667 '+service.key);card.append(node('strong',service.name),node('p','Девяткино ↔ '+service.terminus),node('p',service.note,'hint'));parent.append(card);}
 parent.append(node('p','Полный актуальный список остановок в приложении не подтверждён. Счётчик для № 667 отключён.','hint'));
 parent.append(bus667Link('Оба направления № 667 в расписании','https://rasp.yandex.ru/station/9837872/'));
 const sources=node('details');sources.append(node('summary','Источники · проверено 20.10.2026'),bus667Link('Администрация Мурино','https://mo-murino.ru/obshchie-svedeniya/transportnaya-infrastruktura/'),bus667Link('2ГИС: 667 (красный), ЖК Энфилд','https://2gis.ru/spb/search/'+encodeURIComponent('Энфилд садик')));parent.append(sources);
}
const originalRender667=renderPlan;
renderPlan=function(plan){
 const affected=plan.legs.some(leg=>leg.route&&patternById.get(leg.route)?.ref==='667');
 if(!affected)return originalRender667(plan);
 const box=node('section',undefined,'card');box.id='bus667Result';bus667Cards(box);
 box.prepend(node('div','УТОЧНЕНИЕ МАРШРУТА','eyebrow'));
 box.append(node('p',points.from.name+' → '+points.to.name));
 box.append(navigationButton(points.from,points.to,'bus','Построить точный маршрут в 2ГИС'));
 $('results').replaceChildren(box);activePlan=null;
};
const guide667=node('details');guide667.id='bus667Guide';guide667.className='card';guide667.append(node('summary','Красный и второй № 667 — чем отличаются'));
bus667Cards(guide667);$('results').before(guide667);
