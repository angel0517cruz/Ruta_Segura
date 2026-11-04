import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  distanciaAPolilinea, haversine, horaColombia, IndiceEspacial, longitudPolilinea, MonitorDesvio, muestrearPolilinea,
} from '../shared/geo.js';

const origen = { lat: 5.0224, lng: -74.0046 };
const aMetrosNorte = (m) => ({ lat: origen.lat + m / 111320, lng: origen.lng });
const aMetrosEste = (m) => ({ lat: origen.lat, lng: origen.lng + m / (111320 * Math.cos((origen.lat * Math.PI) / 180)) });

test('haversine: 1° de latitud ≈ 111 km y distancia a sí mismo = 0', () => {
  assert.equal(haversine(origen, origen), 0);
  const d = haversine({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
  assert.ok(Math.abs(d - 111195) < 100);
});

test('distancia a polilínea y avance acumulado', () => {
  const linea = [origen, aMetrosNorte(500)];
  const lateral = distanciaAPolilinea({ lat: origen.lat + 200 / 111320, lng: aMetrosEste(30).lng }, linea);
  assert.ok(Math.abs(lateral.dist - 30) < 1);
  assert.ok(Math.abs(lateral.avance - 200) < 2);
});

test('muestreo cada 25 m conserva la longitud total', () => {
  const linea = [origen, aMetrosNorte(500)];
  const m = muestrearPolilinea(linea, 25);
  assert.equal(m.length, 21);
  assert.ok(Math.abs(longitudPolilinea(m) - 500) < 1);
});

test('índice espacial devuelve solo puntos dentro del radio', () => {
  const idx = new IndiceEspacial([aMetrosNorte(30), aMetrosNorte(200), aMetrosEste(60)]);
  assert.equal(idx.cerca(origen, 70).length, 2);
  assert.equal(idx.cerca(origen, 10).length, 0);
});

test('monitor de desvío: ignora un salto de GPS, alerta tras 3 lecturas y se recupera', () => {
  const ruta = [origen, aMetrosNorte(600)];
  const m = new MonitorDesvio(ruta, { umbralM: 45, consecutivos: 3 });
  const fuera = { lat: origen.lat + 100 / 111320, lng: aMetrosEste(120).lng };
  const dentro = { lat: origen.lat + 150 / 111320, lng: origen.lng + 0.00001 };

  assert.equal(m.actualizar(dentro).estado, 'EN_RUTA');
  assert.equal(m.actualizar(fuera).estado, 'EN_RUTA'); // lectura 1: puede ser ruido
  assert.equal(m.actualizar(dentro).estado, 'EN_RUTA'); // se reinicia el contador
  m.actualizar(fuera);
  m.actualizar(fuera);
  const alerta = m.actualizar(fuera);
  assert.equal(alerta.estado, 'ALERTA');
  assert.ok(alerta.desviacionM >= 110);
  assert.equal(m.actualizar(fuera).estado, 'ALERTA');
  assert.equal(m.actualizar(dentro).estado, 'RECUPERADA');
});

test('monitor de desvío: detecta llegada', () => {
  const ruta = [origen, aMetrosNorte(300)];
  const m = new MonitorDesvio(ruta);
  assert.equal(m.actualizar(aMetrosNorte(295)).estado, 'LLEGADA');
});

test('hora de Colombia es independiente de la zona del servidor', () => {
  assert.equal(horaColombia(new Date('2026-01-01T03:30:00Z')), 22); // UTC-5
});
