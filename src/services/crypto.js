// Cifrado de datos sensibles en reposo (placas y fotos temporales): AES-256-GCM con la clave DATA_KEY.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';

const clave = createHash('sha256').update(config.claveDatos).digest();

/** @param {Buffer|string} dato @returns {string} iv.tag.cifrado en base64 */
export function cifrar(dato) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', clave, iv);
  const cifrado = Buffer.concat([c.update(dato), c.final()]);
  return [iv, c.getAuthTag(), cifrado].map((b) => b.toString('base64')).join('.');
}

export function descifrar(texto) {
  const [iv, tag, cifrado] = texto.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = createDecipheriv('aes-256-gcm', clave, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(cifrado), d.final()]);
}
