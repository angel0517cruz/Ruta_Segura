// Genera docs/Presentacion_Nova.pptx (16:9) para la sustentación de 10 minutos.
// Uso: npm install --no-save pptxgenjs  &&  node tools/presentacion/crear_presentacion.cjs
const path = require('node:path');
const pptxgen = require('pptxgenjs');

const RAIZ = path.resolve(__dirname, '..', '..');
const fs = require('node:fs');
// Usa la versión optimizada (JPEG, 1200 px) si existe: la plataforma limita el tamaño de los archivos.
const cap = (f) => {
  const opt = path.join(RAIZ, 'capturas-video', 'opt', f.replace(/\.png$/, '.jpg'));
  return fs.existsSync(opt) ? opt : path.join(RAIZ, 'capturas-video', f);
};
const SALIDA = path.join(RAIZ, 'docs', 'Presentacion_Nova.pptx');

// Paleta Nova: violeta noche + crema/beige (alertas en rosa)
const C = { noche: '150C33', noche2: '0E0824', violeta: '7C4DFF', violetaTxt: '5B34C9', tinta: '2A1763', crema: 'F6EDDC', beige: 'E8D6B8', arena: 'CDB48F', blanco: 'FFFFFF', rosa: 'FF6F9C', suave: '5E4E7E' };
const TITULO = 'Cambria';
const CUERPO = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
pres.title = 'Nova · Ruta Segura';
pres.author = 'Miguel Angel Cruz Londoño, Julian Alexander Gomez Galvis, Jose Manuel Yara Cruz';
pres.subject = 'Sustentación del reto translocal Cundinamarca';

const W = 13.33;
const M = 0.6;
const sombra = () => ({ type: 'outer', color: '000000', opacity: 0.25, blur: 8, offset: 3, angle: 90 });

// ───────── utilidades de diseño
function fondoClaro(s, kicker, titulo) {
  s.background = { color: C.crema };
  s.addText(kicker.toUpperCase(), { x: M, y: 0.38, w: 9, h: 0.3, fontFace: CUERPO, fontSize: 12, bold: true, color: C.violetaTxt, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText(titulo, { x: M, y: 0.7, w: W - 2 * M, h: 0.95, fontFace: TITULO, fontSize: 34, bold: true, color: C.tinta, margin: 0, valign: 'top', isTextBox: true });
}
function pie(s, oscuro = false) {
  s.addText('Nova · Ruta Segura', { x: M, y: 7.08, w: 4, h: 0.28, fontFace: CUERPO, fontSize: 10, color: oscuro ? C.arena : C.suave, margin: 0, isTextBox: true });
  s.slideNumber = { x: W - 1.0, y: 7.05, w: 0.5, h: 0.3, fontFace: CUERPO, fontSize: 10, color: oscuro ? C.arena : C.suave, align: 'right' };
}
function estrella(s, x, y, t, color = C.beige, transparencia = 0) {
  s.addShape(pres.shapes.STAR_4_POINT, { x, y, w: t, h: t, fill: { color, transparency: transparencia }, line: { color, transparency: 100 }, objectName: 'Destello' });
}
function foto(s, archivo, x, y, w, h, alt) {
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: C.blanco }, line: { color: C.beige, width: 1 }, shadow: sombra(), objectName: 'Marco de captura' });
  s.addImage({ path: cap(archivo), x, y, w, h, altText: alt });
}
function tarjeta(s, x, y, w, h, titulo, texto, opciones = {}) {
  const { numero, fondo = C.blanco, colorTitulo = C.tinta, colorTexto = C.suave, tTitulo = 18, tTexto = 14.5 } = opciones;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fondo }, line: { color: C.beige, width: 0.75 }, shadow: sombra(), objectName: `Tarjeta ${titulo}` });
  let yy = y + 0.2;
  if (numero) {
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: yy, w: 0.5, h: 0.5, fill: { color: C.violeta }, line: { color: C.violeta, transparency: 100 }, objectName: `Número ${numero}` });
    s.addText(String(numero), { x: x + 0.25, y: yy, w: 0.5, h: 0.5, fontFace: TITULO, fontSize: 18, bold: true, color: C.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    yy += 0.62;
  }
  const hTit = numero ? 0.85 : 0.5; // los títulos de las tarjetas numeradas pueden ocupar dos líneas
  s.addText(titulo, { x: x + 0.25, y: yy, w: w - 0.5, h: hTit, fontFace: TITULO, fontSize: tTitulo, bold: true, color: colorTitulo, margin: 0, valign: 'top', isTextBox: true });
  s.addText(texto, { x: x + 0.25, y: yy + hTit + 0.05, w: w - 0.5, h: h - (yy - y) - hTit - 0.3, fontFace: CUERPO, fontSize: tTexto, color: colorTexto, margin: 0, valign: 'top', isTextBox: true });
}
function viñetas(s, items, x, y, w, h, tam = 16, color = C.tinta) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 18 }, breakLine: i < items.length - 1 } })), { x, y, w, h, fontFace: CUERPO, fontSize: tam, color, paraSpaceAfter: 10, margin: 0, valign: 'top', isTextBox: true });
}
function cita(s, texto, x, y, w, h) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: C.noche }, line: { color: C.noche, transparency: 100 }, objectName: 'Frase destacada' });
  s.addText(texto, { x: x + 0.3, y, w: w - 0.6, h, fontFace: TITULO, italic: true, fontSize: 20, color: C.crema, valign: 'middle', margin: 0, isTextBox: true });
}

// ───────── 1. Portada
let s = pres.addSlide();
s.background = { color: C.noche };
for (const [x, y, t, tr] of [[0.7, 0.8, 0.5, 30], [6.2, 0.5, 0.28, 55], [6.6, 6.5, 0.4, 45], [12.2, 0.7, 0.35, 40]]) estrella(s, x, y, t, C.beige, tr);
estrella(s, 0.9, 1.5, 0.9, C.crema);
s.addText('Nova', { x: 0.9, y: 2.5, w: 6, h: 1.3, fontFace: TITULO, fontSize: 80, bold: true, color: C.crema, margin: 0, isTextBox: true });
s.addText('Ruta Segura', { x: 0.95, y: 3.75, w: 6, h: 0.6, fontFace: TITULO, fontSize: 28, color: C.beige, margin: 0, isTextBox: true });
s.addText('Ninguna camina sola.', { x: 0.95, y: 4.55, w: 6, h: 0.6, fontFace: TITULO, italic: true, fontSize: 26, color: C.arena, margin: 0, isTextBox: true });
s.addText('Miguel Angel Cruz Londoño\nJulian Alexander Gomez Galvis\nJose Manuel Yara Cruz', { x: 0.95, y: 5.55, w: 6, h: 1.0, fontFace: CUERPO, fontSize: 16, color: C.crema, margin: 0, isTextBox: true });
s.addText('Reto translocal Cundinamarca · Maratón de programación', { x: 0.95, y: 6.7, w: 7, h: 0.35, fontFace: CUERPO, fontSize: 13, color: C.arena, margin: 0, isTextBox: true });
s.addShape(pres.shapes.RECTANGLE, { x: 7.14, y: 1.44, w: 5.72, h: 3.62, fill: { color: C.noche2 }, line: { color: C.violeta, width: 1.25 }, shadow: sombra(), objectName: 'Marco portada' });
s.addImage({ path: cap('escritorio/02_mapa_calor_8pm.png'), x: 7.2, y: 1.5, w: 5.6, h: 3.5, altText: 'Mapa de calor de Nova a las 8 de la noche en Zipaquirá' });
s.addNotes('Buenas. Somos Miguel Angel, Julian y Jose Manuel, y les presentamos Nova, una aplicación para que las mujeres caminen de noche con más información en Cundinamarca. Su lema: Ninguna camina sola.');

// ───────── 2. Gancho
s = pres.addSlide();
s.background = { color: C.noche };
estrella(s, 11.6, 0.7, 0.6, C.beige, 35);
estrella(s, 0.7, 6.2, 0.4, C.beige, 50);
s.addText([
  { text: '¿Esa calle tiene luz?', options: { breakLine: true } },
  { text: '¿Hay algo abierto?', options: { breakLine: true } },
  { text: '¿Alguien ha tenido problemas ahí?' },
], { x: 0.9, y: 1.1, w: 11.5, h: 3.2, fontFace: TITULO, fontSize: 48, bold: true, color: C.crema, paraSpaceAfter: 12, margin: 0, valign: 'top', isTextBox: true });
s.addText('Para muchas mujeres, no es una molestia: es una barrera.', { x: 0.9, y: 4.9, w: 11.5, h: 1.2, fontFace: TITULO, italic: true, fontSize: 30, color: C.arena, margin: 0, valign: 'top', isTextBox: true });
pie(s, true);
s.addNotes('Piensen en el último trayecto que hicieron de noche. Cuántas decisiones tomaron sin información: ¿esa calle tiene luz?, ¿hay algo abierto?, ¿alguien ha tenido problemas ahí? Para muchas mujeres en Cundinamarca esa pregunta no es una molestia: es una barrera para estudiar, trabajar y moverse. (30 s)');

// ───────── 3. El problema
s = pres.addSlide();
fondoClaro(s, 'El problema', 'La información para decidir existe, pero nadie la junta');
tarjeta(s, M, 1.9, 3.85, 3.9, 'La inseguridad limita la movilidad', 'En parques, vías y entornos universitarios de varios municipios de Cundinamarca, la percepción de inseguridad frena a las mujeres.', { numero: 1, tTexto: 16.5 });
tarjeta(s, M + 4.1, 1.9, 3.85, 3.9, 'La información está dispersa', 'Luminarias, cámaras y comercios están en mapas abiertos. Lo que pasó en cada esquina solo lo sabe la comunidad.', { numero: 2, tTexto: 16.5 });
tarjeta(s, M + 8.2, 1.9, 3.85, 3.9, 'Nadie la junta al decidir', 'Justo cuando se elige por dónde caminar, no hay una sola fuente que reúna todo.', { numero: 3, tTexto: 16.5 });
s.addText('Reto translocal · ODS 5, 11 y 16', { x: M, y: 6.2, w: 8, h: 0.4, fontFace: CUERPO, fontSize: 16, bold: true, color: C.violetaTxt, margin: 0, isTextBox: true });
pie(s);
s.addNotes('En parques, vías y entornos universitarios de varios municipios, la percepción de inseguridad limita la movilidad de las mujeres. Lo curioso es que la información para decidir sí existe, pero está dispersa. Las luminarias, las cámaras y los comercios están en mapas abiertos, y lo que ha pasado en cada esquina solo lo sabe la comunidad. Nadie lo junta en el momento en que se decide el trayecto. (45 s)');

// ───────── 4. La solución
s = pres.addSlide();
fondoClaro(s, 'La solución', 'Nova reúne la información justo cuando vas a caminar');
const funciones = [
  ['Reportar con lugar verificado', 'Acoso, poca luz o zonas desoladas, en un lugar que existe de verdad.'],
  ['Ruta segura, no solo corta', 'Puntaje de seguridad de 0 a 100, explicado y a tu hora.'],
  ['Caminata con alertas', 'Te avisa si te desvías. Tu GPS no sale del teléfono.'],
  ['Mapa de calor por hora', 'Cómo cambia el riesgo según la hora de la noche.'],
];
funciones.forEach(([t, d], i) => tarjeta(s, M + (i % 2) * 4.4, 1.85 + Math.floor(i / 2) * 2.2, 4.15, 2.0, t, d, { tTitulo: 18, tTexto: 15.5 }));
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.55, y: 1.85, w: 3.2, h: 4.2, rectRadius: 0.12, fill: { color: C.noche }, line: { color: C.noche, transparency: 100 }, objectName: 'Significado del nombre' });
estrella(s, 10.9, 2.1, 0.5, C.beige);
s.addText('¿Por qué «Nova»?', { x: 9.8, y: 2.8, w: 2.7, h: 0.4, fontFace: TITULO, fontSize: 18, bold: true, color: C.crema, margin: 0, isTextBox: true });
s.addText('Una nova es una estrella que de pronto brilla donde antes no había luz.\n\nTambién se lee: «no va sola».', { x: 9.8, y: 3.25, w: 2.7, h: 2.6, fontFace: CUERPO, fontSize: 14.5, color: C.beige, margin: 0, valign: 'top', isTextBox: true });
s.addText('Ninguna camina sola.', { x: M, y: 6.35, w: 8, h: 0.45, fontFace: TITULO, italic: true, fontSize: 22, color: C.violetaTxt, margin: 0, isTextBox: true });
pie(s);
s.addNotes('Nova es una aplicación web colaborativa que junta esa información y se la entrega a la usuaria justo cuando va a caminar. El nombre viene de las novas, esas estrellas que de pronto brillan donde antes no había luz. También se lee como "no va sola". Hace cuatro cosas. (45 s)');

// ───────── 5. Reportar
s = pres.addSlide();
fondoClaro(s, 'Reportar', 'Reportes con lugar verificado');
viñetas(s, ['Acoso, poca iluminación o zona desolada', 'El lugar se valida en el mapa y el punto debe quedar a 600 m o menos de él', 'Si el servicio de lugares falla, no se publica sin verificar'], M, 1.95, 4.9, 2.9, 17);
cita(s, 'Preferimos rechazar a publicar un dato falso.', M, 5.0, 4.9, 1.4);
foto(s, 'escritorio/08_reportar_lugar_verificado.png', 5.85, 1.85, 6.85, 4.28, 'Formulario de reporte con el lugar verificado en el mapa');
pie(s);
s.addNotes('La usuaria reporta acoso, mala iluminación o zonas desoladas. No aceptamos lugares inventados: el sitio se valida con Nominatim dentro del municipio y el punto marcado debe quedar a 600 m o menos de ese lugar. Si el servicio de lugares falla, el reporte no se publica sin verificar. Prefirimos rechazar a publicar un dato falso.');

// ───────── 6. Ruta segura
s = pres.addSlide();
fondoClaro(s, 'Navegación inteligente', 'Ruta segura, no solo la más corta');
viñetas(s, ['Puntaje de 0 a 100, medido cada 25 metros', 'Luminarias, cámaras, comercios abiertos a esa hora, rutas verificadas y reportes', 'Pesa el tramo más débil: una ruta es tan segura como su peor tramo', 'La recomendación se explica, y siempre puedes elegir otra'], M, 1.95, 4.9, 4.4, 17);
foto(s, '04_ruta_segura.jpg', 5.85, 1.85, 6.85, 4.28, 'Comparación de rutas con puntaje de seguridad en Girardot');
pie(s);
s.addNotes('Evaluamos cada ruta cada 25 metros: luminarias, cámaras, comercios abiertos a esa hora, rutas verificadas por la comunidad y riesgo reportado. El resultado es un puntaje de 0 a 100, con peso especial en el tramo más débil, porque una ruta es tan segura como su peor tramo. La recomendación viene explicada en lenguaje claro, por ejemplo cuántos metros extra implica. La usuaria siempre puede elegir otra.');

// ───────── 7. Caminata, alerta y placa
s = pres.addSlide();
fondoClaro(s, 'Caminata', 'Alertas de desvío y placa del taxi, con privacidad');
foto(s, '06_alerta_desvio.jpg', M, 1.85, 6.45, 4.03, 'Alerta de desvío con borde rosado pulsante');
foto(s, 'recortes/placa.png', 7.55, 1.85, 2.2, 3.98, 'Registro de la placa del taxi');
s.addText('Alerta de desvío: borde pulsante, vibración y botón para recalcular', { x: M, y: 6.1, w: 6.45, h: 0.4, fontFace: CUERPO, italic: true, fontSize: 14, color: C.suave, margin: 0, isTextBox: true });
viñetas(s, ['Más de 45 m fuera de la ruta en 3 lecturas: alerta visual, vibración y aviso para lectores de pantalla', 'El GPS se procesa solo en el dispositivo', 'Placa cifrada (AES-256-GCM) que se borra sola'], 10.1, 1.85, 2.65, 4.4, 14.5);
pie(s);
s.addNotes('Si la usuaria se aleja más de 45 m de la ruta durante 3 lecturas seguidas, la app avisa con borde pulsante, vibración y anuncio para lectores de pantalla. El GPS se procesa solo en el dispositivo, nunca se transmite al servidor. La placa del taxi se guarda cifrada con AES-256-GCM, vence sola y la usuaria puede borrarla cuando quiera. Si quiere compartirla con alguien de confianza, ella toca el botón: Nova no envía nada por su cuenta.');

// ───────── 8. Mapa de calor
s = pres.addSlide();
fondoClaro(s, 'Mapa de calor', 'El riesgo cambia con la hora de la noche');
foto(s, 'escritorio/02_mapa_calor_8pm.png', M, 1.85, 5.95, 3.72, 'Mapa de calor a las 8 de la noche');
foto(s, 'escritorio/03_mapa_calor_madrugada.png', 6.78, 1.85, 5.95, 3.72, 'Mapa de calor a las 2 de la madrugada');
s.addText('8:00 p. m.', { x: M, y: 5.72, w: 5.95, h: 0.4, fontFace: TITULO, fontSize: 18, bold: true, color: C.tinta, margin: 0, isTextBox: true });
s.addText('2:00 a. m. · madrugada: máxima precaución', { x: 6.78, y: 5.72, w: 5.95, h: 0.4, fontFace: TITULO, fontSize: 18, bold: true, color: C.tinta, margin: 0, isTextBox: true });
s.addText('Una estimación estadística con reportes ciudadanos, no una predicción de delitos. Con el mapa acercado, las calles se ponen en rojo.', { x: M, y: 6.2, w: 12.1, h: 0.7, fontFace: CUERPO, fontSize: 15, color: C.suave, margin: 0, valign: 'top', isTextBox: true });
pie(s);
s.addNotes('El mapa muestra cómo cambia el riesgo según la hora de la noche: se mueve la luna del reloj nocturno y las manchas se encienden o se apagan. Es una estimación basada en reportes ciudadanos, ponderados por la cercanía de la hora, su antigüedad y las confirmaciones. No es una predicción de delitos y así lo decimos en la aplicación.');

// ───────── 9. Comunidad
s = pres.addSlide();
fondoClaro(s, 'Comunidad', 'Insignias de confianza para mantener los datos vivos');
viñetas(s, ['Verificar una ruta, reportar una luminaria dañada o confirmar un comercio abierto da puntos', 'Cuatro niveles (Chispa, Brasa, Aurora, Luna) y siete insignias', 'Esos aportes mejoran el algoritmo: una luminaria dañada resta seguridad a las rutas', 'Contra el abuso: tope de 40 puntos al día y aportes duplicados rechazados'], M, 1.95, 7.4, 4.6, 18);
foto(s, 'recortes/perfil.png', 8.7, 1.8, 2.75, 5.07, 'Perfil con la constelación de insignias');
pie(s);
s.addNotes('Para que los datos no envejezcan, la comunidad gana puntos e insignias de confianza por verificar rutas, reportar luminarias dañadas y confirmar comercios abiertos. Esos aportes alimentan el algoritmo. Para evitar abusos hay un tope de 40 puntos por día y se rechazan aportes duplicados.');

// ───────── 10. Demo
s = pres.addSlide();
s.background = { color: C.noche };
estrella(s, 12.0, 0.6, 0.5, C.beige, 40);
s.addText('Demostración en vivo', { x: M, y: 0.7, w: 10, h: 1.0, fontFace: TITULO, fontSize: 44, bold: true, color: C.crema, margin: 0, isTextBox: true });
const pasos = ['Reportar con lugar verificado', 'Planificar una ruta', 'Caminata y alerta de desvío', 'Mapa de calor por hora', 'Vista de moderación'];
pasos.forEach((t, i) => {
  const x = M + i * 2.45;
  s.addShape(pres.shapes.OVAL, { x: x + 0.45, y: 2.55, w: 1.1, h: 1.1, fill: { color: C.violeta }, line: { color: C.beige, width: 1.5 }, objectName: `Paso ${i + 1}` });
  s.addText(String(i + 1), { x: x + 0.45, y: 2.55, w: 1.1, h: 1.1, fontFace: TITULO, fontSize: 34, bold: true, color: C.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  s.addText(t, { x, y: 3.95, w: 2.0, h: 1.3, fontFace: CUERPO, fontSize: 16, color: C.crema, align: 'center', valign: 'top', margin: 0, isTextBox: true });
});
s.addText('nova-ruta-segura.onrender.com', { x: M, y: 6.0, w: 10, h: 0.5, fontFace: CUERPO, fontSize: 20, color: C.arena, margin: 0, isTextBox: true });
pie(s, true);
s.addNotes('Demo (2 min). 1) Como usuaria: elegir municipio, ver que el mapa se desplaza solo, escribir un punto de referencia, elegir el lugar verificado y publicar. 2) Planificar origen y destino; mostrar las tarjetas con puntaje y la explicación. 3) Iniciar la caminata y usar "Simular desvío" para disparar la alerta; registrar una placa. 4) Mover el reloj nocturno. 5) Entrar como moderadora: ver el reporte con alias, la justificación obligatoria y que no hay botón para borrar cuentas. Abrir la app unos minutos antes: Render en capa gratuita tarda en despertar.');

// ───────── 11. Diferencias
s = pres.addSlide();
fondoClaro(s, 'Lo que nos diferencia', 'Nova se diferencia en tres cosas');
tarjeta(s, M, 1.95, 3.85, 4.2, 'Privacidad por diseño', 'La moderación nunca conoce la identidad de las autoras: solo ve un alias. Por eso puede limitar una publicación, pero nunca eliminar una cuenta.', { numero: 1, tTitulo: 20, tTexto: 15.5 });
tarjeta(s, M + 4.1, 1.95, 3.85, 4.2, 'Una persona decide', 'El algoritmo propone y las personas deciden. Tras 2 denuncias el reporte se aparta, pero ocultarlo o restaurarlo lo decide una persona, con justificación y auditoría.', { numero: 2, tTitulo: 20, tTexto: 15.5 });
tarjeta(s, M + 8.2, 1.95, 3.85, 4.2, 'Honesta con sus límites', 'Ninguna ruta garantiza seguridad. El mapa de calor es una estimación, no una predicción de delitos. Y lo decimos en la propia aplicación.', { numero: 3, tTitulo: 20, tTexto: 15.5 });
pie(s);
s.addNotes('Primera, la privacidad es parte del diseño. La moderación nunca conoce la identidad de las autoras, y por eso puede limitar temporalmente la publicación pero nunca eliminar una cuenta. Segunda, hay un humano que decide: el algoritmo propone y las personas deciden. Tercera, es honesta sobre sus límites: advierte que ninguna ruta garantiza seguridad y que el mapa de calor es una estimación. (1 min)');

// ───────── 12. Moderación
s = pres.addSlide();
fondoClaro(s, 'Moderación', 'Moderación humana, sin tocar identidades');
foto(s, 'recortes/moderacion_reportes.png', M, 1.8, 2.7, 4.97, 'Panel de moderación con todos los reportes');
foto(s, 'recortes/moderacion_metricas.png', 3.75, 1.8, 2.7, 4.97, 'Métricas anónimas de moderación');
viñetas(s, ['Revisa todos los reportes, no solo los denunciados', 'Ve a las autoras solo por un alias, nunca por su identidad', 'Limita la publicación de forma temporal y reversible; no puede borrar cuentas', 'Cura luminarias, cámaras y comercios, y cierra las luminarias reparadas', 'Cada decisión exige justificación y queda en la auditoría'], 7.0, 1.9, 5.7, 4.9, 17);
pie(s);
s.addNotes('La moderadora revisa todos los reportes, no solo los denunciados; cura luminarias, cámaras y comercios; marca luminarias reparadas y ve métricas anónimas. De las autoras ve solo un alias, por ejemplo N-7F3A. Su sanción más fuerte es limitar temporalmente la publicación de una autora. No existe función para borrar cuentas, y cada decisión exige justificación y queda en la auditoría.');

// ───────── 13. Arquitectura
s = pres.addSlide();
fondoClaro(s, 'Cómo está construida', 'Tres capas, datos abiertos y despliegue en la nube');
const capas = [['Navegador', 'JavaScript puro · Leaflet\nSin framework ni CDN'], ['Servidor', 'Node.js 22 · Express 5\nArquitectura MVC · API REST'], ['Base de datos', 'PostgreSQL\n(SQLite en pruebas)']];
capas.forEach(([t, d], i) => {
  const x = M + i * 4.25;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: 3.6, h: 1.9, rectRadius: 0.12, fill: { color: C.noche }, line: { color: C.violeta, width: 1.5 }, shadow: sombra(), objectName: `Capa ${t}` });
  s.addText(t, { x: x + 0.2, y: 2.1, w: 3.2, h: 0.5, fontFace: TITULO, fontSize: 22, bold: true, color: C.crema, align: 'center', margin: 0, isTextBox: true });
  s.addText(d, { x: x + 0.2, y: 2.7, w: 3.2, h: 1.0, fontFace: CUERPO, fontSize: 15, color: C.beige, align: 'center', margin: 0, valign: 'top', isTextBox: true });
  if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 3.68, y: 2.7, w: 0.5, h: 0.4, fill: { color: C.violetaTxt }, line: { color: C.violetaTxt, transparency: 100 }, objectName: 'Flecha' });
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.2, w: 12.1, h: 0.85, rectRadius: 0.12, fill: { color: C.beige }, line: { color: C.arena, width: 1 }, objectName: 'Servicios abiertos' });
s.addText('OpenStreetMap: Nominatim (lugares) · Overpass (luminarias, cámaras, comercios) · OSRM (rutas peatonales)', { x: M + 0.2, y: 4.2, w: 11.7, h: 0.85, fontFace: CUERPO, fontSize: 16, bold: true, color: C.tinta, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
['JWT + bcrypt', 'AES-256-GCM', 'OWASP · CSP estricta', 'Criterios WCAG 2.1 AA', '41 pruebas', 'Docker · Render'].forEach((t, i) => {
  const x = M + i * 2.03;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 5.4, w: 1.93, h: 0.6, rectRadius: 0.3, fill: { color: C.blanco }, line: { color: C.violeta, width: 1 }, objectName: `Sello ${t}` });
  s.addText(t, { x, y: 5.4, w: 1.93, h: 0.6, fontFace: CUERPO, fontSize: 12.5, bold: true, color: C.violetaTxt, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
});
s.addText('Cada servicio externo tiene tiempo límite, caché y respaldo. WCAG: criterios aplicados, falta auditoría externa.', { x: M, y: 6.3, w: 12.1, h: 0.5, fontFace: CUERPO, italic: true, fontSize: 14, color: C.suave, margin: 0, isTextBox: true });
pie(s);
s.addNotes('Arquitectura MVC por capas con Node.js y Express, PostgreSQL, y autenticación con JWT y bcrypt. Los servicios son abiertos: Nominatim, Overpass y OSRM de OpenStreetMap. Cada servicio externo tiene tiempo límite, caché y respaldo, así que si uno falla, Nova sigue funcionando con su base propia. Aplicamos controles OWASP, cabeceras CSP estrictas y criterios WCAG 2.1 AA. Tiene 41 pruebas automáticas, se empaqueta en Docker y está desplegada en la nube con capa gratuita. Seguimos el ciclo de vida completo: ERS en IEEE 830 con 31 requisitos y 4 tipos de diagramas UML. (1 min)');

// ───────── 14. IA responsable
s = pres.addSlide();
fondoClaro(s, 'IA responsable', 'La IA apoya y propone; las personas deciden');
viñetas(s, ['Usamos Claude como herramienta de apoyo y lo declaramos', 'Documentamos herramientas, prompts y fallos de la IA', 'Hay un registro de revisión humana con responsables y firma'], M, 1.95, 5.6, 3.0, 17);
tarjeta(s, 6.6, 1.95, 6.1, 1.9, 'Fallo 1 · detectado por el equipo', 'El panel de moderación no mostraba los reportes nuevos. Ahora muestra todos y hay una prueba automática.', { fondo: C.blanco, tTitulo: 17, tTexto: 14.5 });
tarjeta(s, 6.6, 4.05, 6.1, 1.9, 'Fallo 2 · detectado al medir', 'La IA afirmó que un contraste era accesible y no lo era. Se midió, se corrigió y se documentó.', { fondo: C.blanco, tTitulo: 17, tTexto: 14.5 });
cita(s, 'Los fallos de la IA no se esconden: se documentan.', M, 5.15, 5.6, 1.2);
pie(s);
s.addNotes('Desarrollamos Nova con apoyo de Claude y lo declaramos con transparencia. Documentamos las herramientas, los prompts y los fallos de la IA que el equipo detectó probando el prototipo. Por ejemplo, el panel de moderación no mostraba reportes nuevos y el contraste que había afirmado cumplir accesibilidad no cumplía. Nuestro principio: la IA apoya y propone, las personas revisan, deciden y responden. (45 s)');

// ───────── 15. Impacto y futuro
s = pres.addSlide();
fondoClaro(s, 'Impacto y futuro', 'Responde a los ODS 5, 11 y 16, y sabemos qué falta');
[['5', 'Igualdad de género'], ['11', 'Ciudades seguras'], ['16', 'Instituciones confiables']].forEach(([n, t], i) => {
  const x = M + i * 2.2;
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.95, w: 1.2, h: 1.2, fill: { color: C.violeta }, line: { color: C.violeta, transparency: 100 }, objectName: `ODS ${n}` });
  s.addText(n, { x: x + 0.3, y: 1.95, w: 1.2, h: 1.2, fontFace: TITULO, fontSize: 36, bold: true, color: C.blanco, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  s.addText(`ODS ${n}\n${t}`, { x, y: 3.3, w: 1.8, h: 0.9, fontFace: CUERPO, fontSize: 14, color: C.tinta, bold: true, align: 'center', valign: 'top', margin: 0, isTextBox: true });
});
s.addText('Sostenible: datos abiertos, capa gratuita y una comunidad que mantiene los datos vivos.', { x: M, y: 4.55, w: 6.4, h: 1.0, fontFace: CUERPO, fontSize: 16, color: C.suave, margin: 0, valign: 'top', isTextBox: true });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.4, y: 1.95, w: 5.3, h: 4.6, rectRadius: 0.12, fill: { color: C.noche }, line: { color: C.noche, transparency: 100 }, objectName: 'Hoja de ruta' });
s.addText('Hoja de ruta', { x: 7.7, y: 2.15, w: 4.7, h: 0.5, fontFace: TITULO, fontSize: 22, bold: true, color: C.crema, margin: 0, isTextBox: true });
viñetas(s, ['Reemplazar los datos iniciales generados por datos reales', 'Calibrar los pesos con expertas en seguridad urbana y género', 'Pruebas de usabilidad con mujeres usuarias', 'Aplicación móvil instalable'], 7.7, 2.85, 4.7, 3.5, 16, C.crema);
pie(s);
s.addNotes('Nova responde a los ODS 5, 11 y 16: igualdad de género, ciudades seguras e instituciones confiables. Es sostenible porque usa datos abiertos, capa gratuita y una comunidad que mantiene los datos vivos. Sabemos qué falta: reemplazar los datos iniciales generados por datos reales, calibrar los pesos con expertas en seguridad urbana y género, hacer pruebas de usabilidad con mujeres usuarias y una app móvil instalable. Esa hoja de ruta ya está escrita. (45 s)');

// ───────── 16. Cierre
s = pres.addSlide();
s.background = { color: C.noche };
estrella(s, 6.2, 0.7, 0.9, C.crema);
estrella(s, 1.2, 1.4, 0.35, C.beige, 45);
estrella(s, 11.8, 5.6, 0.45, C.beige, 40);
s.addText('Nova convierte lo que la comunidad ya sabe en luz para el siguiente trayecto.', { x: 1.5, y: 2.0, w: 10.3, h: 2.2, fontFace: TITULO, fontSize: 36, bold: true, color: C.crema, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
s.addText('Ninguna camina sola.', { x: 1.5, y: 4.4, w: 10.3, h: 0.8, fontFace: TITULO, italic: true, fontSize: 32, color: C.arena, align: 'center', margin: 0, isTextBox: true });
s.addText('Gracias', { x: 1.5, y: 5.35, w: 10.3, h: 0.6, fontFace: CUERPO, fontSize: 22, color: C.crema, align: 'center', margin: 0, isTextBox: true });
s.addText('Miguel Angel Cruz Londoño · Julian Alexander Gomez Galvis · Jose Manuel Yara Cruz', { x: 1.0, y: 6.3, w: 11.3, h: 0.4, fontFace: CUERPO, fontSize: 14, color: C.beige, align: 'center', margin: 0, isTextBox: true });
pie(s, true);
s.addNotes('La seguridad no se resuelve con una app, pero la información sí cambia decisiones. Nova convierte lo que la comunidad ya sabe en luz para el siguiente trayecto. Porque ninguna debería caminar sola de noche, sin información y sin respaldo. Gracias. (20 s)');

// ───────── 17. Anexo: seguridad
s = pres.addSlide();
fondoClaro(s, 'Anexo · para preguntas', 'Seguridad y privacidad en una página');
const seg = [
  ['Contraseñas y sesión', 'bcrypt (costo 12) · JWT de 2 h · rol releído en cada petición · bloqueo de 15 min tras 5 fallos'],
  ['Datos sensibles', 'Placa y foto cifradas con AES-256-GCM y con vencimiento · GPS solo en el dispositivo · autoras anónimas'],
  ['Contra ataques web', 'SQL parametrizado · validación de entradas · CSP estricta · sin HTML de usuarias · acceso por dueña'],
  ['Control de poder', 'Roles validados en el servidor · moderación sin identidades ni borrar cuentas · todo auditado'],
  ['Calidad del contenido', 'Lugar verificado · sin teléfonos ni enlaces · 2 denuncias retiran un reporte · 10 reportes por hora'],
  ['Configuración', 'Secretos en variables de entorno · contenedor sin privilegios · npm audit sin vulnerabilidades'],
];
seg.forEach(([t, d], i) => tarjeta(s, M + (i % 3) * 4.1, 1.85 + Math.floor(i / 3) * 2.3, 3.95, 2.1, t, d, { tTitulo: 16, tTexto: 13.5 }));
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.45, w: 12.1, h: 0.55, rectRadius: 0.1, fill: { color: C.beige }, line: { color: C.arena, width: 1 }, objectName: 'Lo que falta' });
s.addText('Falta: prueba de penetración externa · cookie httpOnly con renovación · política formal de datos', { x: M + 0.2, y: 6.45, w: 11.7, h: 0.55, fontFace: CUERPO, fontSize: 13.5, bold: true, color: C.tinta, valign: 'middle', margin: 0, isTextBox: true });
pie(s);
s.addNotes('Diapositiva de respaldo para preguntas de seguridad y privacidad. Lo que falta, dicho con honestidad: prueba de penetración externa, cookie httpOnly con refresh token y una política formal de tratamiento de datos.');

pres.writeFile({ fileName: SALIDA }).then((f) => console.log('Creado:', f));
