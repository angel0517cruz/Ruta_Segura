"""Diagramas UML de Nova · Ruta Segura (matplotlib, paleta lila). Genera PNG en docs/img/."""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyArrowPatch, FancyBboxPatch, Polygon, Rectangle

SALIDA = Path(__file__).resolve().parents[2] / "docs" / "img"
PRI, CLARO, MEDIO, TINTA, SUAVE, ALERTA = "#5b34c9", "#efe9ff", "#b69cff", "#1d1240", "#7d6fa8", "#c2185b"
plt.rcParams["font.family"] = "DejaVu Sans"


def lienzo(w, h, titulo=None):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, w * 10)
    ax.set_ylim(0, h * 10)
    ax.axis("off")
    ax.set_aspect("equal")
    if titulo:
        ax.text(w * 5, h * 10 - 1.5, titulo, ha="center", va="top", fontsize=13, fontweight="bold", color=TINTA)
    return fig, ax


def guardar(fig, nombre):
    SALIDA.mkdir(parents=True, exist_ok=True)
    destino = SALIDA / nombre
    fig.savefig(destino, dpi=135, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    # Paleta reducida: son dibujos de colores planos y así pesan una fracción (la plataforma limita el tamaño).
    from PIL import Image
    Image.open(destino).convert("RGB").quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(destino, optimize=True)


def caja(ax, x, y, w, h, texto="", fc="white", ec=PRI, fs=8.5, bold=False, r=1.0, lw=1.3, color=TINTA, va="center"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}", fc=fc, ec=ec, lw=lw))
    if texto:
        ax.text(x + w / 2, y + h / 2, texto, ha="center", va=va, fontsize=fs, fontweight="bold" if bold else "normal", color=color)


def flecha(ax, p1, p2, estilo="-|>", color=TINTA, ls="-", lw=1.2, rad=0.0, texto=None, tpos=0.5, fs=7.5, off=(0, 1.0)):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle=estilo, mutation_scale=11, color=color, lw=lw, ls=ls,
                                 connectionstyle=f"arc3,rad={rad}", shrinkA=0, shrinkB=0))
    if texto:
        x = p1[0] + (p2[0] - p1[0]) * tpos + off[0]
        y = p1[1] + (p2[1] - p1[1]) * tpos + off[1]
        ax.text(x, y, texto, ha="center", va="bottom", fontsize=fs, color=color, style="italic",
                bbox=dict(fc="white", ec="none", pad=0.5, alpha=0.9))


def actor(ax, x, y, nombre, color=TINTA):
    ax.add_patch(plt.Circle((x, y + 8.5), 1.3, fc="white", ec=color, lw=1.5))
    ax.plot([x, x], [y + 7.2, y + 3.8], color=color, lw=1.5)
    ax.plot([x - 2.2, x + 2.2], [y + 6.2, y + 6.2], color=color, lw=1.5)
    ax.plot([x, x - 2], [y + 3.8, y + 1.2], color=color, lw=1.5)
    ax.plot([x, x + 2], [y + 3.8, y + 1.2], color=color, lw=1.5)
    ax.text(x, y - 0.6, nombre, ha="center", va="top", fontsize=9, fontweight="bold", color=color)


# ───────────────────────────── 1. CASOS DE USO ─────────────────────────────
def casos_de_uso():
    fig, ax = lienzo(17, 13.2, "Diagrama de casos de uso · Nova Ruta Segura")
    ax.add_patch(Rectangle((22, 3), 98, 122, fc="#faf8ff", ec=MEDIO, lw=1.2, ls="--"))
    ax.text(71, 122, "Sistema Nova · Ruta Segura", ha="center", fontsize=10, fontweight="bold", color=PRI)

    casos = {
        "reg": (45, 112, "Registrarse e iniciar\nsesión (JWT)"),
        "rep": (45, 97, "Reportar punto de riesgo\n(lugar verificado)"),
        "lis": (45, 82, "Consultar reportes\n(cercanía y filtro)"),
        "cal": (45, 67, "Ver mapa de calor\npredictivo por hora"),
        "rut": (86, 105, "Planificar ruta segura"),
        "geo": (108, 118, "Geocodificar y verificar\nque el lugar existe"),
        "alt": (86, 73, "Recibir alerta\nde desvío"),
        "cam": (86, 89, "Iniciar caminata"),
        "pla": (86, 57, "Registrar placa\nde taxi (temporal)"),
        "ver": (45, 50, "Verificar datos\n(ruta, luminaria, comercio)"),
        "con": (45, 35, "Confirmar o denunciar\nreporte"),
        "per": (45, 20, "Ver perfil e\ninsignias"),
        "mod": (96, 46, "Moderar reportes\n(ocultar, atender)"),
        "lim": (96, 35, "Limitar publicación de\nuna autora (por alias)"),
        "cur": (96, 24, "Curar datos de seguridad\n(luminarias, comercios)"),
        "met": (96, 13, "Ver métricas y\nregistro de auditoría"),
    }
    for k, (x, y, t) in casos.items():
        ax.add_patch(Ellipse((x, y), 30, 9.2, fc=CLARO, ec=PRI, lw=1.3))
        ax.text(x, y, t, ha="center", va="center", fontsize=7.8, color=TINTA)

    actor(ax, 8, 62, "Usuaria\nautenticada")
    actor(ax, 8, 98, "Visitante")
    actor(ax, 132, 28, "Moderadora\n(persona)")
    actor(ax, 132, 100, "Servicios OSM\n(Nominatim, Overpass,\nOSRM)", color=SUAVE)

    def une(a, b, pa=None, estilo="-", color=TINTA):
        ax.plot([a[0], b[0]], [a[1], b[1]], color=color, lw=1.0, ls=estilo)

    for k in ["rep", "lis", "cal", "rut", "cam", "ver", "con", "per"]:
        x, y, _ = casos[k]
        une((12, 70), (x - 15, y))
    une((12, 106), (casos["reg"][0] - 15, casos["reg"][1]))
    for k in ["mod", "lim", "cur", "met"]:
        x, y, _ = casos[k]
        une((128, 34), (x + 15, y))
    une((128, 108), (casos["geo"][0] + 15, casos["geo"][1]), color=SUAVE)
    une((128, 104), (casos["rut"][0] + 15, casos["rut"][1]), color=SUAVE)

    def rel(a, b, texto, color=PRI, rad=0.0):
        ax_, ay_ = casos[a][0], casos[a][1]
        bx_, by_ = casos[b][0], casos[b][1]
        flecha(ax, (ax_ + 12, ay_ + (4 if by_ > ay_ else -4)), (bx_ + 12, by_ + (-4 if by_ > ay_ else 4)), ls="--", color=color, lw=1.0, rad=rad, texto=texto, fs=7, off=(9, 0))

    flecha(ax, (casos["rut"][0] + 8, casos["rut"][1] + 4.4), (casos["geo"][0] - 8, casos["geo"][1] - 4.4), ls="--", color=PRI, lw=1.0, texto="«include»", fs=7, off=(-9, 0))
    flecha(ax, (86, 94), (86, 100.4), ls="--", color=PRI, lw=1.0, texto="«include»", fs=7, off=(9, -1.5))
    flecha(ax, (86, 78), (86, 84.4), ls="--", color=PRI, lw=1.0, texto="«extend»", fs=7, off=(9, -1.5))
    flecha(ax, (101, 57), (100, 85), ls="--", color=PRI, lw=1.0, rad=-0.35, texto="«extend»", fs=7, off=(9, 0))
    flecha(ax, (casos["con"][0] + 14, casos["con"][1] + 2), (casos["mod"][0] - 14, casos["mod"][1] - 1), ls="--", color=ALERTA, lw=1.0, texto="2 denuncias →\nrevisión", fs=7, off=(0, 0.4))
    guardar(fig, "01_casos_de_uso.png")


# ───────────────────────────── 2. CLASES ─────────────────────────────
def clase(ax, x, y, w, nombre, attrs, metodos=(), fc=CLARO, estereotipo=None):
    lh = 2.15
    h = 4.6 + lh * (len(attrs) + len(metodos)) + (1.6 if metodos else 0)
    ax.add_patch(Rectangle((x, y - h), w, h, fc="white", ec=PRI, lw=1.3))
    ax.add_patch(Rectangle((x, y - 4.6), w, 4.6, fc=fc, ec=PRI, lw=1.3))
    if estereotipo:
        ax.text(x + w / 2, y - 1.2, estereotipo, ha="center", va="center", fontsize=6.5, color=SUAVE, style="italic")
    ax.text(x + w / 2, y - (3.1 if estereotipo else 2.3), nombre, ha="center", va="center", fontsize=8.6, fontweight="bold", color=TINTA)
    cy = y - 4.6 - 1.4
    for a in attrs:
        ax.text(x + 1, cy, a, ha="left", va="center", fontsize=6.9, color=TINTA, family="DejaVu Sans Mono")
        cy -= lh
    if metodos:
        ax.plot([x, x + w], [cy + 0.9, cy + 0.9], color=PRI, lw=1)
        cy -= 0.7
        for m in metodos:
            ax.text(x + 1, cy, m, ha="left", va="center", fontsize=6.9, color=PRI, family="DejaVu Sans Mono")
            cy -= lh
    return {"x": x, "y": y, "w": w, "h": h, "cx": x + w / 2, "cy": y - h / 2}


def borde(c, hacia):
    """Punto del borde de la clase c en dirección al centro de otra."""
    dx, dy = hacia["cx"] - c["cx"], hacia["cy"] - c["cy"]
    sx = (c["w"] / 2) / abs(dx) if dx else 1e9
    sy = (c["h"] / 2) / abs(dy) if dy else 1e9
    t = min(sx, sy)
    return (c["cx"] + dx * t, c["cy"] + dy * t)


def relacion(ax, a, b, mult_a="", mult_b="", rotulo="", agreg=False, color=TINTA, ls="-"):
    pa, pb = borde(a, b), borde(b, a)
    ax.plot([pa[0], pb[0]], [pa[1], pb[1]], color=color, lw=1.1, ls=ls)
    if agreg:
        ax.plot(*pa, marker="D", ms=7, mfc="white", mec=color)
    if mult_a:
        ax.text(pa[0] + (pb[0] - pa[0]) * 0.1, pa[1] + (pb[1] - pa[1]) * 0.1 + 1, mult_a, fontsize=7, color=PRI, ha="center")
    if mult_b:
        ax.text(pb[0] + (pa[0] - pb[0]) * 0.1, pb[1] + (pa[1] - pb[1]) * 0.1 + 1, mult_b, fontsize=7, color=PRI, ha="center")
    if rotulo:
        ax.text((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 0.8, rotulo, fontsize=6.8, ha="center", style="italic", color=SUAVE,
                bbox=dict(fc="white", ec="none", pad=0.3, alpha=0.9))


def clases():
    fig, ax = lienzo(22, 15, "Diagrama de clases · dominio y servicios")
    X = [4, 58, 112, 166]
    W = 46
    ver = clase(ax, X[0], 140, W, "Verificacion", ["id: int", "tipo: RUTA_OK|LUMINARIA_DANADA|\n  COMERCIO_ABIERTO|REPORTE_CONFIRMADO", "lat, lng: float", "puntos: int", "resuelta: bool", "creadaEn: datetime"], ["registrar()", "marcarResuelta()"])
    usu = clase(ax, X[1], 140, W, "Usuaria", ["id: int", "nombre: string", "email: string (único)", "passwordHash: string (bcrypt)", "rol: USUARIA|MODERADORA", "puntos: int", "intentosFallidos: int", "bloqueadaHasta: datetime", "limitadaHasta: datetime"],
                ["registrar()", "iniciarSesion(): JWT", "sumarPuntos(n)", "limitarPublicacion(dias)"])
    mun = clase(ax, X[2], 140, W, "Municipio", ["id: int", "nombre: string", "lat, lng: float"])
    pun = clase(ax, X[3], 140, W, "PuntoSeguridad", ["id: int", "tipo: LUMINARIA|CAMARA|COMERCIO", "lat, lng: float", "abre, cierra: int", "fuente: osm|moderacion", "activo: bool"], ["crear()", "cambiarActivo()"])

    ins = clase(ax, X[0], 98, W, "InsigniaUsuaria", ["usuariaId: int", "codigo: string", "otorgadaEn: datetime"], ["otorgar()"])
    via = clase(ax, X[1], 98, W, "Viaje", ["id: int", "rutaJson: coords[]", "puntaje: int", "estado: EN_CURSO|FINALIZADO|\n  CANCELADO", "desvios: int", "iniciadoEn: datetime"], ["iniciar()", "finalizar()", "registrarDesvio()"])
    rep = clase(ax, X[2], 108, W, "Reporte", ["id: int", "referencia: string", "categoria: ACOSO|ILUMINACION|\n  DESOLADO|LUMINARIA_DANADA", "descripcion: string(≤280)", "lat, lng: float", "precision: EXACTA|APROXIMADA", "hora: int (0-23)", "estado: ACTIVO|EN_REVISION|\n  OCULTO|RESUELTO", "confirmaciones, denuncias: int"],
                ["crear()", "denunciar()", "cambiarEstado()"])

    mon = clase(ax, X[0], 66, W, "MonitorDesvio", ["umbralM = 45", "consecutivos = 3"], ["actualizar(pos): estado"], fc="#e1d6ff", estereotipo="«shared/geo.js · cliente»")
    pla = clase(ax, X[1], 62, W, "PlacaTemporal", ["viajeId: int (único)", "placaCifrada: AES-256-GCM", "fotoCifrada: AES-256-GCM", "expiraEn: datetime"], ["guardar()", "purgarVencidas()"])
    aud = clase(ax, X[2], 64, W, "Auditoria", ["id: int", "actorId: int", "accion: string", "detalle: string", "creadaEn: datetime"], ["registrar()"])

    vub = clase(ax, X[3], 66, W, "VerificadorUbicacion", ["radioCoincidenciaM = 600"], ["verificarUbicacion(ref, punto)"], fc="#e1d6ff", estereotipo="«servicio»")
    plan = clase(ax, X[0], 30, W, "PlanificadorRutas", ["candidatas: Ruta[]"], ["generarCandidatas(o, d)", "atractores(o, d)", "elegirRecomendada()"], fc="#e1d6ff", estereotipo="«servicio»")
    eva = clase(ax, X[1], 30, W, "EvaluadorSeguridad", ["luz, cámaras, comercios, riesgo"], ["evaluarRuta(coords, hora): 0-100", "seguridadEnPunto(p, hora)"], fc="#e1d6ff", estereotipo="«servicio»")
    rie = clase(ax, X[2], 30, W, "ModeloRiesgo", ["sigmaHoras = 2.5", "vidaMediaDias = 120"], ["pesoReporte(r, hora)", "intensidad(suma)"], fc="#e1d6ff", estereotipo="«servicio»")
    cal = clase(ax, X[3], 30, W, "MapaCalor", ["celdas ≈ 180 m"], ["celdasDeCalor(reportes, hora)", "riesgoDeCalles(calles, hora)"], fc="#e1d6ff", estereotipo="«servicio»")

    relacion(ax, usu, ver, "1", "0..*", "aporta")
    relacion(ax, usu, ins, "1", "0..*", "gana")
    relacion(ax, usu, via, "1", "0..*", "camina")
    relacion(ax, usu, rep, "1", "0..*", "publica")
    relacion(ax, mun, rep, "1", "0..*")
    relacion(ax, mun, pun, "1", "0..*")
    relacion(ax, via, pla, "1", "0..1", "registra", agreg=True)
    relacion(ax, rep, aud, "", "", "decisión genera")
    relacion(ax, rep, vub, "", "", "valida con", ls="--")
    relacion(ax, via, mon, "", "", "vigila", ls="--")
    relacion(ax, plan, eva, "", "", "usa", ls="--")
    relacion(ax, eva, rie, "", "", "usa", ls="--")
    relacion(ax, cal, rie, "", "", "usa", ls="--")
    guardar(fig, "02_diagrama_de_clases.png")


# ───────────────────────────── 3. SECUENCIA ─────────────────────────────
def secuencia(nombre_archivo, titulo, participantes, mensajes, notas=()):
    n = len(participantes)
    ancho = max(15, 3.1 * n)
    alto = 2.2 + 0.78 * len(mensajes)
    fig, ax = lienzo(ancho, alto, titulo)
    top = alto * 10 - 7
    xs = {p: 8 + i * ((ancho * 10 - 16) / (n - 1)) for i, p in enumerate(participantes)}
    fondo = 3
    for p, x in xs.items():
        caja(ax, x - 9, top - 3.4, 18, 4.8, p, fc=CLARO, fs=7.4, bold=True)
        ax.plot([x, x], [top - 3.4, fondo], color=MEDIO, lw=1, ls=(0, (4, 3)))
    y = top - 8.2
    for i, m in enumerate(mensajes, 1):
        if m[0] == "nota":
            ax.text(xs[m[1]], y, m[2], ha="center", va="center", fontsize=6.9, color=TINTA, bbox=dict(fc="#fff8d6", ec="#d9c46c", boxstyle="round,pad=0.4"))
            y -= 7.2
            continue
        a, b, txt, tipo = m
        if a == b:
            x = xs[a]
            ax.plot([x, x + 9, x + 9, x], [y, y, y - 3, y - 3], color=TINTA, lw=1)
            ax.annotate("", xy=(x, y - 3), xytext=(x + 1.5, y - 3), arrowprops=dict(arrowstyle="-|>", color=TINTA, lw=1))
            ax.text(x + 10.5, y - 1.5, f"{i}. {txt}", fontsize=6.8, va="center", color=TINTA)
            y -= 7.2
            continue
        flecha(ax, (xs[a], y), (xs[b], y), color=SUAVE if tipo == "ret" else TINTA, ls="--" if tipo == "ret" else "-", lw=1.05,
               texto=f"{i}. {txt}", fs=6.8, off=(0, 0.5))
        y -= 7.2
    guardar(fig, nombre_archivo)


def secuencias():
    secuencia("03_1_secuencia_login.png", "Secuencia · Autenticación con JWT",
              ["Usuaria", "Vista (SPA)", "AuthController", "Usuaria (modelo)", "BD"],
              [("Usuaria", "Vista (SPA)", "ingresa correo y contraseña", "sync"),
               ("Vista (SPA)", "AuthController", "POST /api/auth/login (límite 20/15 min)", "sync"),
               ("AuthController", "AuthController", "validar esquema (zod)", "sync"),
               ("AuthController", "Usuaria (modelo)", "porEmail(email)", "sync"),
               ("Usuaria (modelo)", "BD", "SELECT usuaria", "sync"),
               ("BD", "Usuaria (modelo)", "fila | nada", "ret"),
               ("AuthController", "AuthController", "bcrypt.compare (hash falso si no existe)", "sync"),
               ("nota", "AuthController", "5 fallos → bloqueo 15 min · mismo mensaje en todos los fallos"),
               ("AuthController", "Vista (SPA)", "200 {token JWT HS256, exp 2 h}", "ret"),
               ("Vista (SPA)", "Vista (SPA)", "guarda token en sessionStorage", "sync"),
               ("Vista (SPA)", "AuthController", "GET /api/... Authorization: Bearer", "sync")])

    secuencia("03_2_secuencia_ruta_segura.png", "Secuencia · Planificar ruta segura",
              ["Usuaria", "Vista (SPA)", "RutaController", "Contexto", "Planificador", "APIs OSM", "Evaluador"],
              [("Usuaria", "Vista (SPA)", "origen, destino y hora", "sync"),
               ("Vista (SPA)", "RutaController", "POST /api/rutas/planificar (JWT)", "sync"),
               ("RutaController", "Contexto", "datosParaTrayecto(o, d)", "sync"),
               ("Contexto", "APIs OSM", "Overpass: luces, cámaras, comercios", "sync"),
               ("APIs OSM", "Contexto", "puntos (o null si no responde)", "ret"),
               ("Contexto", "RutaController", "BD propia + verificaciones + OSM", "ret"),
               ("RutaController", "Planificador", "generarCandidatas(o, d, hora)", "sync"),
               ("Planificador", "APIs OSM", "OSRM peatonal: directa + vías por atractores", "sync"),
               ("APIs OSM", "Planificador", "rutas (o respaldo en línea recta)", "ret"),
               ("Planificador", "RutaController", "candidatas[]", "ret"),
               ("RutaController", "Evaluador", "evaluarRuta(cada candidata, hora)", "sync"),
               ("Evaluador", "RutaController", "puntaje 0-100, desglose, tramos", "ret"),
               ("RutaController", "RutaController", "elegirRecomendada (utilidad, tope +60 % distancia)", "sync"),
               ("RutaController", "Vista (SPA)", "200 {rutas, recomendada, aviso}", "ret"),
               ("Vista (SPA)", "Usuaria", "tarjetas con puntaje y explicación", "ret")])

    secuencia("03_3_secuencia_caminata_placa.png", "Secuencia · Caminata con alerta de desvío y placa de taxi",
              ["Usuaria", "Vista (SPA)", "MonitorDesvio", "ViajeController", "PlacaTemporal", "BD"],
              [("Usuaria", "Vista (SPA)", "Empezar caminata", "sync"),
               ("Vista (SPA)", "ViajeController", "POST /api/viajes {ruta}", "sync"),
               ("ViajeController", "BD", "INSERT viaje EN_CURSO", "sync"),
               ("nota", "Vista (SPA)", "El GPS se procesa SOLO en el dispositivo"),
               ("Vista (SPA)", "MonitorDesvio", "actualizar(posición) en cada lectura", "sync"),
               ("MonitorDesvio", "Vista (SPA)", "ALERTA tras 3 lecturas > 45 m", "ret"),
               ("Vista (SPA)", "Usuaria", "borde pulsante + vibración + aviso accesible", "ret"),
               ("Vista (SPA)", "ViajeController", "POST /viajes/:id/desvio", "sync"),
               ("Usuaria", "Vista (SPA)", "toca «Taxi», digita o fotografía la placa", "sync"),
               ("Vista (SPA)", "ViajeController", "PUT /viajes/:id/placa {placa, foto reducida}", "sync"),
               ("ViajeController", "PlacaTemporal", "guardar(): cifrar AES-256-GCM", "sync"),
               ("PlacaTemporal", "BD", "INSERT placa_cifrada, expira_en (12 h)", "sync"),
               ("Vista (SPA)", "ViajeController", "POST /viajes/:id/finalizar", "sync"),
               ("ViajeController", "BD", "expira_en = ahora + 2 h", "sync"),
               ("PlacaTemporal", "BD", "limpieza cada 10 min: DELETE vencidas", "sync")])

    secuencia("03_4_secuencia_reporte_moderacion.png", "Secuencia · Reporte con lugar verificado y moderación",
              ["Usuaria A", "ReporteController", "Verificador", "Nominatim", "Moderadora", "BD"],
              [("Usuaria A", "ReporteController", "POST /api/reportes {municipio, referencia, categoría, punto}", "sync"),
               ("ReporteController", "ReporteController", "valida entrada: sin teléfonos, correos ni enlaces", "sync"),
               ("ReporteController", "Verificador", "verificarUbicacion(referencia, punto)", "sync"),
               ("Verificador", "Nominatim", "buscar «referencia» dentro del municipio", "sync"),
               ("Nominatim", "Verificador", "lugares | ninguno | sin servicio", "ret"),
               ("nota", "Verificador", "Sin lugar: 422 · punto a más de 600 m: 422 · sin servicio: 503"),
               ("Verificador", "ReporteController", "coordenadas verificadas", "ret"),
               ("ReporteController", "BD", "INSERT reporte ACTIVO (la autora no se expone)", "sync"),
               ("Moderadora", "ReporteController", "GET /moderacion/reportes (todos los estados)", "sync"),
               ("ReporteController", "Moderadora", "reportes con alias anónimo de la autora", "ret"),
               ("nota", "Moderadora", "UNA PERSONA decide; no ve identidades ni puede borrar cuentas"),
               ("Moderadora", "ReporteController", "POST /moderacion/reportes/:id/resolver {decisión, nota}", "sync"),
               ("Moderadora", "ReporteController", "POST .../limitar-autora {días, nota} (reversible)", "sync"),
               ("ReporteController", "BD", "estado, limitada_hasta + auditoría con alias", "sync")])


# ───────────────────────────── 4. ACTIVIDADES ─────────────────────────────
def actividades():
    fig, ax = lienzo(17, 20.5, "Diagrama de actividades · Caminata nocturna segura")
    ax.add_patch(Rectangle((4, 4), 66, 192, fc="#faf8ff", ec=MEDIO, lw=1))
    ax.add_patch(Rectangle((70, 4), 96, 192, fc="white", ec=MEDIO, lw=1))
    ax.text(37, 192, "Usuaria", ha="center", fontsize=10, fontweight="bold", color=PRI)
    ax.text(118, 192, "Sistema Nova", ha="center", fontsize=10, fontweight="bold", color=PRI)

    def nodo(x, y, t, w=48, h=7.4, fc="white", **k):
        caja(ax, x - w / 2, y - h / 2, w, h, t, fc=fc, fs=7.6, **k)
        return (x, y)

    def rombo(x, y, t, w=30, h=11):
        ax.add_patch(Polygon([(x, y + h / 2), (x + w / 2, y), (x, y - h / 2), (x - w / 2, y)], fc="#fff8d6", ec="#b89b2c", lw=1.2))
        ax.text(x, y, t, ha="center", va="center", fontsize=7, color=TINTA)
        return (x, y)

    def v(a, b, t=None, **k):
        flecha(ax, (a[0], a[1] - 3.8), (b[0], b[1] + 3.8), texto=t, **k)

    ax.add_patch(plt.Circle((37, 186), 2, fc=TINTA))
    n1 = nodo(37, 176, "Inicia sesión")
    n2 = nodo(37, 164, "Elige origen, destino y hora")
    s1 = nodo(118, 152, "Obtiene luminarias, cámaras,\ncomercios y reportes", w=58, h=8.6)
    s2 = nodo(118, 139, "Genera rutas candidatas\n(OSRM + vías por atractores)", w=58, h=8.6)
    s3 = nodo(118, 126, "Puntúa cada ruta (0-100)\ny elige la de mayor utilidad", w=58, h=8.6)
    n3 = nodo(37, 126, "Compara y selecciona ruta", fc=CLARO)
    d1 = rombo(37, 110, "¿Acepta?", w=26)
    n4 = nodo(37, 94, "Inicia caminata")
    s4 = nodo(118, 94, "Crea viaje EN_CURSO", w=40)
    s5 = nodo(118, 80, "Lee GPS (en el dispositivo)\ny mide distancia a la ruta", w=58, h=8.6)
    d2 = rombo(118, 64, "¿> 45 m durante\n3 lecturas?", w=36, h=12)
    s6 = nodo(150, 48, "Alerta visual,\nvibración y aviso", w=26, h=8.6, ec=ALERTA)
    n5 = nodo(37, 48, "Recalcula o silencia", fc=CLARO)
    d3 = rombo(118, 34, "¿Llegó\n(< 20 m)?", w=26, h=11)
    n6 = nodo(37, 34, "Aporta datos: ruta ok,\nluminaria, comercio", w=46, h=8.6, fc=CLARO)
    s7 = nodo(118, 18, "Finaliza viaje · +puntos, insignias\n· placa se borra en 2 h", w=62, h=8.6)
    ax.add_patch(plt.Circle((118, 8), 2, fc="white", ec=TINTA, lw=2)); ax.add_patch(plt.Circle((118, 8), 1.1, fc=TINTA))

    flecha(ax, (37, 184), (37, 180)); v(n1, n2)
    flecha(ax, (n2[0] + 24, n2[1]), (s1[0] - 29, s1[1] + 3), texto="solicita ruta")
    v(s1, s2); v(s2, s3)
    flecha(ax, (s3[0] - 29, s3[1]), (n3[0] + 24, n3[1]), texto="tarjetas + explicación")
    v(n3, d1)
    flecha(ax, (d1[0] - 13, d1[1]), (10, d1[1]), color=SUAVE); flecha(ax, (10, d1[1]), (10, 164), estilo="-", color=SUAVE)
    flecha(ax, (10, 164), (n2[0] - 24, n2[1]), color=SUAVE, texto="no", off=(-1, 1))
    v(d1, n4, "sí", off=(2, 0))
    flecha(ax, (n4[0] + 24, n4[1]), (s4[0] - 20, s4[1]), texto="POST /viajes")
    v(s4, s5)
    v(s5, d2)
    flecha(ax, (d2[0] + 18, d2[1]), (s6[0], s6[1] + 4.3), texto="sí", rad=0.0, off=(1, 1))
    flecha(ax, (s6[0] - 13, s6[1]), (n5[0] + 24, n5[1]), color=ALERTA)
    flecha(ax, (n5[0], n5[1] + 3.8), (n5[0], 65), estilo="-", color=SUAVE)
    flecha(ax, (n5[0], 65), (d2[0] - 18, 65), color=SUAVE, texto="vuelve a la ruta", off=(0, 1))
    flecha(ax, (d2[0], d2[1] - 6), (d3[0], d3[1] + 5.5), texto="no", off=(2, 0))
    flecha(ax, (d3[0] - 13, d3[1]), (n6[0] + 23, n6[1]), texto="sí")
    flecha(ax, (d3[0] + 13, d3[1]), (162, d3[1]), estilo="-", color=SUAVE)
    flecha(ax, (162, d3[1]), (162, 86), estilo="-", color=SUAVE)
    flecha(ax, (162, 86), (s5[0] + 29, 86), color=SUAVE, texto="no · sigue", off=(-4, 1))
    flecha(ax, (n6[0], n6[1] - 4.4), (s7[0] - 31, s7[1] + 2), texto="POST /verificaciones")
    flecha(ax, (118, 13.7), (118, 10.2))
    guardar(fig, "04_diagrama_de_actividades.png")


def generar():
    casos_de_uso()
    clases()
    secuencias()
    actividades()


if __name__ == "__main__":
    generar()
    print("Diagramas generados en", SALIDA)
