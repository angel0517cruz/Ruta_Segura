// Envoltorio de Leaflet: mapa oscuro, mapa de calor animado, "hilo de luz" para rutas y marcadores.
import { icono, iconoHtml, CATEGORIAS } from './ui.js';

const L = window.L;
let mapa;
const capas = { rutas: L.layerGroup(), marcadores: L.layerGroup(), pois: L.layerGroup(), reportes: L.layerGroup(), calles: L.layerGroup(), yo: L.layerGroup() };
let calor;

/** Capa de canvas que dibuja manchas de riesgo que "respiran". */
const CapaCalor = L.Layer.extend({
  initialize() { this._celdas = []; this._t = 0; },
  onAdd(map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'capa-calor leaflet-zoom-hide');
    map.getPanes().overlayPane.appendChild(this._canvas);
    map.on('moveend zoomend resize', this._reiniciar, this);
    this._reiniciar();
    this._animar();
  },
  onRemove(map) {
    cancelAnimationFrame(this._raf);
    map.off('moveend zoomend resize', this._reiniciar, this);
    this._canvas.remove();
  },
  establecer(celdas) { this._celdas = celdas; this._dibujar(); },
  _reiniciar() {
    const t = this._map.getSize();
    this._canvas.width = t.x;
    this._canvas.height = t.y;
    L.DomUtil.setPosition(this._canvas, this._map.containerPointToLayerPoint([0, 0]));
    this._dibujar();
  },
  _animar() {
    let ultimo = 0;
    const paso = (ahora) => {
      if (ahora - ultimo > 50) { this._t = ahora / 1000; this._dibujar(); ultimo = ahora; }
      this._raf = requestAnimationFrame(paso);
    };
    this._raf = requestAnimationFrame(paso);
  },
  _dibujar() {
    if (!this._map) return;
    const ctx = this._canvas.getContext('2d');
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    const zoom = this._map.getZoom();
    for (const c of this._celdas) {
      const p = this._map.latLngToContainerPoint([c.lat, c.lng]);
      const mPorPx = (40075016.686 * Math.cos((c.lat * Math.PI) / 180)) / 2 ** (zoom + 8);
      const respiro = 1 + 0.07 * Math.sin(this._t * 1.6 + c.lat * 900);
      const r = (190 / mPorPx) * respiro * (0.8 + 0.5 * c.intensidad);
      if (p.x < -r || p.y < -r || p.x > this._canvas.width + r || p.y > this._canvas.height + r) continue;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      const i = c.intensidad;
      const [r1, g1, b1] = i > 0.66 ? [255, 77, 109] : i > 0.4 ? [228, 92, 255] : [182, 156, 255];
      g.addColorStop(0, `rgba(${r1},${g1},${b1},${0.62 * i + 0.1})`);
      g.addColorStop(0.55, `rgba(${r1},${g1},${b1},${0.26 * i})`);
      g.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});

export function iniciarMapa(centro) {
  mapa = L.map('mapa', { zoomControl: false, attributionControl: true, zoomSnap: 0.5, minZoom: 10, maxZoom: 19, keyboard: true }).setView([centro.lat, centro.lng], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);
  L.control.zoom({ position: 'topright' }).addTo(mapa);
  calor = new CapaCalor();
  for (const c of [capas.calles, capas.pois, capas.reportes, capas.rutas, capas.marcadores, capas.yo]) c.addTo(mapa);
  return mapa;
}

export const obtener = () => mapa;
export const irA = (p, zoom = 15) => mapa.flyTo([p.lat, p.lng], zoom, { duration: 1.1 });

function relleno() {
  const ancho = window.innerWidth;
  const panel = document.getElementById('panel');
  if (!panel || panel.hidden) return { sup: [40, 40], inf: [40, 40] };
  if (ancho >= 900) return { sup: [470, 40], inf: [60, 90] };
  return { sup: [30, 70], inf: [30, Math.min(panel.offsetHeight, window.innerHeight * 0.6) + 90] };
}
export function ajustarA(puntos) {
  if (!puntos.length) return;
  const { sup, inf } = relleno();
  mapa.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lng])), { paddingTopLeft: sup, paddingBottomRight: inf, maxZoom: 17, duration: 1 });
}

export function alClic(fn) { mapa.on('click', (e) => fn({ lat: e.latlng.lat, lng: e.latlng.lng })); }
export function sinClic() { mapa.off('click'); mapa.getContainer().style.cursor = ''; }
export function cursorElegir(on) { mapa.getContainer().style.cursor = on ? 'crosshair' : ''; }

// ── Calor
export function mostrarCalor(on) { if (on && !mapa.hasLayer(calor)) calor.addTo(mapa); if (!on && mapa.hasLayer(calor)) mapa.removeLayer(calor); }
export function pintarCalor(celdas) { calor.establecer(celdas); }

export function pintarCalles(calles) {
  capas.calles.clearLayers();
  for (const c of calles) {
    const t = Math.min(1, c.riesgo);
    const color = t > 0.66 ? '#ff4d6d' : t > 0.4 ? '#e45cff' : '#b69cff';
    const linea = L.polyline(c.coords.map((p) => [p.lat, p.lng]), { color, weight: 3 + 4 * t, opacity: 0.55 + 0.4 * t, className: t > 0.55 ? 'calle-roja' : '', interactive: false });
    capas.calles.addLayer(linea);
  }
}
export const limpiarCalles = () => capas.calles.clearLayers();

// ── Rutas: "hilo de luz"
const COLOR_NIVEL = { ALTO: '#e6dcff', MEDIO: '#ffc971', BAJO: '#ff6f9c' };
export function limpiarRutas() { capas.rutas.clearLayers(); }
export function pintarRuta(ruta, { activa = true } = {}) {
  const ll = (p) => [p.lat, p.lng];
  if (!activa) {
    capas.rutas.addLayer(L.polyline(ruta.coords.map(ll), { color: '#9b7bff', weight: 4, opacity: 0.4, dashArray: '2 9', lineCap: 'round', interactive: false }));
    return;
  }
  capas.rutas.addLayer(L.polyline(ruta.coords.map(ll), { color: '#7c4dff', weight: 18, opacity: 0.22, className: 'hilo-luz', interactive: false }));
  for (const t of ruta.tramos) {
    const baja = t.nivel === 'BAJO';
    capas.rutas.addLayer(L.polyline(t.coords.map(ll), { color: COLOR_NIVEL[t.nivel], weight: 6, opacity: 0.95, className: 'hilo-luz', dashArray: baja ? '10 8' : t.nivel === 'MEDIO' ? '16 5' : null, interactive: false }));
  }
  capas.rutas.addLayer(L.polyline(ruta.coords.map(ll), { color: '#ffffff', weight: 2, opacity: 0.85, dashArray: '4 28', className: 'hilo-luz hilo-flujo', interactive: false }));
}

// ── Marcadores
export function pin({ lat, lng }, { color = '#7c4dff', glifo = 'pin', latir = false, titulo = '' } = {}) {
  const m = L.marker([lat, lng], {
    title: titulo, keyboard: true,
    icon: L.divIcon({ className: '', iconSize: [34, 34], iconAnchor: [17, 34], html: `<div class="pin ${latir ? 'latir' : ''}" style="--c:${color}"><span>${iconoHtml(glifo)}</span></div>` }),
  });
  capas.marcadores.addLayer(m);
  return m;
}
export const limpiarMarcadores = () => capas.marcadores.clearLayers();

let marcadorYo;
export function posicionYo(p) {
  if (!marcadorYo) {
    marcadorYo = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: '<div class="yo"></div>' }), interactive: false, zIndexOffset: 1000 });
    capas.yo.addLayer(marcadorYo);
  } else marcadorYo.setLatLng([p.lat, p.lng]);
}
export function quitarYo() { capas.yo.clearLayers(); marcadorYo = null; }

// ── POIs y reportes
export function pintarPois(datos, visibles) {
  capas.pois.clearLayers();
  const dibujar = (lista, color, extra = '') => {
    for (const p of lista) capas.pois.addLayer(L.marker([p.lat, p.lng], { interactive: false, icon: L.divIcon({ className: '', iconSize: [12, 12], html: `<div class="punto-poi ${extra}" style="--c:${color}"></div>` }) }));
  };
  if (visibles.luces) { dibujar(datos.luminarias, '#e6dcff'); dibujar(datos.luminarias_danadas, '#ff6f9c', 'danada'); }
  if (visibles.camaras) dibujar(datos.camaras, '#7ef0ff');
  if (visibles.comercios) { dibujar(datos.comercios, '#ffc971'); dibujar(datos.comercios_confirmados, '#86f0d0'); }
}

export function pintarReportes(reportes, { alAbrir } = {}) {
  capas.reportes.clearLayers();
  for (const r of reportes) {
    const cat = CATEGORIAS[r.categoria];
    const m = L.marker([r.lat, r.lng], {
      title: `${cat.etiqueta}: ${r.referencia}`, keyboard: true,
      icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 26], html: `<div class="pin chico" style="--c:${cat.color}"><span>${iconoHtml(cat.icono)}</span></div>` }),
    });
    if (alAbrir) m.on('click', () => alAbrir(r, m));
    capas.reportes.addLayer(m);
  }
}
export const limpiarReportes = () => capas.reportes.clearLayers();

export function popup(marcador, nodo) { marcador.bindPopup(nodo, { closeButton: true, maxWidth: 260 }).openPopup(); }
export { icono };
