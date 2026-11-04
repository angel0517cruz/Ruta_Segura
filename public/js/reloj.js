// Reloj nocturno: una luna que recorre el cielo mientras eliges a qué hora caminas.
// El control real es un <input type="range"> nativo (teclado, lector de pantalla y táctil funcionan solos).
import { estado, horaActualColombia } from './estado.js';
import { h, hora12, icono } from './ui.js';

const hDeIndice = (i) => (12 + i) % 24; // 0 → 12:00 m, 12 → 00:00, 23 → 11:00 a. m.
const indiceDe = (hora) => (hora - 12 + 24) % 24;
const esDia = (hora) => hora >= 6 && hora < 18;

/** Ajusta el cielo de toda la aplicación según la hora elegida. */
export function ajustarCielo(hora) {
  const noche = !esDia(hora);
  const raiz = document.documentElement.style;
  raiz.setProperty('--cielo-a', noche ? '#150c33' : '#3b2f7a');
  raiz.setProperty('--cielo-b', noche ? '#2c1c63' : '#7a66d6');
  const profundo = hora >= 21 || hora < 4 ? 1 : noche ? 0.7 : 0.12;
  document.getElementById('velo-cielo')?.style.setProperty('--oscuridad', String(profundo));
}

const sol = () => icono('sol');

export function relojNocturno({ hora, alCambiar, compacto = false }) {
  const luna = h('div', { class: 'luna', 'aria-hidden': 'true' }, icono('luna'));
  const grande = h('div', { class: 'hora-grande', 'aria-hidden': 'true' });
  const etiqueta = h('span', { class: 'suave' });
  const entrada = h('input', { type: 'range', id: `reloj-${Math.random().toString(36).slice(2, 6)}`, min: 0, max: 23, step: 1, 'aria-label': 'Hora de la caminata', 'aria-valuetext': '' });
  const ahora = h('button', { class: 'btn sec chico', type: 'button' }, 'Ahora');

  const arco = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arco.setAttribute('class', 'arco'); arco.setAttribute('viewBox', '0 0 100 40'); arco.setAttribute('preserveAspectRatio', 'none');
  arco.innerHTML = '<path d="M5 36 Q50 -22 95 36" fill="none" stroke="rgba(230,220,255,.28)" stroke-width=".6" stroke-dasharray="1.4 1.8" vector-effect="non-scaling-stroke"/>';

  function actualizar(valor, notificar = true) {
    const i = Number(valor);
    const hr = hDeIndice(i);
    const t = i / 23;
    luna.style.left = `${5 + 90 * t}%`;
    luna.style.top = `${92 - 80 * Math.sin(Math.PI * t)}%`;
    luna.replaceChildren(esDia(hr) ? sol() : icono('luna'));
    luna.firstChild.setAttribute('stroke-width', '1.6');
    luna.style.color = esDia(hr) ? '#ffe08a' : '#e6dcff';
    grande.textContent = hora12(hr);
    etiqueta.textContent = esDia(hr) ? 'De día el riesgo suele ser menor' : hr >= 21 || hr < 4 ? 'Madrugada: máxima precaución' : 'Anochecer';
    entrada.setAttribute('aria-valuetext', `${hora12(hr)}. ${etiqueta.textContent}`);
    ajustarCielo(hr);
    if (notificar) alCambiar(hr);
  }

  entrada.addEventListener('input', () => actualizar(entrada.value));
  ahora.addEventListener('click', () => { const hr = horaActualColombia(); entrada.value = indiceDe(hr); estado.hora = null; actualizar(entrada.value); });
  entrada.value = indiceDe(hora);
  actualizar(entrada.value, false);

  return h('div', { class: 'reloj' },
    h('div', { class: 'fila entre' }, h('div', {}, h('div', { class: 'etiqueta' }, 'A qué hora caminas'), grande), ahora),
    compacto ? null : h('div', { class: 'cielo' }, h('div', { class: 'estrellas' }), arco, luna),
    entrada,
    h('div', { class: 'fila entre' }, etiqueta));
}
