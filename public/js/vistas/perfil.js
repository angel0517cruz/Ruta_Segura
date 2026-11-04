// Perfil: nivel, puntos y la "constelación" de insignias de confianza.
import { api, sesion } from '../api.js';
import { estado } from '../estado.js';
import { contar, h, hace, icono } from '../ui.js';

const ACTIVIDAD = { RUTA_OK: 'Verificaste una ruta', LUMINARIA_DANADA: 'Reportaste una luminaria dañada', COMERCIO_ABIERTO: 'Confirmaste un comercio abierto', REPORTE_CONFIRMADO: 'Confirmaste un reporte' };

export async function render(cont, { ir }) {
  const p = await api.get('/perfil');
  const puntos = h('b', {}, '0');
  const estrellas = p.insignias.map((i) => {
    const encendida = Boolean(i.otorgada_en);
    return h('div', { class: `estrella ${encendida ? 'encendida' : ''}`, role: 'group', 'aria-label': `${i.nombre}: ${encendida ? 'conseguida' : `${i.actual} de ${i.meta}`}` },
      icono('estrella'), h('strong', {}, i.nombre), h('span', { class: 'meta' }, encendida ? 'Conseguida' : `${i.actual}/${i.meta}`),
      encendida ? null : h('div', { class: 'mini-barra', 'aria-hidden': 'true' }, h('i', { estilo: { '--v': `${(i.actual / i.meta) * 100}%` } })));
  });
  const obtenidas = p.insignias.filter((i) => i.otorgada_en).length;

  cont.append(h('div', { class: 'pila entra' },
    h('div', { class: 'tarjeta brilla pila' },
      h('div', { class: 'fila entre' }, h('div', {}, h('span', { class: 'etiqueta' }, icono('luna'), `Nivel ${p.nivel.nivel}`), h('h2', {}, p.usuaria.nombre)), h('div', { class: 'kpi' }, puntos, h('span', {}, 'puntos'))),
      h('div', { class: 'progreso-viaje', role: 'progressbar', 'aria-valuenow': Math.round(p.nivel.progreso * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Progreso al siguiente nivel' }, h('div', { estilo: { '--p': `${Math.round(p.nivel.progreso * 100)}%` } })),
      h('p', { class: 'suave' }, p.nivel.siguiente ? `Te faltan ${p.nivel.faltan} puntos para llegar a ${p.nivel.siguiente}.` : 'Llegaste al nivel más alto. Gracias por iluminar el camino.')),
    h('div', {}, h('h3', {}, 'Tu constelación'), h('p', { class: 'ayuda-txt' }, `${obtenidas} de ${p.total_insignias} insignias de confianza. Se ganan aportando datos útiles: luminarias, comercios abiertos y rutas verificadas.`)),
    h('div', { class: 'constelacion' }, estrellas),
    p.actividad.length ? h('div', { class: 'pila' }, h('h3', {}, 'Actividad reciente'), ...p.actividad.slice(0, 5).map((a) => h('div', { class: 'fila entre suave' }, h('span', {}, ACTIVIDAD[a.tipo]), h('span', {}, hace(a.fecha))))) : null,
    h('div', { class: 'pila' },
      h('a', { class: 'btn sec', href: '#/ayuda' }, icono('ayuda'), 'Ayuda, privacidad y límites'),
      estado.usuaria.rol === 'MODERADORA' ? h('a', { class: 'btn sec', href: '#/moderacion' }, icono('mod'), 'Panel de moderación') : null,
      h('button', { class: 'btn sec', type: 'button', onclick: () => { sesion.borrar(); estado.usuaria = null; estado.viaje = null; ir('/'); } }, 'Cerrar sesión'))));
  contar(puntos, p.usuaria.puntos, 1100);
}
