import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { iniciarServidor } from './helper.js';

const { config } = await import('../src/config.js');
const { usarGeocodificador } = await import('../src/services/externos.js');

let s;
let mod;
let municipio;
before(async () => {
  s = await iniciarServidor();
  mod = await s.ingresar('moderadora@demo.co');
  const ana = await s.registrar('Base', 'base@mod.co');
  municipio = (await s.pedir('GET', '/municipios', { token: ana })).cuerpo.municipios.find((m) => m.nombre === 'Zipaquirá');
});
after(() => s.cerrar());

describe('panel de moderación', () => {
  test('un reporte nuevo aparece en «todos los reportes» aunque nadie lo haya denunciado', async () => {
    const t = await s.registrar('Autora', 'autora@mod.co');
    const r = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Parque nuevo', categoria: 'DESOLADO' } });
    const lista = await s.pedir('GET', '/moderacion/reportes?estado=ACTIVO&limite=200', { token: mod });
    assert.ok(lista.cuerpo.reportes.some((x) => x.id === r.cuerpo.reporte.id));
    // La cola de revisión sigue siendo solo lo denunciado.
    const cola = await s.pedir('GET', '/moderacion/cola', { token: mod });
    assert.ok(!cola.cuerpo.reportes.some((x) => x.id === r.cuerpo.reporte.id));
  });

  test('la moderadora ve un alias anónimo de la autora, nunca su identidad', async () => {
    const lista = await s.pedir('GET', '/moderacion/reportes?limite=50', { token: mod });
    const texto = JSON.stringify(lista.cuerpo);
    assert.match(lista.cuerpo.reportes[0].alias_autora, /^N-[0-9A-F]{5}$/);
    assert.ok(!/usuaria_id|email|autora@mod\.co|password/i.test(texto));
  });

  test('puede ocultar un reporte activo con justificación y marcarlo como atendido', async () => {
    const t = await s.registrar('Autora2', 'autora2@mod.co');
    const id = (await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Esquina', categoria: 'ACOSO' } })).cuerpo.reporte.id;
    assert.equal((await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'OCULTAR', nota: 'x' } })).estado, 400);
    const oculto = await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'OCULTAR', nota: 'Contenido ofensivo hacia una persona' } });
    assert.equal(oculto.cuerpo.estado, 'OCULTO');
    const publicos = await s.pedir('GET', `/reportes?municipio_id=${municipio.id}&limite=200`, { token: t });
    assert.ok(!publicos.cuerpo.reportes.some((x) => x.id === id));
    assert.equal((await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'OCULTAR', nota: 'Otra vez' } })).estado, 409);
    await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'RESTAURAR', nota: 'Se verificó que era legítimo' } });
    const atendido = await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'RESUELTO', nota: 'La alcaldía arregló el alumbrado' } });
    assert.equal(atendido.cuerpo.estado, 'RESUELTO');
  });

  test('limitar la publicación de una autora es temporal, auditado y reversible; no existe borrar cuentas', async () => {
    const t = await s.registrar('Abusiva', 'abusiva@mod.co');
    const id = (await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Calle falsa', categoria: 'ACOSO' } })).cuerpo.reporte.id;
    const r = await s.pedir('POST', `/moderacion/reportes/${id}/limitar-autora`, { token: mod, cuerpo: { dias: 7, nota: 'Reportes repetidos sin fundamento' } });
    assert.equal(r.estado, 200);
    assert.match(r.cuerpo.alias_autora, /^N-/);
    const bloqueado = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Otro lugar', categoria: 'ACOSO' } });
    assert.equal(bloqueado.estado, 403);
    assert.equal(bloqueado.cuerpo.error.codigo, 'PUBLICACION_LIMITADA');
    // Sigue pudiendo iniciar sesión y consultar: no pierde su cuenta.
    assert.equal((await s.pedir('GET', '/perfil', { token: t })).estado, 200);
    await s.pedir('POST', `/moderacion/reportes/${id}/limitar-autora`, { token: mod, cuerpo: { dias: 0, nota: 'Apelación aceptada' } });
    assert.equal((await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Otro lugar', categoria: 'ACOSO' } })).estado, 201);
    const aud = await s.pedir('GET', '/moderacion/auditoria', { token: mod });
    assert.ok(aud.cuerpo.eventos.some((e) => e.accion === 'AUTORA_LIMITADA' && /N-/.test(e.detalle)));
    assert.equal((await s.pedir('DELETE', `/moderacion/usuarias/1`, { token: mod })).estado, 404, 'no hay ruta para borrar cuentas');
  });

  test('una usuaria común no puede usar ninguna función de moderación', async () => {
    const t = await s.registrar('Comun', 'comun@mod.co');
    for (const [m, ruta] of [['GET', '/moderacion/reportes'], ['GET', '/moderacion/metricas'], ['GET', '/moderacion/luminarias-danadas'], ['GET', `/moderacion/puntos?municipio_id=${municipio.id}`]]) {
      assert.equal((await s.pedir(m, ruta, { token: t })).estado, 403, ruta);
    }
  });
});

describe('curaduría de datos de seguridad y métricas', () => {
  test('marcar una luminaria como reparada devuelve la seguridad de la ruta', async () => {
    const t = await s.registrar('Vecina', 'vecina@mod.co');
    const v = await s.pedir('POST', '/verificaciones', { token: t, cuerpo: { tipo: 'LUMINARIA_DANADA', lat: municipio.lat + 0.004, lng: municipio.lng + 0.004 } });
    assert.equal(v.estado, 201);
    const pendientes = await s.pedir('GET', '/moderacion/luminarias-danadas', { token: mod });
    const mia = pendientes.cuerpo.luminarias.find((l) => Math.abs(l.lat - (municipio.lat + 0.004)) < 1e-6);
    assert.ok(mia);
    assert.equal((await s.pedir('POST', `/moderacion/luminarias-danadas/${mia.id}/reparar`, { token: mod, cuerpo: { nota: 'Reparada por la alcaldía' } })).estado, 200);
    const despues = await s.pedir('GET', '/moderacion/luminarias-danadas', { token: mod });
    assert.ok(!despues.cuerpo.luminarias.some((l) => l.id === mia.id));
    const capas = await s.pedir('GET', `/capas/${municipio.id}`, { token: t });
    assert.ok(!capas.cuerpo.luminarias_danadas.some((l) => Math.abs(l.lat - (municipio.lat + 0.004)) < 1e-6));
  });

  test('crear y desactivar puntos de seguridad (solo dentro del municipio)', async () => {
    const lejos = await s.pedir('POST', '/moderacion/puntos', { token: mod, cuerpo: { tipo: 'CAMARA', municipio_id: municipio.id, lat: 4.0, lng: -73.0 } });
    assert.equal(lejos.estado, 422);
    const ok = await s.pedir('POST', '/moderacion/puntos', { token: mod, cuerpo: { tipo: 'COMERCIO', nombre: 'Tienda nueva', municipio_id: municipio.id, lat: municipio.lat, lng: municipio.lng, abre: 0, cierra: 24 } });
    assert.equal(ok.estado, 201);
    const t = await s.registrar('Lectora', 'lectora@mod.co');
    const antes = (await s.pedir('GET', `/capas/${municipio.id}`, { token: t })).cuerpo.comercios.length;
    await s.pedir('POST', `/moderacion/puntos/${ok.cuerpo.id}/estado`, { token: mod, cuerpo: { activo: false, nota: 'El comercio cerró' } });
    const despues = (await s.pedir('GET', `/capas/${municipio.id}`, { token: t })).cuerpo.comercios.length;
    assert.equal(despues, antes - 1);
  });

  test('las métricas son agregadas y anónimas', async () => {
    const m = await s.pedir('GET', '/moderacion/metricas', { token: mod });
    assert.equal(m.estado, 200);
    assert.equal(m.cuerpo.por_hora.length, 24);
    assert.ok(m.cuerpo.por_municipio.length > 0);
    assert.ok(!/email|nombre_usuaria|password/i.test(JSON.stringify(m.cuerpo)));
  });
});

describe('verificación de que la ubicación existe', () => {
  const LUGAR = { nombre: 'Parque La Independencia, Zipaquirá', lat: 5.0224, lng: -74.0046 };
  before(() => { config.verificarUbicacion = true; });
  after(() => { config.verificarUbicacion = false; usarGeocodificador(null); });

  test('rechaza una referencia inventada', async () => {
    usarGeocodificador(async () => []);
    const t = await s.registrar('Geo1', 'geo1@mod.co');
    const r = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'asdfgh qwerty', categoria: 'DESOLADO' } });
    assert.equal(r.estado, 422);
    assert.equal(r.cuerpo.error.codigo, 'REFERENCIA_NO_ENCONTRADA');
  });

  test('rechaza un punto marcado lejos del lugar de la referencia', async () => {
    usarGeocodificador(async () => [LUGAR]);
    const t = await s.registrar('Geo2', 'geo2@mod.co');
    const r = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Parque La Independencia', categoria: 'DESOLADO', lat: LUGAR.lat + 0.02, lng: LUGAR.lng } });
    assert.equal(r.estado, 422);
    assert.equal(r.cuerpo.error.codigo, 'PUNTO_NO_COINCIDE');
  });

  test('rechaza un punto fuera del municipio', async () => {
    usarGeocodificador(async () => [LUGAR]);
    const t = await s.registrar('Geo3', 'geo3@mod.co');
    const r = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Parque La Independencia', categoria: 'DESOLADO', lat: 4.3, lng: -74.8 } });
    assert.equal(r.estado, 422);
    assert.equal(r.cuerpo.error.codigo, 'FUERA_DE_MUNICIPIO');
  });

  test('acepta una referencia real y usa sus coordenadas verificadas', async () => {
    usarGeocodificador(async () => [LUGAR]);
    const t = await s.registrar('Geo4', 'geo4@mod.co');
    const r = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Parque La Independencia', categoria: 'ILUMINACION' } });
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.reporte.precision_ubicacion, 'EXACTA');
    assert.equal(r.cuerpo.reporte.lat, LUGAR.lat);
    const cerca = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Parque La Independencia', categoria: 'ILUMINACION', lat: LUGAR.lat + 0.002, lng: LUGAR.lng } });
    assert.equal(cerca.estado, 201);
  });

  test('si el servicio de lugares no responde, no se publica un reporte sin verificar', async () => {
    const { ServicioNoDisponible } = await import('../src/services/externos.js');
    usarGeocodificador(async () => { throw new ServicioNoDisponible('Nominatim'); });
    const t = await s.registrar('Geo5', 'geo5@mod.co');
    const r = await s.pedir('POST', '/reportes', { token: t, cuerpo: { municipio_id: municipio.id, referencia: 'Parque La Independencia', categoria: 'ILUMINACION' } });
    assert.equal(r.estado, 503);
    assert.equal(r.cuerpo.error.codigo, 'UBICACION_NO_VERIFICABLE');
  });
});
