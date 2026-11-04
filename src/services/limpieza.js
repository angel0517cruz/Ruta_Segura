// Minimización de datos: las placas y fotos temporales se eliminan al vencer (y se revisan cada 10 min).
import { Placa } from '../models/viaje.js';

export async function limpiarVencidos() {
  return Placa.purgarVencidas();
}

export function iniciarLimpieza(cadaMs = 10 * 60_000) {
  const t = setInterval(() => limpiarVencidos().catch((e) => console.error('[limpieza]', e)), cadaMs);
  t.unref();
  return t;
}
