"""Documento de uso ético de la IA: herramientas, prompts relevantes, evaluación crítica y supervisión humana (HITL)."""
from pathlib import Path

from .docx_util import h1, h2, nota, nuevo_documento, p, portada, tabla, vinetas

RAIZ = Path(__file__).resolve().parents[2]
INTEGRANTES = "Miguel Angel Cruz Londoño · Julian Alexander Gomez Galvis · Jose Manuel Yara Cruz"
MA, JG, JY = "Miguel Angel Cruz Londoño", "Julian Alexander Gomez Galvis", "Jose Manuel Yara Cruz"


def generar():
    d = nuevo_documento("Uso ético de la IA y supervisión humana")
    portada(d, "Uso ético de la IA y\nsupervisión humana", "Herramientas utilizadas · Prompts relevantes · Evaluación crítica · Supervisión humana",
            [("Proyecto", "Nova · Ruta Segura"), ("Integrantes", INTEGRANTES), ("Versión", "1.1"), ("Fecha", "4 de noviembre de 2026"),
             ("Criterio del reto", "Uso ético de la IA (veeduría y vigilancia humana)"),
             ("Principio rector", "La IA apoya y propone; las personas revisan, deciden y responden.")])

    h1(d, "1. Propósito")
    p(d, "Nova se desarrolló con apoyo de una herramienta de inteligencia artificial generativa. Este documento declara cómo se usó, qué decisiones permanecen en manos de personas y qué vigilancia debe ejercer un equipo humano para que el proyecto salga bien y no quede todo en manos de la IA (enfoque human-in-the-loop). Responde a tres preguntas: ¿qué herramientas se usaron y para qué?, ¿qué se le pidió y qué se obtuvo?, y ¿qué debe revisar una persona antes de confiar en el resultado?")
    nota(d, "El registro de la sección 6 relaciona cada elemento con la evidencia verificable disponible y deja constancia de quién revisa. La aprobación de cada revisión humana se marca y firma únicamente por la persona que efectivamente la realizó.")

    h1(d, "2. Herramientas utilizadas")
    tabla(d, ["Herramienta", "Tipo", "Para qué se usó", "Límite de su rol"], [
        ("Claude (modelo Claude Sonnet 5.5, de Anthropic) mediante Claude Code", "Asistente de IA generativa para desarrollo", "Proponer la arquitectura, escribir código y pruebas, depurar con el navegador integrado, generar diagramas y borradores de documentos y corregir a partir de las observaciones del equipo.", "No decide políticas de moderación, no valida con usuarias reales, no sustituye una revisión de seguridad ni jurídica. Puede equivocarse y sonar segura."),
        ("Node.js, Express, PostgreSQL/SQLite, JWT, bcrypt", "Software determinista", "Ejecución de la aplicación.", "Su comportamiento se verifica con pruebas."),
        ("OpenStreetMap (Nominatim, Overpass, OSRM, teselas)", "Datos y servicios abiertos", "Verificación de lugares, rutas peatonales, luminarias, cámaras, comercios y calles.", "Cobertura desigual; datos de terceros sin garantía."),
        ("matplotlib y python-docx", "Software determinista", "Generar diagramas UML y documentos Word de forma reproducible.", "El resultado se revisa visualmente."),
        ("Navegador integrado y node:test", "Verificación", "Probar la interfaz y la API con 40 pruebas automáticas.", "Solo cubren lo que alguien pensó probar."),
    ], [4.0, 3.2, 5.6, 4.0], fs=8.6)
    p(d, "Instalación de herramientas: Node.js se instaló con autorización expresa del equipo; las dependencias del proyecto se instalaron con npm dentro de la carpeta del proyecto. No se enviaron datos personales a servicios de terceros.")

    h1(d, "3. Prompts relevantes")
    p(d, "Se resumen las instrucciones que más condicionaron el resultado y el control humano aplicado a cada una.")
    tabla(d, ["#", "Instrucción (resumen fiel)", "Qué produjo la IA", "Control humano requerido"], [
        ("P1", "«¿Podemos trabajar en JavaScript?»", "Propuesta de stack Node.js + Express con PostgreSQL y JavaScript en el navegador.", "El equipo aprobó el stack; revisar que cumpla el reto."),
        ("P2", "Enunciado completo del reto «Ruta segura para mujeres en el espacio público nocturno»: reportes con JWT, lista por cercanía con filtro, API externa de mapas, MVC, PostgreSQL, nube, ODS, UX, seguridad, usabilidad y este documento de IA.", "Arquitectura, requisitos, aplicación y documentos alineados con cada criterio.", "Verificar requisito por requisito contra el enunciado oficial (trazabilidad del ERS)."),
        ("P3", "«Otra interfaz, animaciones simples que marquen la diferencia, que no se vea como la mayoría; tonos morados y lilas.»", "Identidad visual con reloj nocturno, hilo de luz, luciérnagas, anillos de puntaje e insignias.", "Probar con usuarias reales que ayuda y no distrae; revisar accesibilidad y movimiento reducido."),
        ("P4", "«Navegación inteligente: algoritmo que priorice iluminación, cámaras y negocios abiertos sobre la ruta más corta; alertas si se aleja de la ruta.»", "Evaluador de seguridad por tramos, rutas candidatas con atractores y monitor de desvío de 3 lecturas.", "Calibrar pesos con expertas y datos reales; validar umbrales de desvío en campo."),
        ("P5", "«Registro rápido de transporte: fotografiar o digitar la placa, almacenarla temporalmente y vincularla al viaje.»", "Placa cifrada AES-256-GCM, vencimiento, purga y borrado inmediato. Se usó PostgreSQL por exigencia del enunciado (la idea original mencionaba MySQL).", "Revisión de privacidad (Ley 1581) y de la política de retención."),
        ("P6", "«Mapas de calor predictivos según la hora de la noche; calles en rojo.»", "Modelo con kernel horario, vigencia y confirmaciones; capas de calor y calles.", "Revisión estadística y de sesgo; decidir qué se publica como zona de riesgo."),
        ("P7", "«Gamificación comunitaria: insignias de confianza por verificar rutas, reportar luminarias y confirmar comercios.»", "Puntos, niveles, 7 insignias, antiabuso y tope diario.", "Vigilar incentivos perversos (reportes falsos por obtener puntos)."),
        ("P8", "«Basarnos en las 5 etapas del ciclo de vida; 4 diagramas UML; ERS con todos los requerimientos.»", "ERS, documento de diagramas y estructura por etapas.", "Una persona debe leer el ERS y los diagramas y confirmar que reflejan la intención."),
        ("P9", "Observaciones del equipo tras probar el prototipo: el rol de moderadora es casi igual al de usuaria; los reportes nuevos no aparecen en el panel; el formulario debe llevar el mapa al municipio y verificar que el lugar exista; ajustar nombre, paleta y formato del ERS.", "Moderación ampliada (todos los reportes, sanción proporcional por alias, curaduría de datos, métricas), verificación de ubicaciones con Nominatim, navegación automática del mapa, nuevo nombre y paleta, y ERS reescrito en formato IEEE 830.", "Cada cambio se probó en el navegador y con pruebas automáticas; el equipo valida que respondan a su criterio."),
    ], [0.9, 5.7, 5.2, 5.0], fs=8.4)
    nota(d, "Prompts de auditoría recomendados para interrogar a la herramienta y no solo confiar en ella: «Explica línea por línea cómo se calcula el puntaje de una ruta», «¿Qué casos extremos rompen el monitor de desvío?», «Enumera los supuestos de privacidad que hiciste», «¿Qué parte de este código no probaste?», «Busca vulnerabilidades OWASP en src/».")

    h1(d, "4. Evaluación crítica")
    h2(d, "4.1 Qué aportó la IA")
    vinetas(d, ["Velocidad: arquitectura, API, interfaz, pruebas y documentos en poco tiempo.",
                "Consistencia: la misma lógica de geometría se comparte entre servidor y navegador y está probada.",
                "Cobertura de buenas prácticas de seguridad (cabeceras, cifrado, validación, control de acceso por objeto) que suelen omitirse por falta de tiempo.",
                "Capacidad de reproducir y corregir fallos al probar en el navegador y en la consola."])
    h2(d, "4.2 Errores o fallos de criterio de la IA y cómo se detectaron")
    p(d, "Esta tabla es la evidencia de por qué la veeduría humana es necesaria. Varios fallos los detectó el propio equipo al probar el prototipo; ninguno lo habría señalado la IA por sí sola.")
    tabla(d, ["Fallo", "Cómo se detectó", "Corrección"], [
        ("El panel de moderación solo mostraba reportes denunciados: un reporte recién creado no aparecía y la moderadora no podía revisarlo.", "Prueba manual del equipo (humana).", "Nueva pestaña con todos los reportes, filtros por estado y municipio y una prueba automática que lo cubre."),
        ("El rol de moderadora era casi idéntico al de usuaria (solo ocultaba reportes), sin funciones propias.", "Observación del equipo (humana).", "Se amplió con curaduría de datos de seguridad, métricas, sanción proporcional y registro de auditoría, sin acceso a identidades ni a borrar cuentas."),
        ("Los reportes aceptaban referencias inventadas y ubicaban el punto de forma aproximada.", "Observación del equipo (humana).", "Verificación del lugar con Nominatim, puntos a ≤ 600 m del lugar y rechazo si el servicio no responde."),
        ("Usó teselas de CARTO que ahora exigen llave de API; el mapa mostraba marcas de agua.", "Inspección visual en el navegador.", "Teselas de OpenStreetMap con filtro oscuro y nota de uso responsable."),
        ("La política CSP bloqueaba las teselas (el comodín no cubre el dominio raíz) y la política de referrer hacía que OSM las rechazara.", "Consola del navegador.", "Lista blanca exacta y política strict-origin-when-cross-origin."),
        ("Afirmó en un comentario que el contraste cumplía AA sin haberlo medido; el botón principal (3,15:1) y el de peligro fallaban.", "Se pidió medirlo con un cálculo explícito.", "Colores corregidos; contrastes medidos y documentados."),
        ("Datos iniciales dispersos que no coincidían con las calles reales: las rutas puntuaban entre 3 y 16 sobre 100.", "Prueba de la API con un trayecto real.", "Se descargaron calles reales de OSM una vez y los datos iniciales se colocan sobre ellas."),
        ("Texto «null» visible e íconos gigantes por falta de reglas base.", "Capturas de pantalla.", "Filtrado de nodos vacíos y regla de tamaño de íconos."),
    ], [6.6, 4.0, 6.2], fs=8.4)
    h2(d, "4.3 Limitaciones que la IA no puede resolver sola")
    vinetas(d, [
        ("Pesos heurísticos del algoritmo.", "Los valores (0,34 luz, 0,55 riesgo, +60 % de desvío, σ = 2,5 h…) son razonables pero no validados; una persona experta debe calibrarlos."),
        ("Mapa de calor no validado estadísticamente.", "Con pocos reportes puede inducir a error, estigmatizar barrios y reproducir el sesgo de quién reporta."),
        ("Datos iniciales simulados.", "Las luminarias, cámaras, comercios y los reportes iniciales del prototipo fueron generados para poder probar el sistema. Deben reemplazarse por datos reales de OpenStreetMap, de la comunidad y de la curaduría de moderación antes de un uso público."),
        ("Accesibilidad no auditada con personas reales.", "Se aplicaron criterios WCAG 2.1 AA y se midió contraste, pero no se probó con lectores de pantalla."),
        ("Sin prueba de penetración independiente.", "Hay pruebas automáticas de controles clave y npm audit sin vulnerabilidades, pero no una auditoría externa."),
        ("Sin validación con mujeres usuarias.", "El diseño parte de supuestos; el protocolo de usabilidad está escrito y falta ejecutarlo."),
        ("Falsa sensación de seguridad.", "Una ruta mejor puntuada no es una ruta segura; el producto lo advierte y una persona debe vigilar que la comunicación no prometa más de lo que entrega."),
    ])

    h1(d, "5. Justificación de la veeduría y vigilancia humana")
    h2(d, "5.1 Por qué no puede quedar todo en manos de la IA")
    vinetas(d, [
        ("Responsabilidad.", "Si una usuaria sigue una ruta y le ocurre algo, o si un reporte falso daña a una persona, la responsabilidad es de personas y organizaciones, no del modelo."),
        ("Contexto local.", "Solo quienes conocen Zipaquirá, Chía o Girardot saben qué parque es realmente peligroso o qué dato está desactualizado."),
        ("Daño asimétrico.", "Un falso «seguro» puede costar más que un falso «inseguro»; esa ponderación es una decisión ética, no técnica."),
        ("Contenido sensible.", "Ocultar o mantener un reporte de acoso es un juicio humano; el algoritmo no debe tomarlo."),
        ("Errores plausibles.", "La IA genera código y texto convincentes que pueden contener fallos de seguridad o de lógica; sin revisión llegan a producción."),
    ])
    h2(d, "5.2 Dónde está el humano en el producto (controles incorporados)")
    tabla(d, ["Decisión", "Quién propone", "Quién decide", "Mecanismo y evidencia"], [
        ("Ocultar, atender o restaurar un reporte", "El sistema (2 denuncias) o la propia moderadora al revisar todos los reportes", "Moderadora (persona)", "Panel de moderación; justificación obligatoria; registro de auditoría. El algoritmo nunca oculta por sí solo."),
        ("Sancionar a una autora", "La moderadora, ante reportes repetidos sin fundamento", "Moderadora, de forma proporcional", "Solo limitar la publicación (1 a 30 días, reversible); la autora se ve por alias; no hay función para borrar cuentas; queda auditado."),
        ("Mantener los datos de seguridad", "Comunidad y OpenStreetMap", "Moderadora", "Curaduría de luminarias, cámaras y comercios; cierre de luminarias reparadas con justificación."),
        ("Elegir una ruta", "El algoritmo recomienda y explica", "La usuaria", "Tarjetas con desglose; puede elegir cualquier alternativa; aviso de que ninguna ruta garantiza seguridad."),
        ("Confiar en un reporte", "Comunidad (confirmaciones)", "Otras usuarias y moderación", "Las confirmaciones suben el peso; las denuncias lo apartan; un reporte sin lugar verificable no se publica."),
        ("Compartir la placa del taxi", "La aplicación ofrece el botón", "La usuaria", "Nada se envía solo; ella toca «Compartir»."),
        ("Conservar datos sensibles", "Regla de retención", "Persona responsable de datos", "Vencimiento automático y borrado inmediato por la usuaria; ajustable con PLACA_TTL_HORAS."),
        ("Asignar el rol de moderadora", "—", "Administración del despliegue", "Solo manual en la base de datos; nunca desde el registro."),
    ], [3.6, 3.8, 3.2, 6.2], fs=8.4)
    h2(d, "5.3 Por qué la moderadora no elimina cuentas")
    p(d, "Eliminar a una persona exige conocer su identidad, y la identidad de las autoras es lo que las protege al reportar. Se decidió que la moderación gestione contenido y datos, no personas: ve un alias estable (por ejemplo N-7F3A) para reconocer patrones, puede limitar de forma temporal y reversible la publicación de reportes y todo queda auditado con su justificación. Eliminar una cuenta queda reservado a la propia usuaria o a quien administra el despliegue. Un futuro rol de administración con doble aprobación puede encargarse de los casos graves.")

    h1(d, "6. Registro de revisión humana")
    p(d, "Cada fila indica qué se revisa, cómo, quién es el responsable propuesto y la evidencia verificable disponible al 4 de noviembre de 2026. La última columna la completa quien realiza la revisión (✔ aprobada · ± con ajustes · ✖ rechazada, con fecha y firma).")
    tabla(d, ["Qué se revisa", "Cómo", "Responsable propuesto", "Evidencia disponible", "Revisión humana"], [
        ("Código del algoritmo de seguridad", "Lectura de seguridadRuta.js y riesgo.js y recálculo manual de 3 casos", MA, "40 de 40 pruebas automáticas aprobadas (rutas, riesgo y monitor de desvío)", "☐ Fecha: ____  Firma: ____"),
        ("Pesos y umbrales (0,34 / 0,55 / +60 % / 45 m / σ 2,5 h)", "Contrastar con una persona experta en seguridad urbana o género", JG, "Sin validación externa aún (ver 4.3)", "☐ Fecha: ____  Firma: ____"),
        ("Seguridad (OWASP)", "Revisión de src/, npm audit y prueba con OWASP ZAP", MA, "npm audit sin vulnerabilidades; pruebas de tokens falsos, roles, bloqueo, IDOR, inyección y cabeceras", "☐ Fecha: ____  Firma: ____"),
        ("Cifrado y retención de placas", "Verificar en la base de datos que no hay texto plano y probar la purga", MA, "Prueba automática: la placa no aparece en texto plano y la purga elimina lo vencido", "☐ Fecha: ____  Firma: ____"),
        ("Privacidad y Ley 1581", "Redactar y revisar la política de tratamiento de datos", JY, "Controles técnicos descritos en el ERS (RNF03); falta la política formal", "☐ Fecha: ____  Firma: ____"),
        ("Accesibilidad", "Lista WCAG 2.1 AA y prueba con lector de pantalla (NVDA o TalkBack)", JG, "Contrastes medidos: texto ≥ 11:1 y controles ≥ 4,7:1; falta prueba con lector de pantalla", "☐ Fecha: ____  Firma: ____"),
        ("Usabilidad", "Ejecutar docs/PRUEBAS_USABILIDAD.md con 5 personas o más", JG, "Protocolo escrito; resultados pendientes", "☐ Fecha: ____  Firma: ____"),
        ("Verificación de ubicaciones", "Intentar reportar lugares falsos y puntos lejanos y revisar los mensajes", JY, "Pruebas automáticas: referencia inventada, punto lejano, punto fuera del municipio y servicio caído", "☐ Fecha: ____  Firma: ____"),
        ("Moderación y alcance del rol", "Simular reportes abusivos y recorrer todas las funciones de la moderadora; confirmar que no ve identidades ni borra cuentas", JY, "Pruebas automáticas: alias anónimo, limitación reversible, sin ruta para borrar cuentas, métricas anónimas", "☐ Fecha: ____  Firma: ____"),
        ("Contenido de los documentos", "Leer el ERS y los UML completos y confirmar que reflejan la intención", "Los tres integrantes", "ERS con 31 actividades y 4 diagramas UML generados con el código actual", "☐ Fecha: ____  Firma: ____"),
        ("Datos iniciales", "Confirmar origen y plan de reemplazo por datos reales", JG, "Columna fuente de cada registro identifica su origen", "☐ Fecha: ____  Firma: ____"),
    ], [3.2, 4.0, 2.4, 4.4, 2.8], fs=8)

    h1(d, "7. Riesgos éticos específicos y controles")
    tabla(d, ["Riesgo", "Control en el diseño", "Vigilancia humana"], [
        ("Reportes falsos o difamatorios", "Lugar verificado; sin datos personales ni enlaces; denuncias; moderación; autoras anónimas hacia afuera", "La moderadora revisa todos los reportes con frecuencia y detecta patrones por alias"),
        ("Estigmatización de barrios", "Aviso de que es una estimación; sin etiquetas absolutas de «zona peligrosa»", "Revisar el lenguaje, publicar la metodología y consultar a líderes comunitarias"),
        ("Exposición de la ubicación de las usuarias", "El GPS se procesa en el dispositivo; solo se envía lo que ella decide", "Auditar que ninguna versión nueva registre posiciones"),
        ("Uso indebido de la placa", "Cifrado, vencimiento corto y acceso solo de la dueña", "Revisar solicitudes de acceso; no entregar a terceros sin orden legal"),
        ("Abuso de poder de la moderación", "Sin identidades, sin borrar cuentas, sanciones reversibles y justificadas, registro de auditoría", "Revisión periódica del registro por una persona distinta a la moderadora"),
        ("Falsa sensación de seguridad", "Textos de límites, desglose explicado y números de emergencia", "Revisar que la comunicación no prometa seguridad"),
        ("Sesgo y cobertura desigual de los datos", "Fuentes mixtas, confirmaciones y curaduría", "Medir qué municipios tienen pocos datos y priorizarlos"),
        ("Incentivos perversos de la gamificación", "Tope diario de puntos, anti-duplicados, insignias por calidad", "Revisar usuarias con picos anómalos de aportes"),
        ("Dependencia de servicios externos", "Caché, tiempos límite y respaldo; no se publica un lugar sin verificar", "Monitorear disponibilidad y políticas de uso de OSM"),
        ("Código generado con vulnerabilidades", "Pruebas, cabeceras y revisión OWASP", "Revisión por pares y pruebas de penetración antes de producción"),
    ], [4.2, 6.4, 6.2], fs=8.4)

    h1(d, "8. Criterios para no publicar")
    vinetas(d, ["No se han completado las revisiones humanas de seguridad, privacidad y moderación de la sección 6.",
                "Los datos iniciales simulados se presentan como si fueran reales en un uso público.",
                "No hay al menos una persona designada que modere y atienda denuncias en menos de 24 horas.",
                "El mapa de calor se publica sin su aviso de límites o con lenguaje que estigmatiza zonas.",
                "Las claves JWT_SECRET y DATA_KEY no se generaron de forma segura para producción."])

    h1(d, "9. Cómo verificar de forma independiente")
    tabla(d, ["Qué verificar", "Cómo"], [
        ("Pruebas automáticas", "npm test (40 pruebas: autenticación, reportes, moderación, verificación de ubicaciones, rutas, mapa de calor, placa cifrada, gamificación y geometría)"),
        ("Dependencias", "npm audit --omit=dev"),
        ("Cabeceras de seguridad", "Inspeccionar las respuestas de /api/salud (CSP, nosniff, sin x-powered-by)"),
        ("Cifrado de la placa", "Consultar placas_temporales: placa_cifrada no contiene el texto de la placa"),
        ("Decisiones de moderación", "GET /api/moderacion/auditoria con una cuenta de moderadora"),
        ("Origen de los datos", "Columna fuente en puntos_seguridad y reportes"),
    ], [4.6, 12.2])

    h1(d, "10. Compromisos")
    vinetas(d, ["Una persona nombrada es responsable del producto y de la decisión de publicar.",
                "La moderación es humana, auditable y con justificación.",
                "Se informa a las usuarias qué hace el sistema, qué no hace y qué datos usa.",
                "Este documento se revisa en cada versión y cuando cambien el modelo o los datos.",
                "Si la IA y una persona experta discrepan, prevalece la persona experta, con registro de la razón."])
    salida = RAIZ / "docs" / "IA_Responsable_Nova.docx"
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
