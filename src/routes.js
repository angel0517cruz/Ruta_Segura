import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from './controllers/authController.js';
import * as comunidad from './controllers/comunidadController.js';
import * as moderacion from './controllers/moderacionController.js';
import * as reportes from './controllers/reporteController.js';
import * as rutas from './controllers/rutaController.js';
import * as viajes from './controllers/viajeController.js';
import { requiereRol, requiereSesion } from './middleware/auth.js';
import { config } from './config.js';

const limite = (ventanaMin, max) =>
  rateLimit({
    windowMs: ventanaMin * 60_000,
    limit: process.env.NODE_ENV === 'test' ? 10_000 : max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' } },
  });

export function crearRutas() {
  const api = Router();
  api.use(limite(15, 600));

  api.get('/salud', (req, res) => res.json({ estado: 'ok', demo: config.demo }));
  api.get('/municipios', rutas.municipios); // tabla de referencia pública: la necesita el formulario de registro

  // Autenticación (límite estricto contra fuerza bruta y relleno de credenciales)
  api.post('/auth/registro', limite(60, 15), auth.registro);
  api.post('/auth/login', limite(15, 20), auth.login);

  // Todo lo demás exige JWT
  api.use(requiereSesion);
  api.get('/auth/yo', auth.yo);
  api.get('/geocodificar', limite(1, 30), rutas.geocodificarReferencia);
  api.get('/capas/:id', rutas.capas);

  api.get('/reportes', reportes.listar);
  api.post('/reportes', reportes.crear);
  api.delete('/reportes/:id', reportes.eliminar);
  api.post('/reportes/:id/denunciar', reportes.denunciar);

  api.post('/verificaciones', comunidad.verificar);
  api.get('/perfil', comunidad.perfil);

  api.post('/rutas/planificar', limite(1, 30), rutas.planificar);
  api.get('/mapa-calor', rutas.mapaCalor);
  api.get('/mapa-calor/calles', limite(1, 30), rutas.callesEnRiesgo);

  api.get('/viajes/actual', viajes.actual);
  api.post('/viajes', viajes.iniciar);
  api.post('/viajes/:id/desvio', viajes.registrarDesvio);
  api.post('/viajes/:id/finalizar', viajes.finalizar);
  api.post('/viajes/:id/cancelar', viajes.cancelar);
  api.put('/viajes/:id/placa', viajes.guardarPlaca);
  api.get('/viajes/:id/placa', viajes.verPlaca);
  api.delete('/viajes/:id/placa', viajes.borrarPlaca);

  const mod = [requiereRol('MODERADORA')];
  api.get('/moderacion/cola', ...mod, moderacion.cola);
  api.get('/moderacion/reportes', ...mod, moderacion.reportes);
  api.post('/moderacion/reportes/:id/resolver', ...mod, moderacion.resolver);
  api.post('/moderacion/reportes/:id/limitar-autora', ...mod, moderacion.limitarAutora);
  api.get('/moderacion/puntos', ...mod, moderacion.puntos);
  api.post('/moderacion/puntos', ...mod, moderacion.crearPunto);
  api.post('/moderacion/puntos/:id/estado', ...mod, moderacion.estadoPunto);
  api.get('/moderacion/luminarias-danadas', ...mod, moderacion.luminariasDanadas);
  api.post('/moderacion/luminarias-danadas/:id/reparar', ...mod, moderacion.repararLuminaria);
  api.get('/moderacion/metricas', ...mod, moderacion.metricas);
  api.get('/moderacion/auditoria', ...mod, moderacion.auditoria);

  return api;
}
