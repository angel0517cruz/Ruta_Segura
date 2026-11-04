// Datos iniciales.
//  - Municipios: tabla de referencia precargada (siempre).
//  - Demo: puntos de seguridad y reportes SIMULADOS para poder mostrar el sistema. No son datos reales
//    y la interfaz lo advierte. En producción real se reemplazan por OSM + reportes de la comunidad.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { haversine, muestrearPolilinea } from '../../shared/geo.js';
import { config } from '../config.js';
import { hashear } from '../services/auth.js';
import { db, iniciarDb } from './index.js';
import { crearEsquema } from './schema.js';

export const MUNICIPIOS = [
  { nombre: 'Zipaquirá', lat: 5.0224, lng: -74.0046 },
  { nombre: 'Chía', lat: 4.8587, lng: -74.0586 },
  { nombre: 'Cajicá', lat: 4.9186, lng: -74.0278 },
  { nombre: 'Fusagasugá', lat: 4.3366, lng: -74.3636 },
  { nombre: 'Girardot', lat: 4.3009, lng: -74.8030 },
  { nombre: 'Ubaté', lat: 5.3085, lng: -73.8148 },
  { nombre: 'Facatativá', lat: 4.8133, lng: -74.3544 },
  { nombre: 'Soacha', lat: 4.5794, lng: -74.2168 },
];

function aleatorio(semilla) {
  let a = semilla >>> 0; // mulberry32: determinista, el demo se ve igual en cada máquina
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const desplazar = (m, dx, dy) => ({
  lat: m.lat + dy / 111320,
  lng: m.lng + dx / (111320 * Math.cos((m.lat * Math.PI) / 180)),
});


function cargarCalles() {
  try { return JSON.parse(readFileSync(new URL('./calles-demo.json', import.meta.url), 'utf8')); } catch { return {}; }
}

/**
 * Genera el "mundo" simulado de un municipio. Con calles reales (calles-demo.json) los puntos se colocan SOBRE ellas;
 * sin ese archivo se usan dos ejes sintéticos. Dos zonas son deliberadamente oscuras y desoladas.
 */
function crearMundo(m, calles, rnd) {
  const reales = Array.isArray(calles) && calles.length > 0;
  const lineas = reales
    ? calles.map((c) => c.map(([lat, lng]) => ({ lat, lng })))
    : [[desplazar(m, -850, 0), desplazar(m, 850, 0)], [desplazar(m, 0, -850), desplazar(m, 0, 850)]];
  const cerca = (a, b) => haversine(a, b);
  const vertices = lineas.flatMap((l) => muestrearPolilinea(l, 30).map(({ lat, lng }) => ({ lat, lng })));
  const puntoCalle = () => vertices[Math.floor(rnd() * vertices.length)];
  const lejanos = vertices.filter((v) => cerca(v, m) > 350 && cerca(v, m) < 800);
  const zonasOscuras = [0, 1].map(() => (lejanos.length ? lejanos[Math.floor(rnd() * lejanos.length)] : desplazar(m, rnd() < 0.5 ? 520 : -480, rnd() < 0.5 ? 380 : -420)));
  const enOscura = (p) => zonasOscuras.some((z) => cerca(p, z) < 230);
  const puntoCercaDe = (z, r) => {
    const candidatos = vertices.filter((v) => cerca(v, z) < r);
    return candidatos.length ? candidatos[Math.floor(rnd() * candidatos.length)] : z;
  };

  // Cada calle es "bien iluminada" (luminarias cada ~40 m) o "tenue" (esporádicas).
  const luces = [];
  for (const l of lineas) {
    const iluminada = rnd() < 0.5;
    for (const p of muestrearPolilinea(l, iluminada ? 40 : 110)) {
      if (!iluminada && rnd() < 0.55) continue;
      if (enOscura(p) && rnd() < 0.92) continue;
      luces.push({ lat: p.lat, lng: p.lng });
    }
  }
  const diurnas = vertices.filter((v) => !enOscura(v) && cerca(v, m) < 750);
  const tomar = (n) => Array.from({ length: Math.min(n, diurnas.length) }, () => diurnas[Math.floor(rnd() * diurnas.length)]);
  return { luces: luces.length > 3000 ? luces.filter(() => rnd() < 3000 / luces.length) : luces, camaras: tomar(16), comercios: tomar(22), zonasOscuras, puntoCalle, puntoCercaDe };
}

export async function sembrarMunicipios() {
  for (const m of MUNICIPIOS) {
    await db.ejecutar('INSERT INTO municipios (nombre, lat, lng) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', [m.nombre, m.lat, m.lng]);
  }
}

export async function sembrarDemo() {
  if (await db.uno('SELECT 1 AS x FROM usuarias LIMIT 1')) return false;
  const ahora = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const hash = await hashear('Luna2026!');
  const municipios = await db.todos('SELECT id, nombre, lat, lng FROM municipios ORDER BY id');
  const zip = municipios.find((m) => m.nombre === 'Zipaquirá');

  const ins = async (nombre, email, rol, puntos) =>
    (await db.ejecutar(
      'INSERT INTO usuarias (nombre, email, password_hash, rol, municipio_id, puntos, creada_en) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [nombre, email, hash, rol, zip.id, puntos, iso(ahora - 30 * 86400_000)],
    )).filas[0].id;
  const sofia = await ins('Sofía Demo', 'sofia@demo.co', 'USUARIA', 22);
  const moderadora = await ins('Moderadora Demo', 'moderadora@demo.co', 'MODERADORA', 0);
  const autoras = [sofia, moderadora];

  await db.ejecutar("INSERT INTO verificaciones (usuaria_id, tipo, lat, lng, puntos, creada_en) VALUES (?, 'LUMINARIA_DANADA', ?, ?, 12, ?)", [sofia, zip.lat + 0.001, zip.lng, iso(ahora - 5 * 86400_000)]);
  await db.ejecutar("INSERT INTO verificaciones (usuaria_id, tipo, lat, lng, puntos, creada_en) VALUES (?, 'RUTA_OK', ?, ?, 10, ?)", [sofia, zip.lat, zip.lng + 0.001, iso(ahora - 4 * 86400_000)]);
  await db.ejecutar("INSERT INTO insignias_usuaria (usuaria_id, codigo, otorgada_en) VALUES (?, 'LUCIERNAGA', ?)", [sofia, iso(ahora - 5 * 86400_000)]);

  const referencias = ['Parque principal', 'Estación de buses', 'Puente peatonal', 'Calle del colegio', 'Lote baldío', 'Zona universitaria', 'Plaza de mercado', 'Ciclovía', 'Parque del barrio', 'Paradero'];
  const categorias = ['ACOSO', 'ILUMINACION', 'DESOLADO', 'LUMINARIA_DANADA'];
  const comercios = ['Tienda La Esquina', 'Droguería Central', 'Panadería Aurora', 'Minimercado 24h', 'Restaurante El Fogón', 'Cafetería Luna'];

  const callesDemo = cargarCalles();
  for (const m of municipios) {
    const rnd = aleatorio(m.id * 7919);
    const mundo = crearMundo(m, callesDemo[m.nombre], rnd);

    for (const p of mundo.luces) await db.ejecutar("INSERT INTO puntos_seguridad (tipo, municipio_id, lat, lng, fuente) VALUES ('LUMINARIA', ?, ?, ?, 'demo')", [m.id, p.lat, p.lng]);
    for (const p of mundo.camaras) await db.ejecutar("INSERT INTO puntos_seguridad (tipo, municipio_id, lat, lng, fuente) VALUES ('CAMARA', ?, ?, ?, 'demo')", [m.id, p.lat, p.lng]);
    for (const [i, p] of mundo.comercios.entries()) {
      const abre = rnd() < 0.3 ? 0 : 7 + Math.floor(rnd() * 3);
      const cierra = abre === 0 ? 24 : 19 + Math.floor(rnd() * 5);
      await db.ejecutar("INSERT INTO puntos_seguridad (tipo, nombre, municipio_id, lat, lng, abre, cierra, fuente) VALUES ('COMERCIO', ?, ?, ?, ?, ?, ?, 'demo')", [comercios[i % comercios.length], m.id, p.lat, p.lng, abre, cierra]);
    }

    // Reportes históricos: concentrados en las zonas oscuras y de noche.
    for (let i = 0; i < 70; i++) {
      const oscura = rnd() < 0.72;
      const p = oscura ? mundo.puntoCercaDe(mundo.zonasOscuras[Math.floor(rnd() * mundo.zonasOscuras.length)], 230) : mundo.puntoCalle();
      const horasNoche = [19, 20, 21, 22, 23, 0, 1, 2, 3];
      const hora = oscura ? horasNoche[Math.floor(Math.pow(rnd(), 1.2) * horasNoche.length)] : Math.floor(rnd() * 24);
      const cat = categorias[Math.floor(rnd() * (oscura ? 3 : 4))];
      await db.ejecutar(
        `INSERT INTO reportes (usuaria_id, municipio_id, referencia, categoria, descripcion, lat, lng, hora, confirmaciones, fuente, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?)`,
        [autoras[i % 2], m.id, referencias[Math.floor(rnd() * referencias.length)], cat, null, p.lat, p.lng, hora, Math.floor(rnd() * 5), iso(ahora - Math.floor(rnd() * 150) * 86400_000)],
      );
    }
  }
  return true;
}

export async function prepararBase({ demo = config.demo } = {}) {
  await iniciarDb();
  await crearEsquema();
  await sembrarMunicipios();
  if (demo) await sembrarDemo();
}

async function reiniciar() {
  for (const t of ['auditoria', 'placas_temporales', 'viajes', 'insignias_usuaria', 'denuncias_reporte', 'verificaciones', 'reportes', 'puntos_seguridad', 'usuarias', 'municipios']) {
    await db.script(`DROP TABLE IF EXISTS ${t}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await iniciarDb();
  if (process.argv.includes('--reset')) await reiniciar();
  await prepararBase({ demo: true });
  console.log('Base lista. Cuentas demo (clave Luna2026!): sofia@demo.co · moderadora@demo.co');
  await db.cerrar();
}
