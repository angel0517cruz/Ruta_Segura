import { db } from '../db/index.js';
import { leerToken } from '../services/auth.js';
import { ErrorApp } from './errores.js';

/** Exige JWT válido en `Authorization: Bearer`. Recarga la usuaria para respetar cambios de rol al instante. */
export async function requiereSesion(req, res, next) {
  const cabecera = req.get('authorization') || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) throw new ErrorApp(401, 'Inicia sesión para continuar.', 'SIN_SESION');
  let payload;
  try {
    payload = leerToken(token);
  } catch {
    throw new ErrorApp(401, 'Tu sesión venció. Vuelve a ingresar.', 'SESION_INVALIDA');
  }
  const usuaria = await db.uno('SELECT id, nombre, email, rol, municipio_id, puntos, limitada_hasta FROM usuarias WHERE id = ?', [Number(payload.sub)]);
  if (!usuaria) throw new ErrorApp(401, 'Tu sesión venció. Vuelve a ingresar.', 'SESION_INVALIDA');
  req.usuaria = usuaria;
  next();
}

/** Autorización por rol, siempre validada en el servidor (nunca confiar en el cliente). */
export const requiereRol = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuaria.rol)) throw new ErrorApp(403, 'No tienes permiso para esta acción.', 'PROHIBIDO');
  next();
};
