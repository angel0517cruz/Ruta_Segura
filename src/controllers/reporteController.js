import { createHash } from 'node:crypto';
import { haversine, horaColombia } from '../../shared/geo.js';
import { config } from '../config.js';
import { ErrorApp } from '../middleware/errores.js';
import { Auditoria } from '../models/comunidad.js';
import { Municipio } from '../models/municipio.js';
import { Reporte, vistaPublica } from '../models/reporte.js';
import { Usuaria } from '../models/usuaria.js';
import { geocodificar } from '../services/externos.js';
import { evaluarInsignias, PUNTOS } from '../services/insignias.js';
import { denunciaSchema, filtroReportesSchema, reporteSchema } from '../services/validaciones.js';

/** Posición aproximada y estable (misma referencia → mismo punto) cuando no se puede geocodificar. */
function puntoAproximado(municipio, referencia) {
  const h = createHash('sha256').update(`${municipio.id}:${referencia.toLowerCase()}`).digest();
  const angulo = (h[0] / 255) * 2 * Math.PI;
  const metros = 150 + (h[1] / 255) * 650;
  return {
    lat: municipio.lat + (Math.sin(angulo) * metros) / 111320,
    lng: municipio.lng + (Math.cos(angulo) * metros) / (111320 * Math.cos((municipio.lat * Math.PI) / 180)),
  };
}

export async function crear(req, res) {
  const d = reporteSchema.parse(req.body);
  const municipio = await Municipio.porId(d.municipio_id);
  if (!municipio) throw new ErrorApp(400, 'Municipio no válido.', 'MUNICIPIO');
  if ((await Reporte.contarUltimaHora(req.usuaria.id)) >= config.limiteReportesHora) {
    throw new ErrorApp(429, 'Llegaste al límite de reportes por hora. Gracias por cuidar tu entorno; vuelve más tarde.', 'LIMITE_REPORTES');
  }

  let punto;
  let precision = 'EXACTA';
  if (d.lat != null && d.lng != null) {
    punto = { lat: d.lat, lng: d.lng };
    if (haversine(punto, municipio) > 20_000) throw new ErrorApp(422, 'Ese punto está lejos del municipio elegido.', 'FUERA_DE_MUNICIPIO');
  } else {
    const [mejor] = await geocodificar(d.referencia, municipio);
    if (mejor) punto = { lat: mejor.lat, lng: mejor.lng };
    else {
      punto = puntoAproximado(municipio, d.referencia);
      precision = 'APROXIMADA';
    }
  }

  const reporte = await Reporte.crear({
    usuariaId: req.usuaria.id,
    municipioId: municipio.id,
    referencia: d.referencia,
    categoria: d.categoria,
    descripcion: d.descripcion || null,
    lat: punto.lat,
    lng: punto.lng,
    precision,
    hora: d.hora ?? horaColombia(),
  });
  await Usuaria.sumarPuntos(req.usuaria.id, PUNTOS.REPORTE_PUBLICADO);
  const insignias = await evaluarInsignias(req.usuaria.id);
  res.status(201).json({ reporte: vistaPublica(reporte, req.usuaria.id), puntos_ganados: PUNTOS.REPORTE_PUBLICADO, insignias_nuevas: insignias });
}

export async function listar(req, res) {
  const f = filtroReportesSchema.parse(req.query);
  const origen = f.lat != null && f.lng != null ? { lat: f.lat, lng: f.lng } : null;
  let filas = await Reporte.activos(f.municipio_id);
  if (f.categoria) filas = filas.filter((r) => r.categoria === f.categoria);
  const salida = filas.map((r) => vistaPublica(r, req.usuaria.id, origen));
  // Orden pedido por el reto: por cercanía; si no hay ubicación, los más recientes primero.
  if (origen) salida.sort((a, b) => a.distancia_m - b.distancia_m);
  else salida.sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  res.json({ total: salida.length, reportes: salida.slice(0, f.limite) });
}

export async function eliminar(req, res) {
  const r = await Reporte.porId(Number(req.params.id));
  if (!r) throw new ErrorApp(404, 'Reporte no encontrado.', 'NO_ENCONTRADO');
  if (r.usuaria_id !== req.usuaria.id) throw new ErrorApp(403, 'Solo puedes eliminar tus propios reportes.', 'PROHIBIDO');
  await Reporte.eliminar(r.id);
  await Auditoria.registrar(req.usuaria.id, 'REPORTE_ELIMINADO_POR_AUTORA', `reporte ${r.id}`);
  res.status(204).end();
}

export async function denunciar(req, res) {
  const { motivo } = denunciaSchema.parse(req.body ?? {});
  const r = await Reporte.porId(Number(req.params.id));
  if (!r || r.estado !== 'ACTIVO') throw new ErrorApp(404, 'Reporte no encontrado.', 'NO_ENCONTRADO');
  if (r.usuaria_id === req.usuaria.id) throw new ErrorApp(400, 'No puedes denunciar tu propio reporte; puedes eliminarlo.', 'PROPIO');
  const total = await Reporte.denunciar(r.id, req.usuaria.id, motivo);
  if (total === null) throw new ErrorApp(409, 'Ya denunciaste este reporte.', 'YA_DENUNCIADO');
  // Un humano decide: el sistema solo lo aparta de la vista pública y lo manda a la cola de moderación.
  let enRevision = false;
  if (total >= config.umbralDenuncias) {
    await Reporte.cambiarEstado(r.id, 'EN_REVISION');
    await Auditoria.registrar(null, 'REPORTE_A_REVISION', `reporte ${r.id} con ${total} denuncias`);
    enRevision = true;
  }
  res.status(202).json({ mensaje: 'Gracias. Una persona del equipo revisará este reporte.', en_revision: enRevision });
}
