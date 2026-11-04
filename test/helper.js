// Arranca la app completa en memoria (SQLite :memory:, sin red) para pruebas de integración.
process.env.NODE_ENV = 'test';
process.env.SQLITE_PATH = ':memory:';
process.env.APIS_EXTERNAS = '0';
process.env.VERIFICAR_UBICACION = '0'; // las pruebas de verificación la activan con un geocodificador simulado
process.env.BCRYPT_COSTO = '4';
process.env.JWT_SECRET = 'x'.repeat(40);
process.env.DATA_KEY = 'y'.repeat(40);

const { crearApp } = await import('../src/app.js');
const { prepararBase } = await import('../src/db/seed.js');
const { db } = await import('../src/db/index.js');

export async function iniciarServidor({ demo = true } = {}) {
  await prepararBase({ demo });
  const servidor = crearApp().listen(0);
  await new Promise((r) => servidor.once('listening', r));
  const base = `http://127.0.0.1:${servidor.address().port}/api`;

  async function pedir(metodo, ruta, { cuerpo, token } = {}) {
    const r = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const texto = await r.text();
    return { estado: r.status, cuerpo: texto ? JSON.parse(texto) : null, cabeceras: r.headers };
  }

  async function ingresar(email, password = 'Luna2026!') {
    const r = await pedir('POST', '/auth/login', { cuerpo: { email, password } });
    return r.cuerpo.token;
  }

  async function registrar(nombre, email) {
    const r = await pedir('POST', '/auth/registro', { cuerpo: { nombre, email, password: 'Clave1234' } });
    return r.cuerpo.token;
  }

  return { base, pedir, ingresar, registrar, db, cerrar: async () => { await new Promise((r) => servidor.close(r)); await db.cerrar(); } };
}
