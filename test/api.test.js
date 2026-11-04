import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { iniciarServidor } from './helper.js';

let s;
let token;
let municipio;
before(async () => {
  s = await iniciarServidor();
  token = await s.registrar('Ana Prueba', 'ana@test.co');
  municipio = (await s.pedir('GET', '/municipios', { token })).cuerpo.municipios.find((m) => m.nombre === 'Zipaquirá');
});
after(() => s.cerrar());

describe('autenticación y autorización (JWT)', () => {
  test('rechaza rutas protegidas sin token o con token falso', async () => {
    assert.equal((await s.pedir('GET', '/reportes')).estado, 401);
    assert.equal((await s.pedir('GET', '/reportes', { token: 'abc.def.ghi' })).estado, 401);
  });

  test('registro valida contraseña y no permite elegir rol', async () => {
    const debil = await s.pedir('POST', '/auth/registro', { cuerpo: { nombre: 'Ana', email: 'x@test.co', password: 'corta' } });
    assert.equal(debil.estado, 400);
    const intento = await s.pedir('POST', '/auth/registro', { cuerpo: { nombre: 'Eva', email: 'eva@test.co', password: 'Clave1234', rol: 'MODERADORA' } });
    assert.equal(intento.estado, 201);
    assert.equal(intento.cuerpo.usuaria.rol, 'USUARIA');
  });

  test('login usa el mismo mensaje para correo inexistente y clave errónea', async () => {
    const a = await s.pedir('POST', '/auth/login', { cuerpo: { email: 'nadie@test.co', password: 'Clave1234' } });
    const b = await s.pedir('POST', '/auth/login', { cuerpo: { email: 'ana@test.co', password: 'Incorrecta1' } });
    assert.equal(a.estado, 401);
    assert.equal(b.estado, 401);
    assert.equal(a.cuerpo.error.mensaje, b.cuerpo.error.mensaje);
  });

  test('bloquea la cuenta tras 5 intentos fallidos', async () => {
    await s.registrar('Bea', 'bea@test.co');
    for (let i = 0; i < 5; i++) await s.pedir('POST', '/auth/login', { cuerpo: { email: 'bea@test.co', password: 'Mala12345' } });
    const r = await s.pedir('POST', '/auth/login', { cuerpo: { email: 'bea@test.co', password: 'Clave1234' } });
    assert.equal(r.estado, 429);
  });

  test('usuaria común no accede a moderación (control de roles en servidor)', async () => {
    assert.equal((await s.pedir('GET', '/moderacion/cola', { token })).estado, 403);
  });

  test('cabeceras de seguridad presentes', async () => {
    const r = await s.pedir('GET', '/salud');
    assert.match(r.cabeceras.get('content-security-policy'), /default-src 'self'/);
    assert.equal(r.cabeceras.get('x-content-type-options'), 'nosniff');
    assert.equal(r.cabeceras.get('x-powered-by'), null);
  });
});

describe('reportes de riesgo', () => {
  test('crea un reporte, lo lista ordenado por cercanía y filtra por categoría', async () => {
    const nuevo = await s.pedir('POST', '/reportes', {
      token, cuerpo: { municipio_id: municipio.id, referencia: 'Parque de la Independencia', categoria: 'ACOSO', descripcion: 'Grupo molestando', hora: 22 },
    });
    assert.equal(nuevo.estado, 201);
    assert.equal(nuevo.cuerpo.reporte.propia, true);
    assert.equal(nuevo.cuerpo.reporte.precision_ubicacion, 'APROXIMADA'); // sin red: ubicación aproximada y honesta
    assert.equal(nuevo.cuerpo.reporte.usuaria_id, undefined); // privacidad: nunca se expone la autora

    const lista = await s.pedir('GET', `/reportes?municipio_id=${municipio.id}&lat=${municipio.lat}&lng=${municipio.lng}&limite=200`, { token });
    const d = lista.cuerpo.reportes.map((r) => r.distancia_m);
    assert.deepEqual(d, [...d].sort((a, b) => a - b));

    const filtro = await s.pedir('GET', `/reportes?municipio_id=${municipio.id}&categoria=ACOSO`, { token });
    assert.ok(filtro.cuerpo.reportes.length > 0);
    assert.ok(filtro.cuerpo.reportes.every((r) => r.categoria === 'ACOSO'));
  });

  test('rechaza datos personales y HTML en la descripción', async () => {
    for (const descripcion of ['llamar al 3001234567', 'escribe a mal@correo.com', 'mira http://x.co', '<script>alert(1)</script>']) {
      const r = await s.pedir('POST', '/reportes', { token, cuerpo: { municipio_id: municipio.id, referencia: 'Calle 1', categoria: 'DESOLADO', descripcion } });
      assert.equal(r.estado, 400, descripcion);
    }
  });

  test('categoría inválida o inyección SQL no rompen nada', async () => {
    const r = await s.pedir('POST', '/reportes', { token, cuerpo: { municipio_id: municipio.id, referencia: "x'; DROP TABLE reportes;--", categoria: 'OTRA' } });
    assert.equal(r.estado, 400);
    const ok = await s.pedir('POST', '/reportes', { token, cuerpo: { municipio_id: municipio.id, referencia: "x'; DROP TABLE reportes;--", categoria: 'DESOLADO' } });
    assert.equal(ok.estado, 201);
    assert.equal((await s.pedir('GET', '/reportes', { token })).estado, 200);
  });

  test('solo la autora elimina su reporte', async () => {
    const otra = await s.registrar('Otra', 'otra@test.co');
    const r = await s.pedir('POST', '/reportes', { token, cuerpo: { municipio_id: municipio.id, referencia: 'Puente', categoria: 'DESOLADO' } });
    const id = r.cuerpo.reporte.id;
    assert.equal((await s.pedir('DELETE', `/reportes/${id}`, { token: otra })).estado, 403);
    assert.equal((await s.pedir('DELETE', `/reportes/${id}`, { token })).estado, 204);
  });
});

describe('moderación humana (human-in-the-loop)', () => {
  test('dos denuncias envían el reporte a revisión; una moderadora decide y queda auditado', async () => {
    const autora = await s.registrar('Autora', 'autora@test.co');
    const d1 = await s.registrar('Denuncia1', 'd1@test.co');
    const d2 = await s.registrar('Denuncia2', 'd2@test.co');
    const r = await s.pedir('POST', '/reportes', { token: autora, cuerpo: { municipio_id: municipio.id, referencia: 'Esquina X', categoria: 'ACOSO' } });
    const id = r.cuerpo.reporte.id;

    assert.equal((await s.pedir('POST', `/reportes/${id}/denunciar`, { token: d1, cuerpo: {} })).estado, 202);
    assert.equal((await s.pedir('POST', `/reportes/${id}/denunciar`, { token: d1, cuerpo: {} })).estado, 409);
    const segunda = await s.pedir('POST', `/reportes/${id}/denunciar`, { token: d2, cuerpo: {} });
    assert.equal(segunda.cuerpo.en_revision, true);

    const visibles = await s.pedir('GET', `/reportes?municipio_id=${municipio.id}&limite=200`, { token });
    assert.ok(!visibles.cuerpo.reportes.some((x) => x.id === id));

    const mod = await s.ingresar('moderadora@demo.co');
    const cola = await s.pedir('GET', '/moderacion/cola', { token: mod });
    assert.ok(cola.cuerpo.reportes.some((x) => x.id === id));
    assert.equal((await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'RESTAURAR' } })).estado, 400); // exige justificación
    const res = await s.pedir('POST', `/moderacion/reportes/${id}/resolver`, { token: mod, cuerpo: { decision: 'RESTAURAR', nota: 'Revisado: es un reporte legítimo' } });
    assert.equal(res.cuerpo.estado, 'ACTIVO');
    const aud = await s.pedir('GET', '/moderacion/auditoria', { token: mod });
    assert.ok(aud.cuerpo.eventos.some((e) => e.accion === 'REPORTE_RESTAURADO'));
  });
});

describe('rutas seguras', () => {
  const origen = { lat: 5.0224, lng: -74.0046 };
  const destino = { lat: 5.0224 + 0.009, lng: -74.0046 + 0.006 };

  test('planifica, devuelve puntaje, desglose y recomienda la ruta de mayor utilidad', async () => {
    const r = await s.pedir('POST', '/rutas/planificar', { token, cuerpo: { origen, destino, hora: 22 } });
    assert.equal(r.estado, 200);
    const { rutas, recomendada } = r.cuerpo;
    assert.ok(rutas.length >= 1);
    for (const x of rutas) {
      assert.ok(x.puntaje >= 0 && x.puntaje <= 100);
      assert.ok(x.coords.length > 5);
      assert.ok(x.tramos.length > 0);
    }
    const rec = rutas.find((x) => x.id === recomendada);
    const corta = Math.min(...rutas.map((x) => x.distancia_m));
    assert.ok(rec.distancia_m <= corta * 1.6, 'el desvío está acotado');
    assert.ok(r.cuerpo.aviso, 'avisa que son trayectos estimados sin conexión');
  });

  test('rechaza trayectos fuera de cobertura o demasiado largos', async () => {
    const lejos = await s.pedir('POST', '/rutas/planificar', { token, cuerpo: { origen: { lat: 6.2, lng: -75.5 }, destino: { lat: 6.21, lng: -75.51 } } });
    assert.equal(lejos.estado, 422);
    const largo = await s.pedir('POST', '/rutas/planificar', { token, cuerpo: { origen, destino: { lat: 5.2, lng: -74.0 } } });
    assert.equal(largo.estado, 422);
  });
});

describe('mapa de calor predictivo', () => {
  test('la intensidad cambia con la hora de la noche', async () => {
    const total = async (h) => {
      const r = await s.pedir('GET', `/mapa-calor?municipio_id=${municipio.id}&hora=${h}`, { token });
      return r.cuerpo.celdas.reduce((acc, c) => acc + c.intensidad, 0);
    };
    const noche = await total(22);
    const tarde = await total(14);
    assert.ok(noche > tarde * 1.3, `22:00 (${noche.toFixed(2)}) debe ser más riesgosa que 14:00 (${tarde.toFixed(2)})`);
  });
});

describe('registro rápido de transporte (placa temporal cifrada)', () => {
  let viaje;
  const ruta = { coords: [{ lat: 5.0224, lng: -74.0046 }, { lat: 5.0234, lng: -74.0036 }], puntaje: 70 };

  test('valida el formato de placa y la vincula al viaje en curso', async () => {
    const t = await s.registrar('Taxi Ana', 'taxi@test.co');
    viaje = (await s.pedir('POST', '/viajes', { token: t, cuerpo: { ruta } })).cuerpo.viaje;
    assert.equal((await s.pedir('PUT', `/viajes/${viaje.id}/placa`, { token: t, cuerpo: { placa: 'hola' } })).estado, 400);
    const ok = await s.pedir('PUT', `/viajes/${viaje.id}/placa`, { token: t, cuerpo: { placa: 'sxl 123'.replace(' ', '') } });
    assert.equal(ok.estado, 201);
    const leida = await s.pedir('GET', `/viajes/${viaje.id}/placa`, { token: t });
    assert.equal(leida.cuerpo.placa, 'SXL123');

    // Cifrado en reposo: el texto plano no aparece en la base de datos.
    const fila = await s.db.uno('SELECT placa_cifrada FROM placas_temporales WHERE viaje_id = ?', [viaje.id]);
    assert.ok(!fila.placa_cifrada.includes('SXL123'));

    // Otra usuaria no puede leer la placa de este viaje (IDOR).
    const intrusa = await s.registrar('Intrusa', 'intrusa@test.co');
    assert.equal((await s.pedir('GET', `/viajes/${viaje.id}/placa`, { token: intrusa })).estado, 404);
  });

  test('el dato temporal se elimina al vencer', async () => {
    const t = await s.ingresar('taxi@test.co', 'Clave1234');
    await s.db.ejecutar('UPDATE placas_temporales SET expira_en = ? WHERE viaje_id = ?', [new Date(Date.now() - 1000).toISOString(), viaje.id]);
    assert.equal((await s.pedir('GET', `/viajes/${viaje.id}/placa`, { token: t })).estado, 404);
    const { limpiarVencidos } = await import('../src/services/limpieza.js');
    assert.equal(await limpiarVencidos(), 1);
  });

  test('al finalizar el viaje se acorta la retención', async () => {
    const t = await s.ingresar('taxi@test.co', 'Clave1234');
    const nuevo = (await s.pedir('POST', '/viajes', { token: t, cuerpo: { ruta } })).cuerpo.viaje;
    await s.pedir('PUT', `/viajes/${nuevo.id}/placa`, { token: t, cuerpo: { placa: 'ABC123' } });
    await s.pedir('POST', `/viajes/${nuevo.id}/finalizar`, { token: t });
    const fila = await s.db.uno('SELECT expira_en FROM placas_temporales WHERE viaje_id = ?', [nuevo.id]);
    assert.ok(new Date(fila.expira_en).getTime() - Date.now() <= 2 * 3600_000 + 5000);
  });
});

describe('gamificación comunitaria', () => {
  test('otorga puntos e insignia al reportar una luminaria dañada y evita duplicados', async () => {
    const t = await s.registrar('Lu', 'lu@test.co');
    const cuerpo = { tipo: 'LUMINARIA_DANADA', lat: 5.0235, lng: -74.0051 };
    const r = await s.pedir('POST', '/verificaciones', { token: t, cuerpo });
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.puntos_ganados, 12);
    assert.ok(r.cuerpo.insignias_nuevas.some((i) => i.codigo === 'LUCIERNAGA'));
    assert.equal((await s.pedir('POST', '/verificaciones', { token: t, cuerpo })).estado, 409);
    const perfil = await s.pedir('GET', '/perfil', { token: t });
    assert.ok(perfil.cuerpo.insignias.find((i) => i.codigo === 'LUCIERNAGA').otorgada_en);
  });

  test('una verificación de luminaria dañada baja el puntaje de rutas que pasan por ahí', async () => {
    const t = await s.registrar('Lu2', 'lu2@test.co');
    const centro = { lat: 5.0310, lng: -74.0100 };
    const o = { lat: centro.lat, lng: centro.lng - 0.002 };
    const d = { lat: centro.lat, lng: centro.lng + 0.002 };
    const antes = (await s.pedir('POST', '/rutas/planificar', { token: t, cuerpo: { origen: o, destino: d, hora: 23 } })).cuerpo.rutas[0].puntaje;
    for (const dx of [-0.001, 0, 0.001]) {
      await s.pedir('POST', '/verificaciones', { token: t, cuerpo: { tipo: 'LUMINARIA_DANADA', lat: centro.lat, lng: centro.lng + dx } });
    }
    const despues = (await s.pedir('POST', '/rutas/planificar', { token: t, cuerpo: { origen: o, destino: d, hora: 23 } })).cuerpo.rutas[0].puntaje;
    assert.ok(despues <= antes, `${despues} debería ser ≤ ${antes}`);
  });

  test('confirmar un reporte propio está prohibido; ajeno suma confirmación', async () => {
    const autora = await s.registrar('Aut2', 'aut2@test.co');
    const otra = await s.registrar('Conf', 'conf@test.co');
    const r = await s.pedir('POST', '/reportes', { token: autora, cuerpo: { municipio_id: municipio.id, referencia: 'Callejón', categoria: 'DESOLADO' } });
    const id = r.cuerpo.reporte.id;
    assert.equal((await s.pedir('POST', '/verificaciones', { token: autora, cuerpo: { tipo: 'REPORTE_CONFIRMADO', reporte_id: id, lat: 0, lng: 0 } })).estado, 400);
    assert.equal((await s.pedir('POST', '/verificaciones', { token: otra, cuerpo: { tipo: 'REPORTE_CONFIRMADO', reporte_id: id, lat: 0, lng: 0 } })).estado, 201);
    const lista = await s.pedir('GET', `/reportes?municipio_id=${municipio.id}&limite=200`, { token: otra });
    assert.equal(lista.cuerpo.reportes.find((x) => x.id === id).confirmaciones, 1);
  });
});
