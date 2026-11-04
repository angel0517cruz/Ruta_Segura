// Caminata en curso: seguimiento local en el dispositivo, alertas de desvío y aportes rápidos.
import { api } from '../api.js';
import { estado } from '../estado.js';
import * as mapa from '../mapa.js';
import { anunciar, h, icono, metros, toast, vibrar } from '../ui.js';
import { puntoEnDistancia, MonitorDesvio, longitudPolilinea } from '/shared/geo.js';
import { seguirPosicion } from '../ubicacion.js';
import { TEXTO_VERIFICACION, verificar } from './acciones.js';
import { abrirPlaca } from './placa.js';

export async function render(cont, { ir }) {
  let viaje = estado.viaje;
  if (!viaje) viaje = (await api.get('/viajes/actual')).viaje;
  if (!viaje) { toast('No tienes una caminata en curso.'); ir('/ruta'); return null; }
  estado.viaje = viaje;

  const coords = viaje.ruta;
  const monitor = new MonitorDesvio(coords, { umbralM: 45, recuperaM: 25, consecutivos: 3 });
  const total = longitudPolilinea(coords);
  let posicion = coords[0];
  let enAlerta = false;
  let simulador = null;
  let pasoSim = 0;
  let desvioSim = -1;
  let pararGps = () => {};
  let terminado = false;
  let vivo = true;

  mapa.limpiarRutas(); mapa.limpiarMarcadores();
  mapa.pintarRuta({ coords, tramos: [{ coords, nivel: 'ALTO' }] });
  mapa.pin(coords[coords.length - 1], { color: '#e45cff', glifo: 'bandera', latir: true, titulo: 'Destino' });
  mapa.ajustarA(coords);

  const barra = h('div', { class: 'progreso-viaje', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0, 'aria-label': 'Avance de la caminata' }, h('div'));
  const texto = h('div', { class: 'estado-viaje ok', role: 'status' });
  const detalle = h('div', { class: 'fila entre suave' });
  const acciones = h('div', { class: 'pila' });
  const botonSim = h('button', { class: 'btn sec chico', type: 'button' }, icono('play'), 'Simular caminata');
  const botonDesvio = h('button', { class: 'btn sec chico', type: 'button' }, icono('alerta'), 'Simular desvío');

  function pintarEstado(r) {
    const pct = total ? Math.min(100, Math.round((r.avanceM / total) * 100)) : 0;
    barra.firstChild.style.setProperty('--p', `${pct}%`);
    barra.setAttribute('aria-valuenow', String(pct));
    detalle.replaceChildren(h('span', {}, `Faltan ${metros(r.restanteM)}`), h('span', {}, `${pct} % del camino`));
    if (r.estado === 'ALERTA') {
      texto.className = 'estado-viaje alerta';
      texto.replaceChildren(icono('alerta'), h('div', {}, h('strong', {}, 'Te alejaste de la ruta'), h('div', {}, `Estás a ${r.desviacionM} m del camino planeado.`)));
    } else if (r.estado === 'LLEGADA') {
      texto.className = 'estado-viaje ok';
      texto.replaceChildren(icono('bandera'), h('strong', {}, '¡Llegaste! Cuéntanos cómo estuvo el camino.'));
    } else {
      texto.className = 'estado-viaje ok';
      texto.replaceChildren(h('span', { class: 'punto-vivo' }), h('strong', {}, 'Vas por la ruta segura'));
    }
  }

  function procesar(pos) {
    posicion = pos;
    mapa.posicionYo(pos);
    mapa.obtener().panTo([pos.lat, pos.lng], { animate: true, duration: 0.6 });
    const r = monitor.actualizar(pos);
    if (r.estado === 'ALERTA' && !enAlerta) {
      enAlerta = true;
      document.getElementById('borde-alerta').classList.add('activo');
      vibrar([220, 100, 220, 100, 400]);
      anunciar(`Alerta: te alejaste ${r.desviacionM} metros de la ruta planeada.`);
      api.post(`/viajes/${viaje.id}/desvio`).catch(() => {});
      acciones.prepend(botonesAlerta);
    }
    if (r.estado === 'RECUPERADA') {
      enAlerta = false;
      document.getElementById('borde-alerta').classList.remove('activo');
      botonesAlerta.remove();
      toast('Volviste a la ruta. ¡Bien!');
    }
    if (r.estado === 'LLEGADA' && !terminado) { terminado = true; detenerSim(); document.getElementById('borde-alerta').classList.remove('activo'); vibrar(120); anunciar('Llegaste a tu destino.'); }
    pintarEstado(r);
  }

  async function recalcular() {
    try {
      const destino = coords[coords.length - 1];
      const r = await api.post('/rutas/planificar', { origen: { lat: posicion.lat, lng: posicion.lng }, destino });
      const nueva = r.rutas.find((x) => x.id === r.recomendada);
      const { viaje: nuevo } = await api.post('/viajes', { ruta: { coords: nueva.coords, puntaje: nueva.puntaje }, origen_texto: 'Mi posición', destino_texto: viaje.destino_texto ?? undefined });
      estado.viaje = nuevo;
      document.getElementById('borde-alerta').classList.remove('activo');
      toast('Ruta recalculada desde tu posición.');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (e) { toast(e.message, 'error'); }
  }

  const botonesAlerta = h('div', { class: 'fila' },
    h('button', { class: 'btn', type: 'button', onclick: recalcular }, icono('ruta'), 'Recalcular desde aquí'),
    h('button', { class: 'btn sec', type: 'button', onclick: () => { document.getElementById('borde-alerta').classList.remove('activo'); botonesAlerta.remove(); } }, 'Estoy bien, silenciar'));

  // ── Simulador (demostración sin salir a la calle)
  function detenerSim() { clearInterval(simulador); simulador = null; botonSim.replaceChildren(icono('play'), 'Simular caminata'); }
  function tick() {
    pasoSim += 1;
    const avance = Math.min(total, pasoSim * 13);
    let p = puntoEnDistancia(coords, avance);
    if (desvioSim >= 0) {
      const a = puntoEnDistancia(coords, Math.max(0, avance - 4));
      const b = puntoEnDistancia(coords, Math.min(total, avance + 4));
      const dx = (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180) * 111320;
      const dy = (b.lat - a.lat) * 111320;
      const n = Math.hypot(dx, dy) || 1;
      const lateral = 95 * Math.max(0, Math.min(1, desvioSim / 3, (11 - desvioSim) / 3));
      p = { lat: p.lat + ((dx / n) * lateral) / 111320, lng: p.lng + ((-dy / n) * lateral) / (111320 * Math.cos((p.lat * Math.PI) / 180)) };
      desvioSim += 1;
      if (desvioSim > 11) desvioSim = -1;
    }
    procesar(p);
  }
  botonSim.addEventListener('click', () => {
    if (simulador) return detenerSim();
    pararGps(); pasoSim = Math.max(0, Math.round(monitor.actualizar(posicion).avanceM / 13));
    simulador = setInterval(tick, 650);
    botonSim.replaceChildren(icono('cerrar'), 'Detener simulación');
    toast('Simulación activa: la posición es simulada.');
  });
  botonDesvio.addEventListener('click', () => {
    if (!simulador) botonSim.click();
    desvioSim = 0;
  });

  // ── Aportes rápidos
  const chipsAporte = Object.entries(TEXTO_VERIFICACION).map(([tipo, txt]) => {
    const ic = { RUTA_OK: 'escudo', LUMINARIA_DANADA: 'luz', COMERCIO_ABIERTO: 'tienda' }[tipo];
    return h('button', { class: 'chip', type: 'button', onclick: () => verificar(tipo, posicion) }, icono(ic), txt);
  });

  async function terminar(estadoFinal) {
    try {
      await api.post(`/viajes/${viaje.id}/${estadoFinal === 'FINALIZADO' ? 'finalizar' : 'cancelar'}`);
      estado.viaje = null;
      document.getElementById('borde-alerta').classList.remove('activo');
      toast(estadoFinal === 'FINALIZADO' ? 'Caminata terminada. Tu placa temporal se borrará pronto.' : 'Caminata cancelada.');
      ir('/mapa');
    } catch (e) { toast(e.message, 'error'); }
  }

  const fab = h('button', { class: 'btn fab-taxi', type: 'button', 'aria-label': 'Registrar placa del taxi', onclick: () => abrirPlaca(viaje) }, icono('taxi'), 'Taxi');

  acciones.append(
    h('div', { class: 'pila' }, h('span', { class: 'etiqueta' }, icono('estrella'), 'Aporta mientras caminas'), h('div', { class: 'chips' }, chipsAporte)));

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('escudo'), `Caminata en curso · puntaje ${viaje.puntaje}`), h('h2', {}, viaje.destino_texto ? `Hacia ${viaje.destino_texto}` : 'Tu caminata')),
    texto, barra, detalle, acciones,
    h('div', { class: 'fila' }, botonSim, botonDesvio),
    h('p', { class: 'ayuda-txt' }, 'Tu posición se procesa solo en este dispositivo. Nova no te rastrea ni la comparte con nadie.'),
    h('div', { class: 'fila' },
      h('button', { class: 'btn', type: 'button', onclick: () => terminar('FINALIZADO') }, icono('check'), 'Terminar caminata'),
      h('button', { class: 'btn sec', type: 'button', onclick: () => { if (window.confirm('¿Cancelar esta caminata?')) terminar('CANCELADO'); } }, 'Cancelar'))));
  document.body.append(fab);

  pintarEstado(monitor.actualizar(coords[0]));
  mapa.posicionYo(coords[0]);
  pararGps = seguirPosicion((p) => { if (vivo && !simulador) procesar(p); }, () => toast('No pudimos usar el GPS. Puedes probar con “Simular caminata”.'));

  return () => {
    vivo = false;
    detenerSim(); pararGps(); fab.remove();
    document.getElementById('borde-alerta').classList.remove('activo');
    mapa.quitarYo(); mapa.limpiarRutas(); mapa.limpiarMarcadores();
  };
}
