import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { iniciarServidor } from './helper.js';

const { sincronizarClaveDemo } = await import('../src/db/seed.js');

let s;
before(async () => { s = await iniciarServidor(); });
after(() => s.cerrar());

test('cambiar DEMO_PASSWORD actualiza la clave de las cuentas iniciales y levanta bloqueos', async () => {
  const entrar = (password) => s.pedir('POST', '/auth/login', { cuerpo: { email: 'moderadora@demo.co', password } });
  assert.equal((await entrar('Luna2026!')).estado, 200);

  // La cuenta se bloquea por intentos fallidos…
  for (let i = 0; i < 5; i++) await entrar('incorrecta1');
  assert.equal((await entrar('Luna2026!')).estado, 429);

  // …y al sincronizar con la nueva clave se actualiza y se desbloquea.
  process.env.DEMO_PASSWORD = 'Nueva2026!';
  assert.equal(await sincronizarClaveDemo(), 2);
  assert.equal((await entrar('Nueva2026!')).estado, 200);
  assert.equal((await entrar('Luna2026!')).estado, 401);
  assert.equal(await sincronizarClaveDemo(), 0, 'sin cambios no vuelve a escribir');
  delete process.env.DEMO_PASSWORD;
});
