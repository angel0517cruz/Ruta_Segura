import { ZodError } from 'zod';
import { config } from '../config.js';

export class ErrorApp extends Error {
  constructor(estado, mensaje, codigo = 'ERROR', detalles) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const noEncontrado = (req, res) => res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Recurso no encontrado.' } });

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof ZodError) {
    const detalles = err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    return res.status(400).json({ error: { codigo: 'VALIDACION', mensaje: 'Revisa los datos enviados.', detalles } });
  }
  if (err instanceof ErrorApp) {
    return res.status(err.estado).json({ error: { codigo: err.codigo, mensaje: err.message, detalles: err.detalles } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { codigo: 'MUY_GRANDE', mensaje: 'El contenido enviado es demasiado grande.' } });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es JSON válido.' } });
  }
  // Nunca se filtra la traza al cliente (OWASP A05/A09): queda solo en el registro del servidor.
  if (!config.produccion || process.env.NODE_ENV !== 'test') console.error('[error]', err);
  res.status(500).json({ error: { codigo: 'INTERNO', mensaje: 'Algo salió mal de nuestro lado. Inténtalo de nuevo.' } });
}
