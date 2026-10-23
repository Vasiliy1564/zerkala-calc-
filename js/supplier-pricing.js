/* Supplier tariff 12.10.2026. Dimensions in mm. Packaging is separate. */
(function(root){
'use strict';
function lookup(shape,material,width,height,edge,height2){
 var missing={cost:null,includesPackaging:false,estimate:false,needsQuote:true};
 if (['silver','graphite','bronze'].indexOf(material)<0 || ['grind','polish','curved-grind','curved-polish'].indexOf(edge)<0) return missing;
 if (['rect','double','circle','oval'].indexOf(shape)<0) return missing;
 var w=Number(width),h=Number(height),h2=Number(height2||0);
 if (!(w>0 && h>0) || (shape==='double' && !(h2>0))) return missing;
 if (shape==='circle')h=w;
 var curved=shape==='circle'||shape==='oval';
 var rate=material==='silver'?1750:3300;
 if (material!=='silver' && (Math.max(w,h,shape==='double'?h2:0)>2550 || Math.min(w,h)>1605 || (shape==='double' && Math.min(w,h2)>1605))) return missing;
 if ((edge.indexOf('curved-')===0)!==curved) return missing;
 var edgeRate={grind:120,polish:140,'curved-grind':170,'curved-polish':230}[edge];
 var parts=shape==='double'?[h,h2]:[h];
 var materialCost=0,edgeCost=0,packagingArea=0;
 parts.forEach(function(partH){
  var area=w*partH/1000000,maxSide=Math.max(w,partH);
  var sizeFactor=maxSide>=2500?2:maxSide>=2000?1.5:maxSide>=1500?1.3:1;
  var smallFactor=area<0.04?2:area<0.12?1.5:1;
  var perimeter=2*(w+partH)/1000;
  if(shape==='circle')perimeter=Math.PI*w/1000;
  if(shape==='oval'){var a=w/2000,b=partH/2000;perimeter=Math.PI*(3*(a+b)-Math.sqrt((3*a+b)*(a+3*b)));}
  materialCost+=Math.max(area,0.2)*rate;
  edgeCost+=perimeter*edgeRate*sizeFactor*smallFactor;
  packagingArea+=area;
 });
 var shapeCost=curved?(materialCost+edgeCost)*0.5:0;
 return {cost:Math.max(350,materialCost+edgeCost+shapeCost),materialCost:materialCost,edgeCost:edgeCost,shapeCost:shapeCost,packagingCost:packagingArea*100,includesPackaging:false,estimate:curved,needsQuote:false};
}
var api={lookup:lookup,markup:function(light){return light?1.50:1.00;}};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorSupplierPricing=api;
})(typeof window==='object'?window:globalThis);

