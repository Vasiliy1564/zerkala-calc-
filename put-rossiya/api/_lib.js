// Общие помощники. Ключ 2ГИС берётся ТОЛЬКО из переменной окружения DGIS_KEY на сервере.
const ALLOWED = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

function cors(req, res) {
  const origin = req.headers.origin || '';
  const ok = ALLOWED.includes('*') || ALLOWED.includes(origin);
  res.setHeader('Access-Control-Allow-Origin', ok ? (ALLOWED.includes('*') ? '*' : origin) : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

function key(res) {
  const k = process.env.DGIS_KEY;
  if (!k) { res.status(500).json({ error: 'DGIS_KEY не задан на сервере' }); return null; }
  return k;
}

const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };

module.exports = { cors, key, num };
