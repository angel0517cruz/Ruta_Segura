// Vista principal: mapa de calor predictivo por hora, capas y reportes.
import { api } from '../api.js';
import { estado, horaActualColombia, horaInicial } from '../estado.js';
import * as mapa from '../mapa.js';
import { relojNocturno } from '../reloj.js';
import { CATEGORIAS, h, icono, toast } from '../ui.js';
import { confirmarReporte, denunciarReporte } from './acciones.js';

export async function render(cont) {
  const m = estado.municipio;
  const hora = estado.hora ?? horaInicial();
  estado.hora = hora;
  const capas = { calor: true, reportes: false, luces: false, camaras: false, comercios: false, calles: false };
  let celdasActuales = [];
  let temporizador;
  let vivo = true;
  let datosCapas = null;

  const kpiReportes = h('b', {}, '–');
  const kpiZona = h('b', {}, '–');
  const aviso = h('p', { class: 'ayuda-txt' });
  const selectorMun = h('select', { id: 'mun-inicio', 'aria-label': 'Municipio' }, estado.municipios.map((x) => h('option', { value: x.id, selected: x.id === m.id }, x.nombre)));
  selectorMun.addEventListener('change', () => { estado.elegirMunicipio(Number(selectorMun.value)); mapa.irA(estado.municipio, 15); cargar(); });

  const chips = [
    ['calor', 'Riesgo por hora', 'alerta'], ['reportes', 'Reportes', 'pin'], ['luces', 'Luminarias', 'luz'],
    ['camaras', 'Cámaras', 'cctv'], ['comercios', 'Comercios', 'tienda'], ['calles', 'Calles en rojo', 'ruta'],
  ].map(([clave, texto, ic]) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(capas[clave]) }, icono(ic), texto);
    b.addEventListener('click', () => { capas[clave] = !capas[clave]; b.setAttribute('aria-pressed', String(capas[clave])); aplicarCapas(); });
    return b;
  });

  const reloj = relojNocturno({ hora, alCambiar: (hr) => { estado.hora = hr; clearTimeout(temporizador); temporizador = setTimeout(() => cargarCalor(hr), 140); } });

  cont.append(h('div', { class: 'pila entra' },
    h('div', { class: 'fila entre' },
      h('div', {}, h('span', { class: 'etiqueta' }, icono('luna'), 'Mapa nocturno'), h('h2', {}, 'Dónde cuidarte, y cuándo')),
      h('span', { class: 'puntos-demo', title: 'Los puntos de seguridad y reportes iniciales son simulados para la demostración' }, 'Datos de demostración')),
    h('div', { class: 'campo' }, h('label', { for: 'mun-inicio' }, 'Municipio'), selectorMun),
    reloj,
    h('div', { class: 'leyenda', 'aria-hidden': 'true' }, 'Menos', h('i'), 'Más riesgo'),
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Capas del mapa' }, chips),
    h('div', { class: 'fila' },
      h('div', { class: 'kpi tarjeta', estilo: { flex: 1 } }, kpiReportes, h('span', {}, 'reportes activos')),
      h('div', { class: 'kpi tarjeta', estilo: { flex: 1 } }, kpiZona, h('span', {}, 'zonas en alerta a esta hora'))),
    aviso,
    h('a', { class: 'btn bloque', href: '#/ruta' }, icono('ruta'), 'Planear una ruta segura')));

  async function cargarCalor(hr) {
    try {
      const d = await api.get(`/mapa-calor?municipio_id=${estado.municipio.id}&hora=${hr}`);
      if (!vivo) return;
      tween(celdasActuales, d.celdas);
      celdasActuales = d.celdas;
      kpiReportes.textContent = d.total_reportes;
      kpiZona.textContent = d.celdas.filter((c) => c.intensidad > 0.5).length;
      aviso.textContent = d.aviso;
      if (capas.calles) cargarCalles(hr);
    } catch (e) { toast(e.message, 'error'); }
  }

  /** Transición suave entre dos mapas de calor (la mancha "se enciende" o se apaga al mover la luna). */
  function tween(antes, despues) {
    const clave = (c) => `${c.lat}:${c.lng}`;
    const previos = new Map(antes.map((c) => [clave(c), c.intensidad]));
    const hasta = new Map(despues.map((c) => [clave(c), c]));
    const todas = new Map([...antes.map((c) => [clave(c), c]), ...despues.map((c) => [clave(c), c])]);
    const t0 = performance.now();
    const paso = (t) => {
      if (!vivo) return;
      const p = Math.min(1, (t - t0) / 450);
      const e = 1 - (1 - p) ** 3;
      const lista = [];
      for (const [k, c] of todas) {
        const de = previos.get(k) ?? 0;
        const a = hasta.get(k)?.intensidad ?? 0;
        const v = de + (a - de) * e;
        if (v > 0.03) lista.push({ lat: c.lat, lng: c.lng, intensidad: v });
      }
      mapa.pintarCalor(lista);
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  async function cargarCalles(hr) {
    if (mapa.obtener().getZoom() < 15) { toast('Acércate un poco más para ver el riesgo calle por calle.'); return; }
    const b = mapa.obtener().getBounds();
    try {
      const d = await api.get(`/mapa-calor/calles?sur=${b.getSouth()}&oeste=${b.getWest()}&norte=${b.getNorth()}&este=${b.getEast()}&hora=${hr ?? estado.hora ?? horaActualColombia()}`);
      if (!vivo) return;
      if (!d.disponible) toast('El servicio de calles no responde ahora; te mostramos las manchas de calor.');
      mapa.pintarCalles(d.calles);
    } catch (e) { toast(e.message, 'error'); }
  }

  async function cargarReportes() {
    const r = await api.get(`/reportes?municipio_id=${estado.municipio.id}&limite=200`);
    if (!vivo) return;
    mapa.pintarReportes(capas.reportes ? r.reportes : [], {
      alAbrir: (rep, marcador) => {
        const cat = CATEGORIAS[rep.categoria];
        const nodo = h('div', { class: 'pila' },
          h('strong', {}, cat.etiqueta), h('span', { class: 'suave' }, `${rep.referencia} · ${rep.confirmaciones} confirmaciones`),
          rep.descripcion ? h('span', {}, rep.descripcion) : null,
          h('div', { class: 'fila' },
            rep.propia ? null : h('button', { class: 'btn chico', type: 'button', onclick: () => confirmarReporte(rep) }, 'La confirmo'),
            rep.propia ? null : h('button', { class: 'btn sec chico', type: 'button', onclick: () => denunciarReporte(rep) }, 'Denunciar')));
        mapa.popup(marcador, nodo);
      },
    });
  }

  async function cargarPois() {
    datosCapas ??= await api.get(`/capas/${estado.municipio.id}`);
    if (!vivo) return;
    mapa.pintarPois(datosCapas, capas);
  }

  function aplicarCapas() {
    mapa.mostrarCalor(capas.calor);
    cargarReportes().catch(() => {});
    cargarPois().catch(() => {});
    if (capas.calles) cargarCalles(); else mapa.limpiarCalles();
  }

  async function cargar() {
    datosCapas = null;
    mapa.limpiarRutas(); mapa.limpiarMarcadores();
    await cargarCalor(estado.hora ?? horaInicial());
    aplicarCapas();
  }

  const alMover = () => { if (capas.calles) { clearTimeout(temporizador); temporizador = setTimeout(() => cargarCalles(), 600); } };
  mapa.obtener().on('moveend', alMover);
  mapa.irA(m, 15);
  await cargar();

  return () => {
    vivo = false;
    clearTimeout(temporizador);
    mapa.obtener().off('moveend', alMover);
    mapa.mostrarCalor(false); mapa.limpiarCalles(); mapa.limpiarReportes(); mapa.pintarPois({ luminarias: [], luminarias_danadas: [], camaras: [], comercios: [], comercios_confirmados: [] }, {});
  };
}
