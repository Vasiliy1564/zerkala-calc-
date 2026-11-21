/* Stavropol prices copied from the active zerkalo-calc-v2 calculator, 2026-11-21.
   Presentation is intentionally independent of supplier pricing and site design. */
(function(root){
'use strict';
var BASE={mirror:1500,edge:150,markup:1.5,ledRoll:700,ledRollLen:5,block:500,switch:500,mount:50,mountStep:2,delivery:300,facetDelivery:1000};
var FACETS={none:150,grind:200,'10':200,'20':250,'25':300};
var ANGLE={barLength:3000,rate:80,trip:500};
var SUPPORTED={rect:1,rounded:1,circle:1,oval:1,capsule:1,semicircle:1,double:1,semidouble:1};
function shapeExtra(shape){return ['circle','oval','capsule','semicircle','semidouble'].indexOf(shape)>=0?95:0;}
function sizeExtra(w,h){var n=Math.max(w,h);return n<=2000?0:n<=2500?1200:3000;}
function perimeter(shape,w,h,h2){
 var totalH=h+(/double/.test(shape)?h2:0);
 if(shape==='circle')return Math.PI*w/1000;
 if(shape==='capsule'){var a=Math.min(w,h),b=Math.max(w,h);return (Math.PI*a+2*(b-a))/1000;}
 if(shape==='oval'){var a=w/2,b=h/2,q=Math.pow(a-b,2)/Math.pow(a+b,2);return Math.PI*(a+b)*(1+3*q/(10+Math.sqrt(4-3*q)))/1000;}
 if(shape==='semicircle'||shape==='semidouble'){
  var r=totalH/2,v=Math.PI*r+totalH;
  if(shape==='semidouble')v+=2*(r+Math.sqrt(Math.max(0,r*r-Math.pow(h-r,2))));
  return v/1000;
 }
 return 2*(w+totalH+(shape==='double'?w:0))/1000;
}
function minimumBars(pieces,barLength){
 pieces=pieces.filter(function(n){return n>0;}).sort(function(a,b){return b-a;});
 if(!pieces.length)return 0;
 var bins=[],best=pieces.length;
 function pack(i){
  if(i===pieces.length){best=Math.min(best,bins.length);return;}
  if(bins.length>=best)return;
  var seen={};
  for(var j=0;j<bins.length;j++){
   if(seen[bins[j]]||bins[j]+pieces[i]>barLength)continue;
   seen[bins[j]]=true;bins[j]+=pieces[i];pack(i+1);bins[j]-=pieces[i];
  }
  bins.push(pieces[i]);pack(i+1);bins.pop();
 }
 pack(0);return best;
}
function segment(side,barLength,pieces){
 side=Math.max(0,Math.round(side));
 while(side>0){var piece=Math.min(side,barLength);pieces.push(piece);side-=piece;}
}
function angleBars(shape,w,h,h2,per){
 if(shape!=='rect'&&shape!=='rounded'&&shape!=='double')return Math.ceil(per*1000/ANGLE.barLength);
 var sides=shape==='double'?[w,w,w,w,h,h,h2,h2]:[w,w,h,h],pieces=[];
 sides.forEach(function(side){segment(side,ANGLE.barLength,pieces);});
 return minimumBars(pieces,ANGLE.barLength);
}
function frontFrameBars(shape,w,h,h2){
 var usable=2700,pieces=[];
 if(shape==='rect'||shape==='double'){
  var sides=shape==='double'?[w,w,h,h,w,w,h2,h2]:[w,w,h,h];
  sides.forEach(function(side){segment(side,usable,pieces);});
  return minimumBars(pieces,usable);
 }
 return Math.ceil((perimeter(shape,w,h,h2)*1000-0.000001)/usable);
}
function calc(input){
 var o=input||{},shape=o.shape,w=Number(o.width),h=Number(o.height),h2=Number(o.height2)||0;
 if(!SUPPORTED[shape])throw Error('Для выбранной формы нужна индивидуальная смета по Ставрополю.');
 if(o.material&&o.material!=='silver')throw Error('Для этого полотна нет подтверждённой ставропольской цены. Уточните стоимость у мастера.');
 if(o.sand&&o.sand!=='none')throw Error('Стоимость рисунка или световых полос уточняется по эскизу.');
 var facet=String(o.facet===undefined?'none':o.facet);
 if(facet==='0')facet='none';
 if(!Object.prototype.hasOwnProperty.call(FACETS,facet))throw Error('Для выбранного фацета пока нет ставропольского тарифа.');
 if(!(w>=400&&h>=400)||(/double/.test(shape)&&h2<400))throw Error('Размеры каждой части должны быть от 40 см.');
 if(shape==='circle')h=w;
 var totalH=h+(/double/.test(shape)?h2:0),area=w*totalH/1000000,per=2*(w+totalH)/1000;
 if(shape==='circle'){area=w*w/1000000;per=4*w/1000;}
 if(shape==='double'){area=w*totalH/1000000;per=2*(w+totalH)/1000;}
 var light=!!o.light,install=!!o.install,rounded=shape==='rounded',multiplier=1.06*1.02;
 if(shape==='double')multiplier*=1+2000/16469.75;
 if(shape==='semidouble')multiplier*=1.2;
 var roundFactor=rounded?1.15:1;
 var edgeCost=per*(FACETS[facet]+shapeExtra(shape)),baseCost=area*BASE.mirror+edgeCost;
 var deliveryFromSupplier=0,installationBase=0,price=0;
 var normalInstall=(area<=2)?Math.max(2000,area*1300):area*1500;
 if(!light){
  price=baseCost*1.8;
  if(facet!=='none'&&facet!=='grind'){deliveryFromSupplier=BASE.facetDelivery;price+=deliveryFromSupplier;}
  if(install){installationBase=normalInstall;price+=installationBase;}
 } else {
  deliveryFromSupplier=facet==='none'||facet==='grind'?BASE.delivery:BASE.facetDelivery;
  if(install)installationBase=Math.max(2500,normalInstall+500);
  price=baseCost*(1+BASE.markup)+Math.ceil(per/BASE.ledRollLen)*BASE.ledRoll+
    BASE.block+BASE.switch+Math.ceil(per/BASE.mountStep)*BASE.mount+
    deliveryFromSupplier+installationBase;
 }
 price+=sizeExtra(w,totalH);
 if(o.film)price+=area*200;
 if(o.heat)price+=2500;
 if(o.ledProfile&&light)price+=per*250;
 price*=multiplier;
 var frontFrame=o.faceFrame&&o.faceFrame!=='none';
 var frontBars=0;
 if(frontFrame){
  if(shape!=='rect'&&shape!=='double')throw Error('Лицевая алюминиевая рама доступна только для прямоугольных зеркал.');
  frontBars=frontFrameBars(shape,w,h,h2);
  var framePurchase=frontBars*500;
  price+=framePurchase+Math.max(1500,framePurchase)+400;
 }
 var required=totalH>2000,aluFrame=required||!!o.aluFrame,aluminumBars=0;
 if(aluFrame){aluminumBars=angleBars(shape,w,h,h2,per);price+=aluminumBars*3*ANGLE.rate+ANGLE.trip;}
 price*=roundFactor;
 var delivery=Number(o.deliveryPrice)||0;
 price+=delivery;
 var procurement=(deliveryFromSupplier*multiplier+(frontFrame?400:0)+(aluFrame?ANGLE.trip:0))*roundFactor;
 var installation=installationBase*multiplier*roundFactor;
 return {total:price,area:area,perimeter:per,totalHeight:totalH,requiredFrame:required,
  aluFrame:aluFrame,angleBars:aluminumBars,angleCharge:aluFrame?aluminumBars*3*ANGLE.rate+ANGLE.trip:0,
  faceFrameBars:frontBars,facet:facet,delivery:delivery,procurement:procurement,installation:installation,
  mirror:price-delivery-procurement-installation,serviceFactor:multiplier,roundingFactor:roundFactor};
}
var api={calculate:calc,angleBars:angleBars,frontFrameBars:frontFrameBars,constants:{base:BASE,angle:ANGLE}};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorStavropolPricing=api;
})(typeof window==='object'?window:globalThis);
