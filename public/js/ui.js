// Utilidades de interfaz. Regla de oro: el contenido de usuarias SIEMPRE entra por textContent (nunca innerHTML).

/** Crea un elemento. props: class, on<Evento>, y cualquier atributo; hijos: texto o nodos. */
export function h(etiqueta, props = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'estilo') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const hijo of hijos.flat()) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return el;
}

const ICONOS = {
  luna: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  nova: '<path d="M12 2c.7 5.600 2 9.100 3.800 10.900C17.600 14.700 20.600 16 22 16.500c-2.800.5-5.700 1.600-7.500 3.400C13 21.400 12.600 22 12 22c-.6 0-1-.6-2.500-2.100C7.700 18.100 4.800 17 2 16.500c1.400-.5 4.400-1.800 6.200-3.600C10 11.100 11.300 7.600 12 2z"/>',
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  ruta: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  lista: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  taxi: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM9 3h6M7 11h10"/><circle cx="7.5" cy="16" r=".6"/><circle cx="16.5" cy="16" r=".6"/>',
  camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 17.5v.5"/>',
  luz: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  cctv: '<path d="M3 8l12-4 2 5-12 4zM17 9l4 1v3l-4-1M8 13v4M5 21h6"/>',
  tienda: '<path d="M4 9l1-5h14l1 5M4 9v11h16V9M4 9c0 2 3 2 4 0 1 2 4 2 4 0 1 2 4 2 4 0 1 2 4 2 4 0M10 20v-5h4v5"/>',
  estrella: '<path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.4l-5.9 3.4 1.3-6.7L2.5 9.5l6.6-.8z"/>',
  ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.2"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  ubicacion: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  escudo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  compartir: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  basura: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  bandera: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  mod: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M9 11h6M9 14h4"/>',
};

export function icono(nombre, clase = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.8');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  if (clase) s.setAttribute('class', clase);
  s.innerHTML = ICONOS[nombre] ?? ''; // constantes del propio código, nunca datos de usuarias
  return s;
}
export const iconoHtml = (nombre) => icono(nombre).outerHTML;

export const CATEGORIAS = {
  ACOSO: { etiqueta: 'Acoso', icono: 'alerta', color: '#ff6f9c' },
  ILUMINACION: { etiqueta: 'Poca iluminación', icono: 'luz', color: '#ffc971' },
  DESOLADO: { etiqueta: 'Zona desolada', icono: 'ojo', color: '#b69cff' },
  LUMINARIA_DANADA: { etiqueta: 'Luminaria dañada', icono: 'luz', color: '#ff9a6f' },
};

// ── Mensajes
export function toast(texto, tipo = 'ok', ms = 4200) {
  const caja = document.getElementById('avisos');
  const el = h('div', { class: `toast ${tipo === 'error' ? 'error' : ''}` }, icono(tipo === 'error' ? 'alerta' : 'check'), h('span', {}, texto));
  caja.append(el);
  setTimeout(() => { el.classList.add('salida'); setTimeout(() => el.remove(), 360); }, ms);
}

/** Anuncio inmediato para lectores de pantalla (alertas de desvío, errores). */
export function anunciar(texto) {
  const r = document.getElementById('anuncios');
  r.textContent = '';
  setTimeout(() => { r.textContent = texto; }, 60);
}

export function ayuda(texto) {
  let globo = null;
  const id = `ayuda-${Math.random().toString(36).slice(2, 8)}`;
  const btn = h('button', { class: 'ayuda-btn', type: 'button', 'aria-label': 'Ayuda', 'aria-expanded': 'false', 'aria-controls': id }, '?');
  btn.addEventListener('click', () => {
    if (globo) { globo.remove(); globo = null; btn.setAttribute('aria-expanded', 'false'); return; }
    globo = h('div', { class: 'ayuda-globo', id, role: 'note' }, texto);
    btn.closest('.campo, .pila, .tarjeta, div')?.append(globo);
    btn.setAttribute('aria-expanded', 'true');
  });
  return btn;
}

// ── Formatos
export const metros = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
export const minutos = (s) => `${Math.max(1, Math.round(s / 60))} min`;
export function hora12(h24) {
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:00 ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}
export function hace(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `hace ${Math.max(1, Math.round(d / 60))} min`;
  if (d < 86400) return `hace ${Math.round(d / 3600)} h`;
  return `hace ${Math.round(d / 86400)} d`;
}

export function contar(el, hasta, ms = 900) {
  const t0 = performance.now();
  const paso = (t) => {
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = Math.round(hasta * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** Anillo de puntaje animado (0-100). */
export function anillo(puntaje, nivel) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 80 80');
  const pista = document.createElementNS(NS, 'circle');
  const valor = document.createElementNS(NS, 'circle');
  for (const [c, cl] of [[pista, 'pista'], [valor, 'valor']]) { c.setAttribute('cx', 40); c.setAttribute('cy', 40); c.setAttribute('r', 36); c.setAttribute('class', cl); svg.append(c); }
  valor.setAttribute('stroke', 'currentColor');
  const num = h('b', {}, '0');
  const caja = h('div', { class: `anillo nivel-${nivel}`, role: 'img', 'aria-label': `Puntaje de seguridad ${puntaje} de 100` }, svg, num);
  requestAnimationFrame(() => requestAnimationFrame(() => { valor.style.strokeDashoffset = String(226 * (1 - puntaje / 100)); contar(num, puntaje, 1100); }));
  return caja;
}
export const nivelDe = (p) => (p >= 60 ? 'alto' : p >= 40 ? 'medio' : 'bajo');
export const textoNivel = (p) => (p >= 60 ? 'Bastante segura' : p >= 40 ? 'Con precaución' : 'Poco recomendable');

/** Revelación de insignia con destellos. Devuelve una promesa que se resuelve al cerrar. */
export function mostrarInsignia(ins) {
  return new Promise((resolver) => {
    const caja = h('div', { class: 'caja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ins-t' },
      icono('estrella', 'gran-estrella'),
      h('p', { class: 'etiqueta', estilo: { 'justify-content': 'center', 'margin-top': '14px' } }, 'Nueva insignia de confianza'),
      h('h2', { id: 'ins-t' }, ins.nombre),
      h('p', { class: 'suave', estilo: { margin: '8px 0 20px' } }, ins.descripcion),
      h('button', { class: 'btn bloque', type: 'button', onclick: () => { velo.remove(); resolver(); } }, 'Seguir cuidando el camino'));
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2; const r = 120 + Math.random() * 90;
      caja.append(h('i', { class: 'chispa', estilo: { left: '50%', top: '120px', '--dx': `${Math.cos(a) * r}px`, '--dy': `${Math.sin(a) * r}px`, 'animation-delay': `${Math.random() * 0.25}s` } }));
    }
    const velo = h('div', { class: 'modal-insignia' }, caja);
    document.body.append(velo);
    caja.querySelector('button').focus();
    anunciar(`Ganaste la insignia ${ins.nombre}`);
  });
}

// Ondas en los botones (efecto de toque)
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest?.('.btn');
  if (!b || b.disabled) return;
  const r = b.getBoundingClientRect();
  const d = Math.max(r.width, r.height);
  const o = h('span', { class: 'onda', estilo: { width: `${d}px`, height: `${d}px`, left: `${e.clientX - r.left - d / 2}px`, top: `${e.clientY - r.top - d / 2}px` } });
  b.append(o);
  setTimeout(() => o.remove(), 650);
});

export const vibrar = (patron) => { try { navigator.vibrate?.(patron); } catch { /* sin soporte */ } };
