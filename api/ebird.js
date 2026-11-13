// Función serverless de Vercel: proxy hacia la API de eBird.
// La API key se guarda como variable de entorno (EBIRD_API_KEY) y nunca llega al navegador.

const num = (v, def, min, max) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def;
};

export default async function handler(req, res) {
  const key = process.env.EBIRD_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'EBIRD_API_KEY no está configurada en Vercel.' });
  }

  const q = req.query ?? {};
  const params = new URLSearchParams({
    lat: num(q.lat, 10.9878, -90, 90).toFixed(4),
    lng: num(q.lng, -74.7889, -180, 180).toFixed(4),
    dist: String(Math.round(num(q.dist, 15, 1, 50))),
    back: String(Math.round(num(q.back, 14, 1, 30))),
    maxResults: String(Math.round(num(q.max, 60, 1, 200))),
    sppLocale: 'es',
  });

  try {
    const r = await fetch(`https://api.ebird.org/v2/data/obs/geo/recent?${params}`, {
      headers: { 'X-eBirdApiToken': key },
    });
    if (!r.ok) {
      return res.status(r.status).json({ error: `eBird respondió ${r.status}` });
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'No se pudo contactar a eBird.' });
  }
}
