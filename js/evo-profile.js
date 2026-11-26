/* Internal EVO mounting profile: 100 RUB per running metre of the outside contour. */
(function(root){
'use strict';
var RATE=100;
function needed(shape,light){return !!light && shape!=='rect' && shape!=='double';}
function length(shape,width,height,height2){
 var w=Number(width),h=Number(height),h2=Number(height2)||0;
 if(!(w>0&&h>0))return 0;
 if(shape==='circle')return Math.PI*w/1000;
 if(shape==='oval'){
  var a=w/2,b=h/2,q=Math.pow(a-b,2)/Math.pow(a+b,2);
  return Math.PI*(a+b)*(1+3*q/(10+Math.sqrt(4-3*q)))/1000;
 }
 if(shape==='capsule'){
  var shortSide=Math.min(w,h),longSide=Math.max(w,h);
  return (Math.PI*shortSide+2*(longSide-shortSide))/1000;
 }
 if(shape==='semicircle'||shape==='semidouble'){
  var diameter=h+(shape==='semidouble'?h2:0);
  return (Math.PI*diameter/2+diameter)/1000;
 }
 // The rounded-corner radius is unspecified; use the current bounding perimeter.
 return 2*(w+h)/1000;
}
function charge(shape,w,h,h2,light){return needed(shape,light)?length(shape,w,h,h2)*RATE:0;}
var api={needed:needed,length:length,charge:charge,rate:RATE};
if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorEvoProfile=api;
})(typeof window==='object'?window:globalThis);
