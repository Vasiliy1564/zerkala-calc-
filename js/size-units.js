/* Input is centimetres; pricing and saved geometry stay in millimetres. */
(function(){
 function cm(mm){return (Math.round(Number(mm)*10)/100).toLocaleString('ru-RU',{maximumFractionDigits:2,useGrouping:false});}
 function read(el){var s=el?el.value.trim().replace(',','.'):'';return /^\d+(?:\.\d*)?$/.test(s)?Math.round(Number(s)*100)/10:0;}
 function write(el,mm){if(el)el.value=cm(mm);}
 function dimensions(text){return String(text).replace(/(\d+(?:\.\d+)?(?:\s*[+×=]\s*\d+(?:\.\d+)?)*)(\s*)мм/g,function(_,nums,space){return nums.replace(/\d+(?:\.\d+)?/g,function(n){return cm(n);})+space+'см';});}
 window.MirrorSize={read:read,write:write,cm:cm,dimensions:dimensions};
})();
