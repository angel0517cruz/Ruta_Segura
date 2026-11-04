// Gamificación comunitaria: puntos, niveles e insignias de confianza.
// El propósito es incentivar datos actualizados (luminarias, comercios, rutas), no competir ni exponer personas.
import { Insignia, Verificacion } from '../models/comunidad.js';

export const PUNTOS = { RUTA_OK: 10, LUMINARIA_DANADA: 12, COMERCIO_ABIERTO: 8, REPORTE_CONFIRMADO: 4, REPORTE_PUBLICADO: 6 };

export const CATALOGO = [
  { codigo: 'LUCIERNAGA', nombre: 'Luciérnaga', descripcion: 'Reportaste tu primera luminaria dañada.', meta: 1, medida: 'LUMINARIA_DANADA' },
  { codigo: 'FARO', nombre: 'Faro del barrio', descripcion: 'Reportaste 10 luminarias dañadas.', meta: 10, medida: 'LUMINARIA_DANADA' },
  { codigo: 'GUARDIANA_RUTA', nombre: 'Guardiana del camino', descripcion: 'Verificaste 5 rutas como seguras.', meta: 5, medida: 'RUTA_OK' },
  { codigo: 'VIGIA_COMERCIO', nombre: 'Vigía de la noche', descripcion: 'Confirmaste 5 comercios abiertos.', meta: 5, medida: 'COMERCIO_ABIERTO' },
  { codigo: 'VOZ_BARRIO', nombre: 'Voz del barrio', descripcion: 'Publicaste 3 reportes de riesgo.', meta: 3, medida: 'REPORTES' },
  { codigo: 'CORO', nombre: 'Coro de confianza', descripcion: 'Confirmaste 10 reportes de otras usuarias.', meta: 10, medida: 'REPORTE_CONFIRMADO' },
  { codigo: 'CONSTELACION', nombre: 'Constelación', descripcion: 'Hiciste 25 aportes en total.', meta: 25, medida: 'TOTAL' },
];

export const NIVELES = [
  { nivel: 'Chispa', desde: 0 },
  { nivel: 'Brasa', desde: 50 },
  { nivel: 'Aurora', desde: 150 },
  { nivel: 'Luna', desde: 400 },
];

export function nivelPara(puntos) {
  const actual = [...NIVELES].reverse().find((n) => puntos >= n.desde);
  const siguiente = NIVELES.find((n) => n.desde > puntos) ?? null;
  return { ...actual, siguiente: siguiente?.nivel ?? null, faltan: siguiente ? siguiente.desde - puntos : 0, progreso: siguiente ? (puntos - actual.desde) / (siguiente.desde - actual.desde) : 1 };
}

export async function progreso(usuariaId) {
  const conteos = await Verificacion.conteos(usuariaId);
  const reportes = await Insignia.totalReportes(usuariaId);
  const total = Object.values(conteos).reduce((a, b) => a + b, 0) + reportes;
  const valor = (medida) => (medida === 'TOTAL' ? total : medida === 'REPORTES' ? reportes : conteos[medida] ?? 0);
  return CATALOGO.map((i) => ({ ...i, actual: Math.min(valor(i.medida), i.meta), cumplida: valor(i.medida) >= i.meta }));
}

/** Otorga las insignias recién cumplidas y devuelve solo las nuevas (para animarlas en la interfaz). */
export async function evaluarInsignias(usuariaId) {
  const nuevas = [];
  for (const i of await progreso(usuariaId)) {
    if (i.cumplida && (await Insignia.otorgar(usuariaId, i.codigo))) nuevas.push({ codigo: i.codigo, nombre: i.nombre, descripcion: i.descripcion });
  }
  return nuevas;
}
