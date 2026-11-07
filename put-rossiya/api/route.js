// GET /api/route?from=lat,lon&to=lat,lon&mode=walking|driving
const { cors, key, num } = require('./_lib');

function parsePoint(s) {
  const [lat, lon] = String(s || '').split(',').map(num);
  return lat === null || lon === null || lat === undefined || lon === undefined ? null : { lat, lon };
}

function lineToCoords(sel) {
  // "LINESTRING(lon lat, lon lat, ...)"
  const m = /\(([^)]*)\)/.exec(sel || '');
  if (!m) return [];
  return m[1].split(',').map(s => s.trim().split(/\s+/).map(Number)).filter(a => a.length >= 2 && a.every(Number.isFinite))
    .map(([lon, lat]) => [lat, lon]);
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const k = key(res); if (!k) return;
  const a = parsePoint(req.query.from), b = parsePoint(req.query.to);
  if (!a || !b) return res.status(400).json({ error: 'Нужны from и to в виде lat,lon' });
  const mode = req.query.mode === 'driving' ? 'driving' : 'walking';

  try {
    const r = await fetch('https://routing.api.2gis.com/routing/7.0.0/global?key=' + encodeURIComponent(k), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        points: [{ type: 'stop', lon: a.lon, lat: a.lat }, { type: 'stop', lon: b.lon, lat: b.lat }],
        transport: mode, output: 'detailed', locale: 'ru'
      })
    });
    const j = await r.json();
    const route = j && j.result && j.result[0];
    if (!r.ok || !route) {
      return res.status(502).json({ error: 'Маршрут не построен', details: j && j.message });
    }
    const coords = [], steps = [];
    for (const m of route.maneuvers || []) {
      if (m.comment) steps.push(m.comment);
      for (const g of (m.outcoming_path && m.outcoming_path.geometry) || []) coords.push(...lineToCoords(g.selection));
    }
    res.status(200).json({
      distance: route.total_distance, duration: route.total_duration, coords, steps
    });
  } catch (e) {
    res.status(502).json({ error: 'Сервис недоступен' });
  }
};
