/* SPb supplier tariff 12.10.2026. Rounded contours: bounding rectangle +50%. */
(function(root){
'use strict';
function rectangular(shape){return shape==='rect'||shape==='double';}
function lookup(shape,material,width,height,edge,height2,options){
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
function markup(light,shape){return light?1.5:1;}
function purchasingTrip(width,height){
 var longer=Math.max(Number(width),Number(height)),shorter=Math.min(Number(width),Number(height));
 if(longer<1800&&shorter<=1500)return 700;
 if(longer<=2000&&shorter<=1000)return 1000;
 return 2000;
}
function reinforcement(shape,width,height,height2){
 var w=Number(width),h=shape==='circle'?w:Number(height);
 if(shape==='double'||shape==='semidouble')h+=Number(height2||0);
 var metres=h<=1800?0:h<=2000?2*h/1000:2*(w+h)/1000;
 return {metres:metres,cost:metres*349,rate:349};
}

// Update circles already stored in carts without adding the difference twice.
function refreshCircleCalculation(data){
 if(!data||!data.mirror||!Array.isArray(data.rows))return data;
 var m=data.mirror,d=Number(m.width);
 if(m.shape!=='circle'||m.circleBlankVersion===1||!(d>0&&d<1000))return data;
 var old=lookup('rect',m.material,d,d,m.edge,0),quote=lookup('circle',m.material,d,d,m.edge,0);
 if(old.needsQuote||quote.needsQuote)return data;
 var dm=quote.materialCost-old.materialCost,de=quote.edgeCost-old.edgeCost;
 var ds=(dm+de)*0.5,base=dm+de+ds,margin=base*markup(m.light,m.shape);
 var six=(base+margin)*0.06,two=(base+margin+six)*0.02,delta=base+margin+six+two;
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
 var base=led+block+button,six=base*0.06,two=(base+six)*0.02;
 var split=m.shape==='semidouble'?1.2:1,delta=(base+six)*split*1.02;
 var changes={'LED-лента':[led,led],'Блок питания':[block,block],'Управление':[button,button],
  'Надбавка 6%':[six,0],'Полукруг из двух частей':[(base+six)*(split-1),0],
  'Дополнительная надбавка 2%':[two*split,0]};
 var rows=data.rows.map(function(row){
  var change=row.key==='mirror'?[delta,0]:changes[row.name];
  return change?Object.assign({},row,{sale:row.sale+change[0],cost:row.cost===null?null:row.cost+change[1]}):Object.assign({},row);
 });
 return Object.assign({},data,{total:data.total+delta,rows:rows,mirror:Object.assign({},m,{componentTariffVersion:1})});
}

var api={tariffs:{silver:1750,special:3300,straightGrind:70,straightPolish:90,curvedGrind:120,curvedPolish:180,simpleTemplate:0.3,round:0.5},refreshComponentCalculation:refreshComponentCalculation,refreshCircleCalculation:refreshCircleCalculation,lookup:lookup,markup:markup,purchasingTrip:purchasingTrip,reinforcement:reinforcement};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorSupplierPricing=api;
})(typeof window==='object'?window:globalThis);

