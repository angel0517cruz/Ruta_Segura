import { haversine, horaColombia } from '../../shared/geo.js';
import { ErrorApp } from '../middleware/errores.js';
import { Municipio } from '../models/municipio.js';
import { Reporte } from '../models/reporte.js';
import { generarCandidatas } from '../services/candidatas.js';
import { celdasDeCalor, riesgoDeCalles } from '../services/calor.js';
import { contextoDesde, datosParaTrayecto } from '../services/contexto.js';
import { callesOsm, geocodificar } from '../services/externos.js';
import { evaluarRuta, elegirRecomendada } from '../services/seguridadRuta.js';
import { bboxSchema, rutaSchema } from '../services/validaciones.js';
import { PuntoSeguridad, Verificacion } from '../models/comunidad.js';
import { config } from '../config.js';

const MAX_CAMINATA_M = 8000;

export async function municipios(req, res) {
  res.json({ municipios: await Municipio.todos() });
}

export async function geocodificarReferencia(req, res) {
  const q = String(req.query.q ?? '').trim();
  const municipio = await Municipio.porId(Number(req.query.municipio_id));
  if (q.length < 3 || q.length > 120 || !municipio) throw new ErrorApp(400, 'Indica un lugar (mínimo 3 letras) y un municipio.', 'PARAMETROS');
  res.json({ resultados: await geocodificar(q, municipio) });
}

export async function planificar(req, res) {
  const { origen, destino, hora = horaColombia() } = rutaSchema.parse(req.body);
  if (haversine(origen, destino) < 60) throw new ErrorApp(422, 'El origen y el destino están casi en el mismo lugar.', 'TRAYECTO_CORTO');
  if (haversine(origen, destino) > MAX_CAMINATA_M) throw new ErrorApp(422, 'El trayecto supera los 8 km: Luma está pensada para caminatas.', 'TRAYECTO_LARGO');
  const datos = await datosParaTrayecto(origen, destino, { usarOsm: config.apis.habilitadas });
  if (!datos.municipio) throw new ErrorApp(422, 'Por ahora cubrimos municipios de Cundinamarca de la lista.', 'FUERA_DE_COBERTURA');

  const ctx = contextoDesde(datos);
  const candidatas = await generarCandidatas(origen, destino, datos, hora);
  const evaluadas = candidatas.map((c) => ({ ...c, ...evaluarRuta(c.coords, ctx, hora) }));
  const { rutas, recomendada } = elegirRecomendada(evaluadas);
  res.json({
    hora,
    municipio: { id: datos.municipio.id, nombre: datos.municipio.nombre },
    recomendada,
    fuentes: datos.fuentes,
    aviso: rutas.some((r) => r.fuente === 'estimada')
      ? 'Sin conexión al servicio de calles: mostramos trayectos estimados en línea recta. Verifica el camino a la vista.'
      : null,
    rutas: rutas.map((r) => ({
      id: r.id,
      etiqueta: r.etiqueta,
      fuente: r.fuente,
      puntaje: r.puntaje,
      distancia_m: r.distancia_m,
      duracion_s: r.duracion_s,
      desglose: r.desglose,
      tramo_critico: r.tramo_critico,
      tramos: r.tramos,
      coords: r.coords.map(({ lat, lng }) => ({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })),
    })),
  });
}

export async function capas(req, res) {
  const municipio = await Municipio.porId(Number(req.params.id));
  if (!municipio) throw new ErrorApp(404, 'Municipio no encontrado.', 'NO_ENCONTRADO');
  const [puntos, danadas, abiertos] = await Promise.all([
    PuntoSeguridad.delMunicipio(municipio.id),
    Verificacion.vigentesLuminarias(),
    Verificacion.vigentesComercios(),
  ]);
  const cerca = (p) => haversine(p, municipio) < 15_000;
  res.json({
    municipio,
    luminarias: puntos.filter((p) => p.tipo === 'LUMINARIA'),
    camaras: puntos.filter((p) => p.tipo === 'CAMARA'),
    comercios: puntos.filter((p) => p.tipo === 'COMERCIO'),
    luminarias_danadas: danadas.filter(cerca),
    comercios_confirmados: abiertos.filter(cerca),
  });
}

export async function mapaCalor(req, res) {
  const municipio = await Municipio.porId(Number(req.query.municipio_id));
  if (!municipio) throw new ErrorApp(400, 'Elige un municipio.', 'MUNICIPIO');
  const hora = req.query.hora == null ? horaColombia() : Math.min(23, Math.max(0, Math.trunc(Number(req.query.hora)) || 0));
  const reportes = await Reporte.activos(municipio.id);
  res.json({
    hora,
    municipio: { id: municipio.id, nombre: municipio.nombre, lat: municipio.lat, lng: municipio.lng },
    total_reportes: reportes.length,
    celdas: celdasDeCalor(reportes, hora),
    aviso: 'Estimación basada en reportes ciudadanos; no es una predicción de delitos ni garantiza seguridad.',
  });
}

export async function callesEnRiesgo(req, res) {
  const { sur, oeste, norte, este, hora = horaColombia() } = bboxSchema.parse(req.query);
  if (norte - sur > 0.03 || este - oeste > 0.03) throw new ErrorApp(400, 'Acerca el mapa para ver el riesgo por calle.', 'ZONA_GRANDE');
  const centro = { lat: (norte + sur) / 2, lng: (este + oeste) / 2 };
  const municipio = await Municipio.masCercano(centro);
  const calles = await callesOsm({ sur, oeste, norte, este });
  if (!municipio || !calles) return res.json({ hora, calles: [], disponible: false });
  const reportes = await Reporte.activos(municipio.id);
  res.json({ hora, disponible: true, calles: riesgoDeCalles(calles, reportes, hora) });
}
