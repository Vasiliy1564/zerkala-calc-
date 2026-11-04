const allowed = new Set(['https://zerkalo-pro-spb.ru', 'https://www.zerkalo-pro-spb.ru', 'https://zerkalo-pro.ru', 'https://www.zerkalo-pro.ru', 'null', 'https://appassets.androidplatform.net']);
const centres = {spb: '30.4290869,60.0565448', stav: '41.9110926,45.0011119'};
function reply(data, status, origin) {
  const headers = {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Vary':'Origin'};
  if (origin && allowed.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(data === null ? null : JSON.stringify(data), {status, headers});
}
export async function OPTIONS(request) {
  const origin=request.headers.get('origin');
  if (!allowed.has(origin)) return reply({error:'origin_not_allowed'},403,origin);
  const response=reply(null,204,origin);
  response.headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers','Content-Type');
  response.headers.set('Access-Control-Max-Age','3600');
  return response;
}
export async function GET(request) {
  const url = new URL(request.url);
  return search(request, url.searchParams.get('q') || '', url.searchParams.get('market'));
}
export async function POST(request) {
  let body;
  try { body=await request.json(); } catch { return reply({error:'invalid_request'},400,request.headers.get('origin')); }
  return search(request, typeof body?.query === 'string' ? body.query.trim() : '', body?.market);
}
async function search(request, query, market) {
  const origin=request.headers.get('origin');
  if (origin && !allowed.has(origin)) return reply({error:'origin_not_allowed'},403,origin);
  query=query.trim();
  if(query.length<4 || query.length>300 || !Object.hasOwn(centres,market)) return reply({error:'invalid_query'},400,origin);
  if(!process.env.TWOGIS_API_KEY) return reply({error:'not_configured'},503,origin);
  const url=new URL('https://catalog.api.2gis.com/3.0/items/geocode');
  url.search=new URLSearchParams({q:query,type:'building',location:centres[market],fields:'items.point,items.address',key:process.env.TWOGIS_API_KEY}).toString();
  try {
    const upstream=await fetch(url,{signal:AbortSignal.timeout(18000)});
    const data=await upstream.json();
    if(data.meta?.code === 404) return reply({features:[],source:'2gis'},200,origin);
    if(!upstream.ok || data.meta?.code !== 200) {
      console.error('2GIS geocoder status',upstream.status,data.meta?.code);
      return reply({error:upstream.status===429||data.meta?.code===429?'limit_reached':'geocoder_unavailable'},502,origin);
    }
    const seen=new Set(),features=[];
    for(const item of data.result?.items || []) {
      const {lon,lat}=item.point || {},label=item.full_name || item.address_name;
      if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon < -180||lon > 180||lat < -90||lat > 90||typeof label!=='string'||!label.trim())continue;
      const id=String(item.id||''),identity=id||`${lon},${lat}`;
      if(seen.has(identity))continue;seen.add(identity);
      features.push({properties:{label},geometry:{coordinates:[lon,lat]},source:'2gis'});
      if(features.length===6)break;
    }
    return reply({features,source:'2gis'},200,origin);
  } catch {
    console.error('2GIS geocoder request failed');
    return reply({error:'geocoder_unavailable'},502,origin);
  }
}
