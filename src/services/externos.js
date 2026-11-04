// Integración con servicios externos de datos abiertos (OpenStreetMap):
//  - Nominatim  → geocodificación de puntos de referencia
//  - Overpass   → luminarias, cámaras y comercios reales (con horarios) y calles para el mapa de calor
//  - OSRM (foot)→ rutas peatonales candidatas
// Todos tienen tiempo límite, caché y un respaldo: la app sigue funcionando sin conexión.
import { config } from '../config.js';

const cache = new Map();
const TTL_MS = 6 * 3600_000;

function deCache(clave) {
  const e = cache.get(clave);
  if (e && Date.now() - e.t < TTL_MS) return e.v;
  cache.delete(clave);
  return undefined;
}
function aCache(clave, v) {
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  cache.set(clave, { t: Date.now(), v });
  return v;
}

async function pedir(url, opciones = {}) {
  if (!config.apis.habilitadas) throw new Error('APIs externas deshabilitadas');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), config.apis.timeoutMs);
  try {
    const r = await fetch(url, {
      ...opciones,
      signal: ctl.signal,
      headers: { 'User-Agent': config.apis.userAgent, Accept: 'application/json', ...opciones.headers },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

/** El servicio externo no respondió (o está deshabilitado): se distingue de "no hay resultados". */
export class ServicioNoDisponible extends Error {
  constructor(servicio) { super(`${servicio} no disponible`); this.servicio = servicio; }
}

// Nominatim exige máximo 1 consulta por segundo: las consultas se encolan y se espacian.
let cola = Promise.resolve();
let ultimaNominatim = 0;
function esperarTurno() {
  const turno = cola.then(async () => {
    const espera = ultimaNominatim + 1100 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaNominatim = Date.now();
  });
  cola = turno.catch(() => {});
  return turno;
}

async function geocodificarReal(texto, municipio) {
  const clave = `geo:${municipio.nombre}:${texto.toLowerCase()}`;
  const previo = deCache(clave);
  if (previo !== undefined) return previo;
  if (!config.apis.habilitadas) throw new ServicioNoDisponible('Nominatim');
  try {
    await esperarTurno();
    const d = 0.08; // ≈ 9 km alrededor del centro del municipio
    const caja = `${municipio.lng - d},${municipio.lat + d},${municipio.lng + d},${municipio.lat - d}`;
    const q = encodeURIComponent(`${texto}, ${municipio.nombre}, Cundinamarca, Colombia`);
    const datos = await pedir(`${config.apis.nominatim}/search?format=jsonv2&limit=5&countrycodes=co&viewbox=${caja}&bounded=1&q=${q}`);
    const resultado = datos.map((x) => ({ nombre: x.display_name, lat: Number(x.lat), lng: Number(x.lon) }));
    return aCache(clave, resultado);
  } catch {
    throw new ServicioNoDisponible('Nominatim');
  }
}

let geocodificador = geocodificarReal;
/** Permite sustituir el geocodificador (pruebas automáticas sin red). */
export function usarGeocodificador(fn) { geocodificador = fn ?? geocodificarReal; }
/** @returns {Promise<{nombre:string,lat:number,lng:number}[]>} lanza ServicioNoDisponible si el servicio falla */
export const geocodificar = (texto, municipio) => geocodificador(texto, municipio);

function parseHorario(oh) {
  if (!oh) return { abre: 8, cierra: 20, estimado: true };
  if (/24\/7/.test(oh)) return { abre: 0, cierra: 24, estimado: false };
  const m = oh.match(/(\d{1,2}):\d{2}\s*-\s*(\d{1,2}):\d{2}/);
  if (m) return { abre: Number(m[1]) % 24, cierra: Number(m[2]) % 24 || 24, estimado: false };
  return { abre: 8, cierra: 20, estimado: true };
}

/** Puntos de seguridad reales de OSM dentro de un cuadro. Devuelve null si el servicio no responde. */
export async function puntosOsm({ sur, oeste, norte, este }) {
  const r = (n) => n.toFixed(3);
  const clave = `osm:${r(sur)}:${r(oeste)}:${r(norte)}:${r(este)}`;
  const previo = deCache(clave);
  if (previo !== undefined) return previo;
  const caja = `${sur},${oeste},${norte},${este}`;
  const consulta = `[out:json][timeout:10];(
    node["highway"="street_lamp"](${caja});
    node["man_made"="surveillance"](${caja});
    node["shop"](${caja});
    node["amenity"~"pharmacy|restaurant|bar|cafe|fast_food|bank|fuel|police"](${caja});
  );out body 500;`;
  try {
    const datos = await pedir(config.apis.overpass, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(consulta)}`,
    });
    const luces = [];
    const camaras = [];
    const comercios = [];
    for (const e of datos.elements ?? []) {
      const p = { lat: e.lat, lng: e.lon, fuente: 'osm' };
      const t = e.tags ?? {};
      if (t.highway === 'street_lamp') luces.push(p);
      else if (t.man_made === 'surveillance') camaras.push(p);
      else comercios.push({ ...p, nombre: t.name ?? null, ...parseHorario(t.opening_hours) });
    }
    return aCache(clave, { luces, camaras, comercios });
  } catch {
    return null;
  }
}

/** Calles (ways) con geometría para pintar el riesgo por calle. */
export async function callesOsm({ sur, oeste, norte, este }) {
  const r = (n) => n.toFixed(3);
  const clave = `calles:${r(sur)}:${r(oeste)}:${r(norte)}:${r(este)}`;
  const previo = deCache(clave);
  if (previo !== undefined) return previo;
  const caja = `${sur},${oeste},${norte},${este}`;
  const consulta = `[out:json][timeout:10];way["highway"~"^(primary|secondary|tertiary|residential|pedestrian|footway|living_street|unclassified)$"](${caja});out geom 350;`;
  try {
    const datos = await pedir(config.apis.overpass, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(consulta)}`,
    });
    const calles = (datos.elements ?? [])
      .filter((e) => e.geometry?.length > 1)
      .map((e) => ({ id: e.id, nombre: e.tags?.name ?? null, coords: e.geometry.map((g) => ({ lat: g.lat, lng: g.lon })) }));
    return aCache(clave, calles);
  } catch {
    return null;
  }
}

/** Rutas peatonales. `vias` son puntos intermedios obligados. Devuelve [] si no hay servicio. */
export async function rutasPeatonales(origen, destino, vias = [], alternativas = false) {
  const puntos = [origen, ...vias, destino].map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const clave = `ruta:${puntos}:${alternativas}`;
  const previo = deCache(clave);
  if (previo !== undefined) return previo;
  try {
    const d = await pedir(`${config.apis.ruteo}/route/v1/foot/${puntos}?overview=full&geometries=geojson&alternatives=${alternativas}&steps=false`);
    const rutas = (d.routes ?? []).map((x) => ({
      coords: x.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distancia_m: Math.round(x.distance),
      duracion_s: Math.round(x.duration),
    }));
    return aCache(clave, rutas);
  } catch {
    return [];
  }
}
