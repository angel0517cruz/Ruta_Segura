// Generación de rutas candidatas: la ruta directa + variantes que pasan por "atractores de seguridad"
// (zonas con más luminarias, cámaras y comercios abiertos dentro de un corredor alrededor del trayecto).
import { haversine, IndiceEspacial, longitudPolilinea, muestrearPolilinea } from '../../shared/geo.js';
import { rutasPeatonales } from './externos.js';
import { comercioAbierto } from './riesgo.js';

const VEL_PEATON = 1.35; // m/s

function proyectar(p, a, b) {
  // Coordenadas locales: t a lo largo del segmento a→b y desplazamiento lateral (m, con signo).
  const k = 111320;
  const cos = Math.cos((a.lat * Math.PI) / 180);
  const bx = (b.lng - a.lng) * k * cos;
  const by = (b.lat - a.lat) * k;
  const px = (p.lng - a.lng) * k * cos;
  const py = (p.lat - a.lat) * k;
  const l2 = bx * bx + by * by || 1;
  const t = (px * bx + py * by) / l2;
  const lateral = (px * by - py * bx) / Math.sqrt(l2);
  return { t, lateral };
}

/** Elige hasta 3 puntos de paso: el mejor de cada lado del corredor y el mejor global. */
export function atractores(origen, destino, datos, hora) {
  const L = haversine(origen, destino);
  const corredor = Math.max(220, L * 0.4);
  const ptos = [
    ...datos.luces.map((p) => ({ ...p, w: 1 })),
    ...datos.camaras.map((p) => ({ ...p, w: 1.4 })),
    ...datos.comercios.filter((c) => comercioAbierto(c, hora)).map((p) => ({ ...p, w: 2 })),
  ];
  if (ptos.length === 0) return [];
  const indice = new IndiceEspacial(ptos, 100);
  const candidatos = [];
  for (const p of ptos) {
    const { t, lateral } = proyectar(p, origen, destino);
    if (t < 0.15 || t > 0.85 || Math.abs(lateral) > corredor || Math.abs(lateral) < 60) continue;
    const densidad = indice.cerca(p, 90).reduce((s, q) => s + q.w, 0);
    candidatos.push({ lat: p.lat, lng: p.lng, lado: Math.sign(lateral), valor: densidad - Math.abs(lateral) / 400 });
  }
  candidatos.sort((a, b) => b.valor - a.valor);
  const elegidos = [];
  for (const lado of [-1, 1]) {
    const mejor = candidatos.find((c) => c.lado === lado);
    if (mejor) elegidos.push(mejor);
  }
  const global = candidatos.find((c) => !elegidos.includes(c) && elegidos.every((e) => haversine(e, c) > 150));
  if (global) elegidos.push(global);
  return elegidos.slice(0, 3);
}

function densificar(puntos) {
  return muestrearPolilinea(puntos, 15).map(({ lat, lng }) => ({ lat, lng }));
}

/** Devuelve candidatas [{coords, distancia_m, duracion_s, fuente}] y elimina duplicados casi idénticos. */
export async function generarCandidatas(origen, destino, datos, hora) {
  const vias = atractores(origen, destino, datos, hora);
  const [directas, ...conVia] = await Promise.all([
    rutasPeatonales(origen, destino, [], true),
    ...vias.map((v) => rutasPeatonales(origen, destino, [v], false)),
  ]);
  let candidatas = [...directas, ...conVia.flat()].map((r) => ({ ...r, fuente: 'osrm' }));

  if (candidatas.length === 0) {
    // Respaldo sin conexión: línea recta y variantes quebradas por los atractores (se avisa a la usuaria).
    const bases = [[origen, destino], ...vias.map((v) => [origen, v, destino])];
    candidatas = bases.map((pts) => {
      const coords = densificar(pts);
      const d = longitudPolilinea(coords);
      return { coords, distancia_m: Math.round(d), duracion_s: Math.round(d / VEL_PEATON), fuente: 'estimada' };
    });
  }
  return descartarDuplicadas(candidatas).slice(0, 5);
}

function descartarDuplicadas(rutas) {
  const unicas = [];
  for (const r of rutas) {
    const m = muestrearPolilinea(r.coords, 60);
    const repetida = unicas.some((u) => {
      const mu = muestrearPolilinea(u.coords, 60);
      const comunes = m.filter((p) => mu.some((q) => haversine(p, q) < 25)).length;
      return comunes / m.length > 0.9 && Math.abs(u.distancia_m - r.distancia_m) < 80;
    });
    if (!repetida) unicas.push(r);
  }
  return unicas;
}
