// Ayuda contextual: cómo funciona, qué datos guardamos y los límites de la herramienta.
import { h, icono } from '../ui.js';

const PREGUNTAS = [
  ['¿Cómo se calcula el puntaje de una ruta?', 'Cada 25 metros medimos luminarias cercanas, cámaras de seguridad, comercios que estarán abiertos a tu hora y el riesgo histórico de los reportes (más peso si son de una hora parecida, recientes y confirmados). El puntaje de 0 a 100 mezcla el promedio con el 20 % de tramos más débiles, para que un tramo oscuro no quede escondido.'],
  ['¿Por qué a veces la ruta segura es más larga?', 'Porque priorizamos la seguridad sobre la distancia, hasta un máximo de +60 %. Siempre te mostramos cuánto más caminas y qué ganas a cambio.'],
  ['¿Qué pasa si me desvío?', 'Si te alejas más de 45 m de la ruta durante 3 lecturas seguidas de GPS, suena una alerta visual y por vibración. Puedes recalcular desde donde estás o silenciarla.'],
  ['¿Qué datos guardan de mí?', 'Tu correo y nombre (o apodo), tus reportes (anónimos para las demás), tus puntos e insignias. La placa del taxi y su foto se guardan cifradas, ligadas a un solo viaje, y se borran solas poco después de terminarlo. Tu posición GPS nunca se envía al servidor mientras caminas.'],
  ['¿Cómo se evita el mal uso de los reportes?', 'No se aceptan teléfonos, correos ni enlaces. Si dos usuarias denuncian un reporte, sale de la vista pública y una moderadora (una persona) decide, con justificación guardada en un registro de auditoría.'],
  ['¿Qué tan confiable es el mapa de calor?', 'Es una estimación estadística construida con reportes ciudadanos. No predice delitos ni garantiza que una zona sea segura o peligrosa. Una zona sin reportes puede significar que nadie ha reportado, no que sea segura.'],
  ['Los datos de demostración', 'Las luminarias, cámaras, comercios y los reportes iniciales de este prototipo son simulados. Cuando hay conexión, Luma también usa datos reales de OpenStreetMap.'],
];

export function render(cont) {
  cont.append(h('div', { class: 'pila entra' },
    h('div', {}, h('span', { class: 'etiqueta' }, icono('ayuda'), 'Ayuda'), h('h2', {}, 'Cómo funciona Luma')),
    h('div', { class: 'aviso peligro' }, icono('alerta'), h('div', {}, h('strong', {}, 'En una emergencia llama al 123.'), ' La línea 155 orienta a mujeres víctimas de violencia. Luma no reemplaza a las autoridades ni tiene botón de pánico.')),
    ...PREGUNTAS.map(([q, a]) => h('details', { class: 'tarjeta' }, h('summary', { style: 'cursor:pointer;font-weight:600' }, q), h('p', { class: 'suave', style: 'margin-top:10px' }, a))),
    h('a', { class: 'btn sec', href: '#/perfil' }, 'Volver')));
}
