import { api, sesion } from './api.js';
import { estado } from './estado.js';
import { iniciarMapa } from './mapa.js';
import { h, icono, toast } from './ui.js';
import { pantallaBienvenida, pantallaAcceso } from './vistas/bienvenida.js';

const RUTAS = {
  '/mapa': () => import('./vistas/inicio.js'),
  '/ruta': () => import('./vistas/ruta.js'),
  '/viaje': () => import('./vistas/viaje.js'),
  '/reportar': () => import('./vistas/reportar.js'),
  '/reportes': () => import('./vistas/reportes.js'),
  '/perfil': () => import('./vistas/perfil.js'),
  '/moderacion': () => import('./vistas/moderacion.js'),
  '/ayuda': () => import('./vistas/ayuda.js'),
};

const NAV = [
  { ruta: '/mapa', icono: 'mapa', texto: 'Mapa' },
  { ruta: '/ruta', icono: 'ruta', texto: 'Ruta' },
  { ruta: '/reportar', icono: 'mas', texto: 'Reportar', central: true },
  { ruta: '/reportes', icono: 'lista', texto: 'Reportes' },
  { ruta: '/perfil', icono: 'perfil', texto: 'Yo' },
];

const $ = (id) => document.getElementById(id);
let limpiar = null;
let numeroNavegacion = 0;

export const ir = (ruta) => { location.hash = `#${ruta}`; };

function dibujarNav(actual) {
  const nav = $('nav');
  const items = estado.usuaria?.rol === 'MODERADORA' ? [...NAV.slice(0, 4), { ruta: '/moderacion', icono: 'mod', texto: 'Moderar' }, NAV[4]] : NAV;
  nav.replaceChildren(...items.map((n) => {
    const a = h('a', { href: `#${n.ruta}`, 'aria-current': n.ruta === actual ? 'page' : null, 'aria-label': n.texto },
      n.central ? h('span', { class: 'orbe' }, icono(n.icono)) : icono(n.icono), n.central ? null : h('span', {}, n.texto));
    if (n.central) a.classList.add('central');
    return a;
  }));
}

async function navegar() {
  const miNumero = ++numeroNavegacion;
  const ruta = location.hash.replace(/^#/, '').split('?')[0] || '';
  if (limpiar) { try { limpiar(); } catch { /* vista ya cerrada */ } limpiar = null; }

  if (!estado.usuaria) {
    $('panel').hidden = true; $('nav').hidden = true;
    const bienvenida = $('bienvenida'); bienvenida.hidden = false;
    if (ruta === '/entrar') limpiar = pantallaAcceso(bienvenida, 'login');
    else if (ruta === '/registro') limpiar = pantallaAcceso(bienvenida, 'registro');
    else limpiar = pantallaBienvenida(bienvenida);
    return;
  }

  $('bienvenida').hidden = true;
  if (!RUTAS[ruta]) return ir(estado.viaje ? '/viaje' : '/mapa');
  $('panel').hidden = false; $('nav').hidden = false;
  $('panel').classList.remove('oculto'); $('asa').setAttribute('aria-expanded', 'true');
  dibujarNav(ruta);
  const modulo = await RUTAS[ruta]();
  if (miNumero !== numeroNavegacion) return; // la usuaria ya navegó a otro sitio
  const cont = $('contenido');
  cont.replaceChildren();
  cont.scrollTop = 0;
  limpiar = (await modulo.render(cont, { ir })) ?? null;
  cont.focus({ preventScroll: true });
}

async function arrancar() {
  try { estado.demo = Boolean((await api.get('/salud')).demo); } catch { /* sin red */ }
  try { estado.municipios = (await api.get('/municipios')).municipios; } catch { /* sin red: se reintenta al usar */ }
  if (!estado.municipioId && estado.municipios[0]) estado.municipioId = estado.municipios[0].id;
  if (sesion.token()) {
    try { estado.usuaria = (await api.get('/auth/yo')).usuaria; } catch { sesion.borrar(); }
  }
  if (estado.usuaria?.municipio_id && !localStorage.getItem('nova.municipio')) estado.elegirMunicipio(estado.usuaria.municipio_id);
  const centro = estado.municipio ?? { lat: 5.0224, lng: -74.0046 };
  iniciarMapa(centro);
  if (estado.usuaria) {
    try { estado.viaje = (await api.get('/viajes/actual')).viaje; } catch { /* sin viaje activo */ }
  }
  navegar();
}

window.addEventListener('hashchange', navegar);
document.addEventListener('sesion-vencida', () => {
  sesion.borrar(); estado.usuaria = null; estado.viaje = null;
  toast('Tu sesión venció. Vuelve a ingresar para continuar.', 'error');
  ir('/entrar');
});
$('asa').addEventListener('click', () => {
  const oculto = $('panel').classList.toggle('oculto');
  $('asa').setAttribute('aria-expanded', String(!oculto));
});
$('saltar').addEventListener('click', (e) => { e.preventDefault(); $('contenido').focus(); });

arrancar();
