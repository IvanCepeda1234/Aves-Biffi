import { CONFIG } from './config.js';
import { fetchEbird, fetchINat } from './api.js';
import { local } from './store.js';
import { renderStats, renderLista, initMap, renderMapa, setEstado, parseFecha, esc } from './ui.js';

const $ = (s) => document.querySelector(s);

const estado = {
  remotos: [],
  filtros: { q: '', fuente: 'todas', orden: 'reciente' },
  especies: new Map(), // nombre común -> nombre científico (para autocompletar)
};

const todos = () => [...local.list(), ...estado.remotos];

function filtrados() {
  const { q, fuente, orden } = estado.filtros;
  const t = q.trim().toLowerCase();
  const res = todos().filter(
    (a) =>
      (fuente === 'todas' || a.fuente === fuente) &&
      (!t || [a.nombre, a.cientifico, a.lugar].some((v) => v?.toLowerCase().includes(t))),
  );
  res.sort(
    orden === 'nombre'
      ? (a, b) => a.nombre.localeCompare(b.nombre, 'es')
      : (a, b) => (parseFecha(b.fecha)?.getTime() ?? 0) - (parseFecha(a.fecha)?.getTime() ?? 0),
  );
  return res;
}

function render() {
  const items = filtrados();
  renderStats(todos());
  renderLista($('#lista'), items);
  renderMapa(items);
}

function llenarDatalist() {
  estado.especies.clear();
  estado.remotos.forEach((a) => {
    if (a.nombre && a.cientifico && !estado.especies.has(a.nombre)) estado.especies.set(a.nombre, a.cientifico);
  });
  $('#lista-especies').innerHTML = [...estado.especies.keys()]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((n) => `<option value="${esc(n)}"></option>`)
    .join('');
}

async function cargar() {
  setEstado('Cargando avistamientos…');
  const [eb, inat] = await Promise.allSettled([fetchEbird(), fetchINat()]);

  const inatData = inat.status === 'fulfilled' ? inat.value : [];
  // eBird no trae fotos: se toman de iNaturalist cuando la especie coincide.
  const fotos = new Map(inatData.filter((o) => o.foto && o.cientifico).map((o) => [o.cientifico.toLowerCase(), o.foto]));
  const ebData = eb.status === 'fulfilled'
    ? eb.value.map((o) => ({ ...o, foto: fotos.get(o.cientifico.toLowerCase()) ?? null }))
    : [];

  estado.remotos = [...ebData, ...inatData];

  const fallos = [eb.status === 'rejected' && 'eBird', inat.status === 'rejected' && 'iNaturalist'].filter(Boolean);
  if (eb.status === 'rejected') console.warn(eb.reason);
  if (inat.status === 'rejected') console.warn(inat.reason);

  setEstado(
    fallos.length
      ? `Sin conexión con ${fallos.join(' y ')}; se muestra lo disponible.`
      : `Actualizado a las ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
    fallos.length ? 'warn' : 'ok',
  );
  llenarDatalist();
  render();
}

function fechaAhora() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function initFormulario() {
  const form = $('#form-avistamiento');
  const msg = $('#form-msg');
  form.fecha.value = fechaAhora();

  form.especie.addEventListener('change', () => {
    const sci = estado.especies.get(form.especie.value);
    if (sci && !form.cientifico.value) form.cientifico.value = sci;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const nombre = String(f.get('especie') ?? '').trim();
    const fecha = String(f.get('fecha') ?? '');
    if (!nombre || !fecha) {
      msg.textContent = 'Completa la especie y la fecha.';
      return;
    }
    local.add({
      id: `local-${crypto.randomUUID?.() ?? Date.now()}`,
      fuente: 'Colegio',
      nombre,
      cientifico: String(f.get('cientifico') ?? '').trim(),
      fecha,
      lugar: `${f.get('lugar')} · ${CONFIG.colegio}`,
      lat: CONFIG.centro.lat,
      lng: CONFIG.centro.lng,
      cantidad: Number(f.get('cantidad')) || null,
      observador: String(f.get('observador') ?? '').trim(),
      notas: String(f.get('notas') ?? '').trim(),
      foto: null,
      enlace: null,
    });
    form.reset();
    form.fecha.value = fechaAhora();
    msg.textContent = `Avistamiento de "${nombre}" guardado.`;
    render();
  });
}

function initFiltros() {
  $('#f-buscar').addEventListener('input', (e) => { estado.filtros.q = e.target.value; render(); });
  $('#f-fuente').addEventListener('change', (e) => { estado.filtros.fuente = e.target.value; render(); });
  $('#f-orden').addEventListener('change', (e) => { estado.filtros.orden = e.target.value; render(); });

  $('#lista').addEventListener('click', (e) => {
    const id = e.target.closest('[data-borrar]')?.dataset.borrar;
    if (id && confirm('¿Eliminar este avistamiento?')) {
      local.remove(id);
      render();
    }
  });
}

initMap($('#map'), CONFIG.centro, CONFIG.colegio);
initFiltros();
initFormulario();
render();
cargar();
