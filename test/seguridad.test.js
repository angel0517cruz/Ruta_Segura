import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearContexto, seguridadEnPunto } from '../src/services/seguridadRuta.js';

const punto = { lat: 5.0224, lng: -74.0046 };
const luces = [{ lat: punto.lat + 0.0001, lng: punto.lng }, { lat: punto.lat, lng: punto.lng + 0.0001 }];

test('la iluminación pesa más de noche que de día', () => {
  const con = crearContexto({ luces, camaras: [], comercios: [], reportes: [] });
  const sin = crearContexto({ luces: [], camaras: [], comercios: [], reportes: [] });
  const aporte = (hora) => seguridadEnPunto(punto, con, hora).seguridad - seguridadEnPunto(punto, sin, hora).seguridad;
  assert.ok(aporte(22) > aporte(13), `noche ${aporte(22).toFixed(2)} debe ser mayor que día ${aporte(13).toFixed(2)}`);
  assert.ok(Math.abs(aporte(22) - 0.34) < 1e-9);
  assert.ok(Math.abs(aporte(13) - 0.12) < 1e-9);
});

test('un reporte de acoso a esa hora baja la seguridad del punto', () => {
  const reporte = { lat: punto.lat, lng: punto.lng, categoria: 'ACOSO', hora: 22, confirmaciones: 0, creado_en: new Date().toISOString() };
  const con = crearContexto({ luces, camaras: [], comercios: [], reportes: [reporte] });
  const sin = crearContexto({ luces, camaras: [], comercios: [], reportes: [] });
  assert.ok(seguridadEnPunto(punto, con, 22).seguridad < seguridadEnPunto(punto, sin, 22).seguridad);
});
