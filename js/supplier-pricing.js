/* RIAL SPb: general 4 mm list dated 14.10.2026; earlier agreement retained for cart migration. */
(function(root){
'use strict';
function rectangular(shape){return shape==='rect'||shape==='double';}
function legacyLookup(shape,material,width,height,edge,height2,options){
 options=options||{};
 var missing={cost:null,includesPackaging:false,estimate:false,needsQuote:true};
 if(['silver','graphite','bronze'].indexOf(material)<0 || ['grind','polish','curved-grind','curved-polish'].indexOf(edge)<0)return missing;
 if(['rect','double','arch','rounded','circle','oval','capsule','semicircle','semidouble','curved'].indexOf(shape)<0)return missing;
 var w=Number(width),h=Number(height),h2=Number(height2||0),rect=rectangular(shape);
 if(!(w>0&&h>0)||(/double/.test(shape)&&!(h2>0)))return missing;
 if(shape==='circle')h=w;
 var totalH=h+(shape==='semidouble'?h2:0);
 var stockHeights=shape==='double'?[h,h2]:[totalH];
 if(material!=='silver'&&stockHeights.some(function(ph){return Math.max(w,ph)>2550||Math.min(w,ph)>1605;}))return missing;
 if(shape==='curved'&&options.category!=='simple-template'){
  var quoted=Number(options.cost);
  if(!Number.isFinite(quoted)||quoted<=0)return missing;
  var quotedArea=w*totalH/1000000;
  return {cost:quoted,materialCost:quoted,edgeCost:0,shapeCost:0,packagingCost:quotedArea*100,includesPackaging:false,estimate:false,needsQuote:false,pricingMode:'quoted',sizeSurcharge:0,splitFactor:1,roundedFactor:1,shapeRate:0,area:quotedArea,perimeter:2*(w+totalH)/1000};
 }
 var grind=edge.indexOf('grind')!==-1;
 var materialCost=0,edgeCost=0,packagingArea=0,perimeter=0,area=0;
 {
  stockHeights.forEach(function(ph){
   var partArea=w*ph/1000000,partPerimeter=2*(w+ph)/1000;
   // Circle procurement uses a square blank of at least 1000 x 1000 mm.
   // Product dimensions still determine LEDs, packaging and installation.
   var blankW=shape==='circle'?Math.max(1000,w):w;
   var blankH=shape==='circle'?Math.max(1000,ph):ph;
   var billedArea=blankW*blankH/1000000,billedPerimeter=2*(blankW+blankH)/1000;
   var maxSide=Math.max(blankW,blankH);
   var sizeFactor=maxSide>=2500?2:maxSide>=2000?1.5:maxSide>=1500?1.3:1;
   var smallFactor=billedArea<0.04?2:billedArea<0.12?1.5:1;
   materialCost+=Math.max(billedArea,0.2)*(material==='silver'?1750:3300);
   edgeCost+=billedPerimeter*(grind?70:90)*sizeFactor*smallFactor;
   packagingArea+=partArea;area+=partArea;perimeter+=partPerimeter;
  });
 }
 // All rounded shapes use the rectangular blank and straight-edge tariff,
 // then the supplier's 50% shape surcharge. Extras are outside this base.
 var shapeRate=rect?0:(shape==='curved'&&options.category==='simple-template'?0.3:0.5);
 var shapeCost=(materialCost+edgeCost)*shapeRate;
 return {cost:Math.max(350,materialCost+edgeCost+shapeCost),materialCost:materialCost,edgeCost:edgeCost,shapeCost:shapeCost,packagingCost:packagingArea*100,includesPackaging:false,estimate:shape==='curved',needsQuote:false,pricingMode:'supplier',shapeRate:shapeRate,sizeSurcharge:0,splitFactor:shape==='semidouble'?1.2:1,roundedFactor:1,area:area,perimeter:perimeter};
}

// RIAL order 17095, 02.11.2026: material by bounding area, +50% on
// shaped material only, rounded roubles; edge metres rounded up, 80/250 RUB.
// This agreed quote overrides the general PDF's 270 RUB CNC base rate.
function agreedLookup(shape,material,width,height,edge,height2,options){
 options=options||{};
 var missing={cost:null,includesPackaging:false,estimate:false,needsQuote:true};
 if(['silver','graphite','bronze'].indexOf(material)<0||['grind','polish','curved-grind','curved-polish'].indexOf(edge)<0)return missing;
 if(['rect','double','arch','rounded','circle','oval','capsule','semicircle','semidouble','curved'].indexOf(shape)<0)return missing;
 var w=Number(width),h=shape==='circle'?w:Number(height),h2=Number(height2||0),rect=rectangular(shape);
 if(!Number.isFinite(w)||!Number.isFinite(h)||!(w>0&&h>0)||(/double/.test(shape)&&(!Number.isFinite(h2)||!(h2>0))))return missing;
 var totalH=h+(shape==='semidouble'?h2:0),parts=shape==='double'?[h,h2]:[totalH];
 if(parts.some(function(ph){return Math.max(w,ph)>3210||Math.min(w,ph)>(material==='silver'?2550:2530);}))return missing;
 var area=0,perimeter=0;
 parts.forEach(function(ph){area+=w*ph/1000000;perimeter+=2*(w+ph)/1000;});
 if(shape==='curved'&&options.category==='quoted'){
  var quoted=Number(options.cost);if(!Number.isFinite(quoted)||quoted<=0)return missing;
  return {cost:quoted,materialCost:quoted,edgeCost:0,shapeCost:0,packagingCost:0,includesPackaging:false,estimate:false,needsQuote:false,pricingMode:'quoted',shapeRate:0,sizeSurcharge:0,splitFactor:1,roundedFactor:1,area:area,perimeter:perimeter};
 }
 var rate=material==='silver'?1568:2800,edgeRate=rect?80:250,shapeRate=rect?0:0.5;
 var materialCost=0,shapeCost=0,edgeCost=0,billedMetres=0;
 parts.forEach(function(ph){
  var blankArea=Math.max(w*ph/1000000,0.2),raw=blankArea*rate;
  var roundedMaterial=Math.round(raw*(1+shapeRate));
  // Preserve the supplier's confirmed 1694 RUB material line for the 900 x 800 wave.
  if(shape==='curved'&&material==='silver'&&((w===900&&ph===800)||(w===800&&ph===900)))roundedMaterial=1694;
  materialCost+=Math.round(raw);shapeCost+=roundedMaterial-Math.round(raw);
  var metres=Math.ceil(2*(w+ph)/1000-1e-9);billedMetres+=metres;edgeCost+=metres*edgeRate;
 });
 var agreedWave=shape==='curved'&&material==='silver'&&((w===900&&totalH===800)||(w===800&&totalH===900));
 return {cost:materialCost+shapeCost+edgeCost,materialCost:materialCost,shapeCost:shapeCost,edgeCost:edgeCost,
  packagingCost:0,includesPackaging:false,estimate:shape==='curved'&&!agreedWave,needsQuote:false,pricingMode:'rial',
  billedMetres:billedMetres,edgeRate:edgeRate,shapeRate:shapeRate,sizeSurcharge:0,splitFactor:1,roundedFactor:1,area:area,perimeter:perimeter,maxSide:Math.max.apply(null,[w].concat(parts)),minSide:Math.min.apply(null,[w].concat(parts))};
}

// General RIAL price list dated 14.10.2026, 4 mm only.
var materials={
 silver:{label:'Серебро, 4 мм',rate:1568,sheet:1073,w:3210,h:2550},
 crystal:{label:'Осветлённое Crystalvision, 4 мм',rate:3100,sheet:2015,w:3210,h:2550},
 bronze:{label:'Бронза, 4 мм',rate:2800,sheet:1820,w:3210,h:2530},
 graphite:{label:'Графит, 4 мм',rate:2800,sheet:1820,w:3210,h:2530},
 antique:{label:'Состаренное, 4 мм',rate:9460,sheet:7310,w:3300,h:2140},
 satinSilver:{label:'Сатинат серебро, 4 мм',rate:3750,sheet:1950,w:3210,h:2550},
 satinBronze:{label:'Сатинат бронза, 4 мм',rate:3750,sheet:1950,w:3210,h:2550},
 satinGraphite:{label:'Сатинат графит, 4 мм',rate:4000,sheet:2080,w:3210,h:2550},
 decorative:{label:'Декоративное зеркало, 4 мм',rate:4320,sheet:3600,w:2550,h:1605}
};
function lookup(shape,material,width,height,edge,height2,options){
 options=options||{};
 var missing={cost:null,includesPackaging:false,estimate:false,needsQuote:true};
 var stock=materials[material],w=Number(width),h=shape==='circle'?w:Number(height),h2=Number(height2||0);
 if(!stock||!Number.isFinite(w)||!Number.isFinite(h)||!(w>0&&h>0))return missing;
 if(['rect','double','arch','rounded','circle','oval','capsule','semicircle','semidouble','curved'].indexOf(shape)<0||['grind','polish','curved-grind','curved-polish'].indexOf(edge)<0)return missing;
 if(/double/.test(shape)&&(!Number.isFinite(h2)||h2<=0))return missing;
 var parts=shape==='double'?[h,h2]:shape==='semidouble'?[h,h2]:[h];
 if(parts.some(function(ph){return !((w<=stock.w&&ph<=stock.h)||(ph<=stock.w&&w<=stock.h));}))return missing;
 var area=0,perimeter=0,materialCost=0,shapeCost=0,edgeCost=0,billedMetres=0;
 var figured=!rectangular(shape),shapeRate=figured?0.5:0;
 // CNC is the default for shaped mirrors; ordinary curved processing remains selectable.
 var cnc=options.machine==='cnc'||(options.machine!=='standard'&&figured);
 var edgeRate=(cnc?270:80)*(figured?1.5:1);
 parts.forEach(function(ph){
  var a=w*ph/1e6,per=2*(w+ph)/1000,raw=Math.max(a,0.2)*stock.rate;
  area+=a;perimeter+=per;materialCost+=raw;shapeCost+=raw*shapeRate;
  var metres=Math.ceil(per-1e-9);billedMetres+=metres;edgeCost+=metres*edgeRate;
 });
 if(shape==='curved'&&options.category==='quoted'){
  var quoted=Number(options.cost);if(!Number.isFinite(quoted)||quoted<=0)return missing;
  materialCost=quoted;shapeCost=0;edgeCost=0;shapeRate=0;
 }
 return {cost:materialCost+shapeCost+edgeCost,materialCost:materialCost,shapeCost:shapeCost,edgeCost:edgeCost,
  packagingCost:0,includesPackaging:false,estimate:shape==='curved'&&options.category!=='quoted',needsQuote:false,
  pricingMode:shape==='curved'&&options.category==='quoted'?'quoted':'rial-list',billedMetres:billedMetres,edgeRate:edgeRate,
  shapeRate:shapeRate,sizeSurcharge:0,splitFactor:1,roundedFactor:1,area:area,perimeter:perimeter,maxSide:Math.max.apply(null,[w].concat(parts)),minSide:Math.min.apply(null,[w].concat(parts))};
}

// Markup on mirror + edge: no light +100%; with light +150% (rect, double) or +115% (shaped).
function markup(light,shape){return light?(rectangular(shape)?1.5:1.15):1;}
function purchasingTrip(width,height){
 var mm=Math.max(Number(width),Number(height));return mm<=1800?300:mm<=2000?450:750;
}
// Усиление сзади (опция): уголок 20×20×1,5 — 141 ₽/м, труба 20×20×2 — 366,5 ₽/м, плюс 300 ₽ за поездку.
var REINF={angle:{label:'уголок 20×20×1,5 мм',rate:141},tube:{label:'труба 20×20×2 мм',rate:366.5}};
function rearProfile(kind,shape,width,height,height2){
 var t=REINF[kind];if(!t)return {metres:0,cost:0};
 var w=Number(width),h=shape==='circle'?w:Number(height);
 if(shape==='double'||shape==='semidouble')h+=Number(height2||0);
 var metres=2*(w+h)/1000;
 return {metres:metres,cost:Math.round(metres*t.rate+300)};
}
function reinforcementKind(choice,shape,width,height,height2){
 var w=Number(width),h=shape==='circle'?w:Number(height);
 if(shape==='double'||shape==='semidouble')h+=Number(height2||0);
 return (choice==='angle'||choice==='tube')?choice:(Math.max(w,h)>2600?'tube':Math.max(w,h)>1800?'angle':'none');
}
function reinforcement(shape,width,height,height2){
 var w=Number(width),h=shape==='circle'?w:Number(height);
 if(shape==='double'||shape==='semidouble')h+=Number(height2||0);
 var metres=Math.max(w,h)<=1800?0:2*(w+h)/1000;
 return {metres:metres,cost:metres*349,rate:349};
}

// Update circles already stored in carts without adding the difference twice.
function refreshCircleCalculation(data){
 if(!data||!data.mirror||!Array.isArray(data.rows))return data;
 var m=data.mirror,d=Number(m.width);
 if(m.shape!=='circle'||m.circleBlankVersion===1||!(d>0&&d<1000))return data;
 var old=legacyLookup('rect',m.material,d,d,m.edge,0),quote=legacyLookup('circle',m.material,d,d,m.edge,0);
 if(old.needsQuote||quote.needsQuote)return data;
 var dm=quote.materialCost-old.materialCost,de=quote.edgeCost-old.edgeCost;
 var ds=(dm+de)*0.5,base=dm+de+ds,margin=base*markup(m.light,m.shape);
 var six=m.pricingVersion===2?0:(base+margin)*0.06,two=m.pricingVersion===2?0:(base+margin+six)*0.02,delta=base+margin+six+two;
 var changes={'Зеркальная заготовка':[dm,dm],'Обработка кромки':[de,de],
  'Закругление: надбавка поставщика 50%':[ds,ds],
  'Наценка на зеркало и обработку':[margin,0],'Надбавка 6%':[six,0],'Дополнительная надбавка 2%':[two,0]};
 var rows=data.rows.map(function(row){
  var change=row.key==='mirror'?[delta,0]:changes[row.name];
  if(!change)return Object.assign({},row);
  return Object.assign({},row,{sale:row.sale+change[0],cost:row.cost===null?null:row.cost+change[1]});
 });
 return Object.assign({},data,{total:data.total+delta,rows:rows,mirror:Object.assign({},m,{circleBlankVersion:1})});
}


// Reprice LED components in orders from earlier app releases.
function refreshComponentCalculation(data){
 data=refreshCircleCalculation(data);
 if(!data||!data.mirror||!Array.isArray(data.rows))return data;
 var m=data.mirror;if(!m.light||m.componentTariffVersion===1)return data;
 var w=Number(m.width),h=m.shape==='circle'?w:Number(m.height);
 if(m.shape==='double'||m.shape==='semidouble')h+=Number(m.height2)||0;
 if(!(w>0&&h>0))return data;
 var rolls=Math.ceil((2*(w+h)/1000)/5),led=-100*rolls,block=-50,button=-100;
 var base=led+block+button,six=m.pricingVersion===2?0:base*0.06,two=m.pricingVersion===2?0:(base+six)*0.02;
 var split=m.pricingVersion===2?1:m.shape==='semidouble'?1.2:1,delta=(base+six)*split*(m.pricingVersion===2?1:1.02);
 var changes={'LED-лента':[led,led],'Блок питания':[block,block],'Управление':[button,button],
  'Надбавка 6%':[six,0],'Полукруг из двух частей':[(base+six)*(split-1),0],
  'Дополнительная надбавка 2%':[two*split,0]};
 var rows=data.rows.map(function(row){
  var change=row.key==='mirror'?[delta,0]:changes[row.name];
  return change?Object.assign({},row,{sale:row.sale+change[0],cost:row.cost===null?null:row.cost+change[1]}):Object.assign({},row);
 });
 return Object.assign({},data,{total:data.total+delta,rows:rows,mirror:Object.assign({},m,{componentTariffVersion:1})});
}


// Replace the pre-4.14 automatic extras in saved orders. New calculations
// contain only procurement with markup, the three LED items and selected options.
function refreshCleanBaseCalculation(data){
 data=refreshComponentCalculation(data);
 if(!data||!data.mirror||!Array.isArray(data.rows)||data.mirror.pricingVersion===2)return data;
 var m=data.mirror,w=Number(m.width),h=m.shape==='circle'?w:Number(m.height),h2=Number(m.height2)||0;
 if(!(w>0&&h>0))return data;
 var q=legacyLookup(m.shape,m.material,w,h,m.edge,h2,{category:m.supplierCategory,cost:m.supplierCost});
 if(q.needsQuote)return data;
 var base=q.cost*(1+markup(m.light,m.shape));
 var led=m.light?Math.ceil(q.perimeter/5)*600+650+500:0;
 var extras=(m.film?q.area*500:0)+(m.heat?2500:0)+(m.ledProfile&&m.light?q.perimeter*600:0);
 var legacy=base+led+extras+q.packagingCost+reinforcement(m.shape,w,h,h2).cost;
 if(m.light)legacy+=q.perimeter*1010/6+Math.ceil(q.perimeter/2)*50;
 legacy*=1.06*q.splitFactor*1.02;
 var clean=base+led+extras,delta=clean-legacy;
 var excluded=['Упаковка','Заднее усиление П-профилем 20×20×1,5 мм','EVA-профиль под LED-ленту','Крепления','Доплата за размер','Надбавка 6%','Дополнительная надбавка 2%','Полукруг из двух частей','Закруглённые углы'];
 var generic=data.rows.some(function(row){return row.key==='mirror';});
 var rows=data.rows.filter(function(row){return excluded.indexOf(row.name)===-1;}).map(function(row){return row.key==='mirror'?Object.assign({},row,{sale:row.sale+delta}):Object.assign({},row);});
 var total=generic?data.total+delta:rows.reduce(function(sum,row){return sum+row.sale;},0);
 return Object.assign({},data,{rows:rows,total:total,mirror:Object.assign({},m,{pricingVersion:2})});
}

// EVA is charged by the metre only for illuminated mirrors, with no markup.
function refreshEVACalculation(data){
 data=refreshCleanBaseCalculation(data);
 if(!data||!data.mirror||!Array.isArray(data.rows)||data.mirror.evaTariffVersion===1)return data;
 var m=data.mirror,delta=0,metres=0;
 if(m.light){
  var q=legacyLookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,{category:m.supplierCategory,cost:m.supplierCost});
  if(q.needsQuote)return data;
  metres=q.perimeter;delta=metres*119;
 }
 var generic=data.rows.some(function(row){return row.key==='mirror';});
 var rows=data.rows.map(function(row){return row.key==='mirror'?Object.assign({},row,{sale:row.sale+delta}):Object.assign({},row);});
 if(m.light&&!generic)rows.push({key:'',name:'EVA-профиль под LED-ленту',sale:delta,cost:delta,note:metres.toFixed(2)+' м × 119 ₽/м'});
 return Object.assign({},data,{total:data.total+delta,rows:rows,mirror:Object.assign({},m,{evaTariffVersion:1})});
}

function refreshProfileCalculation(data){
 if(!data||!data.mirror||!Array.isArray(data.rows)||data.mirror.ledProfileTariffVersion===1)return data;
 var m=data.mirror,delta=0,metres=0;
 if(m.ledProfile&&m.light){
  var q=legacyLookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,{category:m.supplierCategory,cost:m.supplierCost});
  if(q.needsQuote)return data;
  metres=q.perimeter;delta=metres*(250-600);
 }
 var rows=data.rows.map(function(row){
  if(row.key==='mirror')return Object.assign({},row,{sale:row.sale+delta});
  if(m.ledProfile&&m.light&&(row.expense==='profile'||row.name==='LED-профиль'))return Object.assign({},row,{sale:metres*250});
  return Object.assign({},row);
 });
 return Object.assign({},data,{rows:rows,total:data.total+delta,mirror:Object.assign({},m,{ledProfileTariffVersion:1})});
}

function refreshRialCalculation(data){
 if(!data||!data.mirror||!Array.isArray(data.rows)||data.mirror.supplierTariffVersion===1)return data;
 var m=data.mirror,options={category:m.supplierCategory,cost:m.supplierCost};
 var previous=legacyLookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,options);
 var quote=agreedLookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,options);
 if(previous.needsQuote||quote.needsQuote)return data;
 var margin=markup(m.light,m.shape),delta=(quote.cost-previous.cost)*(1+margin),generic=data.rows.some(function(r){return r.key==='mirror';});
 var rows=data.rows.map(function(row){
  var r=Object.assign({},row);
  if(generic){if(r.key==='mirror')r.sale+=delta;return r;}
  var value;
  if(r.name==='Зеркальная заготовка'){value=quote.materialCost;r.note='RIAL, расчёт 17095 от 02.11.2026';}
  else if(r.name==='Обработка кромки'){value=quote.edgeCost;r.note=quote.pricingMode==='quoted'?'Включена в цену производителя':quote.billedMetres+' м × '+quote.edgeRate+' ₽/м';}
  else if(r.name==='Закругление: надбавка поставщика 50%'||r.name==='Простой шаблон: надбавка поставщика 30%'||r.name==='Фигурная форма: 50% только к материалу'){
   value=quote.shapeCost;r.name='Фигурная форма: 50% только к материалу';r.note='С округлением стоимости материала до рубля';
  }else if(r.name==='Наценка на зеркало и обработку'){value=quote.cost*margin;r.sale=value;r.cost=0;return r;}
  if(value!==undefined){r.sale=value;r.cost=value;}return r;
 });
 return Object.assign({},data,{rows:rows,total:data.total+delta,mirror:Object.assign({},m,{supplierTariffVersion:1,estimate:quote.estimate})});
}
function refreshAgreementCalculation(data){
 if(data&&data.mirror&&data.mirror.supplierTariffVersion===1)return data;
 return refreshRialCalculation(refreshProfileCalculation(refreshEVACalculation(data)));
}

// Equipment is selected internally; normalize earlier customer choices once.
function refreshAutomaticProcessing(data){
 var m=data&&data.mirror;if(!m||!Array.isArray(data.rows))return data;
 var options=m.mirrorOptions||{},oldMethod=options.machine||'auto';
 var cleanLabel=String(m.edgeLabel||'').replace(/\s*\(ЧПУ\)/g,'');
 if(oldMethod==='auto'&&cleanLabel===m.edgeLabel)return data;
 var oldQuote=lookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,{category:m.supplierCategory,cost:m.supplierCost,machine:oldMethod});
 var quote=lookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,{category:m.supplierCategory,cost:m.supplierCost,machine:'auto'});
 if(oldQuote.needsQuote||quote.needsQuote)return data;
 var diff=quote.cost-oldQuote.cost,factor=1+markup(m.light,m.shape),delta=diff*factor;
 var rows=data.rows.map(function(row){var r=Object.assign({},row);
  if(r.key==='mirror')r.sale+=delta;
  else if(r.name==='Обработка кромки'){r.sale+=diff;if(r.cost!==null)r.cost+=diff;}
  else if(r.name==='Наценка на зеркало и обработку')r.sale+=diff*(factor-1);
  return r;
 });
 return Object.assign({},data,{rows:rows,total:data.total+delta,mirror:Object.assign({},m,{edgeLabel:cleanLabel,mirrorOptions:Object.assign({},options,{machine:'auto'})})});
}
function refreshCleanCalculation(data){
 if(!data||!data.mirror||!Array.isArray(data.rows))return data;
 if(data.mirror.supplierTariffVersion===2)return refreshAutomaticProcessing(data);
 data=refreshAgreementCalculation(data);
 var m=data.mirror,old=agreedLookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,{category:m.supplierCategory,cost:m.supplierCost});
 var q=lookup(m.shape,m.material,m.width,m.height,m.edge,m.height2,{category:m.supplierCategory,cost:m.supplierCost});
 if(old.needsQuote||q.needsQuote)return data;
 var factor=1+markup(m.light,m.shape),delta=(q.cost-old.cost)*factor;

 var rows=data.rows.map(function(row){
  var r=Object.assign({},row);
  if(r.key==='mirror')r.sale+=delta;
  else if(r.name==='Зеркальная заготовка'){r.sale=r.cost=q.materialCost;r.note='RIAL, прайс 14.10.2026';}
  else if(r.name==='Обработка кромки'){r.sale=r.cost=q.edgeCost;r.note=q.billedMetres+' м × '+q.edgeRate+' ₽/м';}
  else if(r.name==='Фигурная форма: 50% только к материалу')r.sale=r.cost=q.shapeCost;
  else if(r.name==='Наценка на зеркало и обработку'){r.sale=q.cost*(factor-1);r.cost=0;}

  return r;
 });
 return Object.assign({},data,{rows:rows,total:data.total+delta,mirror:Object.assign({},m,{supplierTariffVersion:2})});
}


var api={materials:materials,agreedLookup:agreedLookup,refreshCleanCalculation:refreshCleanCalculation,tariffs:{supplier:"RIAL",date:"2026-11-02",silver:1568,special:2800,straightGrind:80,straightPolish:80,curvedGrind:120,curvedPolish:120,cnc:270,curvedCnc:405,round:0.5},refreshComponentCalculation:refreshComponentCalculation,refreshCircleCalculation:refreshCircleCalculation,lookup:lookup,markup:markup,purchasingTrip:purchasingTrip,reinforcement:reinforcement,rearProfile:rearProfile,reinforcementKind:reinforcementKind,REINF:REINF};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorSupplierPricing=api;
})(typeof window==='object'?window:globalThis);

