// Datos colaborativos: puntos de seguridad, verificaciones y gamificación.
import { db } from '../db/index.js';
import { ahoraIso, haceDias, haceHoras } from './util.js';

export const PuntoSeguridad = {
  /** Solo puntos activos: los que usa el algoritmo y el mapa. */
  delMunicipio: (municipioId) =>
    db.todos('SELECT id, tipo, nombre, lat, lng, abre, cierra, fuente FROM puntos_seguridad WHERE municipio_id = ? AND activo = 1', [municipioId]),
  /** Todos (incluye desactivados): curaduría por moderación. */
  paraModeracion: (municipioId) =>
    db.todos('SELECT id, tipo, nombre, lat, lng, abre, cierra, fuente, activo FROM puntos_seguridad WHERE municipio_id = ? ORDER BY id DESC LIMIT 300', [municipioId]),
  porId: (id) => db.uno('SELECT * FROM puntos_seguridad WHERE id = ?', [id]),
  async crear(d) {
    const { filas } = await db.ejecutar(
      `INSERT INTO puntos_seguridad (tipo, nombre, municipio_id, lat, lng, abre, cierra, fuente, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'moderacion', ?) RETURNING id`,
      [d.tipo, d.nombre ?? null, d.municipioId, d.lat, d.lng, d.abre ?? null, d.cierra ?? null, d.creadoPor],
    );
    return filas[0].id;
  },
  cambiarActivo: (id, activo) => db.ejecutar('UPDATE puntos_seguridad SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]),
};

export const Verificacion = {
  async crear({ usuariaId, tipo, lat, lng, reporteId, puntos }) {
    const { filas } = await db.ejecutar(
      `INSERT INTO verificaciones (usuaria_id, tipo, lat, lng, reporte_id, puntos, creada_en)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [usuariaId, tipo, lat, lng, reporteId ?? null, puntos, ahoraIso()],
    );
    return filas[0].id;
  },
  recientesDeTipo: (usuariaId, tipo, horas) =>
    db.todos('SELECT lat, lng, reporte_id FROM verificaciones WHERE usuaria_id = ? AND tipo = ? AND creada_en > ?', [usuariaId, tipo, haceHoras(horas)]),
  async puntosHoy(usuariaId) {
    const f = await db.uno('SELECT COALESCE(SUM(puntos), 0) AS n FROM verificaciones WHERE usuaria_id = ? AND creada_en > ?', [usuariaId, haceHoras(24)]);
    return Number(f.n);
  },
  /** Verificaciones vigentes que alimentan el algoritmo de rutas: cada tipo caduca a su ritmo. */
  vigentes(tipo, horas) {
    return db.todos('SELECT lat, lng FROM verificaciones WHERE tipo = ? AND creada_en > ?', [tipo, haceHoras(horas)]);
  },
  vigentesLuminarias: () =>
    db.todos('SELECT lat, lng FROM verificaciones WHERE tipo = ? AND creada_en > ? AND resuelta = 0', ['LUMINARIA_DANADA', haceDias(30)]),
  /** Luminarias dañadas aún sin reparar (con id) para la gestión de moderación. */
  luminariasPendientes: () =>
    db.todos("SELECT id, lat, lng, creada_en FROM verificaciones WHERE tipo = 'LUMINARIA_DANADA' AND resuelta = 0 AND creada_en > ? ORDER BY creada_en DESC LIMIT 100", [haceDias(30)]),
  porId: (id) => db.uno('SELECT * FROM verificaciones WHERE id = ?', [id]),
  marcarResuelta: (id) => db.ejecutar('UPDATE verificaciones SET resuelta = 1 WHERE id = ?', [id]),
  async aportes7dias() {
    const f = await db.uno('SELECT COUNT(*) AS n FROM verificaciones WHERE creada_en > ?', [haceDias(7)]);
    return Number(f.n);
  },
  vigentesRutasOk: () => Verificacion.vigentes('RUTA_OK', 24 * 7),
  vigentesComercios: () => Verificacion.vigentes('COMERCIO_ABIERTO', 3),
  async conteos(usuariaId) {
    const filas = await db.todos('SELECT tipo, COUNT(*) AS n FROM verificaciones WHERE usuaria_id = ? GROUP BY tipo', [usuariaId]);
    return Object.fromEntries(filas.map((f) => [f.tipo, Number(f.n)]));
  },
  async yaConfirmo(usuariaId, reporteId) {
    return Boolean(await db.uno("SELECT 1 AS x FROM verificaciones WHERE usuaria_id = ? AND tipo = 'REPORTE_CONFIRMADO' AND reporte_id = ?", [usuariaId, reporteId]));
  },
  ultimos30dias: (usuariaId) =>
    db.todos('SELECT tipo, creada_en FROM verificaciones WHERE usuaria_id = ? AND creada_en > ? ORDER BY creada_en DESC LIMIT 20', [usuariaId, haceDias(30)]),
};

export const Insignia = {
  deUsuaria: (id) => db.todos('SELECT codigo, otorgada_en FROM insignias_usuaria WHERE usuaria_id = ?', [id]),
  async otorgar(usuariaId, codigo) {
    const { cambios } = await db.ejecutar(
      'INSERT INTO insignias_usuaria (usuaria_id, codigo, otorgada_en) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
      [usuariaId, codigo, ahoraIso()],
    );
    return cambios > 0;
  },
  async totalReportes(usuariaId) {
    const f = await db.uno("SELECT COUNT(*) AS n FROM reportes WHERE usuaria_id = ? AND fuente = 'usuaria'", [usuariaId]);
    return Number(f.n);
  },
};

export const Auditoria = {
  registrar: (actorId, accion, detalle) =>
    db.ejecutar('INSERT INTO auditoria (actor_id, accion, detalle, creada_en) VALUES (?, ?, ?, ?)', [actorId, accion, detalle ?? null, ahoraIso()]),
  ultimas: (n = 50) =>
    db.todos(
      `SELECT a.id, a.accion, a.detalle, a.creada_en, u.nombre AS actor FROM auditoria a
       LEFT JOIN usuarias u ON u.id = a.actor_id ORDER BY a.id DESC LIMIT ${Number(n)}`,
    ),
};
