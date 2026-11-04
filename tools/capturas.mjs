// Saca capturas de las pantallas de Nova para el video y la presentación.
// Requiere el servidor en marcha y: npm install --no-save puppeteer-core
// Uso: node tools/capturas.mjs [url]   → capturas-video/escritorio y capturas-video/movil
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://localhost:3000';
const NAVEGADOR = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SALIDA = new URL('../capturas-video/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function token(email, password) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!r.ok) throw new Error(`No se pudo iniciar sesión como ${email}: ${r.status}`);
  return (await r.json()).token;
}

const PERFILES = [
  { carpeta: 'escritorio', ancho: 1440, alto: 900, escala: 1.5, movil: false },
  { carpeta: 'movil', ancho: 390, alto: 844, escala: 3, movil: true },
];

const navegador = await puppeteer.launch({ executablePath: NAVEGADOR, headless: 'new', args: ['--no-sandbox', '--lang=es-CO'] });
const clave = process.env.DEMO_PASSWORD || 'Luna2026!';
const tokenUsuaria = await token('sofia@demo.co', clave);
const tokenModeradora = await token('moderadora@demo.co', clave);

for (const perfil of PERFILES) {
  const carpeta = `${SALIDA}${perfil.carpeta}`;
  mkdirSync(carpeta, { recursive: true });

  async function nueva(tk) {
    const page = await navegador.newPage();
    await page.setViewport({ width: perfil.ancho, height: perfil.alto, deviceScaleFactor: perfil.escala, isMobile: perfil.movil, hasTouch: perfil.movil });
    if (tk) await page.evaluateOnNewDocument((t) => sessionStorage.setItem('nova.token', t), tk);
    return page;
  }
  const foto = async (page, nombre) => { await page.waitForNetworkIdle({ idleTime: 900, timeout: 15000 }).catch(() => {}); await page.screenshot({ path: `${carpeta}/${nombre}.png` }); console.log(`  ${perfil.carpeta}/${nombre}.png`); };
  const clic = (page, texto) => page.evaluate((t) => { const b = [...document.querySelectorAll('button, a')].find((x) => x.textContent.includes(t)); if (!b) throw new Error(`No hay botón «${t}»`); b.click(); }, texto);
  const ir = async (page, hash, espera = 3500) => { await page.goto(`${BASE}/#${hash}`, { waitUntil: 'load' }); await page.reload({ waitUntil: 'load' }); await pausa(espera); };
  const desplazar = (page, px) => page.evaluate((y) => { document.getElementById('contenido').scrollTop = y; }, px);

  console.log(`Perfil ${perfil.carpeta}`);

  // 1. Bienvenida (sin sesión)
  let page = await nueva(null);
  await page.goto(`${BASE}/#/`, { waitUntil: 'load' }); await pausa(2500);
  await foto(page, '01_bienvenida');
  await page.close();

  // 2-10. Usuaria
  page = await nueva(tokenUsuaria);
  await ir(page, '/mapa', 6000);
  await foto(page, '02_mapa_calor_8pm');
  await page.evaluate(() => { const r = document.querySelector('input[type=range]'); r.value = 14; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await pausa(3500);
  await foto(page, '03_mapa_calor_madrugada');

  await ir(page, '/ruta', 2500);
  await clic(page, 'trayecto de ejemplo'); await pausa(800);
  await clic(page, 'Buscar la ruta'); await pausa(11000);
  await desplazar(page, perfil.movil ? 120 : 330); await pausa(1500);
  await foto(page, '04_ruta_segura');

  await clic(page, 'Empezar caminata'); await pausa(6500); // espera a que pase el aviso de GPS
  await foto(page, '05_caminata');
  await clic(page, 'Simular desvío'); await pausa(5800);
  await foto(page, '06_alerta_desvio');
  await page.evaluate(() => document.querySelector('.fab-taxi')?.click()); await pausa(900);
  await page.evaluate(() => { const i = document.getElementById('placa-in'); i.value = 'SXL123'; i.dispatchEvent(new Event('input')); });
  await clic(page, 'Guardar placa'); await pausa(1500);
  await foto(page, '07_placa_taxi');
  await page.keyboard.press('Escape'); await pausa(500);
  await page.evaluate(async (t) => { // cierra la caminata de prueba
    const h = { Authorization: `Bearer ${t}` };
    const a = await (await fetch('/api/viajes/actual', { headers: h })).json();
    if (a.viaje) await fetch(`/api/viajes/${a.viaje.id}/cancelar`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: '{}' });
  }, tokenUsuaria);

  await ir(page, '/reportar', 2500);
  await page.evaluate(() => { const i = document.getElementById('r-ref'); i.value = 'parque'; i.dispatchEvent(new Event('input')); });
  await pausa(5500);
  await page.evaluate(() => document.querySelector('.lugar')?.click()); await pausa(3000);
  await page.evaluate(() => document.querySelector('[role=radio]')?.click()); await pausa(600);
  await foto(page, '08_reportar_lugar_verificado');

  await ir(page, '/reportes', 4500);
  await foto(page, '09_reportes_cercania');
  await ir(page, '/perfil', 3500);
  await foto(page, '10_perfil_insignias');
  await page.close();

  // 11-13. Moderadora
  page = await nueva(tokenModeradora);
  await ir(page, '/moderacion', 3500);
  await clic(page, 'Reportes'); await pausa(2500);
  await desplazar(page, perfil.movil ? 260 : 0);
  await foto(page, '11_moderacion_reportes');
  await clic(page, 'Datos de seguridad'); await pausa(3500);
  await foto(page, '12_moderacion_datos');
  await clic(page, 'Métricas'); await pausa(2500);
  await desplazar(page, perfil.movil ? 260 : 0);
  await foto(page, '13_moderacion_metricas');
  await page.close();
}
await navegador.close();
console.log('Listo:', SALIDA);
