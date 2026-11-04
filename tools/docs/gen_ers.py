"""Especificación de Requerimientos de Software (ERS) de Luma · Ruta Segura."""
from pathlib import Path

from .docx_util import h1, h2, h3, nota, nuevo_documento, p, portada, tabla, vinetas

RAIZ = Path(__file__).resolve().parents[2]

# (ID, Nombre, Descripción, Prioridad, Criterio de aceptación)
RF = {
    "Cuentas y acceso": [
        ("RF-01", "Registro de usuarias", "La visitante crea una cuenta con nombre o apodo, correo, contraseña y municipio. La contraseña exige mínimo 8 caracteres con letras y números. Toda cuenta nueva es USUARIA.", "Alta", "Una contraseña débil se rechaza con mensaje por campo; un intento de enviar rol=MODERADORA crea una cuenta USUARIA."),
        ("RF-02", "Inicio de sesión con JWT", "El sistema autentica con correo y contraseña y entrega un token JWT firmado (HS256, vigencia 2 h) que acompaña cada petición como Bearer.", "Alta", "Credenciales válidas devuelven token; una petición sin token o con token falso responde 401."),
        ("RF-03", "Autorización por roles", "Existen los roles USUARIA y MODERADORA. El rol se verifica en el servidor en cada endpoint protegido.", "Alta", "Una USUARIA que llama a /api/moderacion/* recibe 403."),
        ("RF-04", "Bloqueo por intentos fallidos", "Tras 5 contraseñas incorrectas seguidas la cuenta se bloquea 15 minutos.", "Media", "El sexto intento devuelve 429 aunque la contraseña sea correcta."),
        ("RF-05", "Sesión expirada", "Si el token vence o es inválido, la interfaz avisa con claridad y lleva a la pantalla de ingreso sin perder la página.", "Media", "Con un token vencido aparece el aviso «Tu sesión venció» y el formulario de ingreso."),
    ],
    "Reportes de riesgo (requisito central del reto)": [
        ("RF-06", "Reportar punto de riesgo", "La usuaria autenticada publica un reporte con municipio, punto de referencia (texto), categoría (acoso, iluminación deficiente, zona desolada) y descripción opcional de hasta 280 caracteres.", "Alta", "El reporte queda ACTIVO y aparece en lista y mapa."),
        ("RF-07", "Ubicación textual geocodificada", "A partir de «municipio + punto de referencia» el sistema obtiene coordenadas con una API de geocodificación (Nominatim). Si no puede, usa una posición estable dentro del municipio y marca el reporte como «ubicación aproximada».", "Alta", "Sin conexión el reporte se crea con precision_ubicacion = APROXIMADA y la lista lo indica."),
        ("RF-08", "Ubicación opcional por GPS o mapa", "La usuaria puede fijar el punto con «Estoy aquí» o tocando el mapa; el sistema rechaza puntos a más de 20 km del municipio elegido.", "Media", "Un punto lejano devuelve 422."),
        ("RF-09", "Lista ordenada por cercanía", "Los reportes se listan ordenados por distancia (Haversine) a la ubicación de la usuaria o, si no la comparte, al centro del municipio (tabla de referencia precargada).", "Alta", "Las distancias devueltas son no decrecientes."),
        ("RF-10", "Filtro por tipo de riesgo", "La lista se filtra por categoría de riesgo.", "Alta", "Con filtro ACOSO todas las filas son ACOSO."),
        ("RF-11", "Mapa de puntos reportados", "Un mapa básico (Leaflet + OpenStreetMap) muestra los reportes como marcadores con su categoría y permite abrir su detalle.", "Alta", "Cada reporte visible tiene marcador accesible por teclado."),
        ("RF-12", "Eliminar un reporte propio", "Solo la autora puede eliminar su reporte.", "Media", "Otra usuaria recibe 403."),
        ("RF-13", "Confirmar reportes ajenos", "Una usuaria puede confirmar el reporte de otra (una vez por reporte); no puede confirmar el propio. Las confirmaciones aumentan el peso del reporte en el algoritmo.", "Media", "Confirmar el propio devuelve 400; el contador sube en 1 al confirmar uno ajeno."),
        ("RF-14", "Denuncia de reportes", "Una usuaria puede denunciar un reporte ajeno (falso o con datos personales). Con 2 denuncias distintas el reporte sale de la vista pública y pasa a revisión humana.", "Alta", "Tras la segunda denuncia el reporte deja de aparecer en la lista y aparece en la cola de moderación."),
        ("RF-15", "Anonimato de las autoras", "Ninguna respuesta pública incluye la identidad de quien reporta; la autora solo ve la marca «propia».", "Alta", "Las respuestas de /api/reportes no contienen usuaria_id ni nombre."),
        ("RF-16", "Protección de terceros", "Se rechazan descripciones con teléfonos, correos, enlaces o los caracteres < y >.", "Alta", "Cada uno de esos contenidos devuelve 400."),
        ("RF-17", "Límite de reportes", "Máximo 10 reportes por hora y usuaria.", "Media", "El reporte 11 en una hora devuelve 429."),
    ],
    "Navegación inteligente (diferenciador)": [
        ("RF-18", "Planificar ruta segura", "Dado un origen, un destino y una hora de caminata, el sistema propone rutas peatonales y las puntúa por seguridad. Cubre los municipios de la tabla de referencia; trayectos de hasta 8 km.", "Alta", "La respuesta incluye rutas, puntaje 0-100, desglose y la recomendada."),
        ("RF-19", "Rutas candidatas", "Se generan candidatas con un servicio de ruteo peatonal (OSRM): la ruta directa y variantes que pasan por «atractores de seguridad» (zonas con más luminarias, cámaras y comercios abiertos). Sin conexión se generan trayectos estimados y se avisa a la usuaria.", "Alta", "Sin conexión la respuesta trae aviso y rutas con fuente = estimada."),
        ("RF-20", "Puntaje de seguridad", "Cada 25 m se mide: luminarias a ≤ 45 m (las dañadas restan), cámaras a ≤ 70 m, comercios abiertos a la hora elegida a ≤ 90 m y riesgo histórico a ≤ 110 m. El puntaje mezcla 70 % promedio y 30 % del 20 % de tramos más débiles.", "Alta", "Reportar luminarias dañadas en el trayecto no sube el puntaje."),
        ("RF-21", "Prioridad de la seguridad sobre la distancia", "Se recomienda la ruta de mayor utilidad = puntaje − penalización por desvío, descartando rutas con más de 60 % de distancia extra. La interfaz explica cuántos metros más se caminan y qué se gana.", "Alta", "La ruta recomendada nunca supera 1,6 veces la más corta."),
        ("RF-22", "Visualización por tramos", "La ruta se dibuja como «hilo de luz»; el nivel de cada tramo se indica con color y con patrón de línea (no solo color). El tramo más débil se marca con un símbolo.", "Media", "Los tramos BAJO se dibujan punteados."),
        ("RF-23", "Caminata en curso", "La usuaria inicia una caminata con la ruta elegida. El sistema registra el viaje y su avance se calcula en el dispositivo.", "Alta", "Se crea un viaje EN_CURSO; iniciar otro cancela el anterior."),
        ("RF-24", "Alerta de desvío", "Si la posición se aleja más de 45 m de la ruta durante 3 lecturas consecutivas, se emite una alerta visual (borde pulsante), por vibración y anunciada a lectores de pantalla. Se vuelve a «en ruta» al estar a menos de 25 m.", "Alta", "Prueba unitaria del monitor: ignora un salto aislado, alerta a la tercera lectura y se recupera."),
        ("RF-25", "Recalcular o silenciar", "Ante una alerta la usuaria puede recalcular la ruta desde su posición hacia el mismo destino o silenciar la alerta.", "Media", "Recalcular crea un viaje nuevo con la ruta recomendada."),
        ("RF-26", "Llegada y cierre", "A menos de 20 m del destino se detecta la llegada; la usuaria finaliza o cancela el viaje.", "Media", "El viaje pasa a FINALIZADO y se acorta la vida de la placa."),
        ("RF-27", "Modo demostración", "Un simulador recorre la ruta y puede inyectar un desvío para mostrar el sistema sin salir a la calle; se identifica claramente como simulado.", "Baja", "Con «Simular desvío» se dispara la alerta."),
    ],
    "Registro rápido de transporte": [
        ("RF-28", "Registro rápido de placa", "Desde la caminata en curso, un botón «Taxi» permite digitar la placa o fotografiarla. La placa se valida (ABC123 o ABC12D) y se vincula al viaje en curso.", "Alta", "Una placa inválida devuelve 400; una válida queda ligada al viaje."),
        ("RF-29", "Almacenamiento temporal cifrado", "La placa y la foto se guardan cifradas (AES-256-GCM), vencen a las 12 h como máximo y 2 h después de finalizar el viaje; un proceso elimina lo vencido cada 10 minutos.", "Alta", "El texto de la placa no aparece en la base de datos; la purga elimina las filas vencidas."),
        ("RF-30", "Compartir con una persona de confianza", "La usuaria puede compartir la placa por el menú de compartir del dispositivo o por enlace de mensajería; el sistema no envía nada por su cuenta.", "Media", "La acción solo ocurre al tocar el botón."),
        ("RF-31", "Borrado inmediato", "La usuaria puede borrar la placa y su foto cuando quiera.", "Media", "Tras borrar, la consulta devuelve 404."),
        ("RF-32", "Aislamiento entre usuarias", "Solo la dueña del viaje puede ver o modificar su placa.", "Alta", "Otra usuaria recibe 404."),
    ],
    "Mapas de calor predictivos": [
        ("RF-33", "Mapa de calor por hora", "El sistema estima el riesgo esperado por celdas de ~180 m a partir del historial de reportes, ponderando cercanía horaria (σ = 2,5 h), antigüedad (vida media 120 días) y confirmaciones.", "Alta", "La suma de intensidad a las 22:00 es mayor que a las 14:00 con datos nocturnos."),
        ("RF-34", "Reloj nocturno", "Un deslizador de hora actualiza el mapa de forma dinámica con transiciones suaves; el cielo de la interfaz cambia con la hora.", "Alta", "Mover el control cambia las manchas sin recargar la página."),
        ("RF-35", "Calles en rojo", "Con el mapa acercado, las calles se colorean por riesgo a la hora elegida usando la geometría de OpenStreetMap (Overpass). Si el servicio no responde se mantiene el mapa de calor.", "Media", "Sin servicio se muestra un aviso y las manchas."),
        ("RF-36", "Capas del mapa", "La usuaria activa o desactiva riesgo por hora, reportes, luminarias, cámaras y comercios.", "Media", "Cada capa se enciende y apaga de forma independiente."),
        ("RF-37", "Aviso de límites", "El mapa de calor se acompaña de un aviso: es una estimación con reportes ciudadanos, no una predicción de delitos.", "Alta", "El aviso es visible en la vista del mapa."),
    ],
    "Gamificación comunitaria": [
        ("RF-38", "Verificaciones comunitarias", "La usuaria puede marcar «esta ruta se sintió segura», «hay una luminaria dañada» o «hay un comercio abierto» en su posición.", "Alta", "Cada verificación suma puntos y queda registrada."),
        ("RF-39", "Datos que alimentan el algoritmo", "Las luminarias dañadas (30 días) restan seguridad, los comercios confirmados abiertos (3 h) y las rutas verificadas (7 días) suman.", "Alta", "Tras reportar 3 luminarias dañadas el puntaje de la ruta no aumenta."),
        ("RF-40", "Puntos y niveles", "Hay puntos por aporte y 4 niveles: Chispa, Brasa, Aurora y Luna.", "Media", "El perfil muestra nivel y puntos faltantes."),
        ("RF-41", "Insignias de confianza", "7 insignias se otorgan al cumplir metas (primera luminaria, 10 luminarias, 5 rutas, 5 comercios, 3 reportes, 10 confirmaciones, 25 aportes) con una revelación animada.", "Media", "La primera luminaria otorga LUCIERNAGA."),
        ("RF-42", "Antiabuso", "No se aceptan aportes duplicados cercanos en poco tiempo y hay un tope diario de puntos.", "Alta", "Repetir la misma verificación en el mismo punto devuelve 409."),
        ("RF-43", "Perfil", "El perfil muestra nivel, progreso a cada insignia y actividad reciente.", "Baja", "Insignias no obtenidas muestran su avance."),
    ],
    "Moderación humana": [
        ("RF-44", "Cola de moderación", "La moderadora ve los reportes en revisión con número de denuncias y confirmaciones.", "Alta", "La cola lista los reportes EN_REVISION."),
        ("RF-45", "Decisión justificada", "La moderadora oculta o restaura un reporte y debe escribir una justificación (mínimo 5 caracteres). El sistema nunca oculta por sí solo.", "Alta", "Sin justificación la acción devuelve 400."),
        ("RF-46", "Registro de auditoría", "Cada decisión y cada envío a revisión queda registrado con actor, acción, detalle y fecha.", "Alta", "La auditoría contiene REPORTE_RESTAURADO tras restaurar."),
    ],
    "Experiencia y operación": [
        ("RF-47", "Onboarding", "La primera visita presenta 3 pasos que explican el valor de la aplicación y sus límites.", "Media", "El paso final lleva al registro."),
        ("RF-48", "Ayuda contextual", "Botones «?» junto a campos complejos y una sección de ayuda con preguntas frecuentes, privacidad, límites y números de emergencia (123, línea 155).", "Media", "La ayuda es alcanzable desde el perfil y los formularios."),
        ("RF-49", "Datos de demostración identificados", "Cuando los datos son simulados la interfaz lo declara de forma visible.", "Alta", "Aparece la etiqueta «Datos de demostración»."),
        ("RF-50", "Degradación elegante", "Si una API externa no responde, la aplicación sigue funcionando con la base propia y lo informa.", "Alta", "Con APIs deshabilitadas las pruebas de integración pasan."),
        ("RF-51", "Chequeo de salud", "Un endpoint público de salud permite monitorear el servicio.", "Baja", "GET /api/salud responde 200."),
    ],
}

RNF = {
    "Experiencia de usuario (UX)": [
        ("RNF-01", "Diseño centrado en la usuaria", "Flujos de tareas clave de 3 pasos o menos: reportar (≤ 3 toques tras abrir), planear ruta (origen, destino, buscar), registrar placa (1 toque + placa)."),
        ("RNF-02", "Identidad visual coherente", "Tema «Noche Lila» (paleta morada y lila), tipografía Fraunces/Outfit propia (sin CDN) y micro‑animaciones con propósito: reloj nocturno, hilo de luz, anillos de puntaje, revelación de insignias."),
        ("RNF-03", "Movimiento respetuoso", "Con prefers-reduced-motion todas las animaciones se reducen a un cambio instantáneo."),
        ("RNF-04", "Retroalimentación inmediata", "Toda acción muestra confirmación o error en lenguaje claro dentro de 1 s o con indicador de carga."),
        ("RNF-05", "Adaptable", "Diseño responsivo desde 320 px: hoja inferior en móvil y panel lateral desde 900 px."),
    ],
    "Usabilidad": [
        ("RNF-06", "Onboarding", "Presentación de 3 pasos en la primera visita."),
        ("RNF-07", "Ayuda contextual", "Ayuda en el punto de uso (botón «?», textos de apoyo bajo los campos) y sección de ayuda."),
        ("RNF-08", "Eficiencia en tareas clave", "Atajos: «Estoy aquí», «Usar mi ubicación», «Probar con un trayecto de ejemplo», botón flotante «Taxi»."),
        ("RNF-09", "Prevención y recuperación de errores", "Validación por campo con mensaje asociado, confirmación antes de acciones destructivas (eliminar, denunciar, cancelar)."),
        ("RNF-10", "Pruebas de usabilidad", "Se ejecuta el protocolo de docs/PRUEBAS_USABILIDAD.md con al menos 5 personas; meta: 80 % completa las 4 tareas sin ayuda y SUS ≥ 80."),
    ],
    "Accesibilidad (WCAG 2.1 AA)": [
        ("RNF-11", "Perceptible", "Contraste de texto ≥ 4,5:1 y de componentes ≥ 3:1 sobre el fondo nocturno; el significado nunca depende solo del color (patrones de línea, texto y símbolos); íconos con texto o nombre accesible."),
        ("RNF-12", "Operable por teclado", "Todo el flujo se maneja con teclado, foco visible de 3 px, enlace «Saltar al contenido», marcadores del mapa enfocables y un equivalente en lista (Reportes)."),
        ("RNF-13", "Comprensible", "Idioma declarado (es), etiquetas visibles, errores identificados en texto, ayuda disponible."),
        ("RNF-14", "Robusto", "HTML semántico, roles ARIA en grupos de opciones (radiogroup), diálogos con aria-modal, regiones aria-live para estados y alertas."),
        ("RNF-15", "Objetivos táctiles", "Controles de al menos 40–48 px."),
    ],
    "Seguridad (OWASP Top 10 · 2021)": [
        ("RNF-16", "A01 Control de acceso", "Roles validados en servidor; acceso a objetos filtrado por dueña (viajes y placas) para evitar IDOR."),
        ("RNF-17", "A02 Fallas criptográficas", "Contraseñas con bcrypt (costo 12), JWT HS256 con secreto ≥ 32 caracteres exigido en producción, placas y fotos con AES-256-GCM, HTTPS y HSTS en producción."),
        ("RNF-18", "A03 Inyección", "SQL parametrizado en todo acceso a datos; validación de entrada con esquemas (zod); la interfaz inserta texto con textContent, nunca HTML de usuarias."),
        ("RNF-19", "A04 Diseño inseguro", "Minimización de datos (la posición GPS no se envía en la caminata; las placas vencen), límites de uso y revisión humana de contenido."),
        ("RNF-20", "A05 Configuración incorrecta", "Cabeceras con Helmet: CSP estricta sin scripts en línea ni CDN, nosniff, frame-ancestors none, Referrer-Policy, Permissions-Policy; sin x-powered-by; errores sin traza."),
        ("RNF-21", "A06 Componentes vulnerables", "Dependencias mínimas y auditadas en CI con npm audit."),
        ("RNF-22", "A07 Fallas de autenticación", "Bloqueo tras 5 fallos, mensaje único que no revela si el correo existe, tiempo de respuesta igualado, límite de 20 intentos de ingreso por 15 min."),
        ("RNF-23", "A08 Integridad de software y datos", "Dependencias fijadas con package-lock, imagen Docker reproducible, recursos propios sin CDN."),
        ("RNF-24", "A09 Registro y monitoreo", "Auditoría de decisiones de moderación, errores internos al registro del servidor, endpoint de salud."),
        ("RNF-25", "A10 SSRF", "Las APIs externas se invocan solo con URLs de configuración; la entrada de usuarias solo llega como parámetros codificados."),
        ("RNF-26", "Protección de datos personales", "Alineado con la Ley 1581 de 2012: finalidad declarada, minimización, autoría anónima en reportes, derecho a eliminar los propios reportes y a borrar la placa."),
    ],
    "Rendimiento, escalabilidad y sostenibilidad": [
        ("RNF-27", "Rendimiento", "Planificar una ruta con datos locales responde en menos de 2 s sin red externa; el índice espacial en rejilla evita comparar todos los puntos."),
        ("RNF-28", "Escalabilidad", "Servidor sin estado (JWT), base PostgreSQL con índices, la lógica de puntaje es una función pura apta para ejecutarse en trabajadores o caché; nuevos municipios se añaden con una fila en la tabla de referencia."),
        ("RNF-29", "Sostenibilidad", "Nube con capa gratuita, datos abiertos (OpenStreetMap) sin costos de licencias, y gamificación para que la comunidad mantenga los datos vivos en lugar de depender de personal."),
        ("RNF-30", "Disponibilidad y degradación", "Cada API externa tiene tiempo límite, caché y respaldo; el sistema nunca se cae por un tercero."),
        ("RNF-31", "Portabilidad", "Mismo código para SQLite (desarrollo/pruebas) y PostgreSQL (producción); contenedor Docker."),
        ("RNF-32", "Mantenibilidad", "Arquitectura MVC por capas, lógica de geometría compartida entre cliente y servidor, 27 pruebas automáticas en integración continua."),
    ],
    "IA responsable": [
        ("RNF-33", "Supervisión humana", "Ninguna decisión que afecte a personas (ocultar contenido, sancionar) la toma el algoritmo; el flujo está descrito en docs/IA_Responsable_HITL.docx."),
        ("RNF-34", "Transparencia", "El puntaje de cada ruta se explica con su desglose; los datos simulados y los límites del modelo se declaran en la interfaz."),
        ("RNF-35", "Sin perfilamiento", "No se calculan perfiles de comportamiento de usuarias ni se infiere nada de su historial de rutas."),
    ],
}

REGLAS = [
    ("RN-01", "Un reporte pasa a revisión humana cuando acumula 2 denuncias de usuarias distintas."),
    ("RN-02", "Un reporte EN_REVISION u OCULTO no participa en listas, mapa de calor ni en el puntaje de rutas."),
    ("RN-03", "Una usuaria no puede confirmar ni denunciar su propio reporte; sí puede eliminarlo."),
    ("RN-04", "El rol MODERADORA solo se asigna manualmente en la base de datos."),
    ("RN-05", "El desvío máximo permitido de la ruta recomendada es +60 % respecto a la más corta."),
    ("RN-06", "Un comercio cuenta como «abierto» si la hora de caminata está dentro de su horario (incluye horarios que cruzan la medianoche y 24 h)."),
    ("RN-07", "Los aportes duplicados (mismo tipo, mismo lugar, ventana de 3 a 72 h según el tipo) no suman puntos."),
    ("RN-08", "Tope de 40 puntos por usuaria en 24 horas."),
    ("RN-09", "La placa vence a las 12 h como máximo y 2 h después de terminar el viaje."),
    ("RN-10", "La posición GPS de una caminata no se transmite al servidor; solo se envían coordenadas cuando la usuaria planea una ruta o hace un aporte."),
    ("RN-11", "Cobertura: municipios de la tabla de referencia (Zipaquirá, Chía, Cajicá, Fusagasugá, Girardot, Ubaté, Facatativá, Soacha); trayectos de hasta 8 km."),
    ("RN-12", "Las horas se interpretan en zona horaria de Colombia (UTC−5)."),
]

DATOS = [
    ("municipios", "id, nombre, lat, lng", "Tabla de referencia precargada."),
    ("usuarias", "id, nombre, email (único), password_hash, rol, municipio_id, puntos, intentos_fallidos, bloqueada_hasta, creada_en", "Cuentas y roles."),
    ("puntos_seguridad", "id, tipo (LUMINARIA | CAMARA | COMERCIO), nombre, municipio_id, lat, lng, abre, cierra, fuente", "Señales de seguridad propias (demo u OSM)."),
    ("reportes", "id, usuaria_id, municipio_id, referencia, categoria, descripcion, lat, lng, precision_ubicacion, hora, estado, confirmaciones, denuncias, fuente, creado_en", "Reportes comunitarios."),
    ("verificaciones", "id, usuaria_id, tipo, lat, lng, reporte_id, puntos, creada_en", "Aportes que alimentan el algoritmo y los puntos."),
    ("denuncias_reporte", "reporte_id, usuaria_id, motivo, creada_en", "Una denuncia por usuaria y reporte."),
    ("insignias_usuaria", "usuaria_id, codigo, otorgada_en", "Insignias ganadas."),
    ("viajes", "id, usuaria_id, municipio_id, origen_texto, destino_texto, ruta_json, puntaje, estado, desvios, iniciado_en, finalizado_en", "Caminatas."),
    ("placas_temporales", "id, viaje_id (único), placa_cifrada, foto_cifrada, creada_en, expira_en", "Dato temporal cifrado."),
    ("auditoria", "id, actor_id, accion, detalle, creada_en", "Trazabilidad de decisiones."),
]

TRAZA = [
    ("RF-01 a RF-05", "Registrarse e iniciar sesión", "authController, middleware/auth, services/auth", "api.test.js · autenticación (6)"),
    ("RF-06 a RF-17", "Reportar, consultar, confirmar y denunciar", "reporteController, models/reporte, services/externos", "api.test.js · reportes (4) · gamificación (1)"),
    ("RF-18 a RF-22", "Planificar ruta segura", "rutaController, services/candidatas, seguridadRuta, riesgo", "api.test.js · rutas seguras (2) · gamificación (1)"),
    ("RF-23 a RF-27", "Iniciar caminata · Recibir alerta de desvío", "viajeController, shared/geo.js (MonitorDesvio), vistas/viaje.js", "geo.test.js (7)"),
    ("RF-28 a RF-32", "Registrar placa de taxi", "viajeController, models/viaje, services/crypto, limpieza", "api.test.js · placa (3)"),
    ("RF-33 a RF-37", "Ver mapa de calor predictivo", "rutaController.mapaCalor, services/calor, vistas/inicio.js", "api.test.js · mapa de calor (1)"),
    ("RF-38 a RF-43", "Verificar datos · Ver perfil e insignias", "comunidadController, services/insignias", "api.test.js · gamificación (3)"),
    ("RF-44 a RF-46", "Moderar reportes · Consultar auditoría", "moderacionController, models/comunidad (Auditoria)", "api.test.js · moderación (1)"),
    ("RF-47 a RF-51", "Onboarding, ayuda, degradación", "vistas/bienvenida.js, vistas/ayuda.js, externos.js", "Pruebas con APIs deshabilitadas + usabilidad"),
]


def generar():
    d = nuevo_documento("Especificación de Requerimientos")
    portada(d, "Especificación de\nRequerimientos (ERS)", "Luma · Ruta segura para mujeres en el espacio público nocturno",
            [("Proyecto", "Luma · Ruta Segura (reto translocal, Cundinamarca)"), ("Versión", "1.0"), ("Fecha", "Noviembre de 2026"),
             ("Enfoque", "Ciclo de vida del software en 5 etapas"), ("ODS", "5 · Igualdad de género  |  11 · Ciudades seguras  |  16 · Instituciones sólidas"),
             ("Estado", "Documento vivo: los requisitos se validan con usuarias reales (ver Anexo B)")])

    h1(d, "1. Introducción")
    h2(d, "1.1 Propósito")
    p(d, "Este documento especifica los requerimientos de Luma, una aplicación web colaborativa que ayuda a mujeres a desplazarse de noche por parques, vías y entornos universitarios de municipios de Cundinamarca. Sirve de acuerdo entre quienes construyen, evalúan y usan el sistema, y de base para diseñar, programar, probar y mantener la solución.")
    h2(d, "1.2 Alcance")
    p(d, "Luma permite (1) reportar puntos de riesgo con ubicación textual, (2) verlos en una lista ordenada por cercanía y filtrable, y en un mapa, (3) planificar rutas que priorizan la seguridad sobre la distancia con alertas de desvío, (4) registrar de forma rápida y temporal la placa de un taxi, (5) ver mapas de calor predictivos según la hora de la noche, y (6) ganar insignias de confianza al mantener los datos actualizados.")
    nota(d, "Fuera de alcance, por definición del reto: seguimiento en tiempo real por terceros, botón de pánico y conexión con autoridades. Luma es una herramienta de información colaborativa; no reemplaza a la Policía, a la línea 123 ni a la línea 155 de orientación a mujeres.")
    h2(d, "1.3 Definiciones")
    tabla(d, ["Término", "Definición"], [
        ("Atractor de seguridad", "Zona con alta densidad de luminarias, cámaras y comercios abiertos que se usa como punto de paso para generar rutas candidatas."),
        ("Puntaje de seguridad", "Número de 0 a 100 que resume cuán respaldada está una ruta por señales de seguridad a una hora dada."),
        ("Mapa de calor predictivo", "Estimación del riesgo por zona y hora basada en el historial de reportes; no predice delitos individuales."),
        ("Human-in-the-loop (HITL)", "Diseño en el que una persona revisa y decide las acciones sensibles; el algoritmo propone, no ejecuta."),
        ("Desvío", "Alejamiento de más de 45 m de la ruta planificada durante 3 lecturas de GPS consecutivas."),
        ("JWT", "JSON Web Token: credencial firmada con vigencia limitada."),
    ], [4.5, 12.3])
    h2(d, "1.4 Referencias")
    vinetas(d, ["Enunciado del reto: «Ruta segura para mujeres en el espacio público nocturno» (contexto translocal, Cundinamarca).",
                "OWASP Top 10 (2021) y OWASP ASVS como guía de seguridad.",
                "Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1, nivel AA.",
                "Ley 1581 de 2012 (protección de datos personales, Colombia).",
                "Documentación de OpenStreetMap, Nominatim, Overpass API y OSRM."])

    h1(d, "2. Ciclo de vida del software aplicado")
    p(d, "El proyecto sigue las cinco etapas clásicas del ciclo de vida, sin adoptar una metodología prescriptiva. Cada etapa tiene entregables verificables en el repositorio.")
    tabla(d, ["Etapa", "Qué se hizo", "Entregables"], [
        ("1. Análisis de requisitos", "Lectura del reto, contexto translocal y ODS; identificación de actores, funciones del reto y diferenciadores; definición de requisitos funcionales, no funcionales y reglas de negocio.", "Este ERS"),
        ("2. Diseño", "Arquitectura MVC por capas, modelo de datos, algoritmo de ruta segura, modelo de riesgo temporal, diseño visual «Noche Lila», decisiones técnicas.", "Diagramas UML (casos de uso, clases, secuencia, actividades) · docs/ARQUITECTURA.md"),
        ("3. Implementación", "Servidor Node.js/Express, cliente JavaScript sin dependencias de interfaz, integración con OpenStreetMap, cifrado y control de acceso.", "Carpetas src/, shared/, public/"),
        ("4. Pruebas", "27 pruebas automáticas (unitarias e integración, seguridad y reglas de negocio), revisión de accesibilidad y protocolo de pruebas de usabilidad.", "Carpeta test/ · docs/PRUEBAS_USABILIDAD.md"),
        ("5. Despliegue y mantenimiento", "Contenedor Docker, blueprint de Render con PostgreSQL gratuito, CI en GitHub Actions, purga automática de datos temporales, plan de evolución.", "Dockerfile · render.yaml · .github/workflows · docs/DESPLIEGUE.md"),
    ], [3.6, 8.7, 4.6])

    h1(d, "3. Descripción general")
    h2(d, "3.1 Contexto y problema")
    p(d, "La percepción de inseguridad en parques, vías y entornos universitarios es señalada por la ciudadanía en varios municipios de Cundinamarca, y las mujeres enfrentan barreras adicionales de movilidad. La información existe de forma dispersa (luminarias, comercios abiertos, experiencias propias) pero no está reunida ni disponible justo cuando se decide por dónde caminar.")
    h2(d, "3.2 ODS, escalabilidad y sostenibilidad")
    tabla(d, ["ODS", "Contribución de Luma"], [
        ("ODS 5 · Igualdad de género", "Reduce una barrera concreta de movilidad nocturna y visibiliza el riesgo que afecta de forma desproporcionada a las mujeres."),
        ("ODS 11 · Ciudades y comunidades sostenibles", "Información abierta y colaborativa sobre espacio público seguro; sirve a la gestión local (luminarias dañadas, zonas desoladas)."),
        ("ODS 16 · Paz, justicia e instituciones sólidas", "Participación ciudadana con rendición de cuentas: moderación humana y auditoría pública de decisiones."),
    ], [5.2, 11.6])
    p(d, "Escalabilidad: servidor sin estado, PostgreSQL, un municipio nuevo es una fila de datos; el cálculo de seguridad es una función pura. Sostenibilidad: infraestructura en capa gratuita, datos abiertos, y una comunidad incentivada (gamificación) que mantiene la información viva.")
    h2(d, "3.3 Actores")
    tabla(d, ["Actor", "Descripción"], [
        ("Visitante", "Persona sin cuenta; solo ve la bienvenida, el registro y el ingreso."),
        ("Usuaria autenticada", "Reporta, consulta, planea rutas, camina con alertas, aporta datos y gana insignias."),
        ("Moderadora", "Persona del equipo que revisa reportes denunciados y decide con justificación."),
        ("Servicios de OpenStreetMap", "Nominatim (geocodificación), Overpass (luminarias, cámaras, comercios, calles), OSRM (rutas peatonales), teselas del mapa."),
    ], [4.2, 12.6])
    h2(d, "3.4 Entorno operativo, restricciones y supuestos")
    vinetas(d, ["Navegadores modernos en teléfono o computador, con JavaScript; GPS y cámara opcionales.",
                "Servidor Node.js 22 o superior; PostgreSQL 14+ en producción, SQLite en desarrollo y pruebas.",
                "Restricción: el reto excluye seguimiento en tiempo real y botón de pánico.",
                "Restricción: las políticas de uso de Nominatim (1 consulta por segundo) y de las teselas de OSM obligan a caché y a identificar la aplicación.",
                "Supuesto: la cobertura de OSM sobre luminarias, cámaras y horarios es parcial en municipios pequeños; por eso se complementa con aportes de la comunidad.",
                "Supuesto: los datos de demostración incluidos son simulados y se reemplazan por datos reales con el uso."])

    h1(d, "4. Requerimientos funcionales")
    for grupo, filas in RF.items():
        h2(d, grupo)
        tabla(d, ["ID", "Requerimiento", "Descripción", "Prior.", "Criterio de aceptación"], [(a, b, c, e, f) for a, b, c, e, f in filas], [1.4, 3.0, 6.4, 1.2, 4.9], fs=8.5)

    h1(d, "5. Requerimientos no funcionales")
    for grupo, filas in RNF.items():
        h2(d, grupo)
        tabla(d, ["ID", "Requerimiento", "Descripción"], filas, [1.5, 4.0, 11.3], fs=8.8)

    h1(d, "6. Reglas de negocio")
    tabla(d, ["ID", "Regla"], REGLAS, [1.6, 15.2])

    h1(d, "7. Interfaces externas")
    tabla(d, ["Interfaz", "Detalle"], [
        ("Usuario", "SPA responsiva con navegación inferior (Mapa, Ruta, Reportar, Reportes, Yo)."),
        ("Nominatim (geocodificación)", "GET /search restringido a Colombia y a un cuadro alrededor del municipio; máximo 1 consulta/s; caché de 6 h."),
        ("Overpass API", "POST con consulta QL para luminarias (highway=street_lamp), cámaras (man_made=surveillance), comercios (shop, amenity) y calles; tiempo límite 6 s y caché."),
        ("OSRM peatonal", "GET /route/v1/foot con alternativas y puntos intermedios; caché y respaldo en línea recta."),
        ("Teselas OpenStreetMap", "Imágenes del mapa con atribución obligatoria."),
        ("Hardware", "Geolocalización y cámara del dispositivo, solo con permiso explícito."),
        ("Comunicaciones", "HTTPS con HSTS en producción; API REST JSON; token en cabecera Authorization."),
    ], [4.2, 12.6])

    h1(d, "8. Modelo de datos")
    tabla(d, ["Tabla", "Campos", "Propósito"], DATOS, [3.4, 9.2, 4.2], fs=8.5)

    h1(d, "9. Matriz de trazabilidad")
    tabla(d, ["Requisitos", "Caso de uso", "Componentes", "Verificación"], TRAZA, [2.6, 4.2, 5.8, 4.2], fs=8.6)

    h1(d, "10. Limitaciones conocidas")
    vinetas(d, ["Una zona sin reportes no significa que sea segura: puede significar que nadie ha reportado.",
                "El mapa de calor es una estimación estadística y puede reproducir sesgos de quién reporta más; por eso se muestra con aviso y se complementa con moderación humana.",
                "Las rutas siguen la red de OpenStreetMap; si falta una calle en el mapa, no se considera.",
                "La detección de desvío depende de la precisión del GPS del dispositivo (ver umbrales de 3 lecturas).",
                "La foto de la placa no se lee automáticamente (sin OCR) para no enviar imágenes a terceros; la usuaria digita la placa mirando su foto.",
                "Los datos iniciales son simulados; la utilidad real exige adopción comunitaria y alianzas locales."])

    h1(d, "Anexo A. Glosario de categorías de riesgo")
    tabla(d, ["Categoría", "Significado"], [
        ("ACOSO", "Situaciones de acoso verbal o físico en un punto."),
        ("ILUMINACION", "Iluminación deficiente en una vía o espacio."),
        ("DESOLADO", "Zona sin personas ni actividad."),
        ("LUMINARIA_DANADA", "Luminaria apagada o dañada (se crea desde las verificaciones comunitarias)."),
    ], [4.5, 12.3])
    h1(d, "Anexo B. Validación de los requisitos")
    p(d, "Los requisitos de usabilidad y accesibilidad se validan con el protocolo docs/PRUEBAS_USABILIDAD.md y la lista de verificación WCAG. Los resultados deben registrarse allí por las personas que ejecuten las pruebas; este documento no los inventa.")

    salida = RAIZ / "docs" / "ERS_LumaRutaSegura.docx"
    salida.parent.mkdir(exist_ok=True)
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
