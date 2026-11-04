// Modelo de riesgo temporal-espacial. Lo usan tanto el puntaje de rutas como el mapa de calor,
// de modo que "una calle roja" significa lo mismo en toda la aplicación.
import { distanciaHoras } from '../../shared/geo.js';

export const PESO_CATEGORIA = { ACOSO: 0.55, DESOLADO: 0.35, ILUMINACION: 0.3, LUMINARIA_DANADA: 0.3 };
const SIGMA_HORAS = 2.5; // un reporte de las 22:00 pesa casi igual a las 21:00 y poco a las 15:00
const VIDA_MEDIA_DIAS = 120;
const MS_DIA = 86_400_000;

export const esNoche = (hora) => hora >= 18 || hora < 6;

/** Peso 0..~1.5 de un reporte para una hora de consulta dada. */
export function pesoReporte(reporte, hora, ahoraMs = Date.now()) {
  const kernel = Math.exp(-(distanciaHoras(reporte.hora, hora) ** 2) / (2 * SIGMA_HORAS ** 2));
  const edadDias = Math.max(0, (ahoraMs - new Date(reporte.creado_en).getTime()) / MS_DIA);
  const vigencia = Math.max(0.25, Math.exp(-edadDias / VIDA_MEDIA_DIAS));
  const confianza = 1 + 0.25 * Math.min(4, reporte.confirmaciones ?? 0);
  return (PESO_CATEGORIA[reporte.categoria] ?? 0.3) * kernel * vigencia * confianza;
}

/** Transforma una suma de pesos en intensidad 0..1 (saturación suave). */
export const intensidad = (suma, escala = 1.2) => 1 - Math.exp(-suma / escala);

export function comercioAbierto(c, hora) {
  if (c.abre == null || c.cierra == null) return true;
  if (c.abre === c.cierra) return true;
  return c.abre < c.cierra ? hora >= c.abre && hora < c.cierra : hora >= c.abre || hora < c.cierra;
}
