// Registro rápido de transporte: placa digitada o fotografiada, ligada al viaje y con vencimiento automático.
import { api } from '../api.js';
import { h, hace, icono, toast } from '../ui.js';

const PLACA = /^[A-Z]{3}(\d{3}|\d{2}[A-Z])$/;

/** Reduce la foto en el propio dispositivo (≤ 640 px, JPEG) antes de enviarla: menos datos, más privacidad. */
async function reducirFoto(archivo) {
  const bmp = await createImageBitmap(archivo);
  const escala = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(bmp.width * escala); lienzo.height = Math.round(bmp.height * escala);
  lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
  for (const q of [0.6, 0.45, 0.3]) {
    const url = lienzo.toDataURL('image/jpeg', q);
    if (url.length < 240_000) return url;
  }
  throw new Error('La foto es muy pesada. Intenta acercarte a la placa.');
}

export async function abrirPlaca(viaje, previa) {
  let foto = null;
  let guardada = previa;
  const lugar = document.createElement('div');
  const cerrar = () => { velo.remove(); document.removeEventListener('keydown', alTecla); disparador?.focus(); };
  const disparador = document.activeElement;
  const alTecla = (e) => { if (e.key === 'Escape') cerrar(); };

  const entrada = h('input', { id: 'placa-in', maxlength: 6, placeholder: 'ABC123', autocomplete: 'off', autocapitalize: 'characters', inputmode: 'text', 'aria-label': 'Placa del taxi', 'aria-describedby': 'placa-ayuda placa-error' });
  entrada.addEventListener('input', () => { entrada.value = entrada.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
  const error = h('div', { class: 'error-campo', id: 'placa-error', role: 'alert' });
  const miniatura = h('img', { class: 'miniatura', alt: 'Foto de la placa tomada por ti', hidden: true });
  const archivo = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, id: 'placa-foto' });
  archivo.addEventListener('change', async () => {
    if (!archivo.files[0]) return;
    try { foto = await reducirFoto(archivo.files[0]); miniatura.src = foto; miniatura.hidden = false; error.textContent = ''; }
    catch (e) { error.textContent = e.message; }
  });

  const estadoGuardado = h('div', { role: 'status', 'aria-live': 'polite' });
  const compartir = h('button', { class: 'btn sec', type: 'button', hidden: true }, icono('compartir'), 'Compartir con alguien de confianza');
  const borrar = h('button', { class: 'btn sec', type: 'button', hidden: true }, icono('basura'), 'Borrar ahora');
  const guardar = h('button', { class: 'btn bloque', type: 'button' }, icono('candado'), 'Guardar placa (temporal)');

  function mostrarGuardada(g) {
    guardada = g;
    entrada.value = g.placa ?? entrada.value;
    estadoGuardado.replaceChildren(h('div', { class: 'aviso info' }, icono('candado'), `Guardada con cifrado. Se borra sola ${g.expira_en ? `el ${new Date(g.expira_en).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}` : 'al vencer'}`));
    compartir.hidden = false; borrar.hidden = false;
  }

  guardar.addEventListener('click', async () => {
    const placa = entrada.value.trim().toUpperCase();
    if (!PLACA.test(placa)) { error.textContent = 'La placa debe verse como ABC123.'; entrada.setAttribute('aria-invalid', 'true'); entrada.focus(); return; }
    error.textContent = ''; entrada.removeAttribute('aria-invalid');
    guardar.disabled = true;
    try {
      const r = await api.put(`/viajes/${viaje.id}/placa`, { placa, ...(foto ? { foto } : {}) });
      mostrarGuardada({ placa, ...r });
      toast('Placa registrada en tu viaje.');
    } catch (e) { error.textContent = e.message; } finally { guardar.disabled = false; }
  });

  compartir.addEventListener('click', async () => {
    const texto = `Voy en un taxi con placa ${entrada.value}. Salí de ${viaje.origen_texto ?? 'mi origen'} hacia ${viaje.destino_texto ?? 'mi destino'}. (Luma · Ruta Segura)`;
    if (navigator.share) { try { await navigator.share({ text: texto }); } catch { /* cancelado */ } return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  });

  borrar.addEventListener('click', async () => {
    try { await api.del(`/viajes/${viaje.id}/placa`); guardada = null; entrada.value = ''; foto = null; miniatura.hidden = true; estadoGuardado.replaceChildren(); compartir.hidden = true; borrar.hidden = true; toast('Placa borrada.'); }
    catch (e) { toast(e.message, 'error'); }
  });

  const caja = h('div', { class: 'caja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'placa-t', estilo: { 'text-align': 'left' } },
    h('div', { class: 'fila entre' }, h('h2', { id: 'placa-t' }, 'Placa del taxi'), h('button', { class: 'icono-btn', type: 'button', 'aria-label': 'Cerrar', onclick: cerrar }, icono('cerrar'))),
    h('p', { class: 'suave', id: 'placa-ayuda', estilo: { margin: '6px 0 14px' } }, 'Escríbela o toma una foto. Queda cifrada, ligada a este viaje, y se borra sola. Nadie más puede verla.'),
    h('div', { class: 'pila' },
      h('div', { class: 'placa' }, h('small', {}, 'COLOMBIA · SERVICIO PÚBLICO'), entrada),
      error,
      h('div', { class: 'fila' }, h('label', { class: 'btn sec', for: 'placa-foto' }, icono('camara'), 'Tomar foto'), archivo),
      miniatura, estadoGuardado, guardar, h('div', { class: 'fila' }, compartir, borrar), lugar));
  const velo = h('div', { class: 'modal-insignia' }, caja);
  document.body.append(velo);
  document.addEventListener('keydown', alTecla);
  velo.addEventListener('click', (e) => { if (e.target === velo) cerrar(); });

  if (!previa) {
    try { const g = await api.get(`/viajes/${viaje.id}/placa`); mostrarGuardada(g); if (g.foto) { miniatura.src = g.foto; miniatura.hidden = false; } } catch { /* aún sin placa */ }
  } else mostrarGuardada(previa);
  entrada.focus();
}
export { hace };
