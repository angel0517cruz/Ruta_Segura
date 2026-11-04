"""ERS de Nova · Ruta Segura según el estándar IEEE 830 (mismo formato del ERS de referencia: actividades numeradas,
diccionario de datos en los CRUD y módulos con Cálculos / Validaciones / Gestión / Reportes / CRUDs relacionados)."""
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

RAIZ = Path(__file__).resolve().parents[2]
AUTORES = ["Miguel Angel Cruz Londoño", "Julian Alexander Gomez Galvis", "Jose Manuel Yara Cruz"]
FUENTE = "Times New Roman"


# ───────────────────────────── utilidades de formato ─────────────────────────────
def _fuente(run, tam=11, negrita=False, cursiva=False):
    run.font.name = FUENTE
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FUENTE)
    run.font.size = Pt(tam)
    run.bold, run.italic = negrita, cursiva


def sombrear(celda, hex_):
    pr = celda._tc.get_or_add_tcPr()
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hex_)
    pr.append(sh)


def parrafo(d, texto, tam=11, negrita=False, cursiva=False, centro=False, justificado=True, despues=6):
    p = d.add_paragraph()
    r = p.add_run(texto)
    _fuente(r, tam, negrita, cursiva)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if centro else (WD_ALIGN_PARAGRAPH.JUSTIFY if justificado else WD_ALIGN_PARAGRAPH.LEFT)
    p.paragraph_format.space_after = Pt(despues)
    return p


def titulo(d, texto, nivel=1):
    p = d.add_paragraph()
    r = p.add_run(texto)
    _fuente(r, 15 if nivel == 1 else 12.5, negrita=True)
    p.paragraph_format.space_before = Pt(14 if nivel == 1 else 10)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    return p


def celda(c, texto, negrita=False, tam=10, justificado=False, centro=False):
    c.text = ""
    p = c.paragraphs[0]
    r = p.add_run(str(texto))
    _fuente(r, tam, negrita)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.space_before = Pt(1)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY if justificado else (WD_ALIGN_PARAGRAPH.CENTER if centro else WD_ALIGN_PARAGRAPH.LEFT)


def tabla(d, filas, anchos, encabezado=False, justificar_ultima=False):
    t = d.add_table(rows=0, cols=len(anchos))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for n, fila in enumerate(filas):
        cs = t.add_row().cells
        for i, v in enumerate(fila):
            es_enc = encabezado and n == 0
            celda(cs[i], v, negrita=(i == 0 or es_enc), justificado=(justificar_ultima and i == len(fila) - 1 and not es_enc))
            if es_enc:
                sombrear(cs[i], "D9D9D9")
    for f in t.rows:
        for i, a in enumerate(anchos):
            f.cells[i].width = Cm(a)
    d.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def actividad(d, n, nombre, descripcion):
    parrafo(d, f"Actividad # {n}", 11, negrita=True, justificado=False, despues=2)
    t = d.add_table(rows=2, cols=2)
    t.style = "Table Grid"; t.autofit = False
    for i, h in enumerate(["Nombre de la actividad", "Descripción"]):
        celda(t.rows[0].cells[i], h, negrita=True); sombrear(t.rows[0].cells[i], "D9D9D9")
    celda(t.rows[1].cells[0], nombre, negrita=True)
    celda(t.rows[1].cells[1], descripcion, justificado=True)
    for f in t.rows:
        f.cells[0].width, f.cells[1].width = Cm(4.6), Cm(11.4)
    d.add_paragraph().paragraph_format.space_after = Pt(2)


def crud(d, n, codigo, nombre, descripcion, campos):
    t = d.add_table(rows=0, cols=5)
    t.style = "Table Grid"; t.autofit = False
    f = t.add_row().cells
    a = f[0].merge(f[1]); celda(a, f"Actividad # {n}", negrita=True); sombrear(a, "D9D9D9")
    b = f[2].merge(f[4]); celda(b, codigo, negrita=True)
    f = t.add_row().cells
    a = f[0].merge(f[1]); celda(a, "Nombre de la actividad", negrita=True); sombrear(a, "D9D9D9")
    b = f[2].merge(f[4]); celda(b, "Descripción", negrita=True); sombrear(b, "D9D9D9")
    f = t.add_row().cells
    a = f[0].merge(f[1]); celda(a, nombre, negrita=True)
    b = f[2].merge(f[4]); celda(b, descripcion, justificado=True)
    f = t.add_row().cells
    for i, h in enumerate(["Nombre largo", "Nemotécnico", "Tipo de dato", "Longitud", "Tipo de llave / Observación"]):
        celda(f[i], h, negrita=True); sombrear(f[i], "D9D9D9")
    for campo in campos:
        f = t.add_row().cells
        for i, v in enumerate(campo):
            celda(f[i], v)
    for fila in t.rows:
        for i, w in enumerate([3.8, 3.5, 2.9, 1.6, 4.2]):
            fila.cells[i].width = Cm(w)
    d.add_paragraph().paragraph_format.space_after = Pt(3)


def modulo(d, n, nombre, proposito, usuarios, calculos, validaciones, gestion, reportes, cruds):
    parrafo(d, f"Actividad # {n}", 11, negrita=True, justificado=False, despues=2)
    t = d.add_table(rows=0, cols=2)
    t.style = "Table Grid"; t.autofit = False
    f = t.add_row().cells
    for i, h in enumerate(["Nombre de la actividad", "Descripción"]):
        celda(f[i], h, negrita=True); sombrear(f[i], "D9D9D9")
    f = t.add_row().cells
    celda(f[0], nombre, negrita=True); celda(f[1], proposito, justificado=True)
    for etiqueta, texto in [("Usuario(s)", usuarios), ("Cálculos", calculos), ("Validaciones", validaciones), ("Gestión", gestion), ("Reportes y salidas", reportes), ("CRUDs relacionados", cruds)]:
        f = t.add_row().cells
        celda(f[0], etiqueta, negrita=True); celda(f[1], texto, justificado=True)
    for fila in t.rows:
        fila.cells[0].width, fila.cells[1].width = Cm(3.6), Cm(12.4)
    d.add_paragraph().paragraph_format.space_after = Pt(3)


def simple(d, n, nombre, descripcion):
    actividad(d, n, nombre, descripcion)


# ───────────────────────────── contenido ─────────────────────────────
DEFINICIONES = [
    ("SI", "Sistema de Información."), ("ERS", "Especificación de Requisitos de Software."), ("RF", "Requisito Funcional."),
    ("RNF", "Requisito No Funcional."), ("CRUD", "Create, Read, Update, Delete: operaciones básicas de persistencia sobre una entidad de datos."),
    ("UML", "Unified Modeling Language (Lenguaje Unificado de Modelado)."), ("JWT", "JSON Web Token: credencial firmada con vigencia limitada."),
    ("API", "Interfaz de programación de aplicaciones."), ("OSM", "OpenStreetMap: base de datos geográfica abierta y colaborativa."),
    ("Nominatim", "Servicio de OSM que convierte nombres de lugares en coordenadas (geocodificación)."),
    ("Overpass", "Servicio de OSM para consultar elementos del mapa (luminarias, cámaras, comercios, calles)."),
    ("OSRM", "Motor de rutas de OSM; se usa el perfil peatonal."),
    ("Haversine", "Fórmula que calcula la distancia sobre la superficie terrestre entre dos coordenadas."),
    ("WCAG", "Web Content Accessibility Guidelines (Pautas de Accesibilidad para el Contenido Web)."),
    ("OWASP", "Open Worldwide Application Security Project; su Top 10 lista los riesgos de seguridad web más críticos."),
    ("Punto de referencia", "Lugar nombrado por la usuaria (parque, colegio, calle, tienda) que ubica un reporte dentro de un municipio."),
    ("Puntaje de seguridad", "Valor de 0 a 100 que resume qué tan respaldada está una ruta por luminarias, cámaras, comercios abiertos y reportes, para una hora dada."),
    ("Desvío", "Alejamiento de más de 45 m de la ruta planificada durante 3 lecturas de GPS consecutivas."),
    ("Alias de autora", "Código anónimo y estable (p. ej. N-7F3A) que permite a moderación reconocer patrones sin conocer la identidad de una usuaria."),
]
REFERENCIAS = [
    ("1", "IEEE Std 830-1998, 2008, Especificación de Requisitos de Software. IEEE Computer Society."),
    ("2", "Enunciado del reto «Ruta segura para mujeres en el espacio público nocturno», contexto translocal de Cundinamarca, 2026."),
    ("3", "OWASP Foundation, 2021, OWASP Top 10 y Application Security Verification Standard."),
    ("4", "W3C, 2018, Web Content Accessibility Guidelines (WCAG) 2.1, nivel AA."),
    ("5", "Congreso de la República de Colombia, 2012, Ley 1581, protección de datos personales."),
    ("6", "OpenStreetMap Foundation, 2026, documentación de Nominatim, Overpass API y OSRM; licencia ODbL."),
]

USUARIOS = [
    ("Usuario no privilegiado", "Visitante", "Persona que aún no ha iniciado sesión. Solo puede ver la presentación de Nova, registrarse e iniciar sesión.", "No requerida", "No requerida", "No requerida"),
    ("Usuario autenticado", "Usuaria", "Mujer que usa Nova para reportar puntos de riesgo, consultar reportes y mapas de calor, planificar rutas seguras, caminar con alertas de desvío, registrar la placa de un taxi y aportar datos que le dan puntos e insignias de confianza.", "No requerida", "Uso básico de un teléfono móvil o un navegador web.", "No requerida"),
    ("Usuario privilegiado", "Moderadora", "Persona del equipo responsable de la calidad de la información. Revisa todos los reportes (no solo los denunciados), los oculta o los marca como atendidos, limita temporalmente la publicación de una autora identificada solo por su alias, cura los puntos de seguridad (luminarias, cámaras, comercios), marca luminarias reparadas y consulta métricas anónimas y el registro de auditoría. No ve nombres ni correos de las usuarias y no puede eliminar cuentas.", "Técnico, tecnólogo o profesional en áreas sociales, de género, comunicación o seguridad ciudadana.", "Experiencia en atención a comunidades, mediación o gestión de contenido.", "Manejo básico de aplicativos web y lectura de indicadores sencillos."),
]

CAMPOS = {
    "usuaria": [
        ("Identificador único de la usuaria", "id", "INT", "5", "PK"),
        ("Nombre o apodo", "nombre", "VARCHAR", "60", "No tiene que ser el nombre real"),
        ("Correo electrónico de acceso", "email", "VARCHAR", "120", "Único"),
        ("Contraseña cifrada", "password_hash", "VARCHAR", "100", "Hash bcrypt; nunca texto plano"),
        ("Rol asignado", "rol", "VARCHAR", "12", "USUARIA, MODERADORA"),
        ("Municipio de la usuaria", "municipio_id", "INT", "5", "FK – CRUD-MUNICIPIO"),
        ("Puntos acumulados", "puntos", "INT", "5", "Gamificación"),
        ("Intentos fallidos de ingreso", "intentos_fallidos", "INT", "1", "Se reinicia al ingresar o al bloquear"),
        ("Bloqueo por intentos fallidos", "bloqueada_hasta", "TIMESTAMP", "—", "Vacío si no está bloqueada (15 min)"),
        ("Publicación limitada por moderación", "limitada_hasta", "TIMESTAMP", "—", "Vacío si no hay limitación; vence sola"),
        ("Fecha de registro", "creada_en", "TIMESTAMP", "—", "—"),
    ],
    "municipio": [
        ("Identificador único del municipio", "id", "INT", "5", "PK"),
        ("Nombre del municipio", "nombre", "VARCHAR", "40", "Único: Zipaquirá, Chía, Cajicá, Fusagasugá, Girardot, Ubaté, Facatativá, Soacha"),
        ("Latitud del centro", "lat", "DOUBLE", "—", "Tabla de referencia precargada"),
        ("Longitud del centro", "lng", "DOUBLE", "—", "Tabla de referencia precargada"),
    ],
    "reporte": [
        ("Identificador único del reporte", "id", "INT", "5", "PK"),
        ("Autora del reporte", "usuaria_id", "INT", "5", "FK – CRUD-USUARIA (nunca se muestra)"),
        ("Municipio del reporte", "municipio_id", "INT", "5", "FK – CRUD-MUNICIPIO"),
        ("Punto de referencia", "referencia", "VARCHAR", "120", "Lugar verificado en el municipio"),
        ("Categoría de riesgo", "categoria", "VARCHAR", "20", "ACOSO, ILUMINACION, DESOLADO, LUMINARIA_DANADA"),
        ("Descripción opcional", "descripcion", "VARCHAR", "280", "Sin teléfonos, correos ni enlaces"),
        ("Latitud verificada", "lat", "DOUBLE", "—", "—"),
        ("Longitud verificada", "lng", "DOUBLE", "—", "—"),
        ("Precisión de la ubicación", "precision_ubicacion", "VARCHAR", "10", "EXACTA, APROXIMADA"),
        ("Hora del suceso", "hora", "INT", "2", "0 a 23, hora de Colombia"),
        ("Estado del reporte", "estado", "VARCHAR", "12", "ACTIVO, EN_REVISION, OCULTO, RESUELTO"),
        ("Confirmaciones de la comunidad", "confirmaciones", "INT", "3", "Aumentan su peso en el algoritmo"),
        ("Denuncias recibidas", "denuncias", "INT", "3", "Con 2 pasa a EN_REVISION"),
        ("Origen del dato", "fuente", "VARCHAR", "10", "usuaria"),
        ("Fecha de creación", "creado_en", "TIMESTAMP", "—", "—"),
    ],
    "denuncia": [
        ("Reporte denunciado", "reporte_id", "INT", "5", "PK compuesta · FK – CRUD-REPORTE"),
        ("Usuaria que denuncia", "usuaria_id", "INT", "5", "PK compuesta · FK – CRUD-USUARIA"),
        ("Motivo de la denuncia", "motivo", "VARCHAR", "200", "Opcional"),
        ("Fecha de la denuncia", "creada_en", "TIMESTAMP", "—", "—"),
    ],
    "verificacion": [
        ("Identificador único de la verificación", "id", "INT", "5", "PK"),
        ("Usuaria que aporta", "usuaria_id", "INT", "5", "FK – CRUD-USUARIA"),
        ("Tipo de aporte", "tipo", "VARCHAR", "20", "RUTA_OK, LUMINARIA_DANADA, COMERCIO_ABIERTO, REPORTE_CONFIRMADO"),
        ("Latitud del aporte", "lat", "DOUBLE", "—", "—"),
        ("Longitud del aporte", "lng", "DOUBLE", "—", "—"),
        ("Reporte confirmado", "reporte_id", "INT", "5", "FK – CRUD-REPORTE (solo REPORTE_CONFIRMADO)"),
        ("Puntos otorgados", "puntos", "INT", "3", "4 a 12 según el tipo"),
        ("Indicador de resuelta", "resuelta", "INT", "1", "0 vigente, 1 reparada (luminarias)"),
        ("Fecha del aporte", "creada_en", "TIMESTAMP", "—", "Define su vigencia"),
    ],
    "punto": [
        ("Identificador único del punto", "id", "INT", "5", "PK"),
        ("Tipo de punto", "tipo", "VARCHAR", "10", "LUMINARIA, CAMARA, COMERCIO"),
        ("Nombre del punto", "nombre", "VARCHAR", "60", "Opcional"),
        ("Municipio del punto", "municipio_id", "INT", "5", "FK – CRUD-MUNICIPIO"),
        ("Latitud", "lat", "DOUBLE", "—", "—"),
        ("Longitud", "lng", "DOUBLE", "—", "—"),
        ("Hora de apertura", "abre", "INT", "2", "0 a 23; solo comercios"),
        ("Hora de cierre", "cierra", "INT", "2", "1 a 24; puede ser menor que la apertura si cruza la medianoche"),
        ("Origen del dato", "fuente", "VARCHAR", "10", "osm, moderacion"),
        ("Indicador de activo", "activo", "INT", "1", "1 activo, 0 desactivado por moderación"),
        ("Moderadora que lo creó", "creado_por", "INT", "5", "FK – CRUD-USUARIA"),
    ],
    "viaje": [
        ("Identificador único del viaje", "id", "INT", "5", "PK"),
        ("Usuaria que camina", "usuaria_id", "INT", "5", "FK – CRUD-USUARIA"),
        ("Municipio del viaje", "municipio_id", "INT", "5", "FK – CRUD-MUNICIPIO"),
        ("Descripción del origen", "origen_texto", "VARCHAR", "120", "—"),
        ("Descripción del destino", "destino_texto", "VARCHAR", "120", "—"),
        ("Ruta elegida", "ruta_json", "TEXT", "—", "Lista de coordenadas"),
        ("Puntaje de seguridad de la ruta", "puntaje", "INT", "3", "0 a 100"),
        ("Estado del viaje", "estado", "VARCHAR", "10", "EN_CURSO, FINALIZADO, CANCELADO"),
        ("Cantidad de desvíos", "desvios", "INT", "3", "Alertas emitidas"),
        ("Inicio del viaje", "iniciado_en", "TIMESTAMP", "—", "—"),
        ("Fin del viaje", "finalizado_en", "TIMESTAMP", "—", "Vacío mientras está en curso"),
    ],
    "placa": [
        ("Identificador único del registro", "id", "INT", "5", "PK"),
        ("Viaje al que se vincula", "viaje_id", "INT", "5", "FK – CRUD-VIAJE (único)"),
        ("Placa cifrada", "placa_cifrada", "VARCHAR", "120", "AES-256-GCM; formato original ABC123 o ABC12D"),
        ("Foto cifrada", "foto_cifrada", "TEXT", "—", "Opcional; JPEG reducido en el dispositivo"),
        ("Fecha de registro", "creada_en", "TIMESTAMP", "—", "—"),
        ("Fecha de vencimiento", "expira_en", "TIMESTAMP", "—", "12 h como máximo; 2 h después de terminar el viaje"),
    ],
    "insignia": [
        ("Usuaria que la obtiene", "usuaria_id", "INT", "5", "PK compuesta · FK – CRUD-USUARIA"),
        ("Código de la insignia", "codigo", "VARCHAR", "20", "PK compuesta · LUCIERNAGA, FARO, GUARDIANA_RUTA, VIGIA_COMERCIO, VOZ_BARRIO, CORO, CONSTELACION"),
        ("Fecha en que se otorgó", "otorgada_en", "TIMESTAMP", "—", "—"),
    ],
    "auditoria": [
        ("Identificador único del evento", "id", "INT", "5", "PK"),
        ("Persona que actúa", "actor_id", "INT", "5", "FK – CRUD-USUARIA; vacío si actúa el sistema"),
        ("Acción realizada", "accion", "VARCHAR", "40", "REPORTE_OCULTADO, AUTORA_LIMITADA, LUMINARIA_REPARADA, etc."),
        ("Detalle y justificación", "detalle", "VARCHAR", "300", "Incluye el alias de la autora, nunca su identidad"),
        ("Fecha del evento", "creada_en", "TIMESTAMP", "—", "—"),
    ],
}


def generar():
    d = Document()
    s = d.sections[0]
    s.page_width, s.page_height = Cm(21.59), Cm(27.94)
    s.left_margin = s.right_margin = Cm(2.5)
    s.top_margin = s.bottom_margin = Cm(2.3)
    st = d.styles["Normal"]; st.font.name = FUENTE; st.font.size = Pt(11)

    # ── Portada
    for _ in range(5): parrafo(d, "", despues=14)
    parrafo(d, "Nova · Ruta Segura", 18, negrita=True, centro=True, despues=4)
    parrafo(d, "Aplicación web colaborativa de rutas seguras para mujeres en el espacio público nocturno de Cundinamarca", 12.5, negrita=True, centro=True, despues=14)
    parrafo(d, "Especificación de Requisitos según el estándar de IEEE 830", 11.5, centro=True, despues=60)
    for a in AUTORES: parrafo(d, a, 11.5, centro=True, despues=4)
    for _ in range(3): parrafo(d, "", despues=14)
    parrafo(d, "Maratón de programación · Reto translocal Cundinamarca", 11, centro=True, despues=2)
    parrafo(d, "Sistemas de Información", 11, centro=True, despues=2)
    parrafo(d, "4 de noviembre de 2026", 11, centro=True)
    d.add_page_break()

    # ── 1. Introducción
    titulo(d, "1. Introducción")
    parrafo(d, "Por medio del presente documento se presenta la Especificación de Requisitos de Software (ERS), basada en el estándar IEEE 830, para Nova · Ruta Segura, una aplicación web colaborativa orientada a que las mujeres planeen y recorran trayectos nocturnos con más información en los municipios de Cundinamarca.")
    titulo(d, "1.1. Propósito", 2)
    parrafo(d, "Este informe expone de forma descriptiva y clara las propiedades que tendrá el sistema Nova, sus requerimientos funcionales y no funcionales, las limitaciones y las funciones que poseerá. Está dirigido al equipo desarrollador, a las personas que evalúan el reto y a quienes operarán la moderación de la plataforma.")
    parrafo(d, "Objetivo general", negrita=True, justificado=False, despues=3)
    parrafo(d, "Desarrollar una aplicación web que permita a usuarias autenticadas reportar y consultar puntos de riesgo en el espacio público nocturno y desplazarse por rutas que priorizan la seguridad sobre la distancia, con apoyo de la comunidad y supervisión humana.")
    parrafo(d, "Objetivos específicos", negrita=True, justificado=False, despues=3)
    for t in ["1. Analizar e identificar los requerimientos, el contexto translocal y los Objetivos de Desarrollo Sostenible (5, 11 y 16) a los que responde el reto.",
              "2. Diseñar la arquitectura MVC, la base de datos y los modelos UML (casos de uso, clases, secuencia y actividades) del sistema.",
              "3. Desarrollar la aplicación: reportes con ubicación verificada, rutas seguras con alertas de desvío, registro temporal de transporte, mapas de calor por hora, participación comunitaria y moderación.",
              "4. Realizar pruebas funcionales, de seguridad, de accesibilidad y de usabilidad, y desplegar el sistema en la nube con capa gratuita."]:
        parrafo(d, t)
    titulo(d, "1.2. Ámbito del Sistema", 2)
    parrafo(d, "El sistema se identificará con el nombre «Nova». El nombre proviene del latín nova, «nueva», y de la astronomía, donde una nova es una estrella que de pronto brilla con fuerza en un lugar donde antes no se veía luz; también se lee como «no va sola»: ninguna mujer debería caminar de noche sin información ni respaldo. Su lema es «Ninguna camina sola».")
    parrafo(d, "Nova será una aplicación web desarrollada en JavaScript (Node.js y Express para el servidor, JavaScript sin dependencias de interfaz en el navegador), con base de datos PostgreSQL y autenticación mediante JWT. Por medio de ella, las usuarias podrán reportar puntos de riesgo (acoso, iluminación deficiente, zonas desoladas) con un punto de referencia cuyo lugar el sistema verifica; consultar los reportes ordenados por cercanía y filtrados por tipo, sobre una lista y un mapa; ver mapas de calor predictivos según la hora de la noche; planificar rutas que priorizan la iluminación pública, las cámaras de seguridad y los comercios abiertos; recibir alertas si se desvían de la ruta; registrar de forma temporal y cifrada la placa de un taxi; y obtener insignias de confianza por mantener actualizados los datos. Una moderadora, que es una persona, revisa el contenido, cura los datos de seguridad y consulta métricas anónimas.")
    parrafo(d, "Quedan fuera del alcance, por definición del reto: el seguimiento en tiempo real por parte de terceros, el botón de pánico y la conexión con autoridades. Tampoco hace parte del sistema la prestación de servicios de emergencia (línea 123, línea 155 de orientación a mujeres), la reparación física de las luminarias, que corresponde a las autoridades locales, ni la eliminación de cuentas por parte de la moderación.")
    titulo(d, "1.3. Definiciones, acrónimos y abreviaturas", 2)
    tabla(d, DEFINICIONES, [3.6, 12.4])
    titulo(d, "1.4. Referencias", 2)
    tabla(d, [("N°", "Referencia")] + REFERENCIAS, [1.2, 14.8], encabezado=True)
    titulo(d, "1.5. Visión general del documento", 2)
    parrafo(d, "El documento se organiza así: la sección 2 describe el producto, sus funciones, los tipos de usuario, las restricciones, las suposiciones y los requisitos futuros; la sección 3 presenta los requisitos específicos como actividades numeradas (31 en total) siguiendo un orden procesal: primero el acceso al sistema (RF01 y RF02), luego los CRUD de las entidades de datos (RF03 a RF12), después los módulos funcionales construidos sobre ellas (RF13 a RF22) y, finalmente, los requisitos no funcionales (RNF01 a RNF09); la sección 4 reúne los apéndices.")

    # ── 2. Descripción general
    titulo(d, "2. Descripción general")
    parrafo(d, "Nova nace como una solución tecnológica colaborativa para un problema señalado por la ciudadanía en varios municipios de Cundinamarca: la percepción de inseguridad en parques, vías y entornos universitarios, que impone barreras adicionales de movilidad a las mujeres. La información que ayuda a decidir por dónde caminar (qué calle tiene luz, dónde hay comercios abiertos, qué zonas han sido señaladas) existe de forma dispersa; Nova la reúne, la actualiza con ayuda de la comunidad y la entrega justo cuando se decide el trayecto, con supervisión humana de los contenidos sensibles.")
    titulo(d, "2.1. Perspectiva del producto", 2)
    parrafo(d, "Nova es un sistema independiente de tres capas: una aplicación de una sola página (vista) que se ejecuta en el navegador, un servidor MVC que expone una API REST con autenticación JWT (controladores, servicios y modelos) y una base de datos relacional PostgreSQL. El sistema se apoya en servicios abiertos de OpenStreetMap: Nominatim para verificar y ubicar lugares, Overpass para obtener luminarias, cámaras, comercios y calles, OSRM para trazar rutas peatonales y las teselas para el mapa. Cada servicio externo tiene tiempo límite, caché y respaldo, de modo que Nova sigue funcionando con su base propia cuando alguno falla. La lógica de geometría (distancias y detección de desvío) se comparte entre servidor y navegador.")
    titulo(d, "2.2. Funciones del producto", 2)
    for t in ["Registro, inicio de sesión con JWT y control de acceso por roles (Visitante, Usuaria, Moderadora).",
              "Reportes de riesgo con punto de referencia verificado, consulta por cercanía, filtro por tipo, confirmación y denuncia.",
              "Navegación inteligente: rutas peatonales puntuadas por seguridad, recomendación explicada y alertas de desvío.",
              "Registro rápido y temporal de la placa de un taxi, cifrado y vinculado al viaje.",
              "Mapa de calor predictivo por hora de la noche y riesgo por calle.",
              "Participación comunitaria: verificaciones, puntos, niveles e insignias de confianza.",
              "Moderación humana: revisión de todos los reportes, sanciones proporcionales y reversibles, curaduría de datos de seguridad, métricas anónimas y auditoría."]:
        parrafo(d, "• " + t, despues=3)
    titulo(d, "2.3. Características del usuario", 2)
    for tipo, nombre, desc, edu, exp, tec in USUARIOS:
        tabla(d, [("Tipo de usuario", tipo), ("Nombre de usuario", nombre), ("Descripción", desc), ("Nivel de educación requerida", edu), ("Experiencia requerida", exp), ("Experiencia técnica requerida", tec)], [4.0, 12.0], justificar_ultima=True)
    titulo(d, "2.4. Restricciones", 2)
    for t in ["El reto excluye el seguimiento en tiempo real por terceros y el botón de pánico; la posición GPS de una caminata se procesa solo en el dispositivo de la usuaria.",
              "La base de datos debe ser PostgreSQL (o equivalente) y el despliegue debe realizarse en la nube con capa gratuita.",
              "Las políticas de uso de Nominatim (1 consulta por segundo, identificación de la aplicación) y de las teselas de OpenStreetMap obligan a usar caché y a limitar las consultas.",
              "La moderación no puede conocer la identidad de las autoras ni eliminar cuentas; su sanción más fuerte es la limitación temporal de la publicación.",
              "Los datos personales deben tratarse conforme a la Ley 1581 de 2012: finalidad declarada, minimización y retención limitada."]:
        parrafo(d, "• " + t, despues=3)
    titulo(d, "2.5. Suposiciones y dependencias", 2)
    for t in ["Se supone que las usuarias cuentan con un teléfono o computador con navegador moderno y, para las alertas de desvío, con GPS.",
              "Se depende de la disponibilidad y los datos de OpenStreetMap; su cobertura de luminarias, cámaras y horarios es parcial en municipios pequeños y se complementa con aportes de la comunidad y la curaduría de moderación.",
              "Se supone que al menos una persona designada modera los reportes y atiende las denuncias en menos de 24 horas.",
              "Se supone que las autoridades locales atienden los reportes de luminarias dañadas; Nova solo registra y comunica el estado."]:
        parrafo(d, "• " + t, despues=3)
    titulo(d, "2.6. Requisitos futuros", 2)
    for t in ["Ingreso con proveedores de identidad (OAuth), verificación de correo y renovación de sesión con refresh tokens.",
              "Aplicación móvil instalable con notificaciones.",
              "Integración con los sistemas de alumbrado público de los municipios para sincronizar luminarias reparadas.",
              "Lectura automática de la placa en el dispositivo (OCR local) sin enviar imágenes a terceros.",
              "Rol de administración de plataforma separado de la moderación, con doble aprobación para acciones sobre cuentas.",
              "Calibración de los pesos del algoritmo con datos reales y con expertas en seguridad urbana y género."]:
        parrafo(d, "• " + t, despues=3)

    # ── 3. Requisitos específicos
    d.add_page_break()
    titulo(d, "3. Requisitos Específicos")
    titulo(d, "3.1. Interfaces Externas", 2)
    tabla(d, [
        ("Interfaz de usuario", "Aplicación web responsiva (desde 320 px) con navegación inferior (Mapa, Ruta, Reportar, Reportes, Yo y, para la moderadora, Moderar), tema violeta y crema, accesible por teclado y lector de pantalla."),
        ("Interfaz de hardware", "Geolocalización (GPS) y cámara del dispositivo, usadas solo con permiso explícito de la usuaria."),
        ("Interfaz de software", "Nominatim (geocodificación y verificación de lugares), Overpass API (luminarias, cámaras, comercios, calles), OSRM peatonal (rutas) y teselas de OpenStreetMap. PostgreSQL como base de datos."),
        ("Interfaz de comunicaciones", "HTTPS con HSTS en producción; API REST en JSON; credencial JWT en la cabecera Authorization."),
    ], [4.2, 11.8], justificar_ultima=True)
    titulo(d, "3.2. Funciones", 2)
    parrafo(d, "Los requisitos funcionales y no funcionales se presentan a continuación como actividades numeradas de forma consecutiva, siguiendo un orden procesal y lógico: primero los requisitos base de acceso al sistema (RF01 y RF02), luego los CRUD de las entidades de datos, después los módulos funcionales construidos sobre dichas entidades —dentro de los cuales se describen sus usuarios, cálculos, validaciones, gestión, reportes y salidas, y los CRUD que utilizan— y, finalmente, los requisitos no funcionales.")
    parrafo(d, "Cantidad de actividades: #31", negrita=True, justificado=False)

    n = 0
    def sig():
        nonlocal n
        n += 1
        return n

    simple_n = sig()
    actividad(d, simple_n, "RF01 – Registro de Usuarias", "El sistema permitirá a una visitante crear una cuenta con su nombre o apodo, correo electrónico, contraseña y municipio. La contraseña deberá tener mínimo 8 caracteres con letras y números y se almacenará cifrada. Toda cuenta nueva se crea con el rol USUARIA: el rol MODERADORA solo puede asignarse manualmente en la base de datos por quien administra el despliegue, de modo que ninguna persona pueda otorgárselo a sí misma. Regla de negocio: el correo es único; si ya existe, el sistema invita a iniciar sesión. Este requerimiento es la base de todo el sistema, ya que ninguna usuaria puede operar la plataforma sin una cuenta.")
    actividad(d, sig(), "RF02 – Inicio de Sesión", "El sistema permitirá que las usuarias registradas ingresen mediante su correo electrónico y contraseña. Si las credenciales son correctas, entregará un token JWT firmado con vigencia de 2 horas, que acompañará cada petición; sin token válido, o con un token vencido, el sistema responderá que la sesión no es válida y la interfaz llevará a la pantalla de ingreso con un aviso claro. Tras 5 contraseñas incorrectas seguidas, la cuenta se bloqueará 15 minutos de forma automática y el bloqueo se levantará solo al vencer ese plazo. Por seguridad, el mensaje de error es el mismo para un correo inexistente, una contraseña errónea o una cuenta bloqueada, y el tiempo de respuesta se iguala para no revelar qué cuentas existen. El rol se consulta en el servidor en cada petición; cambiarlo en el navegador no concede ningún permiso.")

    crud(d, sig(), "RF03", "CRUD-USUARIA", "El sistema es el encargado de la información de las cuentas. La usuaria crea y consulta su cuenta; la moderadora no puede ver el nombre ni el correo de ninguna usuaria, ni eliminar cuentas, y solo puede limitar de forma temporal y reversible la publicación de reportes de una autora a través de su alias. La eliminación de una cuenta solo la realiza la propia usuaria o quien administra el despliegue, con registro de auditoría.", CAMPOS["usuaria"])
    crud(d, sig(), "RF04", "CRUD-MUNICIPIO", "El sistema mantiene la tabla de referencia precargada de municipios cubiertos, que se usa para ubicar reportes, ordenarlos por cercanía y delimitar la búsqueda de lugares. Se actualiza solo por quien administra el despliegue.", CAMPOS["municipio"])
    crud(d, sig(), "RF05", "CRUD-REPORTE", "La usuaria es la encargada de la información de los reportes de riesgo que publica; la moderadora gestiona su estado. Un reporte nunca expone a su autora: las respuestas públicas no incluyen su identificación.", CAMPOS["reporte"])
    crud(d, sig(), "RF06", "CRUD-DENUNCIA", "La usuaria registra la denuncia de un reporte ajeno que considera falso o que contiene datos personales. Solo se admite una denuncia por usuaria y reporte.", CAMPOS["denuncia"])
    crud(d, sig(), "RF07", "CRUD-VERIFICACIÓN", "La usuaria registra aportes comunitarios (ruta segura, luminaria dañada, comercio abierto, confirmación de un reporte); la moderadora marca como resueltas las luminarias reparadas.", CAMPOS["verificacion"])
    crud(d, sig(), "RF08", "CRUD-PUNTO DE SEGURIDAD", "El sistema y la moderadora son los encargados de la información de las luminarias, cámaras y comercios que usa el algoritmo de rutas; la moderadora puede crear puntos y desactivarlos con justificación.", CAMPOS["punto"])
    crud(d, sig(), "RF09", "CRUD-VIAJE", "La usuaria es la encargada de la información de sus caminatas, creadas al elegir una ruta. Solo la dueña del viaje puede consultarlo o modificarlo.", CAMPOS["viaje"])
    crud(d, sig(), "RF10", "CRUD-PLACA TEMPORAL", "La usuaria registra la placa del taxi (digitada o con foto) vinculada a su viaje en curso. El dato se guarda cifrado, vence automáticamente y puede borrarse en cualquier momento por la propia usuaria. El campo placa_cifrada admite 120 caracteres porque contiene el vector de inicialización, la etiqueta de autenticación y el texto cifrado codificados en base64.", CAMPOS["placa"])
    crud(d, sig(), "RF11", "CRUD-INSIGNIA", "El sistema otorga de forma automática las insignias de confianza cuando la usuaria cumple su meta; la usuaria las consulta en su perfil.", CAMPOS["insignia"])
    crud(d, sig(), "RF12", "CRUD-AUDITORÍA", "El sistema registra cada decisión de moderación y cada envío de un reporte a revisión, con su justificación. Los registros no se editan ni se eliminan; solo la moderadora los consulta.", CAMPOS["auditoria"])

    modulo(d, sig(), "RF13 – Módulo de Reportes de Riesgo", "Permite a la usuaria publicar y gestionar reportes de riesgo en el espacio público nocturno y a la comunidad confirmarlos o denunciarlos.",
           "Usuaria, Moderadora",
           "Asigna la hora del suceso con la hora actual de Colombia (UTC−5) si la usuaria no la indica. Suma el peso de un reporte con su categoría, la cercanía de la hora consultada, su antigüedad y sus confirmaciones. Cuenta las denuncias por reporte y los reportes publicados en la última hora.",
           "Valida municipio, punto de referencia (3 a 120 caracteres), categoría (ACOSO, ILUMINACION, DESOLADO) y descripción de hasta 280 caracteres sin teléfonos, correos, enlaces ni los caracteres < y >. Limita a 10 reportes por hora por usuaria. Impide confirmar o denunciar el propio reporte, confirmar dos veces el mismo y denunciar dos veces. Si la publicación de la autora está limitada por moderación, rechaza el reporte con un mensaje claro. Con 2 denuncias de usuarias distintas, cambia automáticamente el estado a EN_REVISION y lo retira de las listas, el mapa de calor y las rutas, sin intervención manual.",
           "Gestiona la publicación, la eliminación por parte de la autora, las confirmaciones (que aumentan el peso del reporte), las denuncias y los estados ACTIVO, EN_REVISION, OCULTO y RESUELTO. Otorga puntos por publicar y por confirmar.",
           "Respuesta con el reporte creado, los puntos ganados y las insignias nuevas. Las respuestas públicas nunca incluyen la identidad de la autora.",
           "CRUD-USUARIA, CRUD-MUNICIPIO, CRUD-REPORTE, CRUD-DENUNCIA, CRUD-VERIFICACIÓN, CRUD-AUDITORÍA")

    modulo(d, sig(), "RF14 – Módulo de Verificación de Ubicación", "Garantiza que cada reporte apunte a un lugar que existe, tanto en el punto de referencia como en el punto marcado, y guía a la usuaria hasta él en el mapa.",
           "Usuaria",
           "Calcula con la fórmula de Haversine la distancia entre el punto marcado y los lugares encontrados por el servicio de geocodificación, y entre el punto y el centro del municipio.",
           "Exige que el punto de referencia se encuentre, mediante Nominatim, dentro del municipio elegido (búsqueda limitada a un cuadro de unos 9 km alrededor del centro). Si no se encuentra ningún lugar, rechaza el reporte indicando que revise el nombre. Si la usuaria marcó un punto, exige que esté a no más de 600 m de alguno de los lugares encontrados y a no más de 15 km del centro del municipio. Si el servicio de lugares no responde, no publica el reporte (no se acepta un lugar sin verificar) y pide intentarlo de nuevo. Respeta el límite de una consulta por segundo con una cola de peticiones y una caché de 6 horas.",
           "Al elegir el municipio, el mapa se desplaza solo hasta él; al escribir el punto de referencia, el sistema propone los lugares encontrados; al elegir uno, el mapa se acerca y marca el lugar verificado. La usuaria puede afinar el punto en el mapa o con su GPS dentro del radio permitido.",
           "Lista de lugares verificados, marcador en el mapa y mensajes de error asociados al campo cuando el lugar no existe, el punto no coincide o el servicio no está disponible.",
           "CRUD-MUNICIPIO, CRUD-REPORTE")

    modulo(d, sig(), "RF15 – Módulo de Consulta de Reportes", "Presenta los reportes activos en una lista y en un mapa, ordenados por cercanía y filtrables por tipo de riesgo.",
           "Usuaria, Moderadora",
           "Calcula la distancia de cada reporte a la ubicación de la usuaria o, si no la comparte, al centro del municipio. Ordena de menor a mayor distancia; sin ubicación, del más reciente al más antiguo.",
           "Solo muestra reportes ACTIVO. Valida el municipio, la categoría y el límite de resultados (1 a 200). Marca los reportes propios sin revelar autoras ajenas.",
           "Gestiona los filtros por categoría, la ordenación por cercanía, la vista de mapa con marcadores accesibles por teclado y el equivalente en lista, así como las acciones de confirmar, denunciar y eliminar el reporte propio.",
           "Lista con distancia, hora, antigüedad, confirmaciones y precisión de la ubicación; marcadores en el mapa.",
           "CRUD-REPORTE, CRUD-MUNICIPIO, CRUD-VERIFICACIÓN, CRUD-DENUNCIA")

    modulo(d, sig(), "RF16 – Módulo de Navegación Segura", "Compara rutas peatonales entre un origen y un destino y recomienda la que mejor combina seguridad y distancia, explicando la decisión.",
           "Usuaria",
           "Muestrea cada ruta cada 25 m y mide: luminarias a 45 m o menos (las dañadas restan), cámaras a 70 m, comercios abiertos a la hora elegida a 90 m, rutas verificadas por la comunidad a 60 m y riesgo reportado a 110 m, ponderado por cercanía de la hora (σ de 2,5 h), antigüedad (vida media de 120 días) y confirmaciones. El puntaje de 0 a 100 es 70 % del promedio y 30 % del promedio del 20 % de tramos más débiles. La utilidad de cada ruta es su puntaje menos 45 puntos por cada 100 % de distancia extra.",
           "Valida origen y destino dentro de los municipios cubiertos, una distancia mínima de 60 m y máxima de 8 km y una hora de 0 a 23. Descarta rutas con más de 60 % de distancia adicional respecto a la más corta. Si el servicio de rutas no responde, entrega trayectos estimados en línea recta y lo advierte a la usuaria.",
           "Genera la ruta directa y variantes que pasan por «atractores de seguridad» (zonas con mayor densidad de luminarias, cámaras y comercios abiertos), las puntúa, etiqueta la más segura y la más corta y señala el tramo más débil. Combina datos propios, aportes de la comunidad y datos de OpenStreetMap.",
           "Tarjetas con puntaje, desglose por factor, distancia, tiempo y una explicación en lenguaje claro (metros extra y mejora obtenida); ruta dibujada por tramos, con color y patrón de línea.",
           "CRUD-PUNTO DE SEGURIDAD, CRUD-REPORTE, CRUD-VERIFICACIÓN, CRUD-MUNICIPIO")

    modulo(d, sig(), "RF17 – Módulo de Caminata y Alertas de Desvío", "Acompaña a la usuaria durante la caminata, vigila que siga la ruta planificada y la alerta si se aleja.",
           "Usuaria",
           "Calcula en el dispositivo la distancia de la posición a la ruta, el avance en metros, el porcentaje recorrido y la distancia restante. Considera desvío un alejamiento mayor de 45 m en 3 lecturas consecutivas y recuperación a 25 m o menos; detecta la llegada a menos de 20 m del destino.",
           "Exige una ruta elegida para iniciar la caminata; iniciar otra cancela la anterior. Solo la dueña puede finalizar, cancelar o registrar desvíos de su viaje. La posición GPS no se transmite al servidor.",
           "Gestiona el viaje (EN_CURSO, FINALIZADO, CANCELADO), la alerta de desvío (borde pulsante, vibración y anuncio para lectores de pantalla), las opciones de recalcular desde la posición actual o silenciar, y los aportes rápidos durante el recorrido. Incluye un simulador de caminata y de desvío para probar el sistema sin salir a la calle.",
           "Estado de la caminata, barra de avance, alerta de desvío y registro del número de desvíos del viaje.",
           "CRUD-VIAJE, CRUD-VERIFICACIÓN")

    modulo(d, sig(), "RF18 – Módulo de Registro de Transporte", "Permite registrar de forma rápida la placa de un taxi, digitada o fotografiada, ligada al viaje en curso, y compartirla con una persona de confianza.",
           "Usuaria",
           "Calcula el vencimiento del dato: 12 horas como máximo desde el registro y 2 horas después de finalizar o cancelar el viaje.",
           "Valida el formato de placa colombiana (ABC123 o ABC12D) y que la foto sea JPEG de hasta unos 180 KB, ya reducida en el dispositivo. Solo admite placas en un viaje EN_CURSO y solo su dueña puede verla, modificarla o borrarla. Cifra la placa y la foto con AES-256-GCM antes de guardarlas.",
           "Gestiona el guardado, la consulta, el borrado inmediato y la purga automática de lo vencido. El envío a una persona de confianza ocurre solo cuando la usuaria toca el botón de compartir del dispositivo; Nova no envía nada por su cuenta.",
           "Placa con estilo de placa colombiana, confirmación de guardado con fecha de vencimiento y miniatura de la foto.",
           "CRUD-VIAJE, CRUD-PLACA TEMPORAL")

    modulo(d, sig(), "RF19 – Módulo de Mapa de Calor Predictivo", "Estima el riesgo esperado por zona según la hora de la noche, a partir del historial de reportes, y colorea las calles de acuerdo con ese riesgo.",
           "Usuaria",
           "Agrupa los reportes en celdas de unos 180 m y calcula la intensidad como 1 − e^(−Σpesos / 1,2), donde cada peso combina categoría, cercanía horaria, antigüedad y confirmaciones. Para el riesgo por calle, promedia el máximo y el promedio de las muestras tomadas cada 40 m sobre la geometría de la calle.",
           "Valida el municipio y una hora de 0 a 23; limita la consulta de calles a una zona de 0,03° de lado. Solo incluye reportes ACTIVO. Si el servicio de calles no responde, mantiene el mapa de calor por celdas e informa a la usuaria.",
           "Gestiona el control de hora (reloj nocturno) con actualización dinámica y transición suave, las capas del mapa (riesgo por hora, reportes, luminarias, cámaras, comercios, calles en rojo) y el aviso de que es una estimación y no una predicción de delitos.",
           "Manchas de calor, calles coloreadas por riesgo, número de reportes activos y de zonas en alerta a la hora elegida.",
           "CRUD-REPORTE, CRUD-PUNTO DE SEGURIDAD, CRUD-VERIFICACIÓN, CRUD-MUNICIPIO")

    modulo(d, sig(), "RF20 – Módulo de Participación Comunitaria", "Incentiva que las usuarias mantengan los datos actualizados mediante puntos, niveles e insignias de confianza.",
           "Usuaria",
           "Otorga 10 puntos por verificar una ruta, 12 por una luminaria dañada, 8 por un comercio abierto, 4 por confirmar un reporte y 6 por publicar uno. Calcula el nivel (Chispa, Brasa desde 50, Aurora desde 150, Luna desde 400) y el progreso hacia el siguiente. Calcula el avance de cada una de las 7 insignias.",
           "Rechaza aportes duplicados del mismo tipo cerca del mismo lugar dentro de una ventana de tiempo (6 h para rutas, 72 h para luminarias, 3 h para comercios) y limita a 40 puntos por usuaria cada 24 horas. Las luminarias dañadas vigentes (30 días) restan seguridad a las rutas, los comercios confirmados (3 h) y las rutas verificadas (7 días) suman.",
           "Gestiona el registro de aportes, el otorgamiento automático de insignias con su revelación animada y el perfil con la actividad reciente.",
           "Perfil con nivel, puntos, insignias y avance; mensajes de puntos ganados.",
           "CRUD-VERIFICACIÓN, CRUD-INSIGNIA, CRUD-USUARIA")

    modulo(d, sig(), "RF21 – Módulo de Moderación de Contenido", "Permite a la moderadora revisar todos los reportes, no solo los denunciados, y decidir sobre ellos sin conocer la identidad de las autoras.",
           "Moderadora",
           "Calcula el alias de cada autora (código anónimo derivado con una clave del servidor) para reconocer patrones sin revelar quién es. Calcula la fecha de fin de una limitación como los días indicados (1 a 30) desde el momento de la decisión.",
           "Exige una justificación de mínimo 5 caracteres para cada decisión. Solo admite las transiciones válidas: ocultar desde ACTIVO o EN_REVISION; marcar como atendido desde ACTIVO o EN_REVISION; restaurar desde EN_REVISION, OCULTO o RESUELTO. No permite limitar la propia cuenta ni la de otra moderadora. Valida el rol en el servidor en cada petición.",
           "Gestiona la cola de reportes por revisar, el listado de todos los reportes con filtros por estado y municipio, las decisiones (ocultar, atendido, restaurar) y la limitación temporal y reversible de la publicación de una autora, sin eliminar su cuenta ni impedirle consultar o verificar. Toda acción queda en la auditoría.",
           "Tarjetas de reporte con estado, denuncias, confirmaciones y alias de la autora; confirmación de cada decisión.",
           "CRUD-REPORTE, CRUD-DENUNCIA, CRUD-USUARIA, CRUD-AUDITORÍA")

    modulo(d, sig(), "RF22 – Módulo de Curaduría de Datos y Métricas", "Permite a la moderadora mantener correctos los datos de seguridad que alimentan el algoritmo y conocer el estado general de la plataforma con información agregada.",
           "Moderadora",
           "Calcula métricas agregadas: reportes por estado, tipo, municipio y hora del día, luminarias por reparar, aportes de los últimos 7 días y autoras con limitación vigente.",
           "Solo permite crear puntos de seguridad dentro de un radio de 15 km del centro del municipio, con tipo válido y horario de 0 a 24. Exige justificación para desactivar o activar un punto y para marcar una luminaria como reparada.",
           "Gestiona la lista de luminarias dañadas reportadas por la comunidad en los últimos 30 días y su cierre cuando la autoridad las repara (dejan de restar seguridad), la creación y desactivación de luminarias, cámaras y comercios, y la consulta del registro de auditoría.",
           "Panel de métricas con indicadores, barras por tipo y estado, histograma por hora y registro de las últimas 60 decisiones. Los datos no incluyen identidad de ninguna persona.",
           "CRUD-PUNTO DE SEGURIDAD, CRUD-VERIFICACIÓN, CRUD-REPORTE, CRUD-AUDITORÍA")

    # ── Requisitos no funcionales
    for nombre, texto in [
        ("RNF01 – Compatibilidad con Navegadores Web", "El sistema deberá ser compatible con los navegadores web Google Chrome, Mozilla Firefox, Microsoft Edge y Safari en sus versiones estables más recientes, tanto en computador como en teléfono móvil, sin requerir instalar software adicional en el equipo de la usuaria."),
        ("RNF02 – Seguridad de las Credenciales y de los Datos", "El sistema almacenará las contraseñas únicamente con hash bcrypt, protegerá las sesiones con JWT firmado cuyo secreto tendrá al menos 32 caracteres y es obligatorio en producción, y cifrará la placa del taxi y su foto con AES-256-GCM. Aplicará consultas SQL parametrizadas, validación de toda entrada, cabeceras de seguridad con política CSP estricta sin scripts en línea ni recursos de terceros, control de acceso por rol y por dueña del dato, límites de uso contra fuerza bruta, y no revelará trazas de error al cliente, conforme a los riesgos del OWASP Top 10."),
        ("RNF03 – Privacidad y Anonimato", "El sistema tratará los datos personales conforme a la Ley 1581 de 2012: las autoras de los reportes no se exponen a otras usuarias ni a la moderación (solo un alias), la posición GPS de una caminata no se transmite al servidor, los datos temporales se conservan el menor tiempo posible y la usuaria puede eliminar sus reportes y borrar su placa en cualquier momento."),
        ("RNF04 – Accesibilidad", "La interfaz cumplirá las pautas WCAG 2.1 nivel AA: contraste de texto de al menos 4,5:1 y de controles de al menos 3:1, uso completo con teclado con foco visible, nombres accesibles en íconos, anuncios para lectores de pantalla en alertas y errores, significado no dependiente solo del color, objetivos táctiles amplios y respeto de las preferencias de movimiento reducido y de contraste."),
        ("RNF05 – Usabilidad y Ayuda al Usuario", "La interfaz deberá ser de fácil manejo para todas las usuarias: presentará una introducción de 3 pasos en la primera visita, ayuda contextual en los campos complejos, mensajes de error junto al campo en lenguaje claro, confirmación antes de acciones destructivas y una sección de ayuda con preguntas frecuentes, privacidad, límites del sistema y números de emergencia. Se entregará un protocolo de pruebas de usabilidad con meta de 80 % de éxito sin ayuda y puntaje SUS de al menos 80."),
        ("RNF06 – Rendimiento y Disponibilidad ante Servicios Externos", "El cálculo de una ruta con datos propios deberá responder en menos de 2 segundos. Cada llamada a un servicio externo tendrá un tiempo límite de 6 segundos, caché y un comportamiento de respaldo definido (trayectos estimados, mapa de calor por celdas, o rechazo explícito cuando se exige verificación), de modo que la indisponibilidad de un tercero nunca detenga el sistema."),
        ("RNF07 – Tarea Programada de Depuración de Datos", "El sistema ejecutará automáticamente, al arrancar y cada 10 minutos, una tarea de depuración que elimine las placas y fotos temporales vencidas. Los demás vencimientos (bloqueo de cuenta, limitación de publicación, vigencia de aportes de la comunidad) se evaluarán por fecha en cada consulta y no dependerán de ninguna acción manual."),
        ("RNF08 – Lenguaje de Programación y Versionamiento", "El sistema se desarrollará en JavaScript (Node.js 22 o superior en el servidor, módulos ES en el navegador) con arquitectura MVC por capas. El código fuente estará versionado con Git, contará con pruebas automáticas (40 pruebas de integración y unitarias) ejecutadas en integración continua, y el modelado UML y los documentos se generarán de forma reproducible mediante scripts."),
        ("RNF09 – Despliegue, Portabilidad y Escalabilidad", "El sistema se empaquetará en un contenedor Docker y se desplegará en la nube con capa gratuita (Render con PostgreSQL), con el mismo código para SQLite (desarrollo y pruebas) y PostgreSQL (producción). Será un servidor sin estado, replicable horizontalmente, y la incorporación de un municipio nuevo consistirá en añadir una fila a la tabla de referencia."),
    ]:
        actividad(d, sig(), nombre, texto)

    titulo(d, "3.3. Requisitos de Rendimiento", 2)
    parrafo(d, "El sistema deberá atender la planificación de una ruta (hasta 8 km) en menos de 2 segundos con datos propios y en menos de 10 segundos cuando consulte servicios externos; actualizar el mapa de calor al mover el control de hora en menos de 1 segundo; y soportar al menos 100 usuarias simultáneas por réplica del servidor en la capa gratuita, escalando mediante réplicas adicionales.")
    titulo(d, "3.4. Restricciones de Diseño", 2)
    parrafo(d, "Arquitectura MVC por capas (modelos, controladores, servicios y vista), base de datos relacional con SQL único para PostgreSQL y SQLite, código de geometría compartido entre cliente y servidor, interfaz sin dependencias externas ni recursos de terceros más allá de las teselas del mapa, y variables de entorno para todos los secretos.")
    titulo(d, "3.5. Atributos del Sistema", 2)
    tabla(d, [
        ("Seguridad", "Autenticación JWT, autorización por rol y por dueña del dato, cifrado de datos sensibles, validación de entradas y límites de uso (RNF02)."),
        ("Confiabilidad", "Degradación elegante ante fallas de servicios externos y purga automática de datos temporales (RNF06, RNF07)."),
        ("Mantenibilidad", "Capas separadas, funciones puras para el puntaje y el riesgo, pruebas automáticas y documentación generada por scripts (RNF08)."),
        ("Portabilidad", "Contenedor Docker, PostgreSQL y SQLite con el mismo código (RNF09)."),
        ("Sostenibilidad", "Capa gratuita, datos abiertos de OpenStreetMap y una comunidad que mantiene los datos vivos mediante la gamificación (RF20)."),
    ], [3.6, 12.4], justificar_ultima=True)
    titulo(d, "3.6. Otros Requisitos", 2)
    parrafo(d, "Requisitos éticos y legales: el sistema es una herramienta de información colaborativa y no una garantía de seguridad; informa sus límites, no usa los datos de las usuarias con fines distintos a los declarados y deja la decisión sobre contenido sensible en manos de una persona que justifica y registra cada acción. El mapa de calor es una estimación estadística construida con reportes ciudadanos, puede reflejar el sesgo de quién reporta y no debe usarse para señalar personas ni estigmatizar barrios.")

    # ── 4. Apéndices
    titulo(d, "4. Apéndices")
    titulo(d, "Apéndice A. Ciclo de vida del software aplicado", 2)
    tabla(d, [("Etapa", "Actividades y entregables"),
              ("1. Análisis", "Lectura del reto, contexto translocal y ODS; actores; este ERS."),
              ("2. Diseño", "Arquitectura MVC, modelo de datos, algoritmo de ruta segura y diagramas UML (casos de uso, clases, secuencia y actividades)."),
              ("3. Implementación", "Servidor Node.js/Express, interfaz JavaScript, integración con OpenStreetMap, cifrado y control de acceso."),
              ("4. Pruebas", "40 pruebas automáticas, revisión de accesibilidad y protocolo de pruebas de usabilidad."),
              ("5. Despliegue y mantenimiento", "Docker, Render con PostgreSQL, integración continua, depuración programada de datos y plan de evolución.")],
          [4.0, 12.0], encabezado=True, justificar_ultima=True)
    titulo(d, "Apéndice B. Estados de un reporte", 2)
    tabla(d, [("Estado", "Significado y transición"),
              ("ACTIVO", "Visible en listas, mapa, mapa de calor y puntaje de rutas. Nace así al publicarse."),
              ("EN_REVISION", "Con 2 denuncias de usuarias distintas el sistema lo retira de la vista pública; una persona debe decidir."),
              ("OCULTO", "La moderadora lo ocultó con justificación; no participa en ningún cálculo. Puede restaurarse."),
              ("RESUELTO", "Atendido (p. ej. luminaria reparada); no participa en cálculos. Puede restaurarse.")],
          [3.6, 12.4], encabezado=True, justificar_ultima=True)
    titulo(d, "Apéndice C. Trazabilidad con los diagramas", 2)
    tabla(d, [("Requisitos", "Caso de uso / diagrama"),
              ("RF01, RF02", "Registrarse e iniciar sesión (JWT) · Secuencia de autenticación"),
              ("RF05, RF13, RF14, RF15", "Reportar punto de riesgo · Consultar reportes · Secuencia de reporte con lugar verificado"),
              ("RF16", "Planificar ruta segura · Secuencia de planificación"),
              ("RF17, RF18", "Iniciar caminata, Recibir alerta de desvío, Registrar placa de taxi · Secuencia y actividades de la caminata"),
              ("RF19", "Ver mapa de calor predictivo por hora"),
              ("RF20", "Verificar datos · Ver perfil e insignias"),
              ("RF21, RF22", "Moderar reportes · Limitar publicación de una autora · Curar datos de seguridad · Ver métricas y auditoría")],
          [4.4, 11.6], encabezado=True, justificar_ultima=True)

    salida = RAIZ / "docs" / "ERS_NovaRutaSegura.docx"
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
