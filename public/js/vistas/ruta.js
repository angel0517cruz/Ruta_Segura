// Planificador de ruta segura: compara trayectos y explica por qué recomienda uno.
import { api } from '../api.js';
import { estado, horaInicial } from '../estado.js';
import * as mapa from '../mapa.js';
import { relojNocturno } from '../reloj.js';
import { anillo, h, icono, metros, minutos, nivelDe, textoNivel, toast, ayuda } from '../ui.js';
import { posicionActual } from '../ubicacion.js';

const ETIQUETAS = { MAS_SEGURA: 'Más segura', MAS_SEGURA_Y_CORTA: 'Segura y corta', MAS_CORTA: 'Más corta', ALTERNA: 'Alterna' };

export async function render(cont, { ir }) {
  const mun = estado.municipio;
  const punto = { origen: null, destino: null };
  let eligiendo = null; // 'origen' | 'destino' | null
  let resultado = null;
  let seleccionada = null;
  let hora = estado.hora ?? horaInicial();
  let vivo = true;

  mapa.irA(mun, 15);
  mapa.limpiarRutas(); mapa.limpiarMarcadores();

  const sugerencias = { origen: h('div', { class: 'chips' }), destino: h('div', { class: 'chips' }) };
  const entrada = {
    origen: h('input', { id: 'origen', placeholder: 'Ej. Parque principal', autocomplete: 'off', 'aria-describedby': 'sug-origen' }),
    destino: h('input', { id: 'destino', placeholder: 'Ej. Universidad, casa, terminal', autocomplete: 'off', 'aria-describedby': 'sug-destino' }),
  };
  const estadoBusqueda = h('div', { role: 'status', 'aria-live': 'polite' });
  const resultados = h('div', { class: 'pila' });
  const botonBuscar = h('button', { class: 'btn bloque', type: 'button' }, icono('escudo'), 'Buscar la ruta más segura');

  function colocar(cual, p, texto) {
    punto[cual] = { lat: p.lat, lng: p.lng, texto };
    if (texto) entrada[cual].value = texto;
    sugerencias[cual].replaceChildren();
    mapa.limpiarMarcadores();
    if (punto.origen) mapa.pin(punto.origen, { color: '#9b7bff', glifo: 'ubicacion', titulo: 'Origen' });
    if (punto.destino) mapa.pin(punto.destino, { color: '#e45cff', glifo: 'bandera', latir: true, titulo: 'Destino' });
    if (punto.origen && punto.destino) mapa.ajustarA([punto.origen, punto.destino]);
    else mapa.irA(p, 16);
  }

  async function buscarLugar(cual) {
    const q = entrada[cual].value.trim();
    if (q.length < 3) return;
    sugerencias[cual].replaceChildren(h('span', { class: 'suave' }, 'Buscando…'));
    try {
      const { resultados: lista } = await api.get(`/geocodificar?q=${encodeURIComponent(q)}&municipio_id=${mun.id}`);
      if (!lista.length) {
        sugerencias[cual].replaceChildren(h('span', { class: 'ayuda-txt' }, 'No encontramos ese lugar. Toca “Elegir en el mapa”.'));
        return;
      }
      sugerencias[cual].replaceChildren(...lista.slice(0, 4).map((l) => h('button', { class: 'chip', type: 'button', onclick: () => colocar(cual, l, l.nombre.split(',').slice(0, 2).join(',')) }, icono('pin'), l.nombre.split(',').slice(0, 2).join(','))));
    } catch (e) { sugerencias[cual].replaceChildren(h('span', { class: 'ayuda-txt' }, e.message)); }
  }

  function elegirEnMapa(cual) {
    eligiendo = cual;
    mapa.cursorElegir(true);
    estadoBusqueda.replaceChildren(h('div', { class: 'aviso info' }, icono('pin'), `Toca el mapa para marcar el ${cual === 'origen' ? 'punto de partida' : 'destino'}.`));
    mapa.alClic((p) => {
      if (!eligiendo) return;
      colocar(eligiendo, p, `Punto en el mapa (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`);
      eligiendo = null; mapa.sinClic(); estadoBusqueda.replaceChildren();
    });
  }

  const campoLugar = (cual, etiqueta, ic) => h('div', { class: 'campo' },
    h('label', { for: cual }, icono(ic), etiqueta),
    h('div', { class: 'fila', estilo: { 'flex-wrap': 'nowrap' } },
      entrada[cual],
      cual === 'origen' ? h('button', { class: 'icono-btn', type: 'button', 'aria-label': 'Usar mi ubicación', title: 'Usar mi ubicación', onclick: async () => { try { const p = await posicionActual(); colocar('origen', p, 'Mi ubicación'); } catch (e) { toast(e.message, 'error'); } } }, icono('ubicacion')) : null,
      h('button', { class: 'icono-btn', type: 'button', 'aria-label': `Elegir ${cual} en el mapa`, title: 'Elegir en el mapa', onclick: () => elegirEnMapa(cual) }, icono('pin'))),
    h('div', { id: `sug-${cual}`, 'aria-live': 'polite' }, sugerencias[cual]));

  for (const cual of ['origen', 'destino']) {
    entrada[cual].addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); buscarLugar(cual); } });
    entrada[cual].addEventListener('blur', () => { if (!punto[cual] || entrada[cual].value !== punto[cual].texto) buscarLugar(cual); });
  }

  function ejemplo() {
    const o = { lat: mun.lat - 0.0025, lng: mun.lng - 0.0065 };
    const d = { lat: mun.lat + 0.0042, lng: mun.lng + 0.0068 };
    colocar('origen', o, 'Ejemplo: sector occidental');
    colocar('destino', d, 'Ejemplo: sector oriental');
    entrada.origen.value = 'Ejemplo: sector occidental'; entrada.destino.value = 'Ejemplo: sector oriental';
  }

  async function buscar() {
    if (!punto.origen || !punto.destino) { toast('Elige el origen y el destino primero.', 'error'); return; }
    botonBuscar.disabled = true;
    resultados.replaceChildren(h('div', { class: 'tarjeta fila' }, h('span', { class: 'punto-vivo', style: 'color:var(--lila-300)' }), h('span', {}, 'Tejiendo tu hilo de luz: comparando luminarias, cámaras y comercios abiertos…')));
    try {
      resultado = await api.post('/rutas/planificar', { origen: punto.origen, destino: punto.destino, hora });
      if (!vivo) return;
      seleccionada = resultado.rutas.find((r) => r.id === resultado.recomendada);
      pintarResultados();
    } catch (e) {
      resultados.replaceChildren(h('div', { class: 'aviso peligro', role: 'alert' }, icono('alerta'), e.message));
    } finally { botonBuscar.disabled = false; }
  }

  function explicacion(r, corta) {
    if (r.id === corta.id) return 'Es el trayecto más directo.';
    const extra = r.distancia_m - corta.distancia_m;
    const pct = Math.round((extra / corta.distancia_m) * 100);
    const mejora = r.puntaje - corta.puntaje;
    if (mejora <= 0) return `Es ${metros(extra)} más larga (+${pct} %) y no mejora la seguridad.`;
    return `Camina ${metros(extra)} más (+${pct} %) y gana ${mejora} puntos de seguridad${r.desglose.comercios > corta.desglose.comercios + 5 ? ', con más comercios abiertos' : ''}${r.desglose.iluminacion > corta.desglose.iluminacion + 5 ? ' y mejor iluminación' : ''}.`;
  }

  function pintarMapa() {
    mapa.limpiarRutas();
    for (const r of resultado.rutas) if (r.id !== seleccionada.id) mapa.pintarRuta(r, { activa: false });
    mapa.pintarRuta(seleccionada, { activa: true });
    mapa.ajustarA(seleccionada.coords);
    if (seleccionada.tramo_critico && seleccionada.puntaje < 70) {
      mapa.pin(seleccionada.tramo_critico, { color: '#ff6f9c', glifo: 'alerta', latir: true, titulo: 'Tramo con menos señales de seguridad' });
    }
  }

  function pintarResultados() {
    const corta = resultado.rutas.reduce((a, b) => (b.distancia_m < a.distancia_m ? b : a));
    const tarjetas = resultado.rutas.map((r) => {
      const nivel = nivelDe(r.puntaje);
      const bar = (txt, v, clase = '') => h('div', { class: `barra ${clase}` }, h('span', {}, txt), h('i', { estilo: { '--v': `${Math.max(3, v)}%` }, role: 'img', 'aria-label': `${txt}: ${v} %` }));
      const b = h('button', { class: 'ruta-card', type: 'button', 'aria-pressed': String(r.id === seleccionada.id), 'aria-label': `${ETIQUETAS[r.etiqueta]}, puntaje ${r.puntaje} de 100, ${metros(r.distancia_m)}` },
        anillo(r.puntaje, nivel),
        h('div', {},
          h('div', { class: 'fila entre' }, h('strong', {}, ETIQUETAS[r.etiqueta]), h('span', { class: 'suave' }, `${metros(r.distancia_m)} · ${minutos(r.duracion_s ?? r.distancia_m / 1.35)}`)),
          h('div', { class: `etiqueta nivel-${nivel}` }, textoNivel(r.puntaje)),
          h('div', { class: 'barras' }, bar('Luz', r.desglose.iluminacion), bar('Cámaras', r.desglose.camaras), bar('Comercios', r.desglose.comercios), bar('Riesgo', r.desglose.riesgo, 'riesgo'))));
      b.addEventListener('click', () => { seleccionada = r; pintarResultados(); pintarMapa(); });
      return b;
    });
    resultados.replaceChildren(...[
      resultado.aviso ? h('div', { class: 'aviso' }, icono('alerta'), resultado.aviso) : null,
      h('div', { class: 'pila entra' }, ...tarjetas),
      h('div', { class: 'aviso info', 'aria-live': 'polite' }, icono('escudo'), explicacion(seleccionada, corta)),
      h('button', { class: 'btn bloque', type: 'button', onclick: iniciar }, icono('play'), 'Empezar caminata con alertas'),
      h('p', { class: 'ayuda-txt' }, `Datos: ${resultado.fuentes.map((f) => (f === 'openstreetmap' ? 'OpenStreetMap' : 'base de Luma')).join(' + ')}. Ninguna ruta garantiza tu seguridad: confía en lo que ves y sientes.`)].filter(Boolean));
    pintarMapa();
  }

  async function iniciar() {
    try {
      const { viaje } = await api.post('/viajes', {
        ruta: { coords: seleccionada.coords, puntaje: seleccionada.puntaje },
        origen_texto: punto.origen.texto?.slice(0, 120), destino_texto: punto.destino.texto?.slice(0, 120),
      });
      estado.viaje = viaje;
      ir('/viaje');
    } catch (e) { toast(e.message, 'error'); }
  }

  botonBuscar.addEventListener('click', buscar);

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('ruta'), `Navegación inteligente · ${mun.nombre}`), h('h2', {}, 'Elige tu camino')),
    h('div', { class: 'fila' }, h('button', { class: 'chip', type: 'button', onclick: ejemplo }, icono('play'), 'Probar con un trayecto de ejemplo'), ayuda('Luma puntúa cada tramo con luminarias, cámaras, comercios abiertos a tu hora y reportes de la comunidad. Prioriza la seguridad, sin pasar de +60 % de distancia.')),
    campoLugar('origen', 'Desde', 'ubicacion'),
    campoLugar('destino', 'Hasta', 'bandera'),
    estadoBusqueda,
    relojNocturno({ hora, compacto: true, alCambiar: (hr) => { hora = hr; estado.hora = hr; } }),
    botonBuscar,
    resultados));

  return () => { vivo = false; mapa.sinClic(); mapa.limpiarRutas(); mapa.limpiarMarcadores(); };
}
