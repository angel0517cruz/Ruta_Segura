// Moderación humana (human-in-the-loop): el sistema propone, una persona decide y queda auditado.
import { ErrorApp } from '../middleware/errores.js';
import { Auditoria } from '../models/comunidad.js';
import { Reporte } from '../models/reporte.js';
import { resolverSchema } from '../services/validaciones.js';

export async function cola(req, res) {
  const filas = await Reporte.enRevision();
  res.json({
    total: filas.length,
    reportes: filas.map((r) => ({
      id: r.id, municipio: r.municipio, referencia: r.referencia, categoria: r.categoria,
      descripcion: r.descripcion, denuncias: r.denuncias, confirmaciones: r.confirmaciones, creado_en: new Date(r.creado_en).toISOString(),
    })),
  });
}

export async function resolver(req, res) {
  const { decision, nota } = resolverSchema.parse(req.body);
  const r = await Reporte.porId(Number(req.params.id));
  if (!r || r.estado !== 'EN_REVISION') throw new ErrorApp(404, 'Ese reporte no está en revisión.', 'NO_ENCONTRADO');
  const estado = decision === 'OCULTAR' ? 'OCULTO' : 'ACTIVO';
  await Reporte.cambiarEstado(r.id, estado);
  await Auditoria.registrar(req.usuaria.id, decision === 'OCULTAR' ? 'REPORTE_OCULTADO' : 'REPORTE_RESTAURADO', `reporte ${r.id}: ${nota}`);
  res.json({ id: r.id, estado });
}

export async function auditoria(req, res) {
  const filas = await Auditoria.ultimas(50);
  res.json({ eventos: filas.map((f) => ({ ...f, creada_en: new Date(f.creada_en).toISOString() })) });
}
