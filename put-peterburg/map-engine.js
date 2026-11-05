/* Leaflet 1.9.4, shipped locally. Persistent map instances keep the camera and tiles
   when a walking response, GPS fix or maneuver updates the guidance card. */
const putMapFrame=fn=>(window.requestAnimationFrame||function(f){return setTimeout(f,0)})(fn);
const putMapViews=new Map();let putMapExpanded=null;
function putMapKey(ctx,state){const a=state?.a||ctx.stop,b=state?.b||ctx.stop;return [ctx.boarding?'boarding':'walk',a.lat,a.lon,b.lat,b.lon].join(':')}
function putMapCollapse(view){if(!view)return;view.section.classList.remove('mapExpanded');view.expandButton.textContent='Развернуть';view.expandButton.setAttribute('aria-expanded','false');document.documentElement.classList.remove('putMapExpanded');if(putMapExpanded===view)putMapExpanded=null;view.map?.invalidateSize({pan:false});}
function putMapDispose(view){putMapCollapse(view);view.observer?.disconnect();view.map?.remove();view.map=null;view.disposed=true;}
function clearPutMaps(){for(const view of putMapViews.values())putMapDispose(view);putMapViews.clear()}
function putMapRender(ctx,state){
 const key=putMapKey(ctx,state);let view=putMapViews.get(key);
 if(putMapExpanded&&putMapExpanded!==view)putMapCollapse(putMapExpanded);
 if(!view){view=putMapCreate(key);putMapViews.set(key,view);while(putMapViews.size>4){const oldest=putMapViews.keys().next().value;if(oldest===key)break;putMapDispose(putMapViews.get(oldest));putMapViews.delete(oldest);}}
 view.ctx=ctx;view.state=state;view.activeManeuver=walkingIndex;view.update();view.attach();transferMapView=view;return view.section;
}
function putMapCreate(key){
 const section=node('section',undefined,'transferMapSection'),toolbar=node('div',undefined,'transferMapToolbar'),title=node('strong'),north=node('span','Север ↑');toolbar.append(title,north);
 const frame=node('div',undefined,'transferMap'),canvas=node('div',undefined,'transferMapCanvas');canvas.setAttribute('role','region');canvas.setAttribute('aria-label','Карта 2ГИС. Масштаб: кнопки плюс и минус, два пальца или колёсико.');canvas.tabIndex=0;frame.append(canvas);
 const caption=node('p','Загружаем карту 2ГИС…','transferMapStatus');caption.setAttribute('role','status');
 const zoomDock=node('div',undefined,'transferMapControls mapZoomDock'),actions=node('div',undefined,'mapQuickActions');frame.append(zoomDock);
 const legend=node('p','Двигайте карту пальцем. Раздвиньте два пальца для увеличения.','mapGestureHint');
 const view={key,section,canvas,ctx:null,state:null,map:null,routeLayer:null,pointsLayer:null,gpsLayer:null,routeSignature:null,activeManeuver:0,manualCamera:false,disposed:false,scheduled:false,fix:transferGps(),fitPending:false};
 function action(parent,label,aria,fn){const b=node('button',label);b.type='button';b.setAttribute('aria-label',aria);b.onclick=fn;parent.append(b);return b}
 const zoomIn=action(zoomDock,'+','Увеличить карту',()=>{view.manualCamera=true;view.map?.zoomIn(1)}),zoomOut=action(zoomDock,'−','Уменьшить карту',()=>{view.manualCamera=true;view.map?.zoomOut(1)});
 const fitButton=action(actions,'Весь путь','Показать весь пеший путь',()=>{view.manualCamera=false;view.fit()}),locate=action(actions,'Где я','Показать моё место',()=>{const p=transferGps();if(p&&view.map){view.manualCamera=true;view.map.setView([p.lat,p.lon],Math.max(17,view.map.getZoom()),{animate:true})}else if(typeof Phone!=='undefined'){Phone.locate();say('Определяем ваше место на улице.')}});
 const expand=action(actions,'Развернуть','Развернуть или свернуть карту',()=>{const open=!section.classList.contains('mapExpanded');if(open){putMapCollapse(putMapExpanded);putMapExpanded=view;section.classList.add('mapExpanded');document.documentElement.classList.add('putMapExpanded')}else putMapCollapse(view);expand.textContent=open?'Свернуть':'Развернуть';expand.setAttribute('aria-expanded',String(open));putMapFrame(()=>view.map?.invalidateSize({pan:false}));});view.expandButton=expand;expand.setAttribute('aria-expanded','false');
 const notice=node('p',undefined,'routeCaution');section.append(toolbar,frame,actions,legend,caption,notice);view.legend=legend;
 const ll=p=>[p.lat,p.lon];
 function marker(p,label,color,r=14,group=view.pointsLayer){
  if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return;
  if(!label){L.circleMarker(ll(p),{radius:r,color:'#fff',weight:2,fillColor:color,fillOpacity:1,interactive:false}).addTo(group);return;}
  const html='<span class="putMapPin" style="background:'+color+'">'+label+'</span>';
  L.marker(ll(p),{icon:L.divIcon({html,className:'putMapMarker',iconSize:[32,32],iconAnchor:[16,16]}),interactive:false,keyboard:false}).addTo(group);
 }
 function bounds(){const s=view.state,c=view.ctx,a=s?.a||c.stop,b=s?.b||c.stop,r=s?.state==='ready'?s.route:null;return L.latLngBounds([ll(a),ll(b),...(r?.coordinates||[]).map(p=>[p[1],p[0]])]);}
 view.fit=function(){if(!view.map)return;view.map.invalidateSize({pan:false});view.map.fitBounds(bounds(),{padding:[38,38],maxZoom:18,animate:false});};
 view.updateFix=function(p){view.fix=p;if(!view.gpsLayer)return;view.gpsLayer.clearLayers();if(!p)return;L.circle(ll(p),{radius:p.accuracy,color:'#1764ce',weight:1,fillOpacity:.1,interactive:false}).addTo(view.gpsLayer);marker(p,'Я','#1764ce',12,view.gpsLayer);};
 function updateZoom(){if(!view.map)return;zoomIn.disabled=view.map.getZoom()>=20;zoomOut.disabled=view.map.getZoom()<=12;}
 view.update=function(){
  const c=view.ctx,s=view.state,r=s?.state==='ready'?s.route:null;
  notice.hidden=!(s&&!s.exit&&c.station&&s.a?.name!=='Моё место на улице');notice.textContent='? — координата станции, дверь выхода пока не подтверждена. На улице нажмите «Где я» и «Путь от моего места». ';
  title.textContent=c.boarding?'Выход → ваша остановка':c.title;
  legend.textContent=c.boarding?'М — выход, С — сесть, Я — ваше место. Серые точки — соседние одноимённые остановки.':'А — начало, '+(s?.entry?'М — вход метро':'Б — цель')+', Я — ваше место. Повороты — под картой.';
  canvas.setAttribute('aria-label',c.boarding?'Карта 2ГИС: '+c.service+' в сторону '+c.direction:'Карта 2ГИС до '+c.stop.name);
  if(!view.map)return;
  const signature=r||s?.state||'boarding';if(view.routeSignature!==signature){view.routeSignature=signature;view.routeLayer.clearLayers();if(r){const xy=r.coordinates.map(p=>[p[1],p[0]]);L.polyline(xy,{color:'#fff',weight:9,interactive:false}).addTo(view.routeLayer);L.polyline(xy,{color:'#175ed0',weight:5,interactive:false}).addTo(view.routeLayer);}if(!view.manualCamera)view.fit();}
  view.pointsLayer.clearLayers();for(const stop of c.nearby)marker(stop,'','#a8b5aa',6);
  if(c.station)for(const e of WALKING_ENTRANCES[c.station.name]||[])if(e.osmId!==s?.exit?.osmId&&e.entrance!=='entrance'&&!['no','private'].includes(e.access))marker(e,'','#8065aa',5);
  if(r?.steps[view.activeManeuver]?.location&&view.activeManeuver>0){const xy=r.steps[view.activeManeuver].location;marker({lat:xy[1],lon:xy[0]},String(view.activeManeuver+1),'#a56512');}
  if(s)marker(s.a,s.exit?'М':c.station&&s.a?.name!=='Моё место на улице'?'?':'А',s.exit?'#bf3528':'#655b4c');
  marker(s?.b||c.stop,c.boarding?'С':s?.entry?'М':'Б',c.boarding?'#c33223':'#246d47');view.updateFix(view.fix);updateZoom();
 };
 view.attach=function(){
  if(view.scheduled)return;view.scheduled=true;putMapFrame(()=>{
   view.scheduled=false;if(view.disposed||!section.isConnected)return;
   if(view.map){view.map.invalidateSize({pan:false});return;}
   if(typeof L==='undefined'){caption.textContent='Не удалось загрузить карту. Откройте участок в 2ГИС.';return;}
   const map=view.map=L.map(canvas,{zoomControl:false,minZoom:12,maxZoom:20,zoomSnap:.25,zoomDelta:1,touchZoom:true,bounceAtZoomLimits:false,doubleClickZoom:true,scrollWheelZoom:true,dragging:true,inertia:true,zoomAnimation:true,fadeAnimation:true,attributionControl:true});
   map.attributionControl.setPrefix(false);
   const tiles=L.tileLayer(PUT_MAP_API+'?z={z}&x={x}&y={y}',{minZoom:12,maxZoom:20,maxNativeZoom:19,keepBuffer:2,updateWhenIdle:true,updateWhenZooming:false,updateInterval:160,noWrap:true,bounds:[[58,26],[62,36]],attribution:'<a href="https://2gis.ru/" class="transferAttribution">© 2ГИС</a>'});
   let loaded=0,failed=0;tiles.on('loading',()=>{if(!loaded)caption.textContent='Загружаем карту 2ГИС…'});tiles.on('tileload',()=>{loaded++;caption.textContent='Карта 2ГИС · '+(navigator.onLine===false?'сохранённые изображения':'')});tiles.on('tileerror',()=>{failed++;caption.textContent=loaded?'Часть карты не загрузилась. Уже загруженные участки доступны.':'Карта 2ГИС пока недоступна. Точки и рассчитанный путь показаны без подложки.'});tiles.addTo(map);
   view.routeLayer=L.layerGroup().addTo(map);view.pointsLayer=L.layerGroup().addTo(map);view.gpsLayer=L.layerGroup().addTo(map);
   L.control.scale({imperial:false,maxWidth:100,position:'bottomleft'}).addTo(map);
   map.on('dragstart zoomstart',e=>{if(e.originalEvent)view.manualCamera=true});
   canvas.addEventListener('pointerdown',()=>{view.manualCamera=true},{passive:true});canvas.addEventListener('touchstart',()=>{view.manualCamera=true},{passive:true});canvas.addEventListener('wheel',()=>{view.manualCamera=true},{passive:true});
   map.on('zoomend',updateZoom);view.fit();view.update();
   if(typeof ResizeObserver!=='undefined'){view.observer=new ResizeObserver(()=>{if(canvas.isConnected)map.invalidateSize({pan:false})});view.observer.observe(canvas);}
  });
 };
 return view;
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&putMapExpanded)putMapCollapse(putMapExpanded)});
