// Bienvenida (onboarding de 3 pasos con luciérnagas) y formularios de acceso.
import { api, ErrorApi, sesion } from '../api.js';
import { estado } from '../estado.js';
import { h, icono, toast } from '../ui.js';

const logoLuna = () => {
  const s = icono('luna', 'luna-logo');
  s.setAttribute('stroke-width', '1.4');
  return s;
};

/** Luciérnagas: partículas lila que derivan y se acercan al puntero. Se desactiva con movimiento reducido. */
function luciernagas(lienzo) {
  const ctx = lienzo.getContext('2d');
  let ancho, alto, raf;
  const puntero = { x: -999, y: -999 };
  const bichos = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), v: 0.05 + Math.random() * 0.12, f: Math.random() * 6, r: 1.2 + Math.random() * 2.2, a: Math.random() * 6.28 }));
  const ajustar = () => { ancho = lienzo.width = lienzo.offsetWidth; alto = lienzo.height = lienzo.offsetHeight; };
  ajustar();
  window.addEventListener('resize', ajustar);
  const mover = (e) => { puntero.x = e.clientX; puntero.y = e.clientY; };
  window.addEventListener('pointermove', mover);
  const paso = (t) => {
    ctx.clearRect(0, 0, ancho, alto);
    for (const b of bichos) {
      b.a += (Math.sin(t / 2200 + b.f) * 0.04);
      b.x += (Math.cos(b.a) * b.v) / 300; b.y += (Math.sin(b.a) * b.v) / 300 - 0.00006;
      let px = b.x * ancho, py = b.y * alto;
      const dx = puntero.x - px, dy = puntero.y - py, d = Math.hypot(dx, dy);
      if (d < 220) { b.x += (dx / d) * 0.0009; b.y += (dy / d) * 0.0009; }
      if (b.y < -0.05) { b.y = 1.05; } if (b.x < -0.05) b.x = 1.05; if (b.x > 1.05) b.x = -0.05; if (b.y > 1.1) b.y = -0.02;
      px = b.x * ancho; py = b.y * alto;
      const brillo = 0.45 + 0.55 * Math.abs(Math.sin(t / 900 + b.f));
      const g = ctx.createRadialGradient(px, py, 0, px, py, b.r * 9);
      g.addColorStop(0, `rgba(230,220,255,${brillo})`); g.addColorStop(0.3, `rgba(182,156,255,${brillo * 0.45})`); g.addColorStop(1, 'rgba(155,123,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, b.r * 9, 0, 6.29); ctx.fill();
    }
    raf = requestAnimationFrame(paso);
  };
  raf = requestAnimationFrame(paso);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', ajustar); window.removeEventListener('pointermove', mover); };
}

const PASOS = [
  { icono: 'ruta', titulo: 'El camino más <em>iluminado</em>, no solo el más corto', texto: 'Luma compara rutas según luminarias, cámaras y comercios abiertos a la hora en que caminas.' },
  { icono: 'alerta', titulo: 'Te avisamos <em>si te desvías</em>', texto: 'Mientras caminas, una alerta suave y clara te dice si te alejas de la ruta planeada.' },
  { icono: 'estrella', titulo: 'Una comunidad que <em>cuida</em>', texto: 'Cada reporte y cada luminaria dañada que marcas mejora el mapa para todas. Ganas insignias de confianza.' },
];

export function pantallaBienvenida(raiz) {
  let paso = 0;
  const lienzo = h('canvas', { 'aria-hidden': 'true' });
  const titulo = h('h1', { 'aria-live': 'polite' });
  const texto = h('p', { class: 'suave' });
  const puntos = h('div', { class: 'pasos-punto', 'aria-hidden': 'true' }, PASOS.map(() => h('i')));
  const siguiente = h('button', { class: 'btn', type: 'button' });
  const saltar = h('button', { class: 'btn sec', type: 'button', onclick: () => { location.hash = '#/entrar'; } }, 'Ya tengo cuenta');

  function pintar() {
    const p = PASOS[paso];
    titulo.innerHTML = p.titulo; // texto fijo del código (contiene <em>), sin datos de usuarias
    texto.textContent = p.texto;
    [...puntos.children].forEach((el, i) => el.classList.toggle('act', i === paso));
    siguiente.replaceChildren(paso < PASOS.length - 1 ? 'Siguiente' : 'Crear mi cuenta', icono('flecha'));
    titulo.parentElement?.classList.remove('entra'); void titulo.offsetWidth; titulo.parentElement?.classList.add('entra');
  }
  siguiente.addEventListener('click', () => { if (paso < PASOS.length - 1) { paso++; pintar(); } else location.hash = '#/registro'; });

  const hero = h('div', { class: 'hero' },
    h('div', { class: 'logo' }, logoLuna(), 'Luma'),
    h('div', { class: 'pila entra' }, h('span', { class: 'etiqueta' }, icono('escudo'), 'Ruta segura · Cundinamarca'), titulo, texto),
    puntos,
    h('div', { class: 'fila' }, siguiente, saltar),
    h('p', { class: 'ayuda-txt' }, 'Luma es una herramienta colaborativa de información. No reemplaza a las autoridades ni incluye botón de pánico.'));
  raiz.replaceChildren(lienzo, hero);
  pintar();
  const parar = luciernagas(lienzo);
  siguiente.focus();
  return parar;
}

// ───────────────────────── Acceso ─────────────────────────
function campo({ id, etiqueta, tipo = 'text', autocompletar, ayuda, requerido = true, extra = {} }) {
  const error = h('div', { class: 'error-campo', id: `${id}-error`, 'aria-live': 'polite' });
  const entrada = h('input', { id, name: id, type: tipo, autocomplete: autocompletar, required: requerido, 'aria-describedby': `${id}-error${ayuda ? ` ${id}-ayuda` : ''}`, ...extra });
  const nodo = h('div', { class: 'campo' }, h('label', { for: id }, etiqueta), entrada, ayuda ? h('div', { class: 'ayuda-txt', id: `${id}-ayuda` }, ayuda) : null, error);
  return { nodo, entrada, error };
}

function mostrarErrores(err, campos) {
  for (const c of Object.values(campos)) { c.error.textContent = ''; c.entrada.removeAttribute('aria-invalid'); }
  const detalles = err instanceof ErrorApi ? err.detalles : null;
  if (detalles?.length) {
    for (const d of detalles) { const c = campos[d.campo]; if (c) { c.error.textContent = d.mensaje; c.entrada.setAttribute('aria-invalid', 'true'); } }
    campos[detalles[0].campo]?.entrada.focus();
    return true;
  }
  return false;
}

export function pantallaAcceso(raiz, modo) {
  const registro = modo === 'registro';
  const campos = {
    nombre: registro ? campo({ id: 'nombre', etiqueta: 'Nombre o apodo', autocompletar: 'nickname', ayuda: 'No tiene que ser tu nombre real. No se muestra en tus reportes.' }) : null,
    email: campo({ id: 'email', etiqueta: 'Correo', tipo: 'email', autocompletar: 'email' }),
    password: campo({ id: 'password', etiqueta: 'Contraseña', tipo: 'password', autocompletar: registro ? 'new-password' : 'current-password', ayuda: registro ? 'Mínimo 8 caracteres, con letras y números.' : null, extra: { minlength: registro ? 8 : null } }),
  };
  const mun = h('select', { id: 'municipio', name: 'municipio' }, estado.municipios.map((m) => h('option', { value: m.id, selected: m.id === estado.municipioId }, m.nombre)));
  const enviar = h('button', { class: 'btn bloque', type: 'submit' }, registro ? 'Crear cuenta' : 'Entrar', icono('flecha'));
  const errorGeneral = h('div', { class: 'aviso peligro', role: 'alert', hidden: true });

  const form = h('form', { class: 'pila', novalidate: true },
    ...[campos.nombre, campos.email, campos.password].filter(Boolean).map((c) => c.nodo),
    registro ? h('div', { class: 'campo' }, h('label', { for: 'municipio' }, 'Tu municipio'), mun) : null,
    errorGeneral, enviar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorGeneral.hidden = true;
    enviar.disabled = true;
    try {
      const cuerpo = registro
        ? { nombre: campos.nombre.entrada.value, email: campos.email.entrada.value, password: campos.password.entrada.value, municipio_id: Number(mun.value) }
        : { email: campos.email.entrada.value, password: campos.password.entrada.value };
      const r = await api.post(registro ? '/auth/registro' : '/auth/login', cuerpo);
      sesion.guardar(r.token);
      estado.usuaria = r.usuaria;
      if (r.usuaria.municipio_id) estado.elegirMunicipio(r.usuaria.municipio_id);
      try { estado.viaje = (await api.get('/viajes/actual')).viaje; } catch { /* nada */ }
      toast(`Hola, ${r.usuaria.nombre.split(' ')[0]}. Qué bueno verte.`);
      location.hash = '#/mapa';
    } catch (err) {
      if (!mostrarErrores(err, campos)) { errorGeneral.hidden = false; errorGeneral.replaceChildren(icono('alerta'), err.message); }
    } finally { enviar.disabled = false; }
  });

  const lienzo = h('canvas', { 'aria-hidden': 'true' });
  const tarjeta = h('div', { class: 'hero' },
    h('a', { class: 'logo', href: '#/', 'aria-label': 'Luma, volver al inicio', style: 'text-decoration:none;color:inherit' }, logoLuna(), 'Luma'),
    h('div', { class: 'pila entra' },
      h('h1', {}, registro ? 'Crea tu espacio seguro' : 'Qué bueno verte de nuevo'),
      h('p', { class: 'suave' }, registro ? 'Solo necesitas un correo. Tus reportes son anónimos para las demás usuarias.' : 'Entra para planear tu próxima caminata.')),
    h('div', { class: 'tarjeta' }, form),
    h('p', { class: 'suave' }, registro ? '¿Ya tienes cuenta? ' : '¿Primera vez? ', h('a', { href: registro ? '#/entrar' : '#/registro' }, registro ? 'Entra aquí' : 'Crea una cuenta')),
    !registro && estado.demo ? h('p', { class: 'ayuda-txt' }, 'Demostración: sofia@demo.co · Luna2026!') : null);
  raiz.replaceChildren(lienzo, tarjeta);
  const parar = luciernagas(lienzo);
  (campos.nombre ?? campos.email).entrada.focus();
  return parar;
}
