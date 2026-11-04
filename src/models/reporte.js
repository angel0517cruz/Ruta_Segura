import { haversine } from '../../shared/geo.js';
import { db } from '../db/index.js';
import { aIso, ahoraIso, haceHoras } from './util.js';

const SELECT = `SELECT r.id, r.usuaria_id, r.municipio_id, m.nombre AS municipio, r.referencia, r.categoria,
  r.descripcion, r.lat, r.lng, r.precision_ubicacion, r.hora, r.estado, r.confirmaciones, r.denuncias, r.fuente, r.creado_en
  FROM reportes r JOIN municipios m ON m.id = r.municipio_id`;

/** Vista pública: nunca expone quién reportó (privacidad de la denunciante). */
export function vistaPublica(r, usuariaId, origen) {
  const salida = {
    id: r.id,
    municipio_id: r.municipio_id,
    municipio: r.municipio,
    referencia: r.referencia,
    categoria: r.categoria,
    descripcion: r.descripcion,
    lat: r.lat,
    lng: r.lng,
    precision_ubicacion: r.precision_ubicacion,
    hora: r.hora,
    confirmaciones: r.confirmaciones,
    creado_en: aIso(r.creado_en),
    propia: r.usuaria_id === usuariaId,
  };
  if (origen) salida.distancia_m = Math.round(haversine(origen, r));
  return salida;
}

export const Reporte = {
  async crear(d) {
    const { filas } = await db.ejecutar(
      `INSERT INTO reportes (usuaria_id, municipio_id, referencia, categoria, descripcion, lat, lng, precision_ubicacion, hora, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [d.usuariaId, d.municipioId, d.referencia, d.categoria, d.descripcion ?? null, d.lat, d.lng, d.precision, d.hora, ahoraIso()],
    );
    return Reporte.porId(filas[0].id);
  },
  porId: (id) => db.uno(`${SELECT} WHERE r.id = ?`, [id]),
  /** Reportes visibles (solo ACTIVO). Lista pública y base del mapa de calor. */
  activos(municipioId) {
    return municipioId
      ? db.todos(`${SELECT} WHERE r.estado = 'ACTIVO' AND r.municipio_id = ?`, [municipioId])
      : db.todos(`${SELECT} WHERE r.estado = 'ACTIVO'`);
  },
  async contarUltimaHora(usuariaId) {
    const f = await db.uno('SELECT COUNT(*) AS n FROM reportes WHERE usuaria_id = ? AND creado_en > ?', [usuariaId, haceHoras(1)]);
    return Number(f.n);
  },
  sumarConfirmacion: (id) => db.ejecutar('UPDATE reportes SET confirmaciones = confirmaciones + 1 WHERE id = ?', [id]),
  cambiarEstado: (id, estado) => db.ejecutar('UPDATE reportes SET estado = ? WHERE id = ?', [estado, id]),
  eliminar: async (id) => {
    await db.ejecutar('DELETE FROM verificaciones WHERE reporte_id = ?', [id]);
    await db.ejecutar('DELETE FROM denuncias_reporte WHERE reporte_id = ?', [id]);
    await db.ejecutar('DELETE FROM reportes WHERE id = ?', [id]);
  },
  async denunciar(reporteId, usuariaId, motivo) {
    const { cambios } = await db.ejecutar(
      'INSERT INTO denuncias_reporte (reporte_id, usuaria_id, motivo, creada_en) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
      [reporteId, usuariaId, motivo ?? null, ahoraIso()],
    );
    if (cambios === 0) return null;
    const { filas } = await db.ejecutar('UPDATE reportes SET denuncias = denuncias + 1 WHERE id = ? RETURNING denuncias', [reporteId]);
    return filas[0].denuncias;
  },
  enRevision: () => db.todos(`${SELECT} WHERE r.estado = 'EN_REVISION' ORDER BY r.denuncias DESC, r.creado_en`),
};
