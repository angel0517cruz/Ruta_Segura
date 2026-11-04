import { db } from '../db/index.js';
import { cifrar, descifrar } from '../services/crypto.js';
import { config } from '../config.js';
import { aIso, ahoraIso, enHoras } from './util.js';

const COLS = 'id, usuaria_id, municipio_id, origen_texto, destino_texto, ruta_json, puntaje, estado, desvios, iniciado_en, finalizado_en';

function vista(v) {
  if (!v) return null;
  return {
    id: v.id,
    municipio_id: v.municipio_id,
    origen_texto: v.origen_texto,
    destino_texto: v.destino_texto,
    ruta: v.ruta_json ? JSON.parse(v.ruta_json) : null,
    puntaje: v.puntaje,
    estado: v.estado,
    desvios: v.desvios,
    iniciado_en: aIso(v.iniciado_en),
    finalizado_en: aIso(v.finalizado_en),
  };
}

export const Viaje = {
  async crear({ usuariaId, municipioId, origenTexto, destinoTexto, ruta }) {
    const { filas } = await db.ejecutar(
      `INSERT INTO viajes (usuaria_id, municipio_id, origen_texto, destino_texto, ruta_json, puntaje, iniciado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING ${COLS}`,
      [usuariaId, municipioId ?? null, origenTexto ?? null, destinoTexto ?? null, JSON.stringify(ruta.coords), Math.round(ruta.puntaje), ahoraIso()],
    );
    return vista(filas[0]);
  },
  /** Devuelve el viaje solo si pertenece a la usuaria (control de acceso a nivel de objeto, OWASP A01). */
  async deUsuaria(id, usuariaId) {
    return vista(await db.uno(`SELECT ${COLS} FROM viajes WHERE id = ? AND usuaria_id = ?`, [id, usuariaId]));
  },
  async actual(usuariaId) {
    return vista(await db.uno(`SELECT ${COLS} FROM viajes WHERE usuaria_id = ? AND estado = 'EN_CURSO' ORDER BY id DESC LIMIT 1`, [usuariaId]));
  },
  async cerrarActivos(usuariaId) {
    await db.ejecutar("UPDATE viajes SET estado = 'CANCELADO', finalizado_en = ? WHERE usuaria_id = ? AND estado = 'EN_CURSO'", [ahoraIso(), usuariaId]);
  },
  sumarDesvio: (id) => db.ejecutar('UPDATE viajes SET desvios = desvios + 1 WHERE id = ?', [id]),
  async terminar(id, estado) {
    await db.ejecutar('UPDATE viajes SET estado = ?, finalizado_en = ? WHERE id = ?', [estado, ahoraIso(), id]);
    // Al terminar, la placa vive solo `placaTtlHoras` más (por si hay que consultarla tras un incidente).
    await db.ejecutar('UPDATE placas_temporales SET expira_en = ? WHERE viaje_id = ?', [enHoras(config.placaTtlHoras), id]);
  },
};

export const Placa = {
  async guardar(viajeId, placa, foto) {
    const previa = await db.uno('SELECT id FROM placas_temporales WHERE viaje_id = ?', [viajeId]);
    const expira = enHoras(config.placaTtlMaxHoras);
    const fotoCifrada = foto ? cifrar(foto) : null;
    if (previa) {
      await db.ejecutar('UPDATE placas_temporales SET placa_cifrada = ?, foto_cifrada = ?, expira_en = ? WHERE viaje_id = ?', [cifrar(placa), fotoCifrada, expira, viajeId]);
    } else {
      await db.ejecutar(
        'INSERT INTO placas_temporales (viaje_id, placa_cifrada, foto_cifrada, creada_en, expira_en) VALUES (?, ?, ?, ?, ?)',
        [viajeId, cifrar(placa), fotoCifrada, ahoraIso(), expira],
      );
    }
    return { placa, tiene_foto: Boolean(foto), expira_en: expira };
  },
  async deViaje(viajeId) {
    const f = await db.uno('SELECT placa_cifrada, foto_cifrada, expira_en FROM placas_temporales WHERE viaje_id = ? AND expira_en > ?', [viajeId, ahoraIso()]);
    if (!f) return null;
    return {
      placa: descifrar(f.placa_cifrada).toString('utf8'),
      foto: f.foto_cifrada ? descifrar(f.foto_cifrada).toString('utf8') : null,
      expira_en: aIso(f.expira_en),
    };
  },
  borrar: (viajeId) => db.ejecutar('DELETE FROM placas_temporales WHERE viaje_id = ?', [viajeId]),
  /** Minimización de datos: elimina todo lo vencido. Devuelve cuántas filas se borraron. */
  async purgarVencidas() {
    const { cambios } = await db.ejecutar('DELETE FROM placas_temporales WHERE expira_en <= ?', [ahoraIso()]);
    return cambios;
  },
};
