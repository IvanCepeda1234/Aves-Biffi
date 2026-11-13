// Registros propios del colegio. Por ahora en localStorage (solo este navegador).
// Siguiente paso: reemplazar por una base de datos (p. ej. Supabase o Vercel Postgres).
const KEY = 'aves-biffi:avistamientos';

function leer() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; }
}
function guardar(lista) {
  try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch { /* sin almacenamiento */ }
}

export const local = {
  list: leer,
  add(avistamiento) {
    const lista = [avistamiento, ...leer()];
    guardar(lista);
    return lista;
  },
  remove(id) {
    const lista = leer().filter((a) => a.id !== id);
    guardar(lista);
    return lista;
  },
};
