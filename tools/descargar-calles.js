// Descarga UNA vez las calles reales (OpenStreetMap, licencia ODbL) del centro de cada municipio y las guarda en
// src/db/calles-demo.json. El sembrado de demostración coloca luminarias/cámaras/comercios SIMULADOS sobre esas calles,
// para que las rutas reales (que siguen calles) interactúen con datos coherentes.
// Uso: node tools/descargar-calles.js
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { MUNICIPIOS } from '../src/db/seed.js';

const ESPEJOS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter'];
const UA = 'LumaRutaSegura/1.0 (proyecto academico)';
const DY = 0.0095; // ≈ 1,05 km
const DX = 0.0095;

async function consultar(m) {
  const caja = `${m.lat - DY},${m.lng - DX},${m.lat + DY},${m.lng + DX}`;
  const q = `[out:json][timeout:60];way["highway"~"^(primary|secondary|tertiary|residential|unclassified|pedestrian|living_street|footway)$"](${caja});out geom 1500;`;
  for (const url of ESPEJOS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(120_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return j.elements.filter((e) => e.geometry?.length > 1).map((e) => e.geometry.map((g) => [Number(g.lat.toFixed(5)), Number(g.lon.toFixed(5))]));
    } catch (e) { console.log(`  ${new URL(url).host}: ${e.message}`); }
  }
  return null;
}

const destino = new URL('../src/db/calles-demo.json', import.meta.url);
// Conserva lo ya descargado: si un municipio falla (Overpass suele dar 502) no se pierde lo anterior.
const salida = existsSync(destino) ? JSON.parse(readFileSync(destino, 'utf8')) : {};
for (const m of MUNICIPIOS) {
  console.log(m.nombre);
  const calles = await consultar(m);
  if (calles?.length) { salida[m.nombre] = calles; console.log(`  ${calles.length} calles`); }
}
writeFileSync(destino, JSON.stringify(salida));
console.log('Listo:', Object.keys(salida).length, 'municipios');
