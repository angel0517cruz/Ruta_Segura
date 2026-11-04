// Panel de moderación: aquí una PERSONA decide. El sistema solo propone (reportes denunciados) y todo queda auditado.
import { api } from '../api.js';
import { CATEGORIAS, h, hace, icono, toast } from '../ui.js';

export async function render(cont, { ir }) {
  const cola = h('div', { class: 'pila' });
  const auditoria = h('div', { class: 'pila' });

  async function cargar() {
    const [c, a] = await Promise.all([api.get('/moderacion/cola'), api.get('/moderacion/auditoria')]);
    cola.replaceChildren(...(c.reportes.length ? c.reportes.map(tarjeta) : [h('div', { class: 'tarjeta' }, 'No hay reportes pendientes. Buen trabajo.')]));
    auditoria.replaceChildren(h('table', { class: 'tabla-aud' }, h('caption', { class: 'solo-lectores' }, 'Últimas decisiones'),
      h('tbody', {}, a.eventos.slice(0, 12).map((e) => h('tr', {}, h('td', {}, hace(e.creada_en)), h('td', {}, e.actor ?? 'Sistema'), h('td', {}, e.accion.replaceAll('_', ' ').toLowerCase()), h('td', {}, e.detalle ?? ''))))));
  }

  function tarjeta(r) {
    const cat = CATEGORIAS[r.categoria];
    const nota = h('textarea', { 'aria-label': `Justificación de tu decisión sobre el reporte ${r.id}`, placeholder: 'Justifica tu decisión (mínimo 5 letras)', maxlength: 300 });
    const decidir = async (decision) => {
      if (nota.value.trim().length < 5) { nota.setAttribute('aria-invalid', 'true'); nota.focus(); toast('Escribe una justificación: queda en el registro de auditoría.', 'error'); return; }
      try { await api.post(`/moderacion/${r.id}/resolver`, { decision, nota: nota.value.trim() }); toast(decision === 'OCULTAR' ? 'Reporte ocultado.' : 'Reporte restaurado.'); cargar(); }
      catch (e) { toast(e.message, 'error'); }
    };
    return h('article', { class: 'tarjeta pila' },
      h('div', { class: 'fila entre' }, h('strong', {}, `${cat.etiqueta} · ${r.referencia}`), h('span', { class: 'suave' }, `${r.denuncias} denuncias · ${r.confirmaciones} confirmaciones`)),
      r.descripcion ? h('p', {}, r.descripcion) : h('p', { class: 'suave' }, 'Sin descripción.'),
      h('p', { class: 'ayuda-txt' }, `${r.municipio} · ${hace(r.creado_en)}`),
      h('div', { class: 'campo' }, nota),
      h('div', { class: 'fila' },
        h('button', { class: 'btn peligro chico', type: 'button', onclick: () => decidir('OCULTAR') }, 'Ocultar'),
        h('button', { class: 'btn sec chico', type: 'button', onclick: () => decidir('RESTAURAR') }, 'Restaurar')));
  }

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('mod'), 'Human-in-the-loop'), h('h2', {}, 'Cola de moderación')),
    h('div', { class: 'aviso info' }, icono('escudo'), 'Ningún reporte se oculta automáticamente por el algoritmo: dos denuncias lo apartan de la vista y aquí una persona decide, con justificación.'),
    cola, h('h3', {}, 'Registro de decisiones'), auditoria,
    h('a', { class: 'btn sec', href: '#/perfil' }, 'Volver al perfil')));
  try { await cargar(); } catch (e) { toast(e.message, 'error'); ir('/perfil'); }
}
