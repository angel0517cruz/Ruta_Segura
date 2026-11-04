// Moderación: una PERSONA decide; el sistema propone y deja todo auditado.
// Principio de diseño: la moderadora gestiona CONTENIDO y DATOS, no personas. Nunca ve nombre, correo ni id de una autora
// (solo un alias estable y anónimo), no puede borrar cuentas y su sanción más fuerte es limitar temporalmente la publicación.
import { haversine } from '../../shared/geo.js';
import { ErrorApp } from '../middleware/errores.js';
import { Auditoria, PuntoSeguridad, Verificacion } from '../models/comunidad.js';
import { Municipio } from '../models/municipio.js';
import { Reporte } from '../models/reporte.js';
import { Usuaria } from '../models/usuaria.js';
import { aIso } from '../models/util.js';
import { aliasAutora } from '../services/alias.js';
import {
  estadoPuntoSchema, filtroModeracionSchema, limitarAutoraSchema, puntoSeguridadSchema, repararSchema, resolverSchema,
} from '../services/validaciones.js';

const vistaModeracion = (r) => ({
  id: r.id,
  municipio: r.municipio,
  referencia: r.referencia,
  categoria: r.categoria,
  descripcion: r.descripcion,
  estado: r.estado,
  denuncias: r.denuncias,
  confirmaciones: r.confirmaciones,
  hora: r.hora,
  creado_en: aIso(r.creado_en),
  alias_autora: aliasAutora(r.usuaria_id),
});

// --- Reportes
export async function cola(req, res) {
  const filas = await Reporte.enRevision();
  res.json({ total: filas.length, reportes: filas.map(vistaModeracion) });
}

/** Todos los reportes (cualquier estado): la moderadora también revisa de forma proactiva, no solo lo denunciado. */
export async function reportes(req, res) {
  const f = filtroModeracionSchema.parse(req.query);
  const filas = await Reporte.paraModeracion({ estado: f.estado, municipioId: f.municipio_id, limite: f.limite });
  res.json({ total: filas.length, reportes: filas.map(vistaModeracion) });
}

const DESTINO = { OCULTAR: 'OCULTO', RESTAURAR: 'ACTIVO', RESUELTO: 'RESUELTO' };
const ORIGEN_VALIDO = { OCULTAR: ['ACTIVO', 'EN_REVISION'], RESTAURAR: ['EN_REVISION', 'OCULTO', 'RESUELTO'], RESUELTO: ['ACTIVO', 'EN_REVISION'] };
const ACCION = { OCULTAR: 'REPORTE_OCULTADO', RESTAURAR: 'REPORTE_RESTAURADO', RESUELTO: 'REPORTE_ATENDIDO' };

export async function resolver(req, res) {
  const { decision, nota } = resolverSchema.parse(req.body);
  const r = await Reporte.porId(Number(req.params.id));
  if (!r) throw new ErrorApp(404, 'Reporte no encontrado.', 'NO_ENCONTRADO');
  if (!ORIGEN_VALIDO[decision].includes(r.estado)) throw new ErrorApp(409, `Un reporte ${r.estado} no admite esta acción.`, 'ESTADO_INVALIDO');
  await Reporte.cambiarEstado(r.id, DESTINO[decision]);
  await Auditoria.registrar(req.usuaria.id, ACCION[decision], `reporte ${r.id} (${aliasAutora(r.usuaria_id)}): ${nota}`);
  res.json({ id: r.id, estado: DESTINO[decision] });
}

/** Sanción proporcional y reversible: limitar la publicación de reportes de la autora, sin conocer su identidad. */
export async function limitarAutora(req, res) {
  const { dias, nota } = limitarAutoraSchema.parse(req.body);
  const r = await Reporte.porId(Number(req.params.id));
  if (!r) throw new ErrorApp(404, 'Reporte no encontrado.', 'NO_ENCONTRADO');
  if (r.usuaria_id === req.usuaria.id) throw new ErrorApp(400, 'No puedes limitar tu propia cuenta.', 'PROPIO');
  const autora = await Usuaria.porId(r.usuaria_id);
  if (autora.rol === 'MODERADORA') throw new ErrorApp(403, 'No se puede limitar a otra moderadora desde este panel.', 'PROHIBIDO');
  const hasta = dias === 0 ? null : new Date(Date.now() + dias * 86_400_000).toISOString();
  await Usuaria.limitarPublicacion(r.usuaria_id, hasta);
  await Auditoria.registrar(req.usuaria.id, dias === 0 ? 'LIMITE_AUTORA_LEVANTADO' : 'AUTORA_LIMITADA', `${aliasAutora(r.usuaria_id)} · ${dias} d · reporte ${r.id}: ${nota}`);
  res.json({ alias_autora: aliasAutora(r.usuaria_id), limitada_hasta: hasta });
}

// --- Curaduría de datos de seguridad
export async function puntos(req, res) {
  const municipio = await Municipio.porId(Number(req.query.municipio_id));
  if (!municipio) throw new ErrorApp(400, 'Elige un municipio.', 'MUNICIPIO');
  res.json({ puntos: await PuntoSeguridad.paraModeracion(municipio.id) });
}

export async function crearPunto(req, res) {
  const d = puntoSeguridadSchema.parse(req.body);
  const municipio = await Municipio.porId(d.municipio_id);
  if (!municipio) throw new ErrorApp(400, 'Municipio no válido.', 'MUNICIPIO');
  if (haversine(d, municipio) > 15_000) throw new ErrorApp(422, `Ese punto no está en ${municipio.nombre}.`, 'FUERA_DE_MUNICIPIO');
  const id = await PuntoSeguridad.crear({ tipo: d.tipo, nombre: d.nombre, municipioId: municipio.id, lat: d.lat, lng: d.lng, abre: d.abre, cierra: d.cierra, creadoPor: req.usuaria.id });
  await Auditoria.registrar(req.usuaria.id, 'PUNTO_CREADO', `${d.tipo} #${id} en ${municipio.nombre}`);
  res.status(201).json({ id });
}

export async function estadoPunto(req, res) {
  const { activo, nota } = estadoPuntoSchema.parse(req.body);
  const p = await PuntoSeguridad.porId(Number(req.params.id));
  if (!p) throw new ErrorApp(404, 'Punto no encontrado.', 'NO_ENCONTRADO');
  await PuntoSeguridad.cambiarActivo(p.id, activo);
  await Auditoria.registrar(req.usuaria.id, activo ? 'PUNTO_ACTIVADO' : 'PUNTO_DESACTIVADO', `${p.tipo} #${p.id}: ${nota}`);
  res.json({ id: p.id, activo });
}

export async function luminariasDanadas(req, res) {
  const filas = await Verificacion.luminariasPendientes();
  const lista = await Promise.all(filas.map(async (f) => ({
    id: f.id, lat: f.lat, lng: f.lng, creada_en: aIso(f.creada_en), municipio: (await Municipio.masCercano(f))?.nombre ?? null,
  })));
  res.json({ luminarias: lista });
}

/** Cierra el ciclo con la comunidad: cuando la alcaldía repara la luminaria, deja de restar seguridad a las rutas. */
export async function repararLuminaria(req, res) {
  const { nota } = repararSchema.parse(req.body);
  const v = await Verificacion.porId(Number(req.params.id));
  if (!v || v.tipo !== 'LUMINARIA_DANADA') throw new ErrorApp(404, 'Reporte de luminaria no encontrado.', 'NO_ENCONTRADO');
  await Verificacion.marcarResuelta(v.id);
  await Auditoria.registrar(req.usuaria.id, 'LUMINARIA_REPARADA', `verificación ${v.id}: ${nota}`);
  res.json({ id: v.id, resuelta: true });
}

// --- Métricas anónimas y auditoría
export async function metricas(req, res) {
  const [reportes, luminarias, aportes, limitadas] = await Promise.all([
    Reporte.metricas(), Verificacion.luminariasPendientes(), Verificacion.aportes7dias(), Usuaria.contarLimitadas(),
  ]);
  res.json({ ...reportes, luminarias_pendientes: luminarias.length, aportes_ultimos_7_dias: aportes, autoras_limitadas: limitadas });
}

export async function auditoria(req, res) {
  const filas = await Auditoria.ultimas(60);
  res.json({ eventos: filas.map((f) => ({ ...f, creada_en: aIso(f.creada_en) })) });
}
