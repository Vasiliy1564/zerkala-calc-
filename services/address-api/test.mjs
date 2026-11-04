import test from 'node:test';
import assert from 'node:assert/strict';
import {POST,OPTIONS} from './api/geocode.js';
const call=(query,market='spb',origin='https://zerkalo-pro-spb.ru')=>new Request('https://api.example/api/geocode',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({query,market})});
test('reject unrelated origins, invalid markets and short queries before provider requests',async()=>{
 assert.equal((await POST(call('Мурино 8','spb','https://unrelated.example'))).status,403);
 assert.equal((await POST(call('Мурино 8','__proto__'))).status,400);
 assert.equal((await POST(call('8'))).status,400);
 const r=await OPTIONS(new Request('https://api.example/api/geocode',{method:'OPTIONS',headers:{origin:'null'}}));assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'null');
});
test('normalize real provider shape, preserve full Russian address, keep API key on server',async()=>{
 process.env.TWOGIS_API_KEY='test-only';const original=globalThis.fetch;
 globalThis.fetch=async url=>{assert.equal(url.hostname,'catalog.api.2gis.com');assert.equal(url.searchParams.get('type'),'building');assert.equal(url.searchParams.get('q'),'Ручьевский, 8');return Response.json({meta:{code:200},result:{items:[{id:'123',full_name:'Мурино, проспект Ручьёвский, 8',point:{lon:30.438703,lat:60.066601}},{id:'123',full_name:'duplicate',point:{lon:30.438703,lat:60.066601}},{full_name:'bad',point:{lon:999,lat:60}}]}})};
 try{const r=await POST(call('Ручьевский, 8'));assert.equal(r.status,200);const d=await r.json();assert.equal(d.features.length,1);assert.deepEqual(d.features[0].geometry.coordinates,[30.438703,60.066601]);assert(!JSON.stringify(d).includes('test-only'));assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://zerkalo-pro-spb.ru');}finally{globalThis.fetch=original;delete process.env.TWOGIS_API_KEY;}
});
test('GET search accepts browser and Android origins without a POST preflight', async()=>{
 const {GET}=await import('./api/geocode.js');
 process.env.TWOGIS_API_KEY='test-only';const original=globalThis.fetch;
 globalThis.fetch=async url=>{assert.equal(url.searchParams.get('q'),'Шувалова 16/9');return Response.json({meta:{code:200},result:{items:[{id:'house',full_name:'Мурино, улица Шувалова, 16 / Петровский бульвар, 9',point:{lon:30.4289,lat:60.056339}}]}});};
 try{
  for(const origin of ['https://zerkalo-pro-spb.ru','https://appassets.androidplatform.net']){
   const r=await GET(new Request('https://api.example/api/geocode?q='+encodeURIComponent('Шувалова 16/9')+'&market=spb',{headers:{origin}}));
   assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);assert.equal((await r.json()).features.length,1);
  }
  assert.equal((await GET(new Request('https://api.example/api/geocode?q=abcdef&market=__proto__'))).status,400);
 }finally{globalThis.fetch=original;delete process.env.TWOGIS_API_KEY;}
});

test('allow legitimate HTTP and trailing-dot website origins, reject lookalike domains', async()=>{
 for(const origin of ['http://zerkalo-pro-spb.ru','https://zerkalo-pro-spb.ru.','https://www.zerkalo-pro.ru.']){
  const r=await OPTIONS(new Request('https://api.example/api/geocode',{method:'OPTIONS',headers:{origin}}));assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
 }
 for(const origin of ['https://zerkalo-pro-spb.ru.evil.example','https://evilzerkalo-pro-spb.ru','https://zerkalo-pro-spb.ru:8080','file://']){
  assert.equal((await OPTIONS(new Request('https://api.example/api/geocode',{method:'OPTIONS',headers:{origin}}))).status,403);
 }
});
