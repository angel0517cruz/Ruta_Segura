import { db } from '../db/index.js';
import { aIso, ahoraIso } from './util.js';

const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, municipio_id, puntos';

export const Usuaria = {
  async crear({ nombre, email, passwordHash, municipioId, rol = 'USUARIA' }) {
    const { filas } = await db.ejecutar(
      `INSERT INTO usuarias (nombre, email, password_hash, rol, municipio_id, creada_en)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING ${COLUMNAS_PUBLICAS}`,
      [nombre, email, passwordHash, rol, municipioId ?? null, ahoraIso()],
    );
    return filas[0];
  },
  porEmail: (email) => db.uno('SELECT * FROM usuarias WHERE email = ?', [email]),
  porId: (id) => db.uno(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarias WHERE id = ?`, [id]),
  async estaBloqueada(u) {
    return Boolean(u.bloqueada_hasta) && new Date(aIso(u.bloqueada_hasta)) > new Date();
  },
  async registrarFallo(u) {
    const intentos = u.intentos_fallidos + 1;
    const bloqueo = intentos >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
    await db.ejecutar('UPDATE usuarias SET intentos_fallidos = ?, bloqueada_hasta = ? WHERE id = ?', [bloqueo ? 0 : intentos, bloqueo, u.id]);
  },
  limpiarFallos: (id) => db.ejecutar('UPDATE usuarias SET intentos_fallidos = 0, bloqueada_hasta = NULL WHERE id = ?', [id]),
  sumarPuntos: (id, puntos) => db.ejecutar('UPDATE usuarias SET puntos = puntos + ? WHERE id = ?', [puntos, id]),
};

export const publica = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, municipio_id: u.municipio_id, puntos: u.puntos });
