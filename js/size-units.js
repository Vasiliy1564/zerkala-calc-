/* Input is centimetres; pricing and saved geometry stay in millimetres. */
(function(){
 function cm(mm){return (Math.round(Number(mm))/10).toLocaleString('ru-RU',{maximumFractionDigits:1,useGrouping:false});}
 function read(el){var s=el?el.value.trim().replace(',','.'):'';return /^\d+(?:\.\d?)?$/.test(s)?Math.round(Number(s)*10):0;}
 function write(el,mm){if(el)el.value=cm(mm);}
 function dimensions(text){return String(text).replace(/(\d+(?:\.\d+)?(?:\s*[+×=]\s*\d+(?:\.\d+)?)*)(\s*)мм/g,function(_,nums,space){return nums.replace(/\d+(?:\.\d+)?/g,function(n){return cm(n);})+space+'см';});}
 function sizeField(el){return el&&el.matches&&el.matches('#width,#height,#height2');}
 function clean(text){var separator=false;return String(text).replace(/[^0-9.,]/g,'').replace(/[.,]/g,function(){if(separator)return '';separator=true;return ',';}).replace(/(,\d)\d+/g,'$1');}
 document.addEventListener('beforeinput',function(e){
  if(!sizeField(e.target)||e.isComposing||!e.data||!e.inputType.startsWith('insert'))return;
  var el=e.target,start=el.selectionStart,end=el.selectionEnd;
  var next=el.value.slice(0,start)+e.data+el.value.slice(end);
  if(/[^0-9.,]/.test(e.data)||(next.match(/[.,]/g)||[]).length>1||/[.,]\d{2}/.test(next))e.preventDefault();
 },true);
 function normalize(el){var original=el.value,start=el.selectionStart,next=clean(original);if(next!==original){el.value=next;var caret=clean(original.slice(0,start)).length;el.setSelectionRange(caret,caret);}}
 document.addEventListener('input',function(e){if(sizeField(e.target)&&!e.isComposing)normalize(e.target);},true);
 document.addEventListener('compositionend',function(e){if(sizeField(e.target)){normalize(e.target);e.target.dispatchEvent(new Event('input',{bubbles:true}));}},true);
 window.MirrorSize={read:read,write:write,cm:cm,dimensions:dimensions};
})();
