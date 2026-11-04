"""Documento de uso ético de la IA: herramientas, prompts relevantes, evaluación crítica y veeduría humana (HITL)."""
from pathlib import Path

from .docx_util import h1, h2, nota, nuevo_documento, p, portada, tabla, vinetas

RAIZ = Path(__file__).resolve().parents[2]


def generar():
    d = nuevo_documento("IA responsable y supervisión humana")
    portada(d, "Uso ético de la IA y\nsupervisión humana", "Herramientas utilizadas · Prompts relevantes · Evaluación crítica · Human-in-the-loop",
            [("Proyecto", "Luma · Ruta Segura"), ("Versión", "1.0"), ("Fecha", "Noviembre de 2026"),
             ("Criterio del reto", "Uso ético de la IA (veeduría y vigilancia humana)"),
             ("Principio rector", "La IA propone y construye; las personas revisan, deciden y responden.")])

    h1(d, "1. Propósito y declaración")
    p(d, "Este proyecto se construyó con apoyo sustancial de un asistente de inteligencia artificial. Este documento declara qué se hizo con IA, qué decisiones quedan en manos humanas y cómo una persona debe vigilar el sistema para que «todo» no quede en manos de la IA. Responde a una pregunta concreta: ¿qué tiene que revisar un ser humano para que este proyecto salga bien y sea seguro para las mujeres que lo usen?")
    nota(d, "Declaración: el código, las pruebas, los diagramas y los borradores de los documentos fueron generados por una IA a partir de instrucciones del equipo. Ninguna pieza debe considerarse validada hasta que una persona nombrada complete el registro de revisión de la sección 6. Este documento no afirma que esas revisiones ya ocurrieron.")

    h1(d, "2. Herramientas utilizadas")
    tabla(d, ["Herramienta", "Tipo", "Para qué se usó", "Límite de su rol"], [
        ("Claude (modelo Claude Sonnet 5.5, Anthropic) vía Claude Code", "Asistente de IA generativa con acceso al equipo del desarrollador", "Analizar el proyecto anterior, proponer la arquitectura, escribir código y pruebas, depurar con el navegador integrado, generar diagramas y borradores de documentos, instalar dependencias con permiso explícito.", "No decide políticas, no valida con usuarias reales, no sustituye revisión de seguridad ni jurídica. Puede equivocarse con seguridad y sonar convencida."),
        ("Node.js, Express, SQLite/PostgreSQL, JWT, bcrypt", "Software determinista", "Ejecución de la aplicación.", "Su comportamiento es verificable por pruebas."),
        ("OpenStreetMap (Nominatim, Overpass, OSRM, teselas)", "Datos y servicios abiertos", "Geocodificación, rutas peatonales, luminarias, cámaras, comercios y calles.", "Cobertura desigual; datos de terceros sin garantía."),
        ("matplotlib y python-docx", "Software determinista", "Generar diagramas UML y documentos Word de forma reproducible.", "Revisar el resultado visualmente."),
        ("Navegador integrado y node:test", "Verificación", "Probar la interfaz y la API; 27 pruebas automáticas.", "Las pruebas solo cubren lo que alguien pensó probar."),
    ], [4.0, 3.2, 5.6, 4.0], fs=8.6)
    p(d, "Acciones sobre el equipo del desarrollador: el asistente instaló Node.js LTS con winget (previa autorización escrita de la persona), ejecutó npm install dentro de la carpeta del proyecto, descargó una sola vez calles de OpenStreetMap para la demostración y levantó un servidor local. No se enviaron datos personales a terceros.")

    h1(d, "3. Prompts relevantes")
    p(d, "Se resumen las instrucciones que más condicionaron el resultado, junto con el control humano aplicado a cada una.")
    tabla(d, ["#", "Instrucción (resumen fiel)", "Qué produjo la IA", "Control humano requerido"], [
        ("P1", "«Analiza todo lo que hicimos en Rescate de Alimentos… vamos a trabajar el nuevo proyecto igual, pero ¿podemos trabajar en JavaScript?»", "Resumen del proyecto previo (MVC, pruebas, docs, despliegue) y propuesta de repetir el flujo con stack JavaScript.", "La persona confirmó el cambio de stack; revisar que lo reutilizado cumpla este reto y no solo el anterior."),
        ("P2", "Enunciado completo del reto «Ruta segura para mujeres…»: reportes con JWT, lista por cercanía con filtro, API externa de mapas, MVC, PostgreSQL, nube, ODS, UX/seguridad/usabilidad, y documento de IA con human-in-the-loop.", "Arquitectura, requisitos, aplicación y documentos alineados a cada criterio.", "Verificar requisito por requisito contra el enunciado oficial (matriz de trazabilidad del ERS)."),
        ("P3", "«Otra interfaz… animaciones simples que marquen la diferencia… que no se vea como la mayoría… tonos morados/lila… cosas que marquen la diferencia.»", "Identidad «Noche Lila»: reloj nocturno, hilo de luz, luciérnagas, anillos de puntaje, constelación de insignias.", "Probar con usuarias reales que el diseño ayuda y no distrae; revisar accesibilidad y movimiento reducido."),
        ("P4", "«Navegación inteligente: algoritmo que priorice iluminación, cámaras y negocios abiertos sobre la ruta más corta; alertas si se aleja de la ruta.»", "Evaluador de seguridad por tramos, candidatas con atractores, monitor de desvío con 3 lecturas.", "Calibrar pesos con expertas y datos reales; validar umbrales de desvío en campo."),
        ("P5", "«Registro rápido de transporte: fotografiar o digitar la placa, almacenar temporalmente y vincular al viaje.»", "Placa cifrada AES-256-GCM, vencimiento, purga, borrado inmediato. Se usó PostgreSQL en vez de MySQL por exigencia del enunciado.", "Revisión de privacidad (Ley 1581) y confirmar la política de retención."),
        ("P6", "«Mapas de calor predictivos según la hora de la noche; calles en rojo dinámicas.»", "Modelo con kernel horario, vigencia y confirmaciones; capa de calor y calles.", "Revisión estadística y de sesgo; decidir si se publica una zona como «de riesgo»."),
        ("P7", "«Gamificación: insignias de confianza por verificar rutas, reportar luminarias, confirmar comercios.»", "Puntos, niveles, 7 insignias, antiabuso y tope diario.", "Vigilar incentivos perversos (reportes falsos por puntos)."),
        ("P8", "«No sigamos ninguna metodología; 5 etapas del ciclo de vida; 4 diagramas UML; ERS con todos los requerimientos.»", "ERS, documento de diagramas y estructura por etapas.", "Una persona debe leer el ERS completo y confirmar que refleja la intención."),
        ("P9", "«Te doy acceso total a mi computador.»", "El asistente actuó solo dentro de la carpeta del proyecto y pidió autorización para lo que salía de ahí (instalar Node).", "Mantener el principio de mínimo privilegio; revisar qué permisos se conceden."),
    ], [0.9, 5.7, 5.2, 5.0], fs=8.4)
    nota(d, "Prompts de auditoría recomendados (para que una persona interrogue al asistente y no solo confíe): «Explica línea por línea cómo se calcula el puntaje de una ruta», «¿Qué casos extremos rompen el monitor de desvío?», «Enumera los supuestos de privacidad que hiciste», «¿Qué parte de este código no probaste?», «Busca vulnerabilidades OWASP en src/».")

    h1(d, "4. Evaluación crítica")
    h2(d, "4.1 Qué aportó la IA")
    vinetas(d, ["Velocidad: arquitectura, API, interfaz, pruebas y documentos en una sola sesión de trabajo.",
                "Consistencia: la misma lógica de geometría se comparte entre servidor y navegador y está probada.",
                "Cobertura de buenas prácticas de seguridad (cabeceras, cifrado, validación, control de acceso por objeto) que suelen omitirse por falta de tiempo.",
                "Capacidad de detectar sus propios errores al probar en el navegador y en la consola."])
    h2(d, "4.2 Errores que la IA cometió y cómo se detectaron")
    p(d, "Esta tabla es evidencia de por qué la veeduría humana es necesaria: todos estos fallos salieron de la IA y fueron hallados al ejecutar y mirar, no al leer el código.")
    tabla(d, ["Error de la IA", "Cómo se detectó", "Corrección"], [
        ("Usó teselas de CARTO que ahora exigen llave de API; el mapa mostraba marcas de agua.", "Inspección visual en el navegador.", "Cambio a teselas de OpenStreetMap con filtro oscuro; nota de uso responsable."),
        ("La política CSP bloqueaba las teselas (comodín *. no cubre el dominio raíz) y Referrer-Policy: no-referrer hacía que OSM las rechazara.", "Consola del navegador (violaciones de CSP).", "Lista blanca exacta y política strict-origin-when-cross-origin."),
        ("Texto «null» visible en la interfaz (replaceChildren con valores nulos).", "Captura de pantalla.", "Filtrado de nodos vacíos."),
        ("Íconos SVG gigantes sin regla de tamaño.", "Captura de pantalla.", "Regla base de tamaño de ícono."),
        ("Afirmó en un comentario que el contraste cumplía AA sin haberlo medido; el botón principal (3,15:1) y el botón de peligro fallaban.", "Se pidió medirlo con un cálculo explícito.", "Colores corregidos; contrastes medidos y documentados."),
        ("Datos de demostración dispersos al azar que no coincidían con las calles reales: todas las rutas puntuaban 3–16/100.", "Prueba de la API con un trayecto real.", "Se descargaron calles reales de OSM una vez y los puntos simulados se colocan sobre ellas."),
        ("Intentó reiniciar el servidor matando todos los procesos node de la máquina.", "El control de permisos lo bloqueó.", "Se detuvo solo la tarea propia; ejemplo de un límite humano/sistémico que funcionó."),
        ("Una espera innecesaria de 1 s en el geocodificador sin conexión.", "Duración anómala en las pruebas.", "Salida anticipada cuando las APIs están deshabilitadas."),
    ], [6.6, 4.4, 5.8], fs=8.4)
    h2(d, "4.3 Limitaciones que la IA no puede resolver sola")
    vinetas(d, [
        ("Pesos heurísticos del algoritmo.", "Los valores (0,34 luz, 0,55 riesgo, +60 % de desvío, σ = 2,5 h…) son razonables pero no validados; una persona experta debe calibrarlos."),
        ("Mapa de calor no validado estadísticamente.", "Con pocos reportes puede inducir a error; puede estigmatizar barrios y reproducir el sesgo de quién reporta."),
        ("Datos simulados.", "Las luminarias, cámaras, comercios y los 560 reportes iniciales de la demostración son inventados; en una vitrina o piloto deben declararse (la app ya lo hace) y reemplazarse."),
        ("Accesibilidad no auditada con personas reales.", "Se aplicaron criterios WCAG 2.1 AA y se midió contraste, pero no se probó con lectores de pantalla ni con personas con discapacidad."),
        ("Seguridad sin prueba de penetración.", "Hay pruebas automáticas de controles clave, pero no una auditoría independiente."),
        ("Sin validación con mujeres usuarias.", "Todo el diseño parte de supuestos; el protocolo de usabilidad está escrito pero sin ejecutar."),
        ("Falsa sensación de seguridad.", "Una ruta «mejor puntuada» no es una ruta segura; el producto lo dice, pero una persona debe vigilar que la comunicación no prometa más de lo que entrega."),
    ])

    h1(d, "5. Justificación de la veeduría y vigilancia humana")
    h2(d, "5.1 Por qué no puede quedar todo en manos de la IA")
    vinetas(d, [
        ("Responsabilidad.", "Si una usuaria sigue una ruta y le ocurre algo, o si un reporte falso daña a una persona, la responsabilidad es de personas y organizaciones, no del modelo."),
        ("Contexto local.", "Solo quienes conocen Zipaquirá, Chía o Girardot saben qué parque es realmente peligroso o qué dato está desactualizado."),
        ("Riesgo de daño asimétrico.", "Un falso «seguro» puede costar más que un falso «inseguro»; esa ponderación es una decisión ética, no técnica."),
        ("Contenido sensible.", "Reportes de acoso pueden señalar a personas o estigmatizar barrios; ocultar o mantener un reporte es un juicio humano."),
        ("Errores plausibles.", "La IA genera código y texto convincentes que pueden contener fallos de seguridad o de lógica; sin revisión, esos fallos llegan a producción."),
    ])
    h2(d, "5.2 Dónde está el humano en el producto (controles incorporados)")
    tabla(d, ["Decisión", "Quién propone", "Quién decide", "Mecanismo y evidencia"], [
        ("Ocultar o restaurar un reporte", "El sistema (2 denuncias de usuarias distintas)", "Moderadora (persona)", "Cola /moderacion; justificación obligatoria; registro de auditoría. El algoritmo nunca oculta solo."),
        ("Elegir una ruta", "El algoritmo recomienda y explica", "La usuaria", "Tarjetas con desglose; ella puede elegir cualquier alternativa; aviso de que ninguna ruta garantiza seguridad."),
        ("Confiar en un reporte", "Comunidad (confirmaciones)", "Otras usuarias + moderación", "Las confirmaciones suben el peso; las denuncias lo apartan; sin confirmaciones pesa menos."),
        ("Compartir la placa del taxi", "La app ofrece el botón", "La usuaria", "Nada se envía solo; ella toca «Compartir»."),
        ("Conservar datos sensibles", "Regla de retención", "Persona responsable de datos", "Vencimiento automático + borrado inmediato por la usuaria; la persona responsable puede ajustar PLACA_TTL_HORAS."),
        ("Asignar el rol de moderadora", "—", "Administración", "Solo manual en base de datos; nunca desde el registro."),
        ("Publicar datos simulados o reales", "—", "Equipo del proyecto", "Etiqueta visible «Datos de demostración»; variable SEED_DEMO."),
    ], [3.6, 3.8, 3.2, 6.2], fs=8.4)
    h2(d, "5.3 Dónde está el humano en el desarrollo (veeduría del proceso)")
    p(d, "Antes de cada versión liberada, las personas indicadas revisan lo que la IA produjo. La columna «Evidencia» indica qué debe adjuntarse; «Responsable» y «Fecha» las completa el equipo.")
    h1(d, "6. Registro de revisión humana (por completar)")
    tabla(d, ["Qué se revisa", "Cómo", "Responsable", "Fecha", "Resultado", "Evidencia"], [
        ("Código del algoritmo de seguridad", "Lectura completa de seguridadRuta.js y riesgo.js; recalcular a mano 3 casos", "", "", "", "Notas de revisión"),
        ("Pesos y umbrales (0,34 / 0,55 / +60 % / 45 m / σ 2,5 h)", "Contrastar con una experta en seguridad urbana o género; ajustar", "", "", "", "Acta"),
        ("Seguridad (OWASP)", "npm audit, revisión de src/, prueba con OWASP ZAP", "", "", "", "Informe"),
        ("Cifrado y retención de placas", "Verificar en BD que no hay texto plano; probar purga", "", "", "", "Captura/consulta"),
        ("Privacidad y Ley 1581", "Política de tratamiento de datos, aviso y finalidades", "", "", "", "Documento"),
        ("Accesibilidad", "Lista WCAG 2.1 AA + prueba con lector de pantalla (NVDA/TalkBack)", "", "", "", "Lista marcada"),
        ("Usabilidad", "Ejecutar docs/PRUEBAS_USABILIDAD.md con ≥ 5 personas", "", "", "", "Resultados y SUS"),
        ("Datos de demostración vs. reales", "Confirmar etiquetado y plan de reemplazo", "", "", "", "Captura"),
        ("Moderación", "Simular 10 reportes abusivos y verificar el flujo y los tiempos de respuesta", "", "", "", "Registro de auditoría"),
        ("Contenido de los documentos", "Leer ERS y UML completos y confirmar que reflejan la intención", "", "", "", "Firma"),
    ], [3.5, 4.6, 2.2, 1.5, 1.8, 3.2], fs=8.2)

    h1(d, "7. Riesgos éticos específicos y controles")
    tabla(d, ["Riesgo", "Control en el diseño", "Vigilancia humana"], [
        ("Reportes falsos o difamatorios", "Sin datos personales ni enlaces; denuncias; moderación; autoras anónimas hacia afuera", "Moderadora revisa la cola a diario; revisar patrones de abuso"),
        ("Estigmatización de barrios", "Aviso de que es una estimación; sin etiquetas absolutas de «zona peligrosa»", "Revisar lenguaje y publicar la metodología; consultar a líderes comunitarias"),
        ("Exposición de la ubicación de las usuarias", "El GPS se procesa en el dispositivo; solo se envía lo que ella decide", "Auditar que ninguna versión nueva registre posiciones"),
        ("Uso indebido de la placa", "Cifrado, vencimiento corto, acceso solo de la dueña", "Revisar solicitudes de acceso; no entregar a terceros sin orden legal"),
        ("Falsa sensación de seguridad", "Textos de límites, desglose explicado, números de emergencia", "Revisar que marketing y vitrina no prometan seguridad"),
        ("Sesgo y cobertura desigual de los datos", "Fuentes mixtas; confirmaciones; degradación honesta", "Medir qué municipios tienen pocos datos y priorizar su levantamiento"),
        ("Incentivos perversos de la gamificación", "Tope diario de puntos, anti-duplicados, insignias por calidad no por volumen", "Revisar usuarias con picos anómalos de aportes"),
        ("Dependencia de servicios externos", "Caché, tiempos límite, respaldo local", "Monitorear disponibilidad y políticas de uso de OSM"),
        ("Código generado con vulnerabilidades", "Pruebas, cabeceras, revisión OWASP", "Revisión por pares y pruebas de penetración antes de producción"),
    ], [4.2, 6.4, 6.2], fs=8.4)

    h1(d, "8. Criterios para NO publicar")
    vinetas(d, ["No se ha completado el registro de revisión humana de la sección 6 en seguridad, privacidad y moderación.",
                "Los datos de demostración se presentan como si fueran reales.",
                "No hay al menos una persona designada que modere reportes y atienda denuncias en menos de 24 horas.",
                "El mapa de calor se publica sin su aviso de límites o con lenguaje que estigmatiza zonas.",
                "Las claves JWT_SECRET y DATA_KEY no se generaron de forma segura para producción."])

    h1(d, "9. Cómo verificar de forma independiente")
    tabla(d, ["Qué verificar", "Cómo"], [
        ("Pruebas automáticas", "npm test (27 pruebas: autenticación, reportes, moderación, rutas, calor, placa cifrada, gamificación, geometría y monitor de desvío)"),
        ("Cabeceras de seguridad", "Inspeccionar las respuestas de /api/salud (CSP, nosniff, sin x-powered-by)"),
        ("Cifrado de la placa", "Consultar placas_temporales: placa_cifrada no contiene el texto de la placa"),
        ("Decisiones de moderación", "GET /api/moderacion/auditoria con una cuenta de moderadora"),
        ("Contraste y movimiento", "Revisar docs/ARQUITECTURA.md y activar «reducir movimiento» en el sistema"),
        ("Qué datos son simulados", "Columna fuente = 'demo' en puntos_seguridad y reportes"),
    ], [4.6, 12.2])

    h1(d, "10. Compromisos")
    vinetas(d, ["Un humano nombrado es responsable del producto y de la decisión de publicar.",
                "La moderación es humana, auditable y con justificación.",
                "Se informa a las usuarias qué hace el sistema, qué no hace y qué datos usa.",
                "Se revisa este documento en cada versión y cuando cambie el modelo o los datos.",
                "Si la IA y una persona experta discrepan, prevalece la persona experta, con registro de la razón."])
    salida = RAIZ / "docs" / "IA_Responsable_HITL.docx"
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
