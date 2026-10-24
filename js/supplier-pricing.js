/* SPb rectangles: supplier tariff 12.10.2026. Figures: Stavropol formula. */
(function(root){
'use strict';
function rectangular(shape){return shape==='rect'||shape==='double';}
function lookup(shape,material,width,height,edge,height2){
 var missing={cost:null,includesPackaging:false,estimate:false,needsQuote:true};
 if(['silver','graphite','bronze'].indexOf(material)<0 || ['grind','polish','curved-grind','curved-polish'].indexOf(edge)<0)return missing;
 if(['rect','double','rounded','circle','oval','capsule','semicircle','semidouble','curved'].indexOf(shape)<0)return missing;
 var w=Number(width),h=Number(height),h2=Number(height2||0),rect=rectangular(shape);
 if(!(w>0&&h>0)||(/double/.test(shape)&&!(h2>0)))return missing;
 if(shape==='circle')h=w;
 var totalH=h+(shape==='semidouble'?h2:0);
 var stockHeights=shape==='double'?[h,h2]:[totalH];
 if(material!=='silver'&&stockHeights.some(function(ph){return Math.max(w,ph)>2550||Math.min(w,ph)>1605;}))return missing;
 var grind=edge.indexOf('grind')!==-1;
 var materialCost=0,edgeCost=0,packagingArea=0,perimeter=0,area=0;
 if(rect){
  stockHeights.forEach(function(ph){
   var partArea=w*ph/1000000,maxSide=Math.max(w,ph),partPerimeter=2*(w+ph)/1000;
   var sizeFactor=maxSide>=2500?2:maxSide>=2000?1.5:maxSide>=1500?1.3:1;
   var smallFactor=partArea<0.04?2:partArea<0.12?1.5:1;
   materialCost+=Math.max(partArea,0.2)*(material==='silver'?1750:3300);
   edgeCost+=partPerimeter*(grind?70:90)*sizeFactor*smallFactor;
   packagingArea+=partArea;area+=partArea;perimeter+=partPerimeter;
  });
 }else{
  // Same bounding rectangle and edge surcharge as Stavropol (not +50% per order).
  area=w*totalH/1000000;perimeter=2*(w+totalH)/1000;
  var extra=shape==='rounded'?0:95;
  materialCost=area*(material==='silver'?1500:3300);
  edgeCost=perimeter*((grind?200:150)+extra);
 }
 var maxDimension=Math.max(w,totalH);
 var sizeSurcharge=rect?0:maxDimension<=2000?0:maxDimension<=2500?1200:3000;
 return {cost:rect?Math.max(350,materialCost+edgeCost):materialCost+edgeCost,materialCost:materialCost,edgeCost:edgeCost,shapeCost:0,packagingCost:packagingArea*100,includesPackaging:false,estimate:shape==='curved',needsQuote:false,pricingMode:rect?'supplier':'stavropol',sizeSurcharge:sizeSurcharge,splitFactor:shape==='semidouble'?1.2:1,roundedFactor:shape==='rounded'?1.15:1,area:area,perimeter:perimeter};
}
function markup(light,shape){return light?1.5:(!shape||rectangular(shape)?1:0.8);}
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
var api={lookup:lookup,markup:markup,purchasingTrip:purchasingTrip,reinforcement:reinforcement};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorSupplierPricing=api;
})(typeof window==='object'?window:globalThis);
