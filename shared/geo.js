// Geometría compartida: la usan el servidor (puntaje de rutas) y el navegador (alertas de desvío).
// Sin dependencias, módulo ES puro.

export const RADIO_TIERRA_M = 6371008.8;
const rad = (g) => (g * Math.PI) / 180;

/** Distancia Haversine en metros entre dos puntos {lat, lng}. */
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Proyección equirrectangular local (válida para tramos de pocos km): metros respecto a una referencia.
function aMetros(p, ref) {
  return {
    x: rad(p.lng - ref.lng) * RADIO_TIERRA_M * Math.cos(rad(ref.lat)),
    y: rad(p.lat - ref.lat) * RADIO_TIERRA_M,
  };
}

/** Distancia (m) de un punto a un segmento a-b, y la fracción t (0..1) del punto más cercano. */
export function distanciaASegmento(p, a, b) {
  const pa = aMetros(p, a);
  const ba = aMetros(b, a);
  const largo2 = ba.x * ba.x + ba.y * ba.y;
  let t = largo2 === 0 ? 0 : (pa.x * ba.x + pa.y * ba.y) / largo2;
  t = Math.max(0, Math.min(1, t));
  const dx = pa.x - ba.x * t;
  const dy = pa.y - ba.y * t;
  return { dist: Math.hypot(dx, dy), t };
}

/** Distancia mínima de un punto a una polilínea [{lat,lng}...]. Devuelve también el avance acumulado en metros. */
export function distanciaAPolilinea(p, linea) {
  if (linea.length === 0) return { dist: Infinity, avance: 0, indice: 0 };
  if (linea.length === 1) return { dist: haversine(p, linea[0]), avance: 0, indice: 0 };
  let mejor = { dist: Infinity, avance: 0, indice: 0 };
  let acumulado = 0;
  for (let i = 0; i < linea.length - 1; i++) {
    const largo = haversine(linea[i], linea[i + 1]);
    const { dist, t } = distanciaASegmento(p, linea[i], linea[i + 1]);
    if (dist < mejor.dist) mejor = { dist, avance: acumulado + largo * t, indice: i };
    acumulado += largo;
  }
  return mejor;
}

export function longitudPolilinea(linea) {
  let total = 0;
  for (let i = 0; i < linea.length - 1; i++) total += haversine(linea[i], linea[i + 1]);
  return total;
}

/** Remuestrea una polilínea cada `paso` metros. Devuelve [{lat,lng,avance}]. */
export function muestrearPolilinea(linea, paso = 25) {
  if (linea.length === 0) return [];
  const salida = [{ ...linea[0], avance: 0 }];
  let acumulado = 0;
  let siguiente = paso;
  for (let i = 0; i < linea.length - 1; i++) {
    const a = linea[i];
    const b = linea[i + 1];
    const largo = haversine(a, b);
    while (siguiente <= acumulado + largo && largo > 0) {
      const t = (siguiente - acumulado) / largo;
      salida.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, avance: siguiente });
      siguiente += paso;
    }
    acumulado += largo;
  }
  const ultimo = linea[linea.length - 1];
  if (salida[salida.length - 1].avance < acumulado) salida.push({ ...ultimo, avance: acumulado });
  return salida;
}

/** Punto a `metros` del inicio de la polilínea. */
export function puntoEnDistancia(linea, metros) {
  let acumulado = 0;
  for (let i = 0; i < linea.length - 1; i++) {
    const largo = haversine(linea[i], linea[i + 1]);
    if (acumulado + largo >= metros && largo > 0) {
      const t = (metros - acumulado) / largo;
      return { lat: linea[i].lat + (linea[i + 1].lat - linea[i].lat) * t, lng: linea[i].lng + (linea[i + 1].lng - linea[i].lng) * t };
    }
    acumulado += largo;
  }
  return { ...linea[linea.length - 1] };
}

/** Índice espacial en rejilla: consulta rápida de puntos cercanos sin librerías. */
export class IndiceEspacial {
  constructor(puntos = [], celdaM = 120) {
    this.celdaM = celdaM;
    this.celdas = new Map();
    for (const p of puntos) this.agregar(p);
  }
  #clave(lat, lng) {
    const gLat = this.celdaM / 111320;
    const gLng = this.celdaM / (111320 * Math.cos(rad(lat || 4.9)));
    return `${Math.floor(lat / gLat)}:${Math.floor(lng / gLng)}`;
  }
  agregar(p) {
    const k = this.#clave(p.lat, p.lng);
    const lista = this.celdas.get(k);
    if (lista) lista.push(p);
    else this.celdas.set(k, [p]);
  }
  /** Puntos a menos de `radioM` metros de `centro`. */
  cerca(centro, radioM) {
    const pasos = Math.ceil(radioM / this.celdaM);
    const gLat = this.celdaM / 111320;
    const gLng = this.celdaM / (111320 * Math.cos(rad(centro.lat)));
    const baseLat = Math.floor(centro.lat / gLat);
    const baseLng = Math.floor(centro.lng / gLng);
    const salida = [];
    for (let i = -pasos; i <= pasos; i++) {
      for (let j = -pasos; j <= pasos; j++) {
        const lista = this.celdas.get(`${baseLat + i}:${baseLng + j}`);
        if (!lista) continue;
        for (const p of lista) if (haversine(centro, p) <= radioM) salida.push(p);
      }
    }
    return salida;
  }
}

/**
 * Monitor de desvío de ruta. Una alerta exige `consecutivos` lecturas seguidas fuera del umbral
 * (evita falsos positivos por el ruido del GPS) y una lectura dentro del margen interior para recuperarse.
 */
export class MonitorDesvio {
  constructor(ruta, { umbralM = 45, recuperaM = 25, consecutivos = 3 } = {}) {
    this.ruta = ruta;
    this.umbralM = umbralM;
    this.recuperaM = recuperaM;
    this.consecutivos = consecutivos;
    this.fuera = 0;
    this.enAlerta = false;
    this.largoTotal = longitudPolilinea(ruta);
  }
  /** @returns {{estado:'EN_RUTA'|'ALERTA'|'RECUPERADA'|'LLEGADA', desviacionM:number, avanceM:number, restanteM:number}} */
  actualizar(posicion) {
    const { dist, avance } = distanciaAPolilinea(posicion, this.ruta);
    const restanteM = Math.max(0, this.largoTotal - avance);
    let estado = this.enAlerta ? 'ALERTA' : 'EN_RUTA';
    if (dist > this.umbralM) {
      this.fuera += 1;
      if (this.fuera >= this.consecutivos && !this.enAlerta) {
        this.enAlerta = true;
        estado = 'ALERTA';
      }
    } else {
      this.fuera = 0;
      if (this.enAlerta && dist <= this.recuperaM) {
        this.enAlerta = false;
        estado = 'RECUPERADA';
      }
    }
    if (restanteM < 20 && !this.enAlerta) estado = 'LLEGADA';
    return { estado, desviacionM: Math.round(dist), avanceM: Math.round(avance), restanteM: Math.round(restanteM) };
  }
}

/** Hora (0-23) actual en Colombia, independiente de la zona del servidor. */
export function horaColombia(fecha = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }).format(fecha)) % 24;
}

/** Distancia circular entre horas (0-12). */
export function distanciaHoras(a, b) {
  const d = Math.abs(a - b) % 24;
  return Math.min(d, 24 - d);
}
