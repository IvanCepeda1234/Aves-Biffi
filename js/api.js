import { CONFIG } from './config.js';

// Todas las fuentes se normalizan a este formato:
// { id, fuente, nombre, cientifico, fecha, lugar, lat, lng, cantidad, foto, enlace, autor }

/** eBird (vía la función serverless /api/ebird, que guarda la API key). */
export async function fetchEbird() {
  const { centro, radioKm, diasAtras, maxResultados } = CONFIG;
  const qs = new URLSearchParams({
    lat: centro.lat, lng: centro.lng, dist: radioKm, back: diasAtras, max: maxResultados,
  });
  const r = await fetch(`/api/ebird?${qs}`);
  if (!r.ok) throw new Error(`eBird ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('eBird: respuesta inesperada');

  return data.map((o) => ({
    id: `ebird-${o.subId}-${o.speciesCode}`,
    fuente: 'eBird',
    nombre: o.comName,
    cientifico: o.sciName ?? '',
    fecha: o.obsDt,
    lugar: o.locName ?? 'Sin ubicación',
    lat: o.lat,
    lng: o.lng,
    cantidad: o.howMany ?? null,
    foto: null,
    enlace: o.subId ? `https://ebird.org/checklist/${o.subId}` : null,
    autor: null,
  }));
}

/** iNaturalist (API pública, sin key, con CORS). */
export async function fetchINat() {
  const { centro, radioKm, maxResultados } = CONFIG;
  const qs = new URLSearchParams({
    iconic_taxa: 'Aves',
    lat: centro.lat,
    lng: centro.lng,
    radius: radioKm,
    per_page: Math.min(maxResultados, 200),
    order_by: 'observed_on',
    order: 'desc',
    photos: 'true',
    verifiable: 'true',
    locale: 'es',
  });
  const r = await fetch(`https://api.inaturalist.org/v1/observations?${qs}`);
  if (!r.ok) throw new Error(`iNaturalist ${r.status}`);
  const { results = [] } = await r.json();

  return results.map((o) => ({
    id: `inat-${o.id}`,
    fuente: 'iNaturalist',
    nombre: o.taxon?.preferred_common_name || o.species_guess || o.taxon?.name || 'Ave sin identificar',
    cientifico: o.taxon?.name ?? '',
    fecha: o.time_observed_at || o.observed_on,
    lugar: o.place_guess || 'Sin ubicación',
    lat: o.geojson?.coordinates?.[1],
    lng: o.geojson?.coordinates?.[0],
    cantidad: null,
    foto: o.photos?.[0]?.url?.replace('square', 'medium') ?? null,
    enlace: o.uri ?? null,
    autor: o.user?.login ?? null,
  }));
}
