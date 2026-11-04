import { ErrorApp } from '../middleware/errores.js';
import { Municipio } from '../models/municipio.js';
import { Usuaria, publica } from '../models/usuaria.js';
import { firmarToken, hashear, verificar } from '../services/auth.js';
import { loginSchema, registroSchema } from '../services/validaciones.js';

export async function registro(req, res) {
  const d = registroSchema.parse(req.body);
  if (d.municipio_id && !(await Municipio.porId(d.municipio_id))) throw new ErrorApp(400, 'Municipio no válido.', 'MUNICIPIO');
  if (await Usuaria.porEmail(d.email)) throw new ErrorApp(409, 'Ese correo ya tiene cuenta. Prueba iniciar sesión.', 'CORREO_EXISTE');
  // El rol nunca viene del cliente: toda cuenta nueva es USUARIA (la moderación se asigna a mano).
  const u = await Usuaria.crear({ nombre: d.nombre, email: d.email, passwordHash: await hashear(d.password), municipioId: d.municipio_id });
  res.status(201).json({ token: firmarToken(u), usuaria: publica(u) });
}

export async function login(req, res) {
  const d = loginSchema.parse(req.body);
  const u = await Usuaria.porEmail(d.email);
  // Mensaje único para correo inexistente, clave errónea o cuenta bloqueada: no revela qué falló.
  const invalido = new ErrorApp(401, 'Correo o contraseña incorrectos.', 'CREDENCIALES');
  if (u && (await Usuaria.estaBloqueada(u))) {
    await verificar(d.password, null);
    throw new ErrorApp(429, 'Demasiados intentos. Espera 15 minutos o recupera tu acceso.', 'BLOQUEADA');
  }
  const ok = await verificar(d.password, u?.password_hash);
  if (!u || !ok) {
    if (u) await Usuaria.registrarFallo(u);
    throw invalido;
  }
  await Usuaria.limpiarFallos(u.id);
  res.json({ token: firmarToken(u), usuaria: publica(u) });
}

export function yo(req, res) {
  res.json({ usuaria: publica(req.usuaria) });
}
