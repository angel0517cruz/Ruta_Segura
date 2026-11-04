// Acciones comunitarias reutilizables (confirmar, denunciar, verificar) con retroalimentación de gamificación.
import { api } from '../api.js';
import { h, mostrarInsignia, toast } from '../ui.js';

export async function mostrarPremios(r) {
  if (r.puntos_ganados) toast(`+${r.puntos_ganados} puntos · gracias por cuidar el camino`);
  for (const ins of r.insignias_nuevas ?? []) await mostrarInsignia(ins);
}

export async function confirmarReporte(rep) {
  try {
    const r = await api.post('/verificaciones', { tipo: 'REPORTE_CONFIRMADO', reporte_id: rep.id, lat: rep.lat, lng: rep.lng });
    await mostrarPremios(r);
    return true;
  } catch (e) { toast(e.message, 'error'); return false; }
}

export async function denunciarReporte(rep) {
  if (!window.confirm('¿Este reporte es falso o contiene datos personales? Una persona del equipo lo revisará.')) return false;
  try {
    const r = await api.post(`/reportes/${rep.id}/denunciar`, {});
    toast(r.mensaje);
    return true;
  } catch (e) { toast(e.message, 'error'); return false; }
}

export async function verificar(tipo, posicion) {
  try {
    const r = await api.post('/verificaciones', { tipo, lat: posicion.lat, lng: posicion.lng });
    await mostrarPremios(r);
    return true;
  } catch (e) { toast(e.message, e.estado === 409 ? 'ok' : 'error'); return false; }
}

export const TEXTO_VERIFICACION = {
  RUTA_OK: 'Esta ruta se sintió segura',
  LUMINARIA_DANADA: 'Hay una luminaria dañada',
  COMERCIO_ABIERTO: 'Hay un comercio abierto',
};
export { h };
