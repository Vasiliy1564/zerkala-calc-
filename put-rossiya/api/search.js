// GET /api/search?kind=city&q=...            — города, сёла, населённые пункты по всей России
// GET /api/search?kind=place&q=...&lat=..&lon=..  — места и организации рядом с точкой
const { cors, key, num } = require('./_lib');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const k = key(res); if (!k) return;
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (q.length < 2) return res.status(400).json({ error: 'Слишком короткий запрос' });
  const kind = req.query.kind === 'place' ? 'place' : 'city';

  const p = new URLSearchParams({
    q, key: k, locale: 'ru_RU', page_size: '10',
    fields: 'items.point,items.full_name,items.address_name,items.adm_div,items.rubrics'
  });
  if (kind === 'city') {
    p.set('type', 'adm_div.city,adm_div.settlement,adm_div.district');
  } else {
    const lat = num(req.query.lat), lon = num(req.query.lon);
    if (lat === null || lon === null) return res.status(400).json({ error: 'Нужны lat и lon' });
    p.set('type', 'branch,building,attraction,street');
    p.set('point', `${lon},${lat}`);
    p.set('radius', '15000');
    p.set('sort_point', `${lon},${lat}`);
  }

  try {
    const r = await fetch('https://catalog.api.2gis.com/3.0/items?' + p);
    const j = await r.json();
    if (!r.ok || (j.meta && j.meta.code && j.meta.code >= 400)) {
      return res.status(502).json({ error: '2ГИС вернул ошибку', code: j.meta && j.meta.code, details: j.meta && j.meta.error && j.meta.error.message });
    }
    const items = ((j.result && j.result.items) || [])
      .filter(i => i.point)
      .map(i => ({
        id: i.id,
        name: i.name || i.full_name,
        full: i.full_name || i.name,
        address: i.address_name || '',
        type: i.type,
        lat: i.point.lat, lon: i.point.lon
      }));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ items });
  } catch (e) {
    res.status(502).json({ error: 'Сервис недоступен' });
  }
};
