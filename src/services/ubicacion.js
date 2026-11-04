// Verificación de que un reporte apunta a un lugar REAL: el punto de referencia existe en el municipio y, si la usuaria
// marcó un punto exacto, está cerca de ese lugar (no se aceptan puntos al azar ni referencias inventadas).
import { haversine } from '../../shared/geo.js';
import { config } from '../config.js';
import { ErrorApp } from '../middleware/errores.js';
import { geocodificar, ServicioNoDisponible } from './externos.js';

const LIMITE_MUNICIPIO_M = 15_000;

/** @returns {{lat:number,lng:number,verificada:boolean}} */
export async function verificarUbicacion({ referencia, lat, lng }, municipio) {
  const marcado = lat != null && lng != null ? { lat, lng } : null;
  if (marcado && haversine(marcado, municipio) > LIMITE_MUNICIPIO_M) {
    throw new ErrorApp(422, `Ese punto no está en ${municipio.nombre}. Elige un lugar dentro del municipio.`, 'FUERA_DE_MUNICIPIO');
  }
  if (!config.verificarUbicacion) return { ...(marcado ?? {}), verificada: false }; // modo sin conexión (pruebas)

  let lugares;
  try {
    lugares = await geocodificar(referencia, municipio);
  } catch (e) {
    if (e instanceof ServicioNoDisponible) {
      throw new ErrorApp(503, 'No pudimos verificar que el lugar exista en este momento. Inténtalo de nuevo en unos minutos.', 'UBICACION_NO_VERIFICABLE');
    }
    throw e;
  }
  if (!lugares.length) {
    throw new ErrorApp(422, `No encontramos «${referencia}» en ${municipio.nombre}. Revisa el nombre o elige un lugar de la lista.`, 'REFERENCIA_NO_ENCONTRADA');
  }
  if (!marcado) return { lat: lugares[0].lat, lng: lugares[0].lng, verificada: true };
  const cercano = lugares.some((l) => haversine(l, marcado) <= config.radioCoincidenciaM);
  if (!cercano) {
    throw new ErrorApp(422, `El punto marcado queda a más de ${config.radioCoincidenciaM} m de «${referencia}». Muévelo cerca de ese lugar.`, 'PUNTO_NO_COINCIDE');
  }
  return { ...marcado, verificada: true };
}
