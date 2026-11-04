// Reporte de riesgo: el lugar se busca, se VERIFICA que exista y el mapa navega solo hasta él.
import { api, ErrorApi } from '../api.js';
import { estado, horaActualColombia } from '../estado.js';
import * as mapa from '../mapa.js';
import { CATEGORIAS, ayuda, h, hora12, icono, toast } from '../ui.js';
import { posicionActual } from '../ubicacion.js';
import { haversine } from '/shared/geo.js';
import { mostrarPremios } from './acciones.js';

const RADIO_M = 600; // el punto ajustado debe quedar cerca del lugar verificado (igual que en el servidor)

export async function render(cont, { ir }) {
  let categoria = null;
  let lugar = null; // {lat, lng, nombre, consulta}
  let vivo = true;
  let temporizador;
  let consultaId = 0;

  const selMun = h('select', { id: 'r-mun' }, estado.municipios.map((m) => h('option', { value: m.id, selected: m.id === estado.municipioId }, m.nombre)));
  const municipio = () => estado.municipios.find((m) => m.id === Number(selMun.value));
  const ref = h('input', { id: 'r-ref', maxlength: 120, placeholder: 'Ej. Parque principal, terminal, colegio', autocomplete: 'off', required: true, 'aria-describedby': 'r-ref-err r-lugar' });
  const desc = h('textarea', { id: 'r-desc', maxlength: 280, placeholder: 'Qué pasó o cómo se ve el lugar (opcional)', 'aria-describedby': 'r-desc-ayuda r-desc-cont' });
  const contador = h('span', { id: 'r-desc-cont', class: 'ayuda-txt' }, '0 / 280');
  desc.addEventListener('input', () => { contador.textContent = `${desc.value.length} / 280`; });
  const errRef = h('div', { class: 'error-campo', id: 'r-ref-err', role: 'alert' });
  const errCat = h('div', { class: 'error-campo', role: 'alert' });
  const errGeneral = h('div', { class: 'aviso peligro', role: 'alert', hidden: true });
  const estadoLugar = h('div', { id: 'r-lugar', role: 'status', 'aria-live': 'polite' });
  const sugerencias = h('div', { class: 'lista-lugares' });
  const enviar = h('button', { class: 'btn bloque', type: 'submit' }, icono('check'), 'Publicar reporte');
  const ajustar = h('button', { class: 'chip', type: 'button', hidden: true }, icono('pin'), 'Ajustar el punto en el mapa');
  const gps = h('button', { class: 'chip', type: 'button', hidden: true }, icono('ubicacion'), 'Estoy en este lugar');

  // El mapa acompaña la selección: al elegir municipio vuela hasta él, sin que haya que moverlo a mano.
  function irAlMunicipio() { mapa.limpiarMarcadores(); mapa.irA(municipio(), 15); }

  function elegirLugar(l, consulta) {
    lugar = { lat: l.lat, lng: l.lng, nombre: l.nombre, consulta };
    sugerencias.replaceChildren();
    estadoLugar.replaceChildren(h('div', { class: 'aviso info' }, icono('check'), h('div', {}, h('strong', {}, 'Lugar verificado: '), l.nombre.split(',').slice(0, 3).join(','))));
    ajustar.hidden = false; gps.hidden = false;
    errRef.textContent = ''; ref.removeAttribute('aria-invalid');
    mapa.limpiarMarcadores();
    mapa.pin(lugar, { color: '#ff6f9c', glifo: 'alerta', latir: true, titulo: 'Lugar del reporte' });
    mapa.irA(lugar, 17);
  }

  async function buscar() {
    const q = ref.value.trim();
    const id = ++consultaId;
    if (q.length < 3) { sugerencias.replaceChildren(); estadoLugar.replaceChildren(); return; }
    estadoLugar.replaceChildren(h('span', { class: 'ayuda-txt' }, `Buscando «${q}» en ${municipio().nombre}…`));
    try {
      const r = await api.get(`/geocodificar?q=${encodeURIComponent(q)}&municipio_id=${municipio().id}`);
      if (!vivo || id !== consultaId) return;
      if (!r.disponible) { estadoLugar.replaceChildren(h('div', { class: 'aviso' }, icono('alerta'), 'No pudimos verificar lugares en este momento. Inténtalo de nuevo en unos minutos.')); return; }
      if (!r.resultados.length) { estadoLugar.replaceChildren(h('div', { class: 'aviso' }, icono('alerta'), `No encontramos «${q}» en ${municipio().nombre}. Prueba con otro nombre (parque, colegio, calle, tienda).`)); sugerencias.replaceChildren(); return; }
      estadoLugar.replaceChildren(h('span', { class: 'ayuda-txt' }, 'Elige el lugar correcto:'));
      sugerencias.replaceChildren(...r.resultados.map((l) => h('button', { class: 'lugar', type: 'button', onclick: () => elegirLugar(l, q) }, icono('pin'), l.nombre.split(',').slice(0, 3).join(','))));
    } catch (e) { estadoLugar.replaceChildren(h('div', { class: 'aviso peligro', role: 'alert' }, icono('alerta'), e.message)); }
  }

  ref.addEventListener('input', () => {
    if (lugar && ref.value.trim() !== lugar.consulta) { lugar = null; ajustar.hidden = gps.hidden = true; mapa.limpiarMarcadores(); }
    clearTimeout(temporizador);
    temporizador = setTimeout(buscar, 700);
  });
  selMun.addEventListener('change', () => {
    estado.elegirMunicipio(Number(selMun.value));
    lugar = null; ajustar.hidden = gps.hidden = true; sugerencias.replaceChildren(); estadoLugar.replaceChildren();
    irAlMunicipio();
    if (ref.value.trim().length >= 3) buscar();
  });

  function moverPunto(p, origen) {
    if (haversine(p, lugar) > RADIO_M) { toast(`Ese punto queda a más de ${RADIO_M} m de «${lugar.consulta}». Acércalo al lugar.`, 'error'); return false; }
    lugar = { ...lugar, lat: p.lat, lng: p.lng };
    mapa.limpiarMarcadores();
    mapa.pin(lugar, { color: '#ff6f9c', glifo: 'alerta', latir: true, titulo: 'Lugar del reporte' });
    if (origen === 'mapa') { mapa.sinClic(); mapa.cursorElegir(false); }
    return true;
  }
  ajustar.addEventListener('click', () => { toast('Toca el mapa cerca del lugar para afinar el punto.'); mapa.cursorElegir(true); mapa.alClic((p) => moverPunto(p, 'mapa')); });
  gps.addEventListener('click', async () => { try { moverPunto(await posicionActual(), 'gps'); } catch (e) { toast(e.message, 'error'); } });

  const grupo = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Tipo de riesgo' },
    Object.entries(CATEGORIAS).filter(([k]) => k !== 'LUMINARIA_DANADA').map(([clave, c]) => {
      const b = h('button', { class: 'chip', type: 'button', role: 'radio', 'aria-checked': 'false' }, icono(c.icono), c.etiqueta);
      b.addEventListener('click', () => { categoria = clave; grupo.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); errCat.textContent = ''; });
      return b;
    }));

  const form = h('form', { class: 'pila', novalidate: true },
    h('div', { class: 'campo' }, h('label', { for: 'r-mun' }, 'Municipio'), selMun),
    h('div', { class: 'campo' }, h('label', { for: 'r-ref' }, 'Punto de referencia', ayuda('Escribe un lugar que exista: un parque, un colegio, una calle, una tienda. Lo buscamos en el mapa y confirmamos que está en tu municipio.')), ref, errRef, estadoLugar, sugerencias),
    h('div', { class: 'fila' }, ajustar, gps),
    h('div', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Tipo de riesgo'), grupo, errCat),
    h('div', { class: 'campo' }, h('label', { for: 'r-desc' }, 'Descripción'), desc, h('div', { class: 'fila entre' }, h('span', { class: 'ayuda-txt', id: 'r-desc-ayuda' }, 'No incluyas nombres, teléfonos ni enlaces: protegemos a todas las personas.'), contador)),
    h('div', { class: 'aviso info' }, icono('candado'), `Tu reporte es anónimo para las demás usuarias y se registra a las ${hora12(horaActualColombia())}.`),
    errGeneral, enviar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errRef.textContent = errCat.textContent = ''; errGeneral.hidden = true;
    let ok = true;
    if (ref.value.trim().length < 3) { errRef.textContent = 'Escribe un punto de referencia (mínimo 3 letras).'; ref.setAttribute('aria-invalid', 'true'); ref.focus(); ok = false; }
    else if (!lugar) { errRef.textContent = 'Elige un lugar de la lista para confirmar que existe.'; ref.setAttribute('aria-invalid', 'true'); ref.focus(); if (!sugerencias.children.length) buscar(); ok = false; }
    if (!categoria) { errCat.textContent = 'Elige el tipo de riesgo.'; if (ok) grupo.querySelector('[role=radio]').focus(); ok = false; }
    if (!ok) return;
    enviar.disabled = true;
    try {
      const r = await api.post('/reportes', {
        municipio_id: Number(selMun.value), referencia: ref.value.trim(), categoria,
        ...(desc.value.trim() ? { descripcion: desc.value.trim() } : {}), lat: lugar.lat, lng: lugar.lng,
      });
      await mostrarPremios(r);
      estado.elegirMunicipio(Number(selMun.value));
      ir('/reportes');
    } catch (err) {
      if (err instanceof ErrorApi && err.detalles?.length) {
        const d = err.detalles[0];
        if (d.campo === 'referencia') errRef.textContent = d.mensaje;
        else { errGeneral.hidden = false; errGeneral.replaceChildren(icono('alerta'), d.mensaje); }
      } else if (['REFERENCIA_NO_ENCONTRADA', 'PUNTO_NO_COINCIDE', 'FUERA_DE_MUNICIPIO'].includes(err.codigo)) {
        errRef.textContent = err.message; ref.setAttribute('aria-invalid', 'true'); ref.focus();
      } else { errGeneral.hidden = false; errGeneral.replaceChildren(icono('alerta'), err.message); }
    } finally { enviar.disabled = false; }
  });

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('alerta'), 'Cuidémonos entre todas'), h('h2', {}, 'Reportar un punto de riesgo')),
    form));
  irAlMunicipio();
  ref.focus();
  return () => { vivo = false; clearTimeout(temporizador); mapa.sinClic(); mapa.limpiarMarcadores(); };
}
