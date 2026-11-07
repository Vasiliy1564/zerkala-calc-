// GET /api/tile?z=&x=&y=  — растровые плитки карты 2ГИС через ваш сервер
const { cors, num } = require('./_lib');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  const z = num(req.query.z), x = num(req.query.x), y = num(req.query.y);
  if ([z, x, y].some(v => v === null || !Number.isInteger(v)) || z < 3 || z > 19) return res.status(400).end();
  try {
    const r = await fetch(`https://tile2.maps.2gis.com/tiles?x=${x}&y=${y}&z=${z}&v=1`);
    if (!r.ok) return res.status(r.status).end();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=3600');
    res.status(200).send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.status(502).end();
  }
};
