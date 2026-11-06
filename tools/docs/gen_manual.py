"""Manual de usuario de Nova · Ruta Segura (usuarias y moderadoras), con capturas de la aplicación."""
from pathlib import Path

from docx.shared import Cm, Pt

from .docx_util import h1, h2, nota, nuevo_documento, p, portada, tabla
from .docx_util import imagen as _imagen

RAIZ = Path(__file__).resolve().parents[2]
CAP = RAIZ / "capturas-video"


def imagen(d, ruta, ancho_cm, pie=None):
    """Usa la versión optimizada (JPEG, 1200 px) si existe: la plataforma limita el tamaño de los archivos."""
    ruta = Path(ruta)
    opt = (CAP / "opt" / ruta.relative_to(CAP)).with_suffix(".jpg")
    _imagen(d, opt if opt.exists() else ruta, ancho_cm, pie)


INTEGRANTES = "Miguel Angel Cruz Londoño · Julian Alexander Gomez Galvis · Jose Manuel Yara Cruz"


def _runs(par, texto):
    """Escribe el texto en el párrafo; lo que va entre ** ** queda en negrita."""
    for i, trozo in enumerate(texto.split("**")):
        if trozo:
            r = par.add_run(trozo)
            r.bold = i % 2 == 1


def pasos(d, lista):
    """Lista numerada propia (la numeración automática de Word continuaría entre listas)."""
    for n, t in enumerate(lista, 1):
        par = d.add_paragraph()
        par.paragraph_format.left_indent = Cm(0.9)
        par.paragraph_format.first_line_indent = Cm(-0.6)
        par.paragraph_format.space_after = Pt(4)
        r = par.add_run(f"{n}.  ")
        r.bold = True
        _runs(par, t)


def lista(d, items):
    for t in items:
        par = d.add_paragraph(style="List Bullet")
        _runs(par, t)


def generar():
    d = nuevo_documento("Manual de usuario")
    portada(d, "Manual de usuario", "Nova · Ruta Segura — «Ninguna camina sola»",
            [("Para", "Usuarias y moderadoras"), ("Versión", "1.0"), ("Fecha", "4 de noviembre de 2026"),
             ("Integrantes", INTEGRANTES), ("Dirección", "https://nova-ruta-segura.onrender.com")])

    # ───────────────────────── 1
    h1(d, "1. ¿Qué es Nova?")
    p(d, "Nova es una aplicación web que te ayuda a caminar de noche con más información. Reúne en un solo lugar lo que te sirve para decidir por dónde ir: qué calles tienen luz, dónde hay comercios abiertos a tu hora, qué zonas han sido reportadas por otras mujeres y qué ruta es más segura, no solo más corta. Funciona en el celular y en el computador, sin instalar nada.")
    tabla(d, ["Con Nova puedes…", "Dónde está"], [
        ("Reportar un lugar con riesgo (acoso, poca luz o zona desolada)", "Botón «+» de la barra inferior"),
        ("Ver los reportes cercanos y confirmarlos", "Reportes"),
        ("Ver cómo cambia el riesgo según la hora de la noche", "Mapa"),
        ("Elegir una ruta con puntaje de seguridad", "Ruta"),
        ("Caminar con alertas si te desvías", "Ruta → Empezar caminata con alertas"),
        ("Registrar la placa de un taxi, de forma temporal", "Botón «Taxi» durante la caminata"),
        ("Ganar puntos e insignias por ayudar a mantener el mapa al día", "Yo"),
    ], [11.0, 5.8])
    nota(d, "Importante: Nova es una herramienta de información. No es un botón de pánico, no avisa a las autoridades y ninguna ruta garantiza tu seguridad. En una emergencia llama al 123. La línea 155 orienta a mujeres víctimas de violencia.")

    # ───────────────────────── 2
    h1(d, "2. Antes de empezar")
    tabla(d, ["Necesitas", "Detalle"], [
        ("Un navegador actual", "Chrome, Edge, Firefox o Safari, en celular o computador."),
        ("Conexión a internet", "Para ver el mapa, verificar lugares y calcular rutas."),
        ("Ubicación (opcional)", "Para «Usar mi ubicación», ordenar reportes por cercanía y caminar con GPS. Tú decides si das el permiso."),
        ("Cámara (opcional)", "Solo para fotografiar la placa de un taxi."),
        ("Un correo", "Es tu usuario. No se muestra a otras personas."),
    ], [4.5, 12.3])
    p(d, "Municipios disponibles: Zipaquirá, Chía, Cajicá, Fusagasugá, Girardot, Ubaté, Facatativá y Soacha. Las rutas pueden ser de hasta 8 km.")

    # ───────────────────────── 3
    h1(d, "3. Primeros pasos")
    h2(d, "3.1 Bienvenida")
    p(d, "La primera vez verás tres pantallas cortas que explican qué hace Nova. Pulsa «Siguiente» hasta llegar a «Crear mi cuenta», o «Ya tengo cuenta» si ya te registraste.")
    imagen(d, CAP / "escritorio" / "01_bienvenida.png", 14.5, "Pantalla de bienvenida")
    h2(d, "3.2 Crear tu cuenta")
    pasos(d, ["Escribe un **nombre o apodo**. No tiene que ser tu nombre real y no se muestra en tus reportes.",
              "Escribe tu **correo**.",
              "Crea una **contraseña** de mínimo 8 caracteres, con letras y números.",
              "Elige **tu municipio**.",
              "Pulsa **Crear cuenta**. Entrarás directo al mapa."])
    imagen(d, CAP / "manual" / "registro.png", 12.5, "Crear cuenta")
    h2(d, "3.3 Iniciar y cerrar sesión")
    pasos(d, ["En la bienvenida pulsa «Ya tengo cuenta».", "Escribe tu correo y tu contraseña y pulsa **Entrar**.",
              "Para salir: **Yo → Cerrar sesión**."])
    imagen(d, CAP / "manual" / "entrar.png", 12.5, "Iniciar sesión")
    nota(d, "Si escribes mal la contraseña 5 veces seguidas, la cuenta se bloquea 15 minutos por seguridad. Pasado ese tiempo puedes volver a intentar. Tu sesión dura 2 horas; si vence, Nova te lo avisa y te lleva a la pantalla de ingreso.")

    # ───────────────────────── 4
    h1(d, "4. Conoce la pantalla")
    p(d, "Nova tiene un mapa de fondo y un panel con la información de cada sección. En el computador el panel está a la izquierda; en el celular aparece como una hoja desde abajo, que puedes ocultar o mostrar con la barra gris de su borde superior.")
    tabla(d, ["Botón de la barra inferior", "Para qué sirve"], [
        ("Mapa", "Ver el riesgo por hora y las capas del mapa."),
        ("Ruta", "Planificar una ruta segura y empezar una caminata."),
        ("«+» (centro)", "Reportar un punto de riesgo."),
        ("Reportes", "Lista de reportes ordenada por cercanía."),
        ("Yo", "Tus puntos, niveles e insignias, la ayuda y cerrar sesión."),
        ("Moderar (solo moderadoras)", "Panel de moderación."),
    ], [5.2, 11.6])

    # ───────────────────────── 5
    h1(d, "5. Mapa: el riesgo cambia con la hora")
    p(d, "En «Mapa» eliges el municipio y mueves el reloj nocturno. Las manchas de color muestran dónde se concentran más reportes a esa hora: más claras o violetas significan menos riesgo, rosas y rojas, más riesgo.")
    pasos(d, ["Elige tu **municipio**.", "Mueve el control de **A qué hora caminas**. La luna recorre el cielo y el mapa se actualiza solo. «Ahora» vuelve a la hora actual.",
              "Activa o desactiva las capas: **Riesgo por hora**, **Reportes**, **Luminarias**, **Cámaras**, **Comercios** y **Calles en rojo** (acércate al mapa para verlas)."])
    imagen(d, CAP / "escritorio" / "02_mapa_calor_8pm.png", 14.5, "A las 8:00 p. m.")
    imagen(d, CAP / "escritorio" / "03_mapa_calor_madrugada.png", 14.5, "A las 2:00 a. m. (madrugada)")
    nota(d, "El mapa de calor es una estimación hecha con reportes de la comunidad. No predice delitos. Una zona sin manchas no significa que sea segura: puede que nadie la haya reportado.")

    # ───────────────────────── 6
    h1(d, "6. Reportar un punto de riesgo")
    p(d, "Tu reporte ayuda a otras mujeres. Es anónimo: las demás usuarias nunca ven quién lo escribió.")
    pasos(d, ["Pulsa el botón **«+»** de la barra inferior.",
              "Elige el **municipio**. El mapa se mueve solo hasta allí.",
              "Escribe el **punto de referencia**: un parque, un colegio, una calle, una tienda. Nova busca el lugar y te muestra opciones.",
              "Elige el lugar correcto de la lista. Verás «Lugar verificado» y el mapa se acerca y lo marca. Si hace falta, usa **Ajustar el punto en el mapa** o **Estoy en este lugar** para afinar (siempre cerca del lugar elegido).",
              "Elige el **tipo de riesgo**: Acoso, Poca iluminación o Zona desolada.",
              "Si quieres, cuenta qué pasó en la **descripción** (hasta 280 caracteres).",
              "Pulsa **Publicar reporte**. Verás los puntos que ganaste."])
    imagen(d, CAP / "escritorio" / "08_reportar_lugar_verificado.png", 14.5, "Reporte con el lugar verificado")
    h2(d, "Qué hacer si Nova no deja publicar")
    tabla(d, ["Mensaje", "Qué significa y qué hacer"], [
        ("«No encontramos … en [municipio]»", "El lugar no existe en ese municipio o está mal escrito. Prueba con otro nombre (parque, colegio, calle) y elígelo de la lista."),
        ("«El punto marcado queda a más de 600 m…»", "Moviste el punto muy lejos del lugar elegido. Acércalo."),
        ("«Elige un lugar de la lista…»", "Falta confirmar el lugar. Pulsa una de las opciones que aparecen debajo del campo."),
        ("«No pudimos verificar el lugar…»", "El servicio de mapas no responde ahora. Espera unos minutos y vuelve a intentar. Nova no publica un lugar sin verificarlo."),
        ("«No incluyas teléfonos, correos ni enlaces»", "Protegemos a todas las personas: quita esos datos de la descripción. Tampoco escribas nombres de personas."),
        ("«Llegaste al límite de reportes por hora»", "Puedes publicar hasta 10 reportes por hora. Vuelve más tarde."),
        ("«Tu publicación está limitada…»", "Moderación limitó temporalmente tu publicación de reportes. Puedes seguir consultando y verificando."),
    ], [5.8, 11.0], fs=9)

    # ───────────────────────── 7
    h1(d, "7. Consultar y confirmar reportes")
    p(d, "En «Reportes» ves los reportes de tu municipio, del más cercano al más lejano. Por defecto la distancia se mide desde el centro del municipio; con «Ordenar desde mi ubicación» se mide desde donde estás.")
    imagen(d, CAP / "escritorio" / "09_reportes_cercania.png", 14.5, "Lista de reportes")
    tabla(d, ["Acción", "Para qué sirve"], [
        ("Chips de filtro (Todos, Acoso, Poca iluminación, Zona desolada…)", "Ver solo un tipo de riesgo."),
        ("Ver en el mapa", "Te lleva al punto del reporte."),
        ("La confirmo", "Si conoces el lugar y es cierto, sumas peso al reporte y ganas puntos. No puedes confirmar el tuyo."),
        ("Denunciar", "Si es falso o contiene datos personales. Con 2 denuncias de usuarias distintas, el reporte sale de la vista pública y una moderadora lo revisa."),
        ("Eliminar", "Solo aparece en tus propios reportes."),
    ], [7.0, 9.8], fs=9)

    # ───────────────────────── 8
    h1(d, "8. Planificar una ruta segura")
    pasos(d, ["Pulsa **Ruta**.",
              "Elige **Desde** y **Hasta**: escribe un lugar y elígelo de la lista, usa **Usar mi ubicación** (solo en «Desde») o **Elegir en el mapa** y toca el punto. Para probar rápido, usa **Probar con un trayecto de ejemplo**.",
              "Ajusta **A qué hora caminas** (la seguridad cambia con la hora).",
              "Pulsa **Buscar la ruta más segura**. Nova compara varias rutas reales para caminar.",
              "Toca una tarjeta para ver esa ruta dibujada en el mapa.",
              "Cuando te decidas, pulsa **Empezar caminata con alertas**."])
    imagen(d, CAP / "04_ruta_segura.jpg", 14.5, "Comparación de rutas con su puntaje")
    h2(d, "Cómo leer las tarjetas")
    tabla(d, ["Elemento", "Qué te dice"], [
        ("Anillo con un número (0 a 100)", "Puntaje de seguridad de esa ruta a esa hora. Mientras más alto, mejor respaldada está."),
        ("Etiqueta de color", "60 o más: Bastante segura · 40 a 59: Con precaución · menos de 40: Poco recomendable."),
        ("Barras Luz, Cámaras, Comercios", "Cuánto aporta cada factor. Más larga = mejor."),
        ("Barra Riesgo", "Reportes de la comunidad cerca de la ruta a esa hora. Más larga = más riesgo."),
        ("Más segura / Más corta / Alterna", "Nova marca cuál recomienda y cuál es la más corta. Si la más segura es también la más corta, lo indica."),
        ("Recuadro explicativo", "Cuántos metros más caminas y qué ganas a cambio."),
        ("Marcador rosado con alerta en el mapa", "El tramo con menos señales de seguridad de la ruta."),
    ], [5.5, 11.3], fs=9)
    nota(d, "En el mapa, el trazo continuo claro es un tramo con buen respaldo; los tramos punteados o rosados tienen menos. Si el servicio de rutas no responde, Nova te muestra trayectos estimados en línea recta y te lo advierte: confirma el camino a la vista. Tú siempre puedes elegir otra ruta.")

    # ───────────────────────── 9
    h1(d, "9. Caminar con alertas")
    p(d, "Al empezar la caminata, Nova vigila que sigas la ruta. Tu ubicación se procesa solo en tu dispositivo: no se envía a ningún servidor ni se comparte con nadie.")
    imagen(d, CAP / "escritorio" / "05_caminata.png", 14.5, "Caminata en curso")
    tabla(d, ["Elemento", "Qué hace"], [
        ("«Vas por la ruta segura»", "Estás dentro de la ruta."),
        ("Barra de avance", "Cuánto falta y qué porcentaje llevas."),
        ("Aporta mientras caminas", "Esta ruta se sintió segura · Hay una luminaria dañada · Hay un comercio abierto. Ganas puntos y ayudas a otras mujeres."),
        ("Taxi", "Registrar la placa de un taxi (ver sección 10)."),
        ("Terminar caminata / Cancelar", "Cierra el viaje."),
        ("Simular caminata / Simular desvío", "Para practicar o mostrar Nova sin salir a la calle: mueve un punto de prueba por la ruta."),
    ], [5.5, 11.3], fs=9)
    h2(d, "Alerta de desvío")
    p(d, "Si te alejas más de 45 metros de la ruta durante 3 lecturas seguidas de GPS, Nova te avisa con el borde de la pantalla pulsando en rosa, vibración (si tu teléfono la tiene) y un aviso para lectores de pantalla.")
    imagen(d, CAP / "06_alerta_desvio.jpg", 14.5, "Alerta de desvío")
    tabla(d, ["Botón de la alerta", "Qué hace"], [
        ("Recalcular desde aquí", "Calcula una nueva ruta desde donde estás hasta el mismo destino."),
        ("Estoy bien, silenciar", "Quita la alerta si te desviaste a propósito."),
    ], [5.5, 11.3])
    p(d, "Cuando estés a menos de 20 metros del destino, Nova te avisa que llegaste. Pulsa «Terminar caminata».")

    # ───────────────────────── 10
    h1(d, "10. Registrar la placa de un taxi")
    pasos(d, ["Durante la caminata pulsa el botón **Taxi** (abajo a la derecha).",
              "Escribe la placa (por ejemplo ABC123) o pulsa **Tomar foto**.",
              "Pulsa **Guardar placa (temporal)**. Verás hasta cuándo se guarda.",
              "Si quieres, pulsa **Compartir con alguien de confianza**: se abre el menú de compartir de tu teléfono (o un enlace de mensajería) y tú eliges a quién se lo envías.",
              "Para borrarla ya: **Borrar ahora**."])
    imagen(d, CAP / "recortes" / "placa.png", 5.2, "Registro de placa")
    nota(d, "La placa y la foto se guardan cifradas, ligadas a tu viaje, y solo tú puedes verlas. Se borran solas: máximo 12 horas después de guardarlas o 2 horas después de terminar el viaje. Nova nunca envía la placa a nadie por su cuenta.")

    # ───────────────────────── 11
    h1(d, "11. Puntos, niveles e insignias")
    p(d, "Cada vez que ayudas a mantener el mapa al día, ganas puntos. Los datos que aportas mejoran las rutas de todas.")
    tabla(d, ["Acción", "Puntos"], [
        ("Verificar que una ruta se sintió segura", "10"), ("Reportar una luminaria dañada", "12"), ("Confirmar un comercio abierto", "8"),
        ("Confirmar el reporte de otra usuaria", "4"), ("Publicar un reporte", "6"),
    ], [11.0, 5.8])
    tabla(d, ["Nivel", "Desde"], [("Chispa", "0 puntos"), ("Brasa", "50 puntos"), ("Aurora", "150 puntos"), ("Luna", "400 puntos")], [11.0, 5.8])
    tabla(d, ["Insignia", "Cómo se gana"], [
        ("Luciérnaga", "Reportar tu primera luminaria dañada"), ("Faro del barrio", "Reportar 10 luminarias dañadas"),
        ("Guardiana del camino", "Verificar 5 rutas como seguras"), ("Vigía de la noche", "Confirmar 5 comercios abiertos"),
        ("Voz del barrio", "Publicar 3 reportes"), ("Coro de confianza", "Confirmar 10 reportes de otras usuarias"),
        ("Constelación", "Hacer 25 aportes en total"),
    ], [5.5, 11.3])
    imagen(d, CAP / "recortes" / "perfil.png", 5.2, "Perfil con la constelación de insignias")
    nota(d, "Para evitar abusos, hay un tope de 40 puntos cada 24 horas y no se aceptan aportes repetidos del mismo tipo en el mismo lugar en poco tiempo. Los aportes de luminarias y comercios vencen: una luminaria dañada cuenta 30 días; un comercio confirmado, 3 horas.")

    # ───────────────────────── 12
    h1(d, "12. Ayuda, privacidad y tus datos")
    lista(d, ["**Ayuda:** en «Yo → Ayuda, privacidad y límites» encuentras preguntas frecuentes y los números de emergencia.",
                "**Tus datos:** guardamos tu apodo, tu correo (para entrar), tu contraseña cifrada, tus reportes y tus puntos.",
                "**Anonimato:** ninguna usuaria ve quién escribió un reporte. Moderación solo ve un código anónimo (por ejemplo N-7F3A).",
                "**Tu ubicación:** la caminata la procesa tu teléfono y no se guarda.",
                "**Control:** puedes eliminar tus propios reportes y borrar tu placa cuando quieras.",
                "**Contenido:** Nova no acepta teléfonos, correos, enlaces ni nombres de personas en los reportes."])

    # ───────────────────────── 13
    h1(d, "13. Guía para moderadoras")
    p(d, "La moderadora es una persona que cuida la calidad de la información. Su rol lo asigna la administración del despliegue: no se puede pedir al registrarse. Quien tenga el rol verá el botón «Moderar» en la barra inferior (y «Panel de moderación» en «Yo»).")
    nota(d, "Principio de este rol: decides sobre contenido y datos, nunca sobre personas. Ves un alias, no una identidad. No puedes borrar cuentas. Cada decisión exige una justificación y queda en el registro de auditoría.")
    imagen(d, CAP / "recortes" / "moderacion_reportes.png", 5.4, "Panel de moderación")
    h2(d, "13.1 La justificación")
    p(d, "Arriba del panel hay un cuadro «Justificación». Antes de cada decisión escribe por qué (mínimo 5 letras). Se guarda en la auditoría junto con el alias de la autora.")
    h2(d, "13.2 Las cinco secciones")
    tabla(d, ["Sección", "Qué puedes hacer"], [
        ("Por revisar", "Reportes con 2 o más denuncias. Salieron de la vista pública y esperan tu decisión."),
        ("Reportes", "Todos los reportes, de cualquier estado, filtrables por estado y municipio. Revísalos de forma proactiva, no solo los denunciados."),
        ("Datos de seguridad", "Luminarias dañadas reportadas por la comunidad (botón «Reparada» cuando la autoridad las arregla), y los puntos de seguridad: agregar luminarias, cámaras o comercios en el centro del mapa, y activarlos o desactivarlos."),
        ("Métricas", "Reportes por tipo, estado, municipio y hora; luminarias por reparar; aportes de los últimos 7 días; autoras limitadas. Son datos agregados y anónimos."),
        ("Registro", "Las últimas decisiones: quién las tomó, qué acción y su justificación."),
    ], [4.0, 12.8], fs=9)
    h2(d, "13.3 Decidir sobre un reporte")
    tabla(d, ["Botón", "Cuándo usarlo"], [
        ("Ocultar", "Contiene datos personales, difama a alguien, el lugar es falso o es abuso. Sale de listas, mapa de calor y rutas. Se puede restaurar."),
        ("Atendido", "El problema se resolvió (por ejemplo, se reparó la luminaria). Sale de los cálculos y puede restaurarse."),
        ("Restaurar", "Fue una denuncia injustificada o una decisión equivocada: vuelve a ser visible."),
        ("Sanción proporcional → Limitar publicación", "Una autora publica reportes sin fundamento de forma repetida. Eliges de 1 a 30 días. La autora puede seguir entrando y consultando. «Levantar» anula la limitación."),
    ], [5.5, 11.3], fs=9)
    imagen(d, CAP / "recortes" / "moderacion_metricas.png", 5.4, "Métricas anónimas")
    imagen(d, CAP / "escritorio" / "12_moderacion_datos.png", 14.5, "Datos de seguridad")
    h2(d, "13.4 Buenas prácticas")
    lista(d, ["Escribe justificaciones claras: otra persona debería entender tu decisión.",
                "Ante la duda, prefiere «Restaurar» o dejar visible antes que ocultar sin motivo.",
                "Usa la limitación solo ante un patrón, no por un solo reporte.",
                "No intentes averiguar quién es una autora. El diseño lo impide a propósito.",
                "Revisa la sección «Métricas» a diario para ver si hay picos extraños de reportes.",
                "Una persona distinta de la moderadora debería revisar el registro periódicamente."])

    # ───────────────────────── 14
    h1(d, "14. Solución de problemas")
    tabla(d, ["Problema", "Qué hacer"], [
        ("La página tarda mucho al abrir", "La aplicación se duerme cuando nadie la usa. La primera carga puede tardar cerca de un minuto. Espera y recarga."),
        ("El mapa se ve vacío o en negro", "Revisa tu conexión. Las imágenes del mapa vienen de OpenStreetMap; recarga la página."),
        ("No puedo entrar", "Verifica el correo y la contraseña. Tras 5 fallos la cuenta se bloquea 15 minutos."),
        ("«Tu sesión venció»", "Normal después de 2 horas. Vuelve a ingresar."),
        ("«Usar mi ubicación» no funciona", "Permite la ubicación en tu navegador (el candado junto a la dirección) o elige el punto en el mapa."),
        ("No aparecen rutas o el aviso dice «trayectos estimados»", "El servicio de rutas no respondió. Revisa el camino a la vista o intenta de nuevo en unos minutos."),
        ("No encuentro mi lugar al reportar", "Prueba con el nombre de un parque, colegio o calle cercano y elígelo de la lista."),
        ("No vibra la alerta", "No todos los dispositivos permiten vibración desde el navegador. La alerta visual y el aviso para lectores de pantalla siempre funcionan."),
        ("Quiero borrar mi reporte", "En «Reportes», busca el tuyo y pulsa «Eliminar»."),
    ], [5.8, 11.0], fs=9)

    # ───────────────────────── 15
    h1(d, "15. Accesibilidad")
    lista(d, ["Puedes usar Nova solo con el teclado: Tab para avanzar, Enter para activar, Esc para cerrar ventanas.",
                "El primer enlace de cada página, «Saltar al contenido», te lleva directo al panel.",
                "Las alertas y los errores se anuncian a los lectores de pantalla.",
                "Si tu dispositivo tiene activado «reducir movimiento», las animaciones se simplifican.",
                "En «Reportes» tienes una lista que equivale al mapa para quien no puede usarlo.",
                "Los tramos de baja seguridad se dibujan punteados, no solo en otro color."])

    # ───────────────────────── 16
    h1(d, "16. Glosario")
    tabla(d, ["Término", "Significado"], [
        ("Punto de referencia", "Un lugar con nombre (parque, colegio, calle) que ubica tu reporte."),
        ("Lugar verificado", "Nova comprobó en el mapa que ese lugar existe en el municipio."),
        ("Puntaje de seguridad", "Número de 0 a 100 que resume cuán respaldada está una ruta a una hora dada."),
        ("Desvío", "Alejarte más de 45 m de la ruta durante 3 lecturas seguidas de GPS."),
        ("Reloj nocturno", "Control para elegir la hora y ver cómo cambia el riesgo."),
        ("Alias", "Código anónimo con el que moderación reconoce a una autora sin saber quién es."),
        ("Limitar publicación", "Sanción temporal y reversible: la autora no puede publicar reportes por unos días."),
        ("Cifrado", "Forma de guardar un dato para que nadie pueda leerlo sin la clave."),
    ], [4.6, 12.2], fs=9)
    p(d, "Recuerda: en una emergencia llama al 123. La línea 155 orienta a mujeres víctimas de violencia.", negrita=True)

    salida = RAIZ / "docs" / "Manual_de_Usuario_Nova.docx"
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
