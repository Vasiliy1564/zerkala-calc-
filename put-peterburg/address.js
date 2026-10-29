/* Shared normalization: Unicode word boundaries, typed street abbreviations, house suffixes. */
function addressWords(s){if(String(s).includes(','))return String(s).split(',').map(addressWords).filter(Boolean).join(' ');let n=norm(s).replace(/№/g,' ').replace(/ленинградская\s+(?:область|обл)|российская федерация|россия|санкт петербург|(?:^|\s)спб(?=\s|$)|(?:^|\s)\d{6}(?=\s|$)/g,' ');n=n.replace(/(?:^|\s)(набережная|площадь|аллея|шоссе|бульвар|проезд)(?=\s+(?:улица|ул)(?:\s|$))/g,(_,x)=>' ~'+x+'~');if(n.trim()==='набережная')return 'набережная';return n.replace(/(?:^|\s)(?:ул|улица|пр|пр т|просп|проспект|пер|переулок|наб|набережная|пл|площадь|бул|б р|бульвар|ш|шоссе|аллея|д|дом|г|город|дер|деревня|пос|поселок|гп|пгт|обл|тер|территория)(?=\s|$)/g,' ').replace(/~/g,'').replace(/\s+/g,' ').trim()}
function streetType(s){const n=' '+norm(s)+' ';const kinds=[['улица','ул|улица'],['проспект','пр|пр т|просп|проспект'],['переулок','пер|переулок'],['аллея','аллея'],['площадь','пл|площадь'],['набережная','наб|набережная'],['шоссе','ш|шоссе'],['бульвар','бул|б р|бульвар'],['проезд','проезд']];for(const [kind,pattern] of kinds)if(new RegExp('(?:^|\\s)(?:'+pattern+')(?=\\s|$)').test(n))return kind;return ''}
function streetNormalize(s){return addressWords(s)}
function canonicalHouse(s){return String(s).toLowerCase().replace(/ё/g,'е').replace(/[−–—]/g,'-').replace(/[«»".,()№]/g,' ').replace(/^(?:д|дом)\s+/,'').replace(/\s*(?:корпус|корп|к)\s*(?=\d)/g,'к').replace(/\s*(?:строение|стр)\s*(?=\d)/g,'с').replace(/\s*(?:литера|литер|лит)\s*/g,'').replace(/участок\s*/g,'уч').replace(/сооружение\s*/g,'соор').replace(/помещение\s*/g,'пом').replace(/офис\s*/g,'оф').replace(/\s+/g,'')}
function houseBase(s){return canonicalHouse(s).match(/^\d+(?:[-/]\d+)*(?:[а-яa-z]+(?!\d))?/u)?.[0]||canonicalHouse(s)}
function knownAddressParts(query){const text=String(query).trim(),parts=[];if(typeof HOUSE_DATA==='undefined'||typeof regionalSearchIndex!=='function')return parts;const known=regionalSearchIndex().houseNumbers,re=/[,\s]+/g;let m;while((m=re.exec(text))){const house=text.slice(re.lastIndex).trim(),prefix=text.slice(0,m.index).trim();if(prefix&&/\d/.test(house)&&known.has(canonicalHouse(house)))parts.push({street:streetNormalize(prefix),house,text:prefix})}return parts}
function streetParts(query){
 let text=query.trim().replace(/(?:^|[\s,])\d{6}(?=[\s,]|$)/g,' '),house='';
 // Exact known suffixes support every explicitly stored house format, including
 // ranges, multiple letters, plots, premises and comma-separated corpora.
 if(typeof HOUSE_DATA!=='undefined'&&typeof regionalSearchIndex==='function'){
  const known=regionalSearchIndex().houseNumbers,separator=/[,\s]+/g;let sep;
  while((sep=separator.exec(text))){const suffix=text.slice(separator.lastIndex).trim(),prefix=text.slice(0,sep.index).trim();if(prefix&&/\d/.test(suffix)&&known.has(canonicalHouse(suffix)))return {street:streetNormalize(prefix),house:suffix,text:prefix}}
 }

 // A number is a house only at the end, or after explicit "дом"; never the first number in a street name.
 const m=text.match(/(?:,\s*(?:д(?:ом)?\.?\s*)?|\s+(?:д(?:ом)?\.?\s*)?)(\d+[а-яa-z]*(?:\s*(?:к(?:орп(?:ус)?)?\.?|\/|с(?:тр(?:оение)?)?\.?)\s*\d+[а-яa-z]?)*(?:\s*(?:лит(?:ера|ер)?\.?)\s*[а-яa-z]+)?)\s*$/iu);
 if(m){house=m[1];text=text.slice(0,m.index)}
 return {street:streetNormalize(text),house,text};
}
let streetHintCache=null;
function streetHints(query){
 const part=streetParts(query),n=part.street;if(n.length<3)return [];
 if(!streetHintCache)streetHintCache=STREETS.names.map(name=>({name,key:streetNormalize(name)}));
 // Locality is context: remove it only when it matches an actual locality in the regional data.
 let tokens=n.split(' ');if(typeof stripKnownLocality==='function')tokens=stripKnownLocality(tokens);
 if(!tokens.length)return [];const target=tokens.join(' '),nq=target.replace(/\s/g,''),exact=[],prefix=[],fuzzy=[];
 for(const x of streetHintCache){if(streetType(part.text.split(',').at(-1))&&streetType(x.name)!==streetType(part.text.split(',').at(-1)))continue;const {name,key}=x,compact=key.replace(/\s/g,'');let score;
  if(key===target)score=0;else if(key.startsWith(target))score=1;else if(tokens.every(t=>key.split(' ').some(k=>k.startsWith(t))))score=2;
  else if(target.length>=5&&Math.abs(compact.length-nq.length)<=2){const d=editDistance(nq,compact);if(d<=2)fuzzy.push({...x,score:3+d});continue}else continue;
  (score===0?exact:prefix).push({...x,score});
 }
 let choices=exact.length?exact:prefix.length?prefix:fuzzy;choices.sort((a,b)=>a.score-b.score||a.key.length-b.key.length||Number(streetType(b.name)==='улица')-Number(streetType(a.name)==='улица')||Number(/(?:^|[\s,])(?:ул|пр|пер|наб|пл|ш|бул)\./u.test(a.name))-Number(/(?:^|[\s,])(?:ул|пр|пер|наб|пл|ш|бул)\./u.test(b.name))||a.name.localeCompare(b.name,'ru'));
 if(!exact.length&&!prefix.length&&choices.length)choices=choices.filter(x=>x.score===choices[0].score);
 const seen=new Set();choices=choices.filter(x=>{const k=x.key+':'+streetType(x.name);if(seen.has(k))return false;seen.add(k);return true});
 return choices.slice(0,10).map(x=>({...x,query:x.name+(part.house?', '+part.house:''),corrected:x.score>0,house:part.house}));
}
function streetOptions(f,hints){const box=$(f+'List');for(const h of hints){const b=node('button');b.append(node('strong',h.query),node('small',h.score===0?'Улица / территория из базы · уточнить адрес':h.score<=2?'Подходящее название · выбрать':'Возможно, вы имели в виду · выбрать'));b.onclick=()=>{const resume=pendingBuild;$(f).value=h.query;points[f]=null;seq[f]++;requests[f]=null;box.replaceChildren();pendingBuild=resume;searchPlace(f,true)};box.append(b)}}
