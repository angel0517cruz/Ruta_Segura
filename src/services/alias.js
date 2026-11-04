// Alias estable y anónimo de una autora. Permite a moderación detectar patrones ("la misma autora publicó 5 reportes
// abusivos") sin conocer nombre, correo ni id. No es reversible sin la clave del servidor.
import { createHmac } from 'node:crypto';
import { config } from '../config.js';

export function aliasAutora(usuariaId) {
  return `N-${createHmac('sha256', config.claveDatos).update(`alias:${usuariaId}`).digest('hex').slice(0, 5).toUpperCase()}`;
}
