// Mapa de calor predictivo: riesgo esperado en cada celda (~180 m) para una hora de la noche.
// Es una estimación estadística sobre reportes ciudadanos, no una predicción de delitos (ver ERS §Limitaciones).
import { IndiceEspacial, muestrearPolilinea } from '../../shared/geo.js';
import { intensidad, pesoReporte } from './riesgo.js';

const CELDA_GRADOS = 0.0016;

export function celdasDeCalor(reportes, hora, ahoraMs = Date.now()) {
  const acumulado = new Map();
  for (const r of reportes) {
    const w = pesoReporte(r, hora, ahoraMs);
    if (w < 0.01) continue;
    const i = Math.floor(r.lat / CELDA_GRADOS);
    const j = Math.floor(r.lng / CELDA_GRADOS);
    const c = acumulado.get(`${i}:${j}`) ?? { i, j, suma: 0, n: 0 };
    c.suma += w;
    c.n += 1;
    acumulado.set(`${i}:${j}`, c);
  }
  return [...acumulado.values()]
    .map((c) => ({
      lat: Number(((c.i + 0.5) * CELDA_GRADOS).toFixed(5)),
      lng: Number(((c.j + 0.5) * CELDA_GRADOS).toFixed(5)),
      intensidad: Number(intensidad(c.suma).toFixed(3)),
      reportes: c.n,
    }))
    .filter((c) => c.intensidad > 0.04)
    .sort((a, b) => b.intensidad - a.intensidad);
}

/** Riesgo (0..1) de cada calle: promedio ponderado a lo largo de su geometría. */
export function riesgoDeCalles(calles, reportes, hora, ahoraMs = Date.now()) {
  const indice = new IndiceEspacial(reportes, 120);
  return calles
    .map((calle) => {
      const muestras = muestrearPolilinea(calle.coords, 40);
      let maximo = 0;
      let total = 0;
      for (const m of muestras) {
        let suma = 0;
        for (const r of indice.cerca(m, 110)) suma += pesoReporte(r, hora, ahoraMs);
        const v = intensidad(suma);
        maximo = Math.max(maximo, v);
        total += v;
      }
      const riesgo = 0.5 * maximo + 0.5 * (total / muestras.length);
      return { id: calle.id, nombre: calle.nombre, coords: calle.coords, riesgo: Number(riesgo.toFixed(2)) };
    })
    .filter((c) => c.riesgo > 0.05);
}
