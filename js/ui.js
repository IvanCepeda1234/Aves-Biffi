// Escapa texto antes de insertarlo como HTML (los datos vienen de APIs externas).
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const urlSegura = (u) => (typeof u === 'string' && u.startsWith('https://') ? u : null);

export function parseFecha(s) {
  if (!s) return null;
  let v = String(s);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) v += 'T12:00';
  const d = new Date(v.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

const fmtFechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const fmtFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

export function formatFecha(s) {
  const d = parseFecha(s);
  if (!d) return 'Fecha desconocida';
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? fmtFecha.format(d) : fmtFechaHora.format(d);
}

const slug = (fuente) => fuente.toLowerCase();

const ICONO_AVE = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 6.5c-.9 0-1.7.4-2.3 1L13 9.3 8.6 5.2C7.4 4.1 5.6 4 4.3 5L3 6l5 5-5.2 1.4c-.8.2-.9 1.3-.1 1.6l5.5 2.3 2.3 4.2c.4.7 1.4.6 1.6-.2l1-3.6 3.5-1.6c1.8-.8 3-2.6 3-4.6v-.6l1.9-1.2c.4-.3.3-.9-.2-1L21 6.5z"/></svg>`;

export function setEstado(msg, tipo = 'ok') {
  const el = document.getElementById('estado');
  el.textContent = msg;
  el.classList.toggle('status--warn', tipo === 'warn');
}

export function renderStats(items) {
  const especies = new Set(items.map((a) => (a.cientifico || a.nombre).toLowerCase()));
  document.getElementById('stat-total').textContent = items.length;
  document.getElementById('stat-especies').textContent = especies.size;
  document.getElementById('stat-locales').textContent = items.filter((a) => a.fuente === 'Colegio').length;
}

function tarjeta(a) {
  const foto = urlSegura(a.foto);
  const enlace = urlSegura(a.enlace);
  const media = foto
    ? `<img src="${esc(foto)}" alt="${esc(a.nombre)}" loading="lazy">`
    : `<div class="card__ph">${ICONO_AVE}</div>`;

  const meta = [
    `<li>${esc(a.lugar)}</li>`,
    `<li>${esc(formatFecha(a.fecha))}</li>`,
    a.cantidad ? `<li>Cantidad: ${esc(a.cantidad)}</li>` : '',
    a.observador ? `<li>Registró: ${esc(a.observador)}</li>` : '',
    a.autor ? `<li>Observador: ${esc(a.autor)}</li>` : '',
  ].join('');

  const acciones = [
    enlace ? `<a href="${esc(enlace)}" target="_blank" rel="noopener">Ver en ${esc(a.fuente)}</a>` : '',
    a.fuente === 'Colegio' ? `<button class="link-btn" type="button" data-borrar="${esc(a.id)}">Eliminar</button>` : '',
  ].join('');

  return `
    <article class="card">
      <div class="card__media">${media}<span class="badge badge--${slug(a.fuente)}">${esc(a.fuente)}</span></div>
      <div class="card__body">
        <h3>${esc(a.nombre)}</h3>
        ${a.cientifico ? `<p class="sci">${esc(a.cientifico)}</p>` : ''}
        <ul class="meta">${meta}</ul>
        ${a.notas ? `<p class="sci">${esc(a.notas)}</p>` : ''}
        ${acciones ? `<div class="card__actions">${acciones}</div>` : ''}
      </div>
    </article>`;
}

export function renderLista(contenedor, items) {
  contenedor.innerHTML = items.length
    ? items.map(tarjeta).join('')
    : '<p class="empty">No hay avistamientos que coincidan con la búsqueda.</p>';
}

/* ===== Mapa (Leaflet) ===== */
const COLORES = { eBird: '#2b6cb0', iNaturalist: '#6d9f00', Colegio: '#1f6f4a' };
let capa = null;

export function initMap(el, centro, nombreColegio) {
  if (!window.L) {
    el.innerHTML = '<p class="empty">No se pudo cargar el mapa.</p>';
    return;
  }
  const map = L.map(el, { scrollWheelZoom: false }).setView([centro.lat, centro.lng], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.circleMarker([centro.lat, centro.lng], { radius: 11, color: '#d98e04', weight: 3, fillOpacity: 0.25 })
    .bindPopup(`<strong>${esc(nombreColegio)}</strong>`)
    .addTo(map);
  capa = L.layerGroup().addTo(map);
}

export function renderMapa(items) {
  if (!capa) return;
  capa.clearLayers();
  items
    .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lng))
    .forEach((a) => {
      L.circleMarker([a.lat, a.lng], {
        radius: 7, color: COLORES[a.fuente] ?? '#555', weight: 2, fillOpacity: 0.7,
      })
        .bindPopup(`<strong>${esc(a.nombre)}</strong><br>${esc(a.lugar)}<br><small>${esc(formatFecha(a.fecha))} · ${esc(a.fuente)}</small>`)
        .addTo(capa);
    });
}
