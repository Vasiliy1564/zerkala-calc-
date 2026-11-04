/* Regional OSM snapshot, served by this website; no external search server needed. */
(function(){
'use strict';
var loading=null;
function words(value){return String(value).toLowerCase().replace(/ё/g,'е').replace(/спб/g,'санкт петербург').replace(/[^а-яa-z0-9]+/g,' ').replace(/(?:^|\s)(?:ул|улица|пр|просп|проспект|переулок|пер|проезд|наб|набережная|шоссе|ш|бульвар|бул|площадь|пл|дом|д|город|г|поселок|пос|деревня|дер)(?=\s|$)/g,' ').replace(/\s+/g,' ').trim();}
function house(value){return String(value).toLowerCase().replace(/ё/g,'е').replace(/\s*(?:корпус|корп\.?|к)\s*(?=\d)/g,'к').replace(/\s*(?:строение|стр\.?)\s*(?=\d)/g,'с').replace(/\s*(?:литера|лит\.?)\s*/g,'').replace(/\s+/g,'');}
function split(query){var m=String(query).trim().match(/^(.*?)[,\s]+(?:д(?:ом)?\.?\s*)?(\d+[а-яa-z]?(?:\s*[-/]\s*\d+[а-яa-z]?)*(?:\s*(?:к(?:орп(?:ус)?)?\.?|стр(?:оение)?\.?|с)\s*\d+[а-яa-z]?)?(?:\s*(?:лит(?:ера)?\.?)\s*[а-яa-z])?)\s*$/iu);return m?{tokens:words(m[1]).split(' ').filter(Boolean),number:house(m[2])}:null;}
async function load(progress){
 if(loading)return loading;
 loading=(async function(){
  var cache=null;try{cache=await caches.open('mirror-address-spb-20261027');}catch(e){}
  var done=0,urls=Array.from({length:8},function(_,i){return '/put-peterburg/houses.part-0'+i+'.bin';});
  var chunks=await Promise.all(urls.map(async function(url){
   var response=cache?await cache.match(url):null;
   if(!response){var control=new AbortController(),timer=setTimeout(function(){control.abort();},20000);try{response=await fetch(url,{signal:control.signal});if(!response.ok)throw Error('Address database HTTP '+response.status);if(cache)await cache.put(url,response.clone());}finally{clearTimeout(timer);}}
   var bytes=await response.arrayBuffer();done++;if(progress)progress(done,8);return bytes;
  }));
  var data;
  try{data=JSON.parse(await new Response(new Blob(chunks).stream().pipeThrough(new DecompressionStream('gzip'))).text());}
  catch(e){if(cache)await Promise.all(urls.map(function(url){return cache.delete(url);}));throw e;}
  var labels=data.labels.map(function(label){return {label:label,all:words(label.join(' ')).split(' '),street:words(label[1]).split(' ')};}),numbers=new Map();
  data.houses.forEach(function(row){var key=house(row[3]);if(!numbers.has(key))numbers.set(key,[]);numbers.get(key).push(row);});
  return {labels:labels,numbers:numbers};
 })().catch(function(error){loading=null;throw error;});
 return loading;
}
window.MirrorAddressFallback={search:async function(query,progress){
 var parsed=split(query);if(!parsed||!parsed.tokens.length)return {features:[],source:'offline-osm',limited:true};
 var data=await load(progress),matches=[],seen=new Set();
 for(var row of data.numbers.get(parsed.number)||[]){
  var label=data.labels[row[2]];
  if(!parsed.tokens.every(function(token){return label.all.includes(token);}))continue;
  if(!label.street.every(function(token){return parsed.tokens.includes(token);}))continue;
  var name=label.label.concat(row[3]).filter(Boolean).join(', ');
  if(seen.has(name)||!Number.isFinite(row[0])||!Number.isFinite(row[1]))continue;seen.add(name);
  matches.push({properties:{label:name},geometry:{coordinates:[row[1],row[0]]},source:'offline-osm'});
 }
 matches.sort(function(a,b){return Number(b.properties.label.startsWith('Санкт-Петербург,'))-Number(a.properties.label.startsWith('Санкт-Петербург,'))||a.properties.label.localeCompare(b.properties.label,'ru');});
 return {features:matches.slice(0,20),source:'offline-osm',limited:true};
}};
})();
