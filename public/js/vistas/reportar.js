// Formulario de reporte de riesgo: municipio + punto de referencia + categoría (+ descripción opcional).
import { api, ErrorApi } from '../api.js';
import { estado, horaActualColombia } from '../estado.js';
import * as mapa from '../mapa.js';
import { CATEGORIAS, ayuda, h, hora12, icono, toast } from '../ui.js';
import { posicionActual } from '../ubicacion.js';
import { mostrarPremios } from './acciones.js';

export async function render(cont, { ir }) {
  let categoria = null;
  let puntoMapa = null;
  let marcador = null;
  mapa.irA(estado.municipio, 15);

  const selMun = h('select', { id: 'r-mun' }, estado.municipios.map((m) => h('option', { value: m.id, selected: m.id === estado.municipioId }, m.nombre)));
  const ref = h('input', { id: 'r-ref', maxlength: 120, placeholder: 'Ej. Parque principal, frente al colegio', autocomplete: 'off', required: true, 'aria-describedby': 'r-ref-err r-ref-ayuda' });
  const desc = h('textarea', { id: 'r-desc', maxlength: 280, placeholder: 'Qué pasó o cómo se ve el lugar (opcional)', 'aria-describedby': 'r-desc-ayuda r-desc-cont' });
  const contador = h('span', { id: 'r-desc-cont', class: 'ayuda-txt' }, '0 / 280');
  desc.addEventListener('input', () => { contador.textContent = `${desc.value.length} / 280`; });
  const errRef = h('div', { class: 'error-campo', id: 'r-ref-err', role: 'alert' });
  const errCat = h('div', { class: 'error-campo', role: 'alert' });
  const errGeneral = h('div', { class: 'aviso peligro', role: 'alert', hidden: true });
  const ubicacionTxt = h('span', { class: 'ayuda-txt' }, 'Si no marcas el punto, lo ubicamos con el nombre del lugar.');
  const enviar = h('button', { class: 'btn bloque', type: 'submit' }, icono('check'), 'Publicar reporte');

  const grupo = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Tipo de riesgo' },
    Object.entries(CATEGORIAS).filter(([k]) => k !== 'LUMINARIA_DANADA').map(([clave, c]) => {
      const b = h('button', { class: 'chip', type: 'button', role: 'radio', 'aria-checked': 'false' }, icono(c.icono), c.etiqueta);
      b.addEventListener('click', () => { categoria = clave; grupo.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); errCat.textContent = ''; });
      return b;
    }));

  function marcar(p) {
    puntoMapa = p;
    if (marcador) marcador.remove?.();
    mapa.limpiarMarcadores();
    marcador = mapa.pin(p, { color: '#ff6f9c', glifo: 'alerta', latir: true, titulo: 'Punto del reporte' });
    ubicacionTxt.textContent = `Punto marcado (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}).`;
    mapa.sinClic(); mapa.cursorElegir(false);
  }

  const form = h('form', { class: 'pila', novalidate: true },
    h('div', { class: 'campo' }, h('label', { for: 'r-mun' }, 'Municipio'), selMun),
    h('div', { class: 'campo' }, h('label', { for: 'r-ref' }, 'Punto de referencia', ayuda('Un lugar que otra persona reconozca: un parque, una esquina, una tienda. Así ubicamos el reporte en el mapa.')), ref, errRef),
    h('div', { class: 'campo' }, h('span', { class: 'rotulo' }, 'Tipo de riesgo'), grupo, errCat),
    h('div', { class: 'fila' },
      h('button', { class: 'chip', type: 'button', onclick: async () => { try { marcar(await posicionActual()); } catch (e) { toast(e.message, 'error'); } } }, icono('ubicacion'), 'Estoy aquí'),
      h('button', { class: 'chip', type: 'button', onclick: () => { toast('Toca el mapa para marcar el punto.'); mapa.cursorElegir(true); mapa.alClic(marcar); } }, icono('pin'), 'Marcar en el mapa')),
    ubicacionTxt,
    h('div', { class: 'campo' }, h('label', { for: 'r-desc' }, 'Descripción'), desc, h('div', { class: 'fila entre' }, h('span', { class: 'ayuda-txt', id: 'r-desc-ayuda' }, 'No incluyas nombres, teléfonos ni enlaces: protegemos a todas las personas.'), contador)),
    h('div', { class: 'aviso info' }, icono('candado'), `Tu reporte es anónimo para las demás usuarias y se registra a las ${hora12(horaActualColombia())}.`),
    errGeneral, enviar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errRef.textContent = errCat.textContent = ''; errGeneral.hidden = true;
    let ok = true;
    if (ref.value.trim().length < 3) { errRef.textContent = 'Escribe un punto de referencia (mínimo 3 letras).'; ref.setAttribute('aria-invalid', 'true'); ref.focus(); ok = false; } else ref.removeAttribute('aria-invalid');
    if (!categoria) { errCat.textContent = 'Elige el tipo de riesgo.'; ok = ok && false; if (ref.getAttribute('aria-invalid') == null) grupo.querySelector('[role=radio]').focus(); }
    if (!ok) return;
    enviar.disabled = true;
    try {
      const r = await api.post('/reportes', {
        municipio_id: Number(selMun.value), referencia: ref.value.trim(), categoria,
        ...(desc.value.trim() ? { descripcion: desc.value.trim() } : {}), ...(puntoMapa ?? {}),
      });
      if (r.reporte.precision_ubicacion === 'APROXIMADA') toast('No pudimos ubicar el lugar con exactitud; lo marcamos de forma aproximada.');
      await mostrarPremios(r);
      estado.elegirMunicipio(Number(selMun.value));
      ir('/reportes');
    } catch (err) {
      if (err instanceof ErrorApi && err.detalles?.length) {
        const d = err.detalles[0];
        (d.campo === 'referencia' ? errRef : errGeneral).textContent = d.mensaje;
        errGeneral.hidden = d.campo === 'referencia';
        if (!errGeneral.hidden) errGeneral.prepend(icono('alerta'));
      } else { errGeneral.hidden = false; errGeneral.replaceChildren(icono('alerta'), err.message); }
    } finally { enviar.disabled = false; }
  });

  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('alerta'), 'Cuidémonos entre todas'), h('h2', {}, 'Reportar un punto de riesgo')),
    form));
  ref.focus();
  return () => { mapa.sinClic(); mapa.limpiarMarcadores(); };
}
