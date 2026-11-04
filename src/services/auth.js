import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Hash ficticio para igualar el tiempo de respuesta cuando el correo no existe (evita enumerar cuentas).
const HASH_FALSO = bcrypt.hashSync('relleno-tiempo-constante', config.bcryptCosto);

export const hashear = (password) => bcrypt.hash(password, config.bcryptCosto);
export const verificar = (password, hash) => bcrypt.compare(password, hash ?? HASH_FALSO);

export function firmarToken(usuaria) {
  return jwt.sign({ rol: usuaria.rol }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(usuaria.id),
    expiresIn: config.jwtExpira,
    issuer: 'ruta-segura',
  });
}

export function leerToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'ruta-segura' });
}
