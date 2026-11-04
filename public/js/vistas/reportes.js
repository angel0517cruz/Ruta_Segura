// Lista de reportes ordenada por cercanía, con filtro por tipo de riesgo (equivalente accesible del mapa).
import { api } from '../api.js';
import { estado } from '../estado.js';
import * as mapa from '../mapa.js';
import { CATEGORIAS, h, hace, hora12, icono, metros, toast } from '../ui.js';
import { posicionActual } from '../ubicacion.js';
import { confirmarReporte, denunciarReporte } from './acciones.js';

export async function render(cont) {
  let filtro = null;
  let origen = null; // {lat,lng,texto}
  const mun = estado.municipio;
  const lista = h('div', { class: 'pila', 'aria-live': 'polite' });
  const resumen = h('p', { class: 'ayuda-txt', role: 'status' });
  const base = { lat: mun.lat, lng: mun.lng, texto: `el centro de ${mun.nombre}` };
  origen = base;
  mapa.irA(mun, 14);

  const chips = [[null, 'Todos', 'lista'], ...Object.entries(CATEGORIAS).map(([k, c]) => [k, c.etiqueta, c.icono])].map(([clave, texto, ic]) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(clave === filtro) }, icono(ic), texto);
    b.addEventListener('click', () => { filtro = clave; chips.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); cargar(); });
    return b;
  });

  const usarGps = h('button', { class: 'chip', type: 'button' }, icono('ubicacion'), 'Ordenar desde mi ubicación');
  usarGps.addEventListener('click', async () => {
    try { const p = await posicionActual(); origen = { ...p, texto: 'tu ubicación' }; usarGps.setAttribute('aria-pressed', 'true'); cargar(); }
    catch (e) { toast(e.message, 'error'); }
  });

  function tarjeta(r, vista) {
    const cat = CATEGORIAS[r.categoria];
    return h('article', { class: 'reporte', estilo: { '--c': cat.color } },
      h('div', { class: 'glifo' }, icono(cat.icono)),
      h('div', {},
        h('h3', {}, cat.etiqueta, ' · ', r.referencia),
        h('div', { class: 'meta' },
          r.distancia_m != null ? h('span', {}, `a ${metros(r.distancia_m)}`) : null,
          h('span', {}, `${hace(r.creado_en)}`), h('span', {}, `≈ ${hora12(r.hora)}`),
          h('span', {}, `${r.confirmaciones} ${r.confirmaciones === 1 ? 'confirmación' : 'confirmaciones'}`),
          r.precision_ubicacion === 'APROXIMADA' ? h('span', { title: 'No se pudo ubicar con exactitud' }, '≈ ubicación aproximada') : null),
        r.descripcion ? h('p', { estilo: { 'margin-top': '6px' } }, r.descripcion) : null,
        h('div', { class: 'acciones' },
          h('button', { class: 'btn sec chico', type: 'button', onclick: () => { mapa.irA(r, 17); document.getElementById('panel').classList.add('oculto'); } }, icono('mapa'), 'Ver en el mapa'),
          r.propia ? h('button', { class: 'btn sec chico', type: 'button', onclick: async () => { if (!window.confirm('¿Eliminar tu reporte?')) return; try { await api.del(`/reportes/${r.id}`); toast('Reporte eliminado.'); cargar(); } catch (e) { toast(e.message, 'error'); } } }, icono('basura'), 'Eliminar')
            : [h('button', { class: 'btn chico', type: 'button', onclick: async () => { if (await confirmarReporte(r)) cargar(); } }, icono('check'), 'La confirmo'),
               h('button', { class: 'btn sec chico', type: 'button', onclick: async () => { if (await denunciarReporte(r)) cargar(); } }, 'Denunciar')])));
  }

  async function cargar() {
    const q = new URLSearchParams({ municipio_id: mun.id, lat: origen.lat, lng: origen.lng, limite: 60 });
    if (filtro) q.set('categoria', filtro);
    try {
      const r = await api.get(`/reportes?${q}`);
      resumen.textContent = `${r.total} ${r.total === 1 ? 'reporte' : 'reportes'} en ${mun.nombre}, ordenados por cercanía a ${origen.texto}.`;
      lista.replaceChildren(...(r.reportes.length ? r.reportes.map(tarjeta) : [h('div', { class: 'tarjeta' }, 'Aún no hay reportes de este tipo. Si ves algo, ¡cuéntalo!')]));
      mapa.limpiarMarcadores();
      mapa.pintarReportes(r.reportes);
    } catch (e) { lista.replaceChildren(h('div', { class: 'aviso peligro', role: 'alert' }, icono('alerta'), e.message)); }
  }

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('lista'), mun.nombre), h('h2', {}, 'Reportes de la comunidad')),
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar por tipo de riesgo' }, chips),
    h('div', { class: 'chips' }, usarGps), resumen, lista));
  await cargar();
  return () => mapa.limpiarReportes();
}
