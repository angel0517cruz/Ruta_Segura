import { haversine } from '../../shared/geo.js';
import { config } from '../config.js';
import { ErrorApp } from '../middleware/errores.js';
import { Insignia, Verificacion } from '../models/comunidad.js';
import { Reporte } from '../models/reporte.js';
import { Usuaria } from '../models/usuaria.js';
import { CATALOGO, evaluarInsignias, nivelPara, progreso, PUNTOS } from '../services/insignias.js';
import { verificacionSchema } from '../services/validaciones.js';

const REPETICION = { RUTA_OK: { m: 150, h: 6 }, LUMINARIA_DANADA: { m: 40, h: 72 }, COMERCIO_ABIERTO: { m: 40, h: 3 }, REPORTE_CONFIRMADO: { m: 0, h: 0 } };

export async function verificar(req, res) {
  const d = verificacionSchema.parse(req.body);
  const uid = req.usuaria.id;

  if (d.tipo === 'REPORTE_CONFIRMADO') {
    if (!d.reporte_id) throw new ErrorApp(400, 'Indica qué reporte confirmas.', 'REPORTE_REQUERIDO');
    const r = await Reporte.porId(d.reporte_id);
    if (!r || r.estado !== 'ACTIVO') throw new ErrorApp(404, 'Reporte no encontrado.', 'NO_ENCONTRADO');
    if (r.usuaria_id === uid) throw new ErrorApp(400, 'No puedes confirmar tu propio reporte.', 'PROPIO');
    if (await Verificacion.yaConfirmo(uid, r.id)) throw new ErrorApp(409, 'Ya confirmaste este reporte.', 'YA_CONFIRMADO');
    d.lat = r.lat;
    d.lng = r.lng;
  } else {
    // Antiabuso: sin duplicados cercanos en poco tiempo, y tope diario de puntos.
    const { m, h } = REPETICION[d.tipo];
    const previas = await Verificacion.recientesDeTipo(uid, d.tipo, h);
    if (previas.some((p) => haversine(p, d)  < m)) throw new ErrorApp(409, 'Ya aportaste este dato aquí hace poco. ¡Gracias!', 'DUPLICADO');
  }
  if ((await Verificacion.puntosHoy(uid)) >= config.puntosDiariosMax) {
    throw new ErrorApp(429, 'Llegaste al tope de puntos de hoy. Tus aportes siguen sumando al mapa; mañana vuelves a ganar.', 'TOPE_DIARIO');
  }

  const puntos = PUNTOS[d.tipo];
  await Verificacion.crear({ usuariaId: uid, tipo: d.tipo, lat: d.lat, lng: d.lng, reporteId: d.reporte_id, puntos });
  if (d.tipo === 'REPORTE_CONFIRMADO') await Reporte.sumarConfirmacion(d.reporte_id);
  await Usuaria.sumarPuntos(uid, puntos);
  const insignias = await evaluarInsignias(uid);
  const yo = await Usuaria.porId(uid);
  res.status(201).json({ puntos_ganados: puntos, puntos_totales: yo.puntos, nivel: nivelPara(yo.puntos), insignias_nuevas: insignias });
}

export async function perfil(req, res) {
  const yo = await Usuaria.porId(req.usuaria.id);
  const [prog, otorgadas, actividad] = await Promise.all([progreso(yo.id), Insignia.deUsuaria(yo.id), Verificacion.ultimos30dias(yo.id)]);
  const fechas = new Map(otorgadas.map((o) => [o.codigo, new Date(o.otorgada_en).toISOString()]));
  res.json({
    usuaria: { id: yo.id, nombre: yo.nombre, rol: yo.rol, puntos: yo.puntos },
    nivel: nivelPara(yo.puntos),
    insignias: prog.map((i) => ({ codigo: i.codigo, nombre: i.nombre, descripcion: i.descripcion, meta: i.meta, actual: i.actual, otorgada_en: fechas.get(i.codigo) ?? null })),
    total_insignias: CATALOGO.length,
    actividad: actividad.map((a) => ({ tipo: a.tipo, fecha: new Date(a.creada_en).toISOString() })),
  });
}
