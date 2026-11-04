"""Guía de estudio para la sustentación: dónde está cada cosa, tecnologías, cifras clave y preguntas probables del jurado."""
from pathlib import Path

from .docx_util import h1, h2, nota, nuevo_documento, p, portada, tabla, vinetas

RAIZ = Path(__file__).resolve().parents[2]
INTEGRANTES = "Miguel Angel Cruz Londoño · Julian Alexander Gomez Galvis · Jose Manuel Yara Cruz"


def qa(d, titulo, pares):
    h2(d, titulo)
    tabla(d, ["Pregunta del jurado", "Respuesta sugerida"], pares, [5.4, 11.4], fs=9)


def generar():
    d = nuevo_documento("Guía de estudio")
    portada(d, "Guía de estudio\npara la sustentación", "Qué usamos, dónde está cada cosa y cómo responder al jurado",
            [("Proyecto", "Nova · Ruta Segura — «Ninguna camina sola»"), ("Integrantes", INTEGRANTES), ("Fecha", "4 de noviembre de 2026"),
             ("Uso", "Material de estudio interno. No incluye contraseñas ni claves: esas se consultan en Render.")])

    h1(d, "1. Ficha rápida (memorízala)")
    tabla(d, ["Dato", "Respuesta"], [
        ("¿Qué es?", "Aplicación web colaborativa que ayuda a las mujeres a caminar de noche por municipios de Cundinamarca: reportes de riesgo con lugar verificado, rutas puntuadas por seguridad, alertas de desvío, mapa de calor por hora, registro temporal de la placa de un taxi y gamificación comunitaria."),
        ("Nombre", "Nova: «nueva» en latín; una nova es una estrella que de pronto brilla donde no había luz; también «no va sola». Lema: Ninguna camina sola."),
        ("Reto", "Ruta segura para mujeres en el espacio público nocturno · translocal Cundinamarca · ODS 5, 11 y 16."),
        ("URL en la nube", "https://nova-ruta-segura.onrender.com"),
        ("Código fuente", "https://github.com/angel0517cruz/Ruta_Segura (rama main)"),
        ("Despliegue", "Render, plan gratuito, servicio web con Docker, región Oregon. Se despliega solo cada vez que se hace push a main."),
        ("Base de datos", "PostgreSQL en Render, con un schema propio llamado «nova» dentro de la base compartida con otro proyecto. En desarrollo y pruebas: SQLite."),
        ("Lenguaje principal", "JavaScript (Node.js en el servidor; módulos ES en el navegador). SQL para datos. Python solo para generar los documentos y diagramas."),
        ("Frontend", "Página única (SPA) en JavaScript puro, HTML y CSS, sin React ni otro framework. Mapa con Leaflet y teselas de OpenStreetMap."),
        ("Backend", "Node.js 22 (en Docker) con Express 5, arquitectura MVC por capas, API REST en JSON con autenticación JWT."),
        ("Pruebas", "41 pruebas automáticas con el ejecutor de pruebas de Node (node:test)."),
        ("IA usada", "Claude (Sonnet 5.5, de Anthropic) mediante Claude Code, como herramienta de apoyo; declarado en el documento de IA responsable."),
    ], [3.8, 13.0], fs=9)

    h1(d, "2. Dónde está cada cosa")
    h2(d, "2.1 Despliegue en la nube")
    tabla(d, ["Pieza", "Dónde vive", "Detalle para explicar"], [
        ("Código", "GitHub: angel0517cruz/Ruta_Segura", "Rama main. Cada push dispara el despliegue automático en Render."),
        ("Aplicación (frontend + backend)", "Render → servicio web «nova-ruta-segura»", "Un solo servicio Docker: el mismo servidor Express entrega la API y también los archivos del frontend (carpeta public/). No hay un servidor separado para el frontend."),
        ("Base de datos", "Render → PostgreSQL (la base de otro proyecto)", "Render solo permite una base PostgreSQL gratuita por cuenta. Nova usa su propio schema «nova» (variable DB_SCHEMA), así que no toca las tablas del otro proyecto."),
        ("Configuración como código", "render.yaml (Blueprint)", "Describe el servicio, las variables y que DATABASE_URL se pega a mano. Dockerfile arma la imagen con Node 22 y un usuario sin privilegios."),
        ("Secretos", "Variables de entorno de Render", "JWT_SECRET y DATA_KEY (generadas por Render), DATABASE_URL, DEMO_PASSWORD, DB_SCHEMA, SEED_DEMO, APP_USER_AGENT. Nunca están en el repositorio."),
        ("Integración continua", "GitHub Actions (.github/workflows/ci.yml)", "Configurada para correr las pruebas y npm audit en cada push. Revisa la pestaña Actions del repositorio antes de presentar."),
        ("Mapas y datos abiertos", "OpenStreetMap", "Nominatim (verificar lugares), Overpass (luminarias, cámaras, comercios, calles), OSRM peatonal (rutas) y teselas del mapa."),
    ], [3.4, 4.6, 8.8], fs=9)
    h2(d, "2.2 Mapa del proyecto (carpetas)")
    tabla(d, ["Carpeta", "Qué contiene"], [
        ("src/controllers", "Controladores (la C del MVC): reciben la petición y responden. Auth, reportes, rutas, viajes, comunidad, moderación."),
        ("src/models", "Modelos (la M): acceso a datos con SQL parametrizado."),
        ("src/services", "Lógica de negocio: puntaje de rutas, riesgo, mapa de calor, insignias, cifrado, geocodificación, verificación de ubicación, limpieza."),
        ("src/middleware", "Autenticación JWT, roles y manejo de errores."),
        ("src/db", "Adaptador PostgreSQL/SQLite, esquema, datos iniciales, script para asignar moderadora."),
        ("public", "Vista (la V): index.html, CSS, y vistas JavaScript (mapa, ruta, caminata, reportar, reportes, perfil, moderación, ayuda)."),
        ("shared/geo.js", "Geometría compartida: distancias, índice espacial y el monitor de desvío. Lo usan el servidor y el navegador."),
        ("test", "41 pruebas automáticas."),
        ("docs", "ERS, UML, documento de IA, arquitectura, usabilidad, API y despliegue."),
        ("tools", "Generadores de documentos y descarga de calles de OpenStreetMap."),
    ], [4.0, 12.8], fs=9)

    h1(d, "3. Tecnologías por capa")
    tabla(d, ["Capa", "Tecnologías", "Por qué"], [
        ("Lenguajes", "JavaScript (ES modules), SQL, HTML, CSS. Python solo para documentos.", "Un solo lenguaje en cliente y servidor permite compartir shared/geo.js y probar la misma lógica que corre en el teléfono."),
        ("Frontend", "JavaScript puro, Leaflet 1.9, CSS propio, fuentes Fraunces y Outfit alojadas en el propio servidor.", "Sin framework ni CDN: política de seguridad estricta, carga rápida y sin rastreadores."),
        ("Backend", "Node.js 22, Express 5, zod (validación), jsonwebtoken, bcryptjs, helmet, express-rate-limit.", "Pocas dependencias, todas conocidas y auditadas (npm audit sin vulnerabilidades)."),
        ("Base de datos", "PostgreSQL (producción), SQLite integrado de Node (desarrollo y pruebas).", "El enunciado pide PostgreSQL; SQLite permite desarrollar y probar sin instalar un servidor. El mismo SQL sirve en ambos."),
        ("Servicios externos", "Nominatim, Overpass, OSRM, teselas de OpenStreetMap.", "Datos abiertos y gratuitos; cada uno con tiempo límite, caché y respaldo."),
        ("Seguridad", "JWT HS256, bcrypt (costo 12), AES-256-GCM, CSP estricta, límites de uso.", "Cubre los riesgos principales del OWASP Top 10."),
        ("Calidad", "node:test (41 pruebas), npm audit, GitHub Actions.", "Pruebas de integración con base en memoria y sin red."),
        ("Despliegue", "Docker, Render (plan gratuito), render.yaml.", "Reproducible y barato; el mismo contenedor corre en cualquier nube."),
    ], [2.8, 6.6, 7.4], fs=9)

    h1(d, "4. Cómo funciona por dentro")
    h2(d, "4.1 Qué pasa cuando una usuaria abre la app")
    vinetas(d, ["El navegador pide index.html y los módulos JavaScript al servidor Express (Render).",
                "La SPA lee la lista de municipios (GET /api/municipios, pública) y, si hay sesión, comprueba el token con GET /api/auth/yo.",
                "Cada petición protegida lleva el JWT en la cabecera Authorization. El servidor lo verifica y vuelve a leer el rol en la base de datos.",
                "El controlador valida la entrada con zod, llama a los servicios y modelos, y responde en JSON.",
                "El mapa lo dibuja Leaflet en el navegador con teselas de OpenStreetMap; las capas (calor, rutas, marcadores) las dibuja nuestro código."])
    h2(d, "4.2 Las siete funciones centrales")
    tabla(d, ["Función", "Cómo funciona (para explicarlo en 20 segundos)"], [
        ("Reporte con lugar verificado", "La usuaria elige municipio (el mapa vuela solo), escribe un lugar y elige uno de la lista de Nominatim. El servidor repite la verificación: el lugar debe existir en el municipio y el punto marcado debe quedar a 600 m o menos. Si Nominatim no responde, no se publica."),
        ("Ruta segura", "OSRM trae la ruta directa y variantes que pasan por «atractores» (zonas con más luz, cámaras y comercios abiertos). Cada ruta se muestrea cada 25 m y se mide luz (45 m), cámaras (70 m), comercios abiertos a esa hora (90 m), rutas verificadas (60 m) y riesgo reportado (110 m). Puntaje = 70 % promedio + 30 % del 20 % más débil. Se elige la mejor utilidad (puntaje menos penalización por distancia) sin pasar de +60 %."),
        ("Riesgo por hora y mapa de calor", "Cada reporte pesa según su categoría, qué tan cerca está su hora de la hora consultada (curva gaussiana, σ = 2,5 h), su antigüedad (vida media de 120 días) y sus confirmaciones. Se suman en celdas de unos 180 m y se convierte en intensidad con 1 − e^(−suma/1,2)."),
        ("Alerta de desvío", "En el teléfono, una clase calcula la distancia de cada lectura de GPS a la ruta. Si pasa de 45 m en 3 lecturas seguidas, alerta; se recupera a 25 m. El GPS nunca se envía al servidor."),
        ("Placa del taxi", "Se valida el formato (ABC123 o ABC12D), se cifra con AES-256-GCM y se liga al viaje. Vence a las 12 h como máximo y 2 h después de terminar el viaje; una tarea cada 10 minutos borra lo vencido. La usuaria puede borrarla ya."),
        ("Gamificación", "Puntos por aportar: ruta segura 10, luminaria dañada 12, comercio abierto 8, confirmar reporte 4, publicar reporte 6. Niveles Chispa, Brasa (50), Aurora (150) y Luna (400); 7 insignias. Tope de 40 puntos por día y rechazo de duplicados. Las luminarias dañadas restan seguridad a las rutas; los comercios confirmados y las rutas verificadas suman."),
        ("Moderación", "Con 2 denuncias de usuarias distintas el reporte sale de la vista pública. La moderadora revisa todos los reportes, decide con justificación obligatoria, ve a las autoras solo por un alias, puede limitar temporalmente su publicación y cura datos de seguridad. Todo queda en auditoría. No puede ver identidades ni borrar cuentas."),
    ], [3.4, 13.4], fs=9)

    h1(d, "5. Base de datos")
    tabla(d, ["Tabla", "Para qué sirve"], [
        ("municipios", "Tabla de referencia precargada de 8 municipios: Zipaquirá, Chía, Cajicá, Fusagasugá, Girardot, Ubaté, Facatativá y Soacha."),
        ("usuarias", "Cuentas: correo, hash bcrypt, rol (USUARIA o MODERADORA), puntos, bloqueo y limitación de publicación."),
        ("puntos_seguridad", "Luminarias, cámaras y comercios (con horario) que usa el algoritmo; con indicador de activo y origen (columna fuente)."),
        ("reportes", "Reportes de riesgo con lugar verificado, hora, estado (ACTIVO, EN_REVISION, OCULTO, RESUELTO), confirmaciones y denuncias."),
        ("denuncias_reporte", "Una denuncia por usuaria y reporte."),
        ("verificaciones", "Aportes de la comunidad: ruta segura, luminaria dañada, comercio abierto, confirmación de reporte."),
        ("insignias_usuaria", "Insignias ganadas."),
        ("viajes", "Caminatas: ruta elegida, puntaje, estado y número de desvíos."),
        ("placas_temporales", "Placa y foto cifradas con fecha de vencimiento (una por viaje)."),
        ("auditoria", "Registro de decisiones de moderación y del sistema, con justificación y alias de la autora."),
    ], [3.8, 13.0], fs=9)
    p(d, "Detalles que suelen preguntar: los campos tienen longitudes definidas (por ejemplo correo 120, referencia 120, descripción 280); las llaves foráneas y restricciones CHECK impiden estados inválidos; hay índices por municipio y estado; el SQL usa marcadores «?» que un adaptador convierte a $1, $2… para PostgreSQL; las fechas se guardan como TIMESTAMPTZ en PostgreSQL y como texto ISO en SQLite.")

    h1(d, "6. Seguridad y privacidad en una página")
    tabla(d, ["Tema", "Qué hicimos"], [
        ("Contraseñas", "bcrypt con costo 12; mínimo 8 caracteres con letras y números; nunca texto plano."),
        ("Sesión", "JWT firmado (HS256) de 2 horas. El rol se vuelve a leer de la base en cada petición. Se guarda en sessionStorage (se borra al cerrar la pestaña)."),
        ("Fuerza bruta", "Bloqueo de 15 minutos tras 5 fallos; mismo mensaje para correo inexistente o clave errónea; límites de 20 intentos de ingreso por 15 minutos."),
        ("Inyección", "Consultas SQL parametrizadas y validación de toda entrada con zod. La interfaz inserta texto con textContent, nunca HTML de usuarias."),
        ("Cabeceras", "Política CSP estricta (solo recursos propios y teselas), nosniff, frame-ancestors none, HSTS en producción, sin x-powered-by."),
        ("Control de acceso", "Roles validados en el servidor; viajes y placas filtrados por dueña para evitar acceder a datos ajenos."),
        ("Datos sensibles", "Placa y foto cifradas con AES-256-GCM y con vencimiento. El GPS de la caminata se procesa solo en el dispositivo."),
        ("Anonimato", "Las respuestas públicas no incluyen a la autora; moderación ve solo un alias (HMAC con la clave del servidor)."),
        ("Contenido", "No se aceptan teléfonos, correos ni enlaces en las descripciones; límite de 10 reportes por hora."),
        ("Ley 1581 de 2012", "Finalidad declarada, minimización, retención limitada y derecho de la usuaria a borrar sus reportes y su placa."),
    ], [3.4, 13.4], fs=9)

    h1(d, "7. Qué es real y qué es de prueba (sé honesto)")
    vinetas(d, [
        ("Real:", "los municipios, las calles y las rutas (OpenStreetMap), la verificación de lugares, el cifrado, la autenticación, las reglas y el código."),
        ("Generado para poder probar:", "alrededor de 11 500 puntos de luminarias, cámaras y comercios y 561 reportes iniciales, colocados sobre calles reales de OpenStreetMap. La columna fuente de cada registro lo identifica."),
        ("Parcial:", "cuando Overpass responde, Nova suma luminarias, cámaras y comercios reales de OSM; en el desarrollo respondió lento y a veces falló, y por eso hay un respaldo."),
        ("Sin validar:", "los pesos del algoritmo (son heurísticos), el mapa de calor como instrumento estadístico, la usabilidad con mujeres reales, la accesibilidad con lectores de pantalla y una prueba de penetración externa."),
    ])

    h1(d, "8. Números para tener a la mano")
    tabla(d, ["Cifra", "Qué significa"], [
        ("31", "actividades del ERS: 22 requisitos funcionales (RF01 a RF22) y 9 no funcionales (RNF01 a RNF09)"),
        ("4", "tipos de diagrama UML: casos de uso, clases, secuencia (4 diagramas) y actividades"),
        ("41", "pruebas automáticas"),
        ("10", "tablas en la base de datos"),
        ("35", "rutas de la API"),
        ("≈ 2 200 / 1 800", "líneas de JavaScript del servidor / del navegador"),
        ("8", "municipios cubiertos"),
        ("25 m", "distancia entre muestras al puntuar una ruta"),
        ("45 m · 3 lecturas · 25 m", "umbral de desvío · lecturas seguidas para alertar · distancia para recuperarse"),
        ("+60 %", "máximo de distancia extra permitido a una ruta recomendada"),
        ("600 m", "distancia máxima entre el punto marcado y el lugar verificado"),
        ("2 denuncias", "las que apartan un reporte de la vista pública hasta que una persona decida"),
        ("12 h · 2 h · 10 min", "vida máxima de la placa · vida tras terminar el viaje · cada cuánto se depura"),
        ("2 h · 12 · 5 / 15 min", "vigencia del JWT · costo de bcrypt · intentos fallidos / bloqueo"),
        ("40 puntos", "tope diario de puntos por usuaria"),
        ("ODS 5 · 11 · 16", "igualdad de género · ciudades seguras · instituciones sólidas"),
    ], [4.8, 12.0], fs=9)

    h1(d, "9. Preguntas probables del jurado")
    qa(d, "9.1 Producto y problema", [
        ("¿Qué problema resuelve y para quién?", "La inseguridad percibida al caminar de noche limita la movilidad de las mujeres en Cundinamarca. La información para decidir (luz, comercios abiertos, lo que ha pasado en cada esquina) existe, pero dispersa. Nova la reúne y la entrega justo cuando se elige el trayecto."),
        ("¿En qué se diferencia de Google Maps?", "Un mapa común optimiza distancia o tiempo. Nova optimiza seguridad, explica por qué recomienda una ruta, combina datos abiertos con lo que reporta la comunidad por hora de la noche y tiene moderación humana y privacidad por diseño."),
        ("¿Por qué no incluye un botón de pánico o seguimiento en vivo?", "El reto lo excluye y además es una decisión de diseño: el GPS se procesa solo en el dispositivo para proteger a la usuaria. Nova informa; no reemplaza a las autoridades (123 y línea 155)."),
        ("¿Quiénes son los usuarios y qué roles hay?", "Visitante (se registra o entra), usuaria autenticada y moderadora. El rol de moderadora se asigna a mano en la base de datos; nadie se lo puede dar a sí misma."),
        ("¿Cómo se sostiene en el tiempo?", "Usa datos abiertos y capa gratuita, y la gamificación incentiva que la comunidad mantenga los datos al día. Cada municipio nuevo es una fila en una tabla."),
        ("¿Cómo contribuye a los ODS?", "ODS 5 reduce una barrera concreta de movilidad; ODS 11 aporta información abierta sobre espacio público seguro y sirve a la gestión local (luminarias dañadas); ODS 16 con moderación auditada y participación ciudadana."),
    ])
    qa(d, "9.2 Técnicas", [
        ("¿Qué lenguajes y por qué JavaScript?", "JavaScript en cliente y servidor, SQL para los datos, HTML y CSS en la interfaz. Un solo lenguaje permite compartir el código de geometría (shared/geo.js) entre navegador y servidor, así lo que probamos es lo que corre en el teléfono."),
        ("¿Dónde está desplegado?", "En Render, plan gratuito, como servicio web con Docker en la región de Oregon, en https://nova-ruta-segura.onrender.com. El código está en GitHub y Render se actualiza solo con cada push."),
        ("¿Dónde está el frontend?", "En la carpeta public/ del mismo repositorio. El servidor Express lo entrega junto con la API; no hay un servidor separado. Es una página única hecha con JavaScript puro."),
        ("¿Por qué no usaron React u otro framework?", "Para mantener una política de seguridad estricta sin dependencias de terceros, cargar rápido y no necesitar un paso de compilación. Para el tamaño del proyecto, JavaScript con módulos alcanza. Con un equipo más grande, migrar a un framework sería razonable."),
        ("¿Qué base de datos usan y por qué?", "PostgreSQL en producción, como pide el reto, y SQLite en desarrollo y pruebas para no instalar un servidor. Un adaptador de pocas líneas permite que el mismo SQL funcione en ambas."),
        ("¿Por qué Nova usa un schema dentro de la base de otro proyecto?", "Render solo permite una base PostgreSQL gratuita por cuenta. Nova crea su propio schema «nova», así sus tablas están aisladas y no tocan las del otro proyecto."),
        ("¿Cómo se comunican frontend y backend?", "Por una API REST en JSON sobre HTTPS. Cada petición protegida lleva el token JWT en la cabecera Authorization."),
        ("¿Qué significa MVC aquí?", "Modelos en src/models (datos), controladores en src/controllers (reciben y responden), vista en public/ (la interfaz). La lógica de negocio está aparte, en src/services, sin tocar la base de datos, para poder probarla."),
        ("¿Cómo funciona el algoritmo de ruta segura?", "Se generan rutas candidatas, se muestrea cada 25 m, se mide luz, cámaras, comercios abiertos a esa hora, rutas verificadas y riesgo reportado, y se calcula un puntaje de 0 a 100 que pesa también el tramo más débil. Se recomienda la mejor combinación de seguridad y distancia, con tope de +60 %, y se explica en lenguaje claro."),
        ("¿De dónde salen las rutas?", "Del servicio de rutas peatonales de OpenStreetMap (OSRM). Nova no dibuja las calles: pide varias rutas reales, las puntúa y elige."),
        ("¿Cómo detecta que me desvié y por qué esos umbrales?", "Calcula la distancia de cada lectura de GPS a la ruta. Más de 45 m durante 3 lecturas seguidas activa la alerta; se exigen 3 para no alertar por el ruido del GPS. Los valores son heurísticos y deberían ajustarse en pruebas de campo."),
        ("¿El mapa de calor es realmente predictivo?", "Es una estimación estadística basada en reportes ciudadanos y su hora, no una predicción de delitos. Lo decimos en la aplicación. Puede reflejar el sesgo de quién reporta y por eso se acompaña de moderación."),
        ("¿Qué pasa si OpenStreetMap falla?", "Cada servicio tiene tiempo límite, caché y respaldo: sin rutas externas se ofrecen trayectos estimados con aviso, sin calles se mantiene el mapa de calor por celdas. La excepción es la verificación de lugares: sin ella, el reporte no se publica."),
        ("¿Cómo verifican que un lugar existe?", "Buscan el punto de referencia en Nominatim dentro del municipio. Si hay un punto marcado, debe estar a 600 m o menos del lugar encontrado y a 15 km o menos del centro del municipio."),
        ("¿Cómo escala?", "El servidor no guarda estado (usa JWT), así que se replica; PostgreSQL tiene índices; la lógica de puntaje son funciones puras. Un límite actual: las cachés están en memoria, y con varias réplicas habría que moverlas a Redis."),
    ])
    qa(d, "9.3 Seguridad y privacidad", [
        ("¿Cómo guardan contraseñas y sesiones?", "Contraseñas con bcrypt (costo 12). Sesión con JWT firmado de 2 horas; el rol se vuelve a leer de la base en cada petición."),
        ("¿Por qué el token está en sessionStorage y no en una cookie?", "Sin cookies no hay riesgo de CSRF y sessionStorage se borra al cerrar la pestaña, útil en equipos compartidos. El riesgo es XSS, y lo mitigamos con una política CSP estricta y sin insertar HTML de usuarias. A futuro, una cookie httpOnly con refresh token es mejor."),
        ("¿Cómo se protegen de inyección SQL y XSS?", "SQL parametrizado, validación con zod y la interfaz usa textContent. Hay pruebas automáticas, incluida una con texto de inyección."),
        ("¿Qué datos personales guardan?", "Nombre o apodo, correo y contraseña cifrada, reportes (sin exponer a la autora), puntos e insignias. La placa y la foto, cifradas y temporales. El GPS de la caminata no se guarda."),
        ("¿Qué pasa si se filtra la base de datos?", "Las contraseñas están con hash y la placa cifrada con AES-256-GCM. La clave de cifrado está en una variable de entorno, no en la base. Aun así, la placa es temporal, así que lo que haya expuesto es poco y de corta vida."),
        ("¿Un moderador podría abusar de su poder?", "Por diseño no ve identidades (solo un alias), no puede borrar cuentas, su sanción es limitar publicación de forma temporal y reversible, y cada decisión exige justificación y queda en el registro de auditoría. Falta una revisión periódica de ese registro por una persona distinta."),
        ("¿Hicieron pruebas de seguridad?", "Pruebas automáticas de tokens falsos, roles, bloqueo de cuenta, acceso a datos ajenos, inyección y cabeceras, y npm audit sin vulnerabilidades. No hicimos una prueba de penetración externa; está declarado como pendiente."),
        ("¿Qué hacen con la Ley 1581?", "Declaramos finalidades, minimizamos datos, limitamos retención (placas) y permitimos borrar reportes y placa. Falta redactar una política formal de tratamiento de datos."),
    ])
    qa(d, "9.4 Moderación y comunidad", [
        ("¿Y los reportes falsos o difamatorios?", "El lugar debe existir, no se aceptan teléfonos ni enlaces, hay un máximo de 10 reportes por hora, 2 denuncias retiran el reporte, la moderadora revisa todos y puede limitar temporalmente a una autora por alias."),
        ("¿Por qué la moderadora no puede borrar cuentas?", "Para borrar a una persona hay que conocer su identidad, y el anonimato es lo que protege a quien reporta. Eliminar una cuenta queda para la propia usuaria o para quien administra el despliegue, con auditoría."),
        ("¿Y si alguien usa la app para perseguir a otra persona?", "Nova no comparte la ubicación de nadie con terceros ni permite seguimiento: el GPS no sale del dispositivo y la placa solo la ve su dueña, que decide si la comparte con alguien de confianza."),
        ("¿La gamificación puede incentivar reportes falsos?", "Es un riesgo conocido. Mitigamos con verificación del lugar, tope de 40 puntos por día, rechazo de aportes duplicados e insignias por tipo de aporte. Habría que vigilar picos anómalos."),
        ("¿Cómo evitan estigmatizar barrios?", "Mostramos avisos de que es una estimación, no usamos etiquetas como «zona peligrosa» y se debe revisar el lenguaje y la metodología con líderes comunitarias."),
    ])
    qa(d, "9.5 Inteligencia artificial y proceso", [
        ("¿Qué hizo la IA y qué hicieron ustedes?", "Respondan con lo que de verdad hizo cada uno. Base honesta: la IA (Claude) generó gran parte del código y de los documentos; el equipo definió los requisitos, decidió el enfoque (roles, privacidad, paleta, nombre), probó el prototipo, detectó fallos y exigió correcciones. Cada integrante debe poder explicar al menos un módulo."),
        ("¿Cómo saben que el código es correcto?", "41 pruebas automáticas, pruebas manuales en el navegador y npm audit. No es una garantía total: hay partes sin prueba de campo (por ejemplo el GPS real) y falta revisión externa."),
        ("¿Qué errores cometió la IA?", "Documentados en el documento de IA: el panel de moderación no mostraba reportes nuevos (lo vio el equipo), afirmó un contraste accesible que no lo era (se midió y corrigió), usó teselas que exigen llave de API, y sus datos iniciales no coincidían con las calles reales."),
        ("¿Qué es human-in-the-loop en su proyecto?", "En el producto: el algoritmo recomienda pero la usuaria elige; el sistema aparta un reporte tras 2 denuncias pero una persona decide con justificación. En el desarrollo: un registro de revisión humana con responsables y firma."),
        ("¿Pueden explicar el código si lo pedimos?", "Prepárense: shared/geo.js (desvío), src/services/seguridadRuta.js (puntaje), src/services/ubicacion.js (verificación) y src/controllers/moderacionController.js (alias y sanción) son los cuatro archivos más importantes para repasar."),
    ])
    qa(d, "9.6 Datos y validez", [
        ("¿Los datos son reales?", "Las calles y rutas sí (OpenStreetMap). Las luminarias, cámaras, comercios y reportes iniciales fueron generados para poder probar y se identifican en la columna fuente. El plan es reemplazarlos con datos de OpenStreetMap, de la comunidad y de la curaduría de moderación."),
        ("¿Los pesos del algoritmo están validados?", "No. Son heurísticos y razonables, y lo declaramos. Deben calibrarse con expertas en seguridad urbana y género y con datos reales."),
        ("¿Probaron con usuarias reales?", "Todavía no. Dejamos un protocolo de pruebas de usabilidad listo (tareas, métricas y SUS). La alerta de desvío con GPS real tampoco se ha probado en calle; se probó con un simulador y con pruebas unitarias."),
        ("¿Qué falta para llevarlo a producción real?", "Datos reales, calibración con expertas, pruebas de usabilidad y accesibilidad con personas, una prueba de penetración, una política de datos formal, una persona moderadora designada y una infraestructura que no caduque."),
    ])
    qa(d, "9.7 Operación y despliegue", [
        ("¿Por qué tarda en abrir?", "La capa gratuita de Render duerme el servicio tras un rato sin visitas y la primera carga tarda cerca de un minuto. Se evita abriendo la app unos minutos antes de presentar."),
        ("¿Cómo se actualiza la aplicación?", "Con un push a la rama main de GitHub; Render reconstruye la imagen Docker y la despliega solo."),
        ("¿Cómo se nombra una moderadora real?", "La persona se registra y quien administra ejecuta npm run moderadora -- correo, que cambia su rol en la base de datos y lo registra en la auditoría."),
        ("¿Qué pasa con los datos al cerrar o reiniciar?", "Están en PostgreSQL, no se pierden al reiniciar. Aviso: la base gratuita de Render caduca a los 30 días de creada, y comparte vida con el otro proyecto."),
    ])

    h1(d, "10. Qué NO decir")
    vinetas(d, ["«Cumple WCAG 2.1 AA»: di «aplicamos criterios WCAG 2.1 AA y medimos el contraste; falta auditoría con lectores de pantalla».",
                "«Nova garantiza seguridad» o «predice delitos»: ayuda a decidir con más información.",
                "«Es 100 % seguro»: no hicimos una prueba de penetración externa.",
                "Cifras de usuarias, impacto o precisión: no tenemos ninguna medición real.",
                "«Los datos son reales» sin aclarar que parte de los datos iniciales son generados.",
                "Mostrar contraseñas o correos de cuentas en pantalla durante la demo."])

    h1(d, "11. Plan B de la demo")
    tabla(d, ["Si ocurre…", "Haz esto"], [
        ("Render está dormido o tarda", "Abre https://nova-ruta-segura.onrender.com 5 minutos antes y navega una vez. Ten abierta la versión local (npm start) como respaldo."),
        ("No hay internet o el mapa no carga", "Muestra capturas de la app y la guía de pantallas; explica la degradación elegante (trayectos estimados) como ventaja."),
        ("No funciona el GPS del equipo", "Usa «Simular caminata» y «Simular desvío», que están hechos para eso."),
        ("Nominatim no responde al reportar", "Explica que el reporte no se publica sin verificar el lugar (es una decisión de diseño) y muestra otra función."),
        ("No entra a una cuenta", "La clave de las cuentas de ejemplo es la variable DEMO_PASSWORD en Render (Environment). Si estuvo bloqueada, espera 15 minutos o reinicia el servicio."),
    ], [5.0, 11.8], fs=9)

    h1(d, "12. Glosario para no atorarse")
    tabla(d, ["Término", "En una frase"], [
        ("MVC", "Separar los datos (modelo), la lógica de petición (controlador) y la interfaz (vista)."),
        ("API REST", "Forma de pedir y enviar datos al servidor con direcciones y verbos HTTP, normalmente en JSON."),
        ("JWT", "Credencial firmada y con vencimiento que prueba quién eres sin guardar sesión en el servidor."),
        ("bcrypt", "Función para guardar contraseñas de forma que no se pueden leer, solo comprobar."),
        ("AES-256-GCM", "Cifrado que protege el contenido y detecta si fue alterado."),
        ("CSP", "Política del navegador que limita de dónde puede cargar scripts, estilos e imágenes."),
        ("OWASP Top 10", "Lista de los riesgos de seguridad web más comunes."),
        ("WCAG 2.1 AA", "Pautas de accesibilidad web; AA es el nivel que suelen exigir."),
        ("Geocodificar", "Convertir el nombre de un lugar en coordenadas."),
        ("Haversine", "Fórmula para la distancia entre dos coordenadas sobre la Tierra."),
        ("Schema (PostgreSQL)", "Carpeta lógica dentro de una base que agrupa tablas y las aísla de otras."),
        ("Docker", "Paquete que lleva la aplicación con todo lo que necesita para correr igual en cualquier lugar."),
        ("Human-in-the-loop", "Una persona revisa y decide las acciones sensibles; el sistema solo propone."),
    ], [4.0, 12.8], fs=9)

    salida = RAIZ / "docs" / "Guia_de_Estudio_Nova.docx"
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
