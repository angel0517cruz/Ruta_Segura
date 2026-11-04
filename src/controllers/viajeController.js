import { ErrorApp } from '../middleware/errores.js';
import { Municipio } from '../models/municipio.js';
import { Placa, Viaje } from '../models/viaje.js';
import { placaSchema, viajeSchema } from '../services/validaciones.js';

async function propio(req) {
  const v = await Viaje.deUsuaria(Number(req.params.id), req.usuaria.id);
  if (!v) throw new ErrorApp(404, 'Viaje no encontrado.', 'NO_ENCONTRADO');
  return v;
}

export async function iniciar(req, res) {
  const d = viajeSchema.parse(req.body);
  await Viaje.cerrarActivos(req.usuaria.id);
  const municipio = await Municipio.masCercano(d.ruta.coords[0]);
  const viaje = await Viaje.crear({
    usuariaId: req.usuaria.id,
    municipioId: municipio?.id,
    origenTexto: d.origen_texto,
    destinoTexto: d.destino_texto,
    ruta: d.ruta,
  });
  res.status(201).json({ viaje });
}

export async function actual(req, res) {
  const viaje = await Viaje.actual(req.usuaria.id);
  res.json({ viaje, placa: viaje ? await Placa.deViaje(viaje.id) : null });
}

export async function registrarDesvio(req, res) {
  const v = await propio(req);
  if (v.estado !== 'EN_CURSO') throw new ErrorApp(409, 'Este viaje ya terminó.', 'VIAJE_CERRADO');
  await Viaje.sumarDesvio(v.id);
  res.status(204).end();
}

async function cerrar(req, res, estado) {
  const v = await propio(req);
  if (v.estado !== 'EN_CURSO') throw new ErrorApp(409, 'Este viaje ya terminó.', 'VIAJE_CERRADO');
  await Viaje.terminar(v.id, estado);
  res.json({ viaje: await Viaje.deUsuaria(v.id, req.usuaria.id) });
}
export const finalizar = (req, res) => cerrar(req, res, 'FINALIZADO');
export const cancelar = (req, res) => cerrar(req, res, 'CANCELADO');

// --- Registro rápido de transporte: la placa queda cifrada y ligada al viaje, con fecha de vencimiento.
export async function guardarPlaca(req, res) {
  const v = await propio(req);
  if (v.estado !== 'EN_CURSO') throw new ErrorApp(409, 'Solo puedes registrar placa en un viaje en curso.', 'VIAJE_CERRADO');
  const d = placaSchema.parse(req.body);
  res.status(201).json(await Placa.guardar(v.id, d.placa, d.foto));
}

export async function verPlaca(req, res) {
  const v = await propio(req);
  const placa = await Placa.deViaje(v.id);
  if (!placa) throw new ErrorApp(404, 'No hay placa registrada (o ya venció).', 'SIN_PLACA');
  res.set('Cache-Control', 'no-store').json(placa);
}

export async function borrarPlaca(req, res) {
  const v = await propio(req);
  await Placa.borrar(v.id);
  res.status(204).end();
}
