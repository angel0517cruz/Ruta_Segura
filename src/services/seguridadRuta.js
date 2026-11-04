// Algoritmo de ruta segura.
//
// 1) Cada ruta candidata se muestrea cada 25 m.
// 2) En cada muestra se mide: luminarias cercanas, cámaras, comercios abiertos a esa hora y riesgo
//    histórico reportado (ponderado por hora, antigüedad y confirmaciones de la comunidad).
// 3) El puntaje 0-100 mezcla el promedio con el 20 % más débil: un solo tramo oscuro y desolado
//    no puede quedar "diluido" por diez tramos buenos.
// 4) Se elige por utilidad = seguridad − penalización por desvío, con tope de +60 % de distancia.
import { IndiceEspacial, longitudPolilinea, muestrearPolilinea } from '../../shared/geo.js';
import { comercioAbierto, esNoche, intensidad, pesoReporte } from './riesgo.js';

export const RADIOS = { luz: 45, camara: 70, comercio: 90, riesgo: 110, comunidad: 60 };
const PASO_M = 25;
const TOPE_DESVIO = 0.6;
const PENALIZACION_DESVIO = 45; // puntos que cuesta duplicar la distancia

/**
 * @param {{luces:any[], camaras:any[], comercios:any[], reportes:any[], rutasOk?:any[], luminariasDanadas?:any[], comerciosAbiertos?:any[]}} datos
 */
export function crearContexto(datos) {
  return {
    luces: new IndiceEspacial(datos.luces ?? []),
    camaras: new IndiceEspacial(datos.camaras ?? []),
    comercios: new IndiceEspacial(datos.comercios ?? []),
    reportes: new IndiceEspacial(datos.reportes ?? []),
    rutasOk: new IndiceEspacial(datos.rutasOk ?? []),
    danadas: new IndiceEspacial(datos.luminariasDanadas ?? []),
    abiertosAhora: new IndiceEspacial(datos.comerciosAbiertos ?? []),
  };
}

const acotar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/** Seguridad 0..1 de un punto concreto, con su desglose. */
export function seguridadEnPunto(p, ctx, hora, ahoraMs = Date.now()) {
  const noche = esNoche(hora);
  const luces = ctx.luces.cerca(p, RADIOS.luz).length;
  const danadas = ctx.danadas.cerca(p, RADIOS.luz).length;
  const camaras = ctx.camaras.cerca(p, RADIOS.camara).length;
  const comercios =
    ctx.comercios.cerca(p, RADIOS.comercio).filter((c) => comercioAbierto(c, hora)).length +
    ctx.abiertosAhora.cerca(p, RADIOS.comercio).length;
  const verificada = ctx.rutasOk.cerca(p, RADIOS.comunidad).length > 0;
  let suma = 0;
  for (const r of ctx.reportes.cerca(p, RADIOS.riesgo)) suma += pesoReporte(r, hora, ahoraMs);

  const luz = acotar(luces / 2 - danadas * 0.4);
  const cam = acotar(camaras);
  const com = acotar(comercios);
  const riesgo = intensidad(suma);

  // De noche la iluminación pesa 0,34; de día solo 0,12 (y se compensa con una base mayor para no castigar de más).
  const base = 0.12 + (noche ? 0 : 0.22) + (noche ? 0.34 : 0.12) * luz + 0.2 * cam + 0.3 * com + (verificada ? 0.06 : 0);
  const seguridad = acotar(base - 0.55 * riesgo - (danadas > 0 ? 0.12 : 0));
  return { seguridad, luz, cam, com, riesgo };
}

const nivel = (s) => (s >= 0.6 ? 'ALTO' : s >= 0.4 ? 'MEDIO' : 'BAJO');

export function evaluarRuta(coords, ctx, hora, ahoraMs = Date.now()) {
  const muestras = muestrearPolilinea(coords, PASO_M);
  const medidas = muestras.map((m) => ({ ...m, ...seguridadEnPunto(m, ctx, hora, ahoraMs) }));
  const promedio = (campo) => medidas.reduce((s, m) => s + m[campo], 0) / (medidas.length || 1);

  const ordenadas = medidas.map((m) => m.seguridad).sort((a, b) => a - b);
  const k = Math.max(1, Math.ceil(ordenadas.length * 0.2));
  const peores = ordenadas.slice(0, k).reduce((s, v) => s + v, 0) / k;
  const puntaje = Math.round(100 * (0.7 * promedio('seguridad') + 0.3 * peores));

  // Tramos de ~100 m para pintar la ruta por colores en el mapa.
  const tramos = [];
  const bloque = 4;
  for (let i = 0; i < medidas.length - 1; i += bloque) {
    const trozo = medidas.slice(i, Math.min(medidas.length, i + bloque + 1));
    const s = trozo.reduce((a, m) => a + m.seguridad, 0) / trozo.length;
    tramos.push({ coords: trozo.map(({ lat, lng }) => ({ lat, lng })), seguridad: Number(s.toFixed(2)), nivel: nivel(s) });
  }

  return {
    puntaje,
    distancia_m: Math.round(longitudPolilinea(coords)),
    desglose: {
      iluminacion: Math.round(100 * promedio('luz')),
      camaras: Math.round(100 * promedio('cam')),
      comercios: Math.round(100 * promedio('com')),
      riesgo: Math.round(100 * promedio('riesgo')),
    },
    tramos,
    tramo_critico: tramoCritico(medidas),
  };
}

function tramoCritico(medidas) {
  const m = medidas.reduce((peor, x) => (x.seguridad < peor.seguridad ? x : peor), medidas[0]);
  return { lat: m.lat, lng: m.lng, avance_m: Math.round(m.avance) };
}

/** Elige la ruta con mejor utilidad y etiqueta la más corta y la más segura. */
export function elegirRecomendada(evaluadas) {
  if (evaluadas.length === 0) return { rutas: [], recomendada: null };
  const dMin = Math.min(...evaluadas.map((r) => r.distancia_m));
  const validas = evaluadas.filter((r) => r.distancia_m <= dMin * (1 + TOPE_DESVIO));
  const utilidad = (r) => r.puntaje - PENALIZACION_DESVIO * Math.max(0, (r.distancia_m - dMin) / dMin);
  const mejor = validas.reduce((a, b) => (utilidad(b) > utilidad(a) ? b : a));
  const corta = evaluadas.reduce((a, b) => (b.distancia_m < a.distancia_m ? b : a));
  const rutas = evaluadas.map((r, i) => ({
    ...r,
    id: `r${i + 1}`,
    etiqueta: r === mejor ? 'MAS_SEGURA' : r === corta ? 'MAS_CORTA' : 'ALTERNA',
  }));
  // Si la más corta es también la recomendada, se informa tal cual (honestidad: no inventamos un desvío).
  const recomendada = rutas.find((r) => r.etiqueta === 'MAS_SEGURA').id;
  if (mejor === corta) rutas.find((r) => r.id === recomendada).etiqueta = 'MAS_SEGURA_Y_CORTA';
  return { rutas, recomendada };
}
