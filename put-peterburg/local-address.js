/* Indexed lookup across the entire regional snapshot. No house/entrance inference. */
let regionalIndex=null;
function regionalSearchIndex(){
 if(regionalIndex)return regionalIndex;
 if(typeof REGION_SEARCH_INDEX!=='undefined'&&typeof PLACE_DATA!=='undefined'){const r=REGION_SEARCH_INDEX;regionalIndex={labels:r.labels.map((l,i)=>({...l,city:HOUSE_DATA.labels[i][0],street:HOUSE_DATA.labels[i][1]})),houseNumbers:new Map(Object.entries(r.houseNumbers)),prefix:new Map(Object.entries(r.prefix)),places:r.places.map((p,i)=>Object.assign(PLACE_DATA.places[i],p)),localityKeys:r.localityKeys,houseKeys:r.houseKeys};return regionalIndex}
 const labels=HOUSE_DATA.labels.map(l=>({city:l[0],street:l[1],tokens:addressWords(l.join(', ')).split(' ').filter(Boolean),streetTokens:addressWords(l[1]).split(' ').filter(Boolean),cityKey:norm(l[0]),type:streetType(l[1])}));
 const houseNumbers=new Map(),localities=new Set(),prefix=new Map();
 const add=(key,type,id)=>{const k=type+':'+key;if(!prefix.has(k))prefix.set(k,[]);prefix.get(k).push(id)};
 labels.forEach((l,i)=>{for(const t of new Set(l.tokens)){if(t.length>=2)add(t.slice(0,3),'label',i)}for(const t of addressWords(l.city).split(' ')){if(t)localities.add(t)}});
 HOUSE_DATA.houses.forEach((h,i)=>{const hn=canonicalHouse(h[3]),base=houseBase(hn);for(const key of new Set([hn,base])){if(!houseNumbers.has(key))houseNumbers.set(key,[]);houseNumbers.get(key).push(i)}});
 const places=(typeof PLACE_DATA==='undefined'?[]:PLACE_DATA.places).map(p=>({...p,searchNames:[p.name,...(p.aliases||[])].map(addressWords),tokens:addressWords([p.name,...(p.aliases||[]),p.locality,p.street,p.house].join(' ')).split(' ').filter(Boolean)}));
 places.forEach((p,i)=>{for(const t of new Set(p.tokens)){if(t.length>=2)add(t.slice(0,3),'place',i)}});
 regionalIndex={labels,houseNumbers,localities,prefix,places,localityKeys:[...new Set(labels.flatMap(l=>l.city.split(',').filter(x=>!streetType(x)).map(addressWords)).filter(x=>x.length>=4))].sort((a,b)=>b.length-a.length)};return regionalIndex;
}
function stripKnownLocality(tokens){const q=tokens.join(' ');for(const k of regionalSearchIndex().localityKeys){if(q.startsWith(k+' ')&&q.length-k.length>3)return q.slice(k.length+1).split(' ');if(q.endsWith(' '+k)&&q.length-k.length>3)return q.slice(0,-k.length-1).split(' ')}return tokens}
function candidateIndices(tokens,type,allCount){const idx=regionalSearchIndex(),lists=tokens.filter(t=>t.length>=3).map(t=>idx.prefix.get(type+':'+t.slice(0,3))||[]);if(!lists.length)return Array.from({length:allCount},(_,i)=>i);return lists.reduce((a,b)=>a.length<=b.length?a:b)}
function localAddressMatches(query,limit=20){const seen=new Set();for(const part of [streetParts(query),...knownAddressParts(query)]){const key=part.text+'|'+part.house;if(seen.has(key))continue;seen.add(key);const results=localAddressPartMatches(query,part,limit);if(results.length)return results}return []}
function localAddressPartMatches(query,part,limit){
 if(!part.house)return [];const house=canonicalHouse(part.house),base=houseBase(house);
 const tokens=addressWords(part.text).split(' ').filter(Boolean);if(!tokens.length)return [];
 const queryType=streetType(part.text.split(',').at(-1)),idx=regionalSearchIndex(),requestedSpb=/(?:^|\s)(?:санкт петербург|спб)(?:\s|$)/.test(norm(query)),rows=idx.houseNumbers.get(house)||idx.houseNumbers.get(base)||[],results=[],seen=new Set();
 for(const i of rows){const h=HOUSE_DATA.houses[i],label=idx.labels[h[2]],hn=idx.houseKeys?idx.houseKeys[i]:canonicalHouse(h[3]);if(queryType&&queryType!==label.type)continue;if(hn!==house&&!(house===base&&(hn.startsWith(base+'к')||hn.startsWith(base+'с'))))continue;
  if(!tokens.every(t=>label.tokens.includes(t)))continue;
  if(requestedSpb&&label.cityKey&&!label.cityKey.includes('санкт петербург'))continue;
  // "Садовая" is not "Малая Садовая" or "2-я Садовая" unless the full street name was supplied.
  if(!label.streetTokens.every(t=>tokens.includes(t)))continue;
  if(seen.has(h[4]))continue;seen.add(h[4]);const name=[label.city,label.street,h[3]].filter(Boolean).join(', ');
  results.push({name,lat:h[0],lon:h[1],kind:'address',house:h[3],exactHouse:hn===house,source:'offline-osm',osmId:h[4],locality:label.city});
 }
 const rank=p=>norm(p.locality)==='санкт петербург'?0:norm(p.locality).includes('санкт петербург')?1:!p.locality?3:2;
 results.sort((a,b)=>Number(b.exactHouse)-Number(a.exactHouse)||rank(a)-rank(b)||a.name.localeCompare(b.name,'ru',{numeric:true}));const groups=new Map(),unique=[];for(const p of results){const k=norm(p.name),group=groups.get(k)||[];if(group.some(x=>distance(x,p)<30))continue;group.push(p);groups.set(k,group);unique.push(p);if(unique.length>=limit)break}return unique;
}
function localPlaceMatches(query,limit=20){
 const q=addressWords(query);if(q.length<2)return [];const tokens=q.split(' '),idx=regionalSearchIndex(),out=[];
 for(const i of candidateIndices(tokens,'place',idx.places.length)){const p=idx.places[i];if(!tokens.every(t=>p.tokens.some(k=>k.startsWith(t))))continue;
  const score=p.searchNames.includes(q)?0:p.searchNames.some(n=>n.startsWith(q))?1:2;
  out.push({...p,name:[p.name,p.locality,p.street,p.house].filter((v,i,a)=>v&&a.indexOf(v)===i).join(', '),score});
 }
 out.sort((a,b)=>a.score-b.score||Number(b.kind==='settlement')-Number(a.kind==='settlement')||a.name.length-b.name.length);const seen=new Set();return out.filter(p=>{const k=p.osmId;if(seen.has(k))return false;seen.add(k);return true}).slice(0,limit);
}
function coordinatePoint(query){const m=String(query).trim().match(/^([+-]?\d{1,2}\.\d+)\s*[,;\s]\s*([+-]?\d{1,3}\.\d+)$/);if(!m)return null;const lat=Number(m[1]),lon=Number(m[2]);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;return {name:lat+', '+lon,lat,lon,kind:'address',source:'coordinates'}}
function appendLocalAddresses(f,items){const box=$(f+'List');for(const p of items){const b=node('button');const duplicate=items.some(x=>x!==p&&norm(x.name)===norm(p.name));b.append(node('strong',p.name),node('small',p.locality?'Дом из встроенной базы'+(duplicate?' · '+p.lat.toFixed(4)+', '+p.lon.toFixed(4):' · выбрать'):'Дом · населённый пункт не указан · '+p.lat.toFixed(4)+', '+p.lon.toFixed(4)));b.onclick=()=>pick(f,p);box.append(b)}}
function offerLocalAddress(f){const items=localAddressMatches($(f).value.trim());if(!items.length)return false;const exact=items.filter(p=>p.exactHouse);if(exact.length===1){pick(f,exact[0]);return true}const box=$(f+'List');box.replaceChildren();appendLocalAddresses(f,exact.length?exact:items);const online=node('button','Искать адрес через интернет');online.onclick=()=>searchPlace(f,true,true);box.append(online);$('go').disabled=false;say('Выберите населённый пункт, дом и корпус из списка.');return true}
