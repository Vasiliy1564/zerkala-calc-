/* SPb supplier tariff 12.10.2026. Rounded contours: bounding rectangle +50%. */
(function(root){
'use strict';
function rectangular(shape){return shape==='rect'||shape==='double';}
function lookup(shape,material,width,height,edge,height2){
 var missing={cost:null,includesPackaging:false,estimate:false,needsQuote:true};
 if(['silver','graphite','bronze'].indexOf(material)<0 || ['grind','polish','curved-grind','curved-polish'].indexOf(edge)<0)return missing;
 if(['rect','double','arch','rounded','circle','oval','capsule','semicircle','semidouble','curved'].indexOf(shape)<0)return missing;
 var w=Number(width),h=Number(height),h2=Number(height2||0),rect=rectangular(shape);
 if(!(w>0&&h>0)||(/double/.test(shape)&&!(h2>0)))return missing;
 if(shape==='circle')h=w;
 var totalH=h+(shape==='semidouble'?h2:0);
 var stockHeights=shape==='double'?[h,h2]:[totalH];
 if(material!=='silver'&&stockHeights.some(function(ph){return Math.max(w,ph)>2550||Math.min(w,ph)>1605;}))return missing;
 var grind=edge.indexOf('grind')!==-1;
 var materialCost=0,edgeCost=0,packagingArea=0,perimeter=0,area=0;
 {
  stockHeights.forEach(function(ph){
   var partArea=w*ph/1000000,maxSide=Math.max(w,ph),partPerimeter=2*(w+ph)/1000;
   var sizeFactor=maxSide>=2500?2:maxSide>=2000?1.5:maxSide>=1500?1.3:1;
   var smallFactor=partArea<0.04?2:partArea<0.12?1.5:1;
   materialCost+=Math.max(partArea,0.2)*(material==='silver'?1750:3300);
   edgeCost+=partPerimeter*(grind?70:90)*sizeFactor*smallFactor;
   packagingArea+=partArea;area+=partArea;perimeter+=partPerimeter;
  });
 }
 // All rounded shapes use the rectangular blank and straight-edge tariff,
 // then the supplier's 50% shape surcharge. Extras are outside this base.
 var shapeCost=rect?0:(materialCost+edgeCost)*0.5;
 return {cost:Math.max(350,materialCost+edgeCost+shapeCost),materialCost:materialCost,edgeCost:edgeCost,shapeCost:shapeCost,packagingCost:packagingArea*100,includesPackaging:false,estimate:shape==='curved',needsQuote:false,pricingMode:'supplier',sizeSurcharge:0,splitFactor:shape==='semidouble'?1.2:1,roundedFactor:1,area:area,perimeter:perimeter};
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
var api={lookup:lookup,markup:markup,purchasingTrip:purchasingTrip,reinforcement:reinforcement};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorSupplierPricing=api;
})(typeof window==='object'?window:globalThis);
