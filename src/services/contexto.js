// Reúne todas las señales de seguridad de un municipio (BD propia + verificaciones + OSM) para evaluar rutas.
import { Municipio } from '../models/municipio.js';
import { PuntoSeguridad, Verificacion } from '../models/comunidad.js';
import { Reporte } from '../models/reporte.js';
import { puntosOsm } from './externos.js';
import { crearContexto } from './seguridadRuta.js';

const caja = (a, b, margenGrados = 0.004) => ({
  sur: Math.min(a.lat, b.lat) - margenGrados,
  norte: Math.max(a.lat, b.lat) + margenGrados,
  oeste: Math.min(a.lng, b.lng) - margenGrados,
  este: Math.max(a.lng, b.lng) + margenGrados,
});

/** Datos crudos (listas) para un par origen-destino. `usarOsm=false` evita la red (pruebas). */
export async function datosParaTrayecto(origen, destino, { usarOsm = true } = {}) {
  const municipio = (await Municipio.masCercano(origen)) ?? (await Municipio.masCercano(destino));
  if (!municipio) return { municipio: null };
  const [puntos, reportes, danadas, rutasOk, abiertos] = await Promise.all([
    PuntoSeguridad.delMunicipio(municipio.id),
    Reporte.activos(municipio.id),
    Verificacion.vigentesLuminarias(),
    Verificacion.vigentesRutasOk(),
    Verificacion.vigentesComercios(),
  ]);
  const datos = {
    municipio,
    luces: puntos.filter((p) => p.tipo === 'LUMINARIA'),
    camaras: puntos.filter((p) => p.tipo === 'CAMARA'),
    comercios: puntos.filter((p) => p.tipo === 'COMERCIO'),
    reportes,
    luminariasDanadas: danadas,
    rutasOk,
    comerciosAbiertos: abiertos,
    fuentes: ['base_propia'],
  };
  if (usarOsm) {
    const osm = await puntosOsm(caja(origen, destino));
    if (osm) {
      datos.luces.push(...osm.luces);
      datos.camaras.push(...osm.camaras);
      datos.comercios.push(...osm.comercios);
      datos.fuentes.push('openstreetmap');
    }
  }
  return datos;
}

export const contextoDesde = (datos) => crearContexto(datos);
