// Panel de moderación. La moderadora gestiona contenido y datos: nunca ve quién escribió un reporte (solo un alias),
// no puede borrar cuentas y toda decisión exige una justificación que queda en el registro.
import { api } from '../api.js';
import { estado } from '../estado.js';
import * as mapa from '../mapa.js';
import { CATEGORIAS, h, hace, hora12, icono, toast } from '../ui.js';

const ESTADOS = { ACTIVO: 'Activo', EN_REVISION: 'En revisión', OCULTO: 'Oculto', RESUELTO: 'Atendido' };
const PESTANAS = [['revisar', 'Por revisar'], ['reportes', 'Reportes'], ['datos', 'Datos de seguridad'], ['metricas', 'Métricas'], ['registro', 'Registro']];

export async function render(cont, { ir }) {
  let pestana = 'revisar';
  let vivo = true;
  const cuerpo = h('div', { class: 'pila', 'aria-live': 'polite' });
  const botones = PESTANAS.map(([clave, texto]) => {
    const b = h('button', { class: 'chip', type: 'button', role: 'tab', 'aria-selected': String(clave === pestana) }, texto);
    b.addEventListener('click', () => { pestana = clave; botones.forEach((x) => x.setAttribute('aria-selected', String(x === b))); mostrar(); });
    return b;
  });
  // Justificación compartida: cada decisión debe explicarse (queda en el registro de auditoría).
  const nota = h('textarea', { id: 'mod-nota', maxlength: 300, placeholder: 'Escribe aquí la justificación de tu próxima decisión (mínimo 5 letras)', 'aria-label': 'Justificación de la decisión' });
  const exigirNota = () => {
    if (nota.value.trim().length < 5) { nota.setAttribute('aria-invalid', 'true'); nota.focus(); toast('Escribe una justificación: queda en el registro de auditoría.', 'error'); return null; }
    nota.removeAttribute('aria-invalid');
    return nota.value.trim();
  };
  const hecho = (msg) => { toast(msg); nota.value = ''; mostrar(); };

  async function decidir(r, decision) {
    const n = exigirNota(); if (!n) return;
    try { await api.post(`/moderacion/reportes/${r.id}/resolver`, { decision, nota: n }); hecho({ OCULTAR: 'Reporte ocultado.', RESTAURAR: 'Reporte restaurado.', RESUELTO: 'Reporte marcado como atendido.' }[decision]); }
    catch (e) { toast(e.message, 'error'); }
  }
  async function limitar(r, dias) {
    const n = exigirNota(); if (!n) return;
    if (dias > 0 && !window.confirm(`Se limitará la publicación de reportes de la autora ${r.alias_autora} por ${dias} día(s). Podrá seguir usando Nova. ¿Continuar?`)) return;
    try { await api.post(`/moderacion/reportes/${r.id}/limitar-autora`, { dias, nota: n }); hecho(dias ? `Publicación limitada ${dias} día(s) para ${r.alias_autora}.` : 'Limitación levantada.'); }
    catch (e) { toast(e.message, 'error'); }
  }

  function tarjeta(r) {
    const cat = CATEGORIAS[r.categoria];
    const dias = h('select', { 'aria-label': `Días de limitación para ${r.alias_autora}` }, [1, 3, 7, 15, 30].map((d) => h('option', { value: d }, `${d} día${d > 1 ? 's' : ''}`)));
    return h('article', { class: 'tarjeta pila' },
      h('div', { class: 'fila entre' }, h('strong', {}, `${cat.etiqueta} · ${r.referencia}`), h('span', { class: `estado-pill e-${r.estado}` }, ESTADOS[r.estado])),
      r.descripcion ? h('p', {}, r.descripcion) : h('p', { class: 'suave' }, 'Sin descripción.'),
      h('p', { class: 'ayuda-txt' }, `${r.municipio} · ${hace(r.creado_en)} · ≈ ${hora12(r.hora)} · ${r.denuncias} denuncias · ${r.confirmaciones} confirmaciones · autora ${r.alias_autora}`),
      h('div', { class: 'fila' },
        r.estado === 'ACTIVO' || r.estado === 'EN_REVISION' ? h('button', { class: 'btn peligro chico', type: 'button', onclick: () => decidir(r, 'OCULTAR') }, 'Ocultar') : null,
        r.estado === 'ACTIVO' || r.estado === 'EN_REVISION' ? h('button', { class: 'btn sec chico', type: 'button', onclick: () => decidir(r, 'RESUELTO') }, icono('check'), 'Atendido') : null,
        r.estado !== 'ACTIVO' ? h('button', { class: 'btn sec chico', type: 'button', onclick: () => decidir(r, 'RESTAURAR') }, 'Restaurar') : null),
      h('details', {}, h('summary', { style: 'cursor:pointer;font-size:.85rem' }, 'Sanción proporcional (sin conocer a la autora)'),
        h('div', { class: 'fila', style: 'margin-top:8px' }, dias,
          h('button', { class: 'btn sec chico', type: 'button', onclick: () => limitar(r, Number(dias.value)) }, 'Limitar publicación'),
          h('button', { class: 'btn sec chico', type: 'button', onclick: () => limitar(r, 0) }, 'Levantar'))));
  }

  async function verRevisar() {
    const c = await api.get('/moderacion/cola');
    cuerpo.replaceChildren(
      h('p', { class: 'ayuda-txt' }, 'Reportes con 2 o más denuncias. Salen de la vista pública hasta que una persona decida.'),
      ...(c.reportes.length ? c.reportes.map(tarjeta) : [h('div', { class: 'tarjeta' }, 'No hay reportes pendientes de revisión. Revisa la pestaña «Reportes» para ver todos los demás.')]));
  }

  async function verReportes() {
    const selEstado = h('select', { 'aria-label': 'Filtrar por estado' }, [['', 'Todos los estados'], ...Object.entries(ESTADOS)].map(([v, t]) => h('option', { value: v }, t)));
    const selMun = h('select', { 'aria-label': 'Filtrar por municipio' }, [h('option', { value: '' }, 'Todos los municipios'), ...estado.municipios.map((m) => h('option', { value: m.id }, m.nombre))]);
    const lista = h('div', { class: 'pila' });
    const cargar = async () => {
      const q = new URLSearchParams({ limite: 60 });
      if (selEstado.value) q.set('estado', selEstado.value);
      if (selMun.value) q.set('municipio_id', selMun.value);
      const r = await api.get(`/moderacion/reportes?${q}`);
      lista.replaceChildren(h('p', { class: 'ayuda-txt' }, `${r.total} reportes, del más reciente al más antiguo.`), ...(r.reportes.length ? r.reportes.map(tarjeta) : [h('div', { class: 'tarjeta' }, 'No hay reportes con ese filtro.')]));
    };
    selEstado.addEventListener('change', cargar); selMun.addEventListener('change', cargar);
    cuerpo.replaceChildren(h('div', { class: 'fila' }, selEstado, selMun), lista);
    await cargar();
  }

  async function verDatos() {
    const mun = estado.municipio;
    const selMun = h('select', { 'aria-label': 'Municipio' }, estado.municipios.map((m) => h('option', { value: m.id, selected: m.id === mun.id }, m.nombre)));
    const luces = h('div', { class: 'pila' });
    const puntos = h('div', { class: 'pila' });
    const tipo = h('select', { 'aria-label': 'Tipo de punto' }, [['LUMINARIA', 'Luminaria'], ['CAMARA', 'Cámara'], ['COMERCIO', 'Comercio']].map(([v, t]) => h('option', { value: v }, t)));
    const nombre = h('input', { placeholder: 'Nombre (opcional)', maxlength: 60, 'aria-label': 'Nombre del punto' });
    const cargar = async () => {
      const [l, p] = await Promise.all([api.get('/moderacion/luminarias-danadas'), api.get(`/moderacion/puntos?municipio_id=${selMun.value}`)]);
      luces.replaceChildren(h('h3', {}, `Luminarias dañadas por reparar (${l.luminarias.length})`), h('p', { class: 'ayuda-txt' }, 'Reportadas por la comunidad en los últimos 30 días. Al marcarlas como reparadas dejan de restar seguridad a las rutas.'),
        ...(l.luminarias.length ? l.luminarias.map((x) => h('div', { class: 'fila entre tarjeta' }, h('span', {}, `${x.municipio ?? 'Zona'} · ${hace(x.creada_en)}`),
          h('div', { class: 'fila' }, h('button', { class: 'btn sec chico', type: 'button', onclick: () => mapa.irA(x, 18) }, 'Ver'),
            h('button', { class: 'btn chico', type: 'button', onclick: async () => { const n = exigirNota(); if (!n) return; try { await api.post(`/moderacion/luminarias-danadas/${x.id}/reparar`, { nota: n }); hecho('Luminaria marcada como reparada.'); } catch (e) { toast(e.message, 'error'); } } }, 'Reparada')))) : [h('div', { class: 'tarjeta' }, 'No hay luminarias pendientes.')]));
      puntos.replaceChildren(h('h3', {}, 'Puntos de seguridad'),
        h('div', { class: 'tarjeta pila' }, h('strong', {}, 'Agregar en el centro del mapa'), h('div', { class: 'fila' }, tipo, nombre),
          h('button', { class: 'btn chico', type: 'button', onclick: async () => {
            const c = mapa.obtener().getCenter();
            try { await api.post('/moderacion/puntos', { tipo: tipo.value, nombre: nombre.value.trim() || undefined, municipio_id: Number(selMun.value), lat: c.lat, lng: c.lng, ...(tipo.value === 'COMERCIO' ? { abre: 0, cierra: 24 } : {}) }); nombre.value = ''; toast('Punto agregado.'); cargar(); } catch (e) { toast(e.message, 'error'); } } }, icono('mas'), 'Agregar punto')),
        ...p.puntos.slice(0, 30).map((x) => h('div', { class: 'fila entre' }, h('span', { class: x.activo ? '' : 'suave' }, `${{ LUMINARIA: 'Luminaria', CAMARA: 'Cámara', COMERCIO: 'Comercio' }[x.tipo]}${x.nombre ? ` · ${x.nombre}` : ''} #${x.id}${x.activo ? '' : ' (inactivo)'}`),
          h('button', { class: 'btn sec chico', type: 'button', onclick: async () => { const n = exigirNota(); if (!n) return; try { await api.post(`/moderacion/puntos/${x.id}/estado`, { activo: !x.activo, nota: n }); hecho(x.activo ? 'Punto desactivado.' : 'Punto activado.'); } catch (e) { toast(e.message, 'error'); } } }, x.activo ? 'Desactivar' : 'Activar'))));
    };
    selMun.addEventListener('change', () => { estado.elegirMunicipio(Number(selMun.value)); mapa.irA(estado.municipio, 15); cargar(); });
    cuerpo.replaceChildren(h('div', { class: 'campo' }, h('label', { for: 'mod-mun' }, 'Municipio'), selMun), luces, puntos);
    selMun.id = 'mod-mun';
    mapa.irA(mun, 15);
    await cargar();
  }

  async function verMetricas() {
    const m = await api.get('/moderacion/metricas');
    const max = Math.max(1, ...m.por_hora);
    const barras = (obj) => Object.entries(obj).map(([k, v]) => h('div', { class: 'barra' }, h('span', {}, CATEGORIAS[k]?.etiqueta ?? ESTADOS[k] ?? k), h('i', { estilo: { '--v': `${Math.max(3, (v / Math.max(1, ...Object.values(obj))) * 100)}%` }, role: 'img', 'aria-label': `${v}` })));
    const kpi = (n, t) => h('div', { class: 'kpi tarjeta', estilo: { flex: 1 } }, h('b', {}, n), h('span', {}, t));
    cuerpo.replaceChildren(
      h('div', { class: 'fila' }, kpi(m.por_estado.EN_REVISION ?? 0, 'por revisar'), kpi(m.luminarias_pendientes, 'luminarias por reparar')),
      h('div', { class: 'fila' }, kpi(m.aportes_ultimos_7_dias, 'aportes en 7 días'), kpi(m.autoras_limitadas, 'autoras limitadas')),
      h('h3', {}, 'Reportes por tipo'), h('div', { class: 'barras' }, barras(m.por_categoria)),
      h('h3', {}, 'Reportes por estado'), h('div', { class: 'barras' }, barras(m.por_estado)),
      h('h3', {}, 'A qué hora ocurren'), h('div', { class: 'histograma', role: 'img', 'aria-label': 'Reportes activos por hora del día' }, m.por_hora.map((v, i) => h('i', { title: `${hora12(i)}: ${v}`, estilo: { '--h': `${Math.max(4, (v / max) * 100)}%` } }))),
      h('h3', {}, 'Municipios con más reportes activos'), ...m.por_municipio.slice(0, 6).map((x) => h('div', { class: 'fila entre suave' }, h('span', {}, x.municipio), h('span', {}, x.total))),
      h('p', { class: 'ayuda-txt' }, 'Datos agregados: no incluyen identidad de ninguna persona.'));
  }

  async function verRegistro() {
    const a = await api.get('/moderacion/auditoria');
    cuerpo.replaceChildren(h('p', { class: 'ayuda-txt' }, 'Toda decisión queda registrada con su justificación.'),
      h('table', { class: 'tabla-aud' }, h('caption', { class: 'solo-lectores' }, 'Últimas decisiones'),
        h('tbody', {}, a.eventos.map((e) => h('tr', {}, h('td', {}, hace(e.creada_en)), h('td', {}, e.actor ?? 'Sistema'), h('td', {}, e.accion.replaceAll('_', ' ').toLowerCase()), h('td', {}, e.detalle ?? ''))))));
  }

  async function mostrar() {
    try { await { revisar: verRevisar, reportes: verReportes, datos: verDatos, metricas: verMetricas, registro: verRegistro }[pestana](); }
    catch (e) { if (vivo) { toast(e.message, 'error'); if (e.estado === 403) ir('/perfil'); } }
  }

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('mod'), 'Moderación'), h('h2', {}, 'Cuidar la información')),
    h('div', { class: 'aviso info' }, icono('escudo'), 'Decides sobre contenido y datos, nunca sobre personas: ves un alias, no una identidad, y no puedes borrar cuentas. Cada decisión se registra.'),
    h('div', { class: 'campo' }, h('label', { for: 'mod-nota' }, 'Justificación'), nota),
    h('div', { class: 'chips', role: 'tablist', 'aria-label': 'Secciones de moderación' }, botones),
    cuerpo));
  await mostrar();
  return () => { vivo = false; };
}
