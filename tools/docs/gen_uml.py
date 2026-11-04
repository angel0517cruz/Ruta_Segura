"""Documento de diagramas UML (los 4 grandes) con su explicación."""
from pathlib import Path

from .docx_util import h1, h2, imagen, nota, nuevo_documento, p, portada, tabla, vinetas

RAIZ = Path(__file__).resolve().parents[2]
IMG = RAIZ / "docs" / "img"


def generar():
    d = nuevo_documento("Diagramas UML")
    portada(d, "Diagramas UML", "Casos de uso · Clases · Secuencia · Actividades",
            [("Proyecto", "Luma · Ruta Segura"), ("Versión", "1.0"), ("Fecha", "Noviembre de 2026"),
             ("Etapa del ciclo de vida", "2. Diseño"), ("Relación", "Cada diagrama se traza a los requisitos del ERS")])

    h1(d, "1. Diagrama de casos de uso")
    p(d, "Muestra qué puede hacer cada actor con el sistema. La moderadora es una persona (no un proceso automático): es el punto de supervisión humana. Los servicios de OpenStreetMap se modelan como actor externo porque el sistema depende de ellos para geocodificar y trazar rutas, pero sigue funcionando sin ellos.")
    imagen(d, IMG / "01_casos_de_uso.png", 16.8, "Figura 1. Casos de uso de Luma · Ruta Segura")
    tabla(d, ["Caso de uso", "Actor", "Requisitos"], [
        ("Registrarse e iniciar sesión (JWT)", "Visitante", "RF-01 a RF-05"),
        ("Reportar punto de riesgo", "Usuaria", "RF-06 a RF-08, RF-16, RF-17"),
        ("Consultar reportes (cercanía y filtro)", "Usuaria", "RF-09 a RF-11"),
        ("Ver mapa de calor predictivo por hora", "Usuaria", "RF-33 a RF-37"),
        ("Planificar ruta segura", "Usuaria · Servicios OSM", "RF-18 a RF-22"),
        ("Iniciar caminata (incluye planificar)", "Usuaria", "RF-23, RF-26, RF-27"),
        ("Recibir alerta de desvío (extiende caminata)", "Usuaria", "RF-24, RF-25"),
        ("Registrar placa de taxi (extiende caminata)", "Usuaria", "RF-28 a RF-32"),
        ("Verificar datos · Ver perfil e insignias", "Usuaria", "RF-38 a RF-43"),
        ("Confirmar o denunciar reporte", "Usuaria", "RF-13, RF-14"),
        ("Moderar reportes denunciados · Consultar auditoría", "Moderadora", "RF-44 a RF-46"),
    ], [8.0, 4.4, 4.4])

    h1(d, "2. Diagrama de clases")
    p(d, "Representa las entidades del dominio (persistidas) y los servicios que contienen la lógica. Las relaciones de composición más importantes son: una Usuaria publica muchos Reportes y hace muchos Viajes; un Viaje tiene como máximo una PlacaTemporal que no existe sin él; cada decisión sobre un Reporte genera un registro de Auditoría. El MonitorDesvio vive en shared/geo.js y se ejecuta en el navegador, de modo que la posición GPS no sale del dispositivo.")
    imagen(d, IMG / "02_diagrama_de_clases.png", 17.2, "Figura 2. Diagrama de clases (dominio y servicios)")
    nota(d, "Decisión de diseño: EvaluadorSeguridad y ModeloRiesgo son funciones puras (sin acceso a base de datos). Reciben el contexto ya cargado, lo que permite probarlas de forma aislada y escalarlas por separado.")

    h1(d, "3. Diagramas de secuencia")
    p(d, "Se documentan los cuatro intercambios más importantes del sistema.")
    h2(d, "3.1 Autenticación con JWT")
    imagen(d, IMG / "03_1_secuencia_login.png", 16.2, "Figura 3. Secuencia de inicio de sesión")
    p(d, "Puntos de seguridad: validación de entrada, bcrypt con hash de relleno cuando el correo no existe (igual tiempo de respuesta), bloqueo tras 5 fallos y un único mensaje de error.")
    h2(d, "3.2 Planificar ruta segura")
    imagen(d, IMG / "03_2_secuencia_ruta_segura.png", 17.0, "Figura 4. Secuencia de planificación de ruta segura")
    p(d, "Obsérvese que ambas llamadas a OpenStreetMap son opcionales: si fallan, el contexto usa la base propia y el planificador entrega trayectos estimados con un aviso a la usuaria.")
    h2(d, "3.3 Caminata con alerta de desvío y placa de taxi")
    imagen(d, IMG / "03_3_secuencia_caminata_placa.png", 16.6, "Figura 5. Secuencia de caminata, alerta y placa temporal")
    h2(d, "3.4 Reporte comunitario y moderación humana")
    imagen(d, IMG / "03_4_secuencia_reporte_moderacion.png", 16.8, "Figura 6. Secuencia de reporte, denuncias y decisión de la moderadora")
    p(d, "Es el diagrama central del enfoque human-in-the-loop: el sistema solo aparta el reporte de la vista pública tras 2 denuncias; la decisión de ocultarlo o restaurarlo la toma una persona y queda auditada.")

    h1(d, "4. Diagrama de actividades")
    p(d, "Describe el flujo de una caminata nocturna de extremo a extremo con dos carriles: la usuaria y el sistema. Incluye los bucles de decisión (¿acepta?, ¿se desvió?, ¿llegó?) y la recuperación tras una alerta.")
    imagen(d, IMG / "04_diagrama_de_actividades.png", 14.6, "Figura 7. Actividades de la caminata nocturna segura")

    h1(d, "5. Fórmulas del algoritmo (apoyo al diseño)")
    tabla(d, ["Elemento", "Definición"], [
        ("Seguridad de un punto", "s = clamp( base + w_luz·luz + 0,2·cámara + 0,3·comercio + 0,06·ruta_verificada − 0,55·riesgo − 0,12·[luminaria dañada] )"),
        ("Pesos de luz", "w_luz = 0,34 de noche (18:00–05:59) y 0,12 + base 0,22 de día"),
        ("Peso de un reporte", "w = peso_categoría · e^(−Δh² / 2σ²) · max(0,25; e^(−edad/120)) · (1 + 0,25·min(4, confirmaciones))  con σ = 2,5 h"),
        ("Intensidad", "I = 1 − e^(−Σw / 1,2)"),
        ("Puntaje de ruta", "P = 100 · (0,7 · promedio(s) + 0,3 · promedio del 20 % más bajo)"),
        ("Utilidad", "U = P − 45 · max(0, (distancia − distancia_mínima) / distancia_mínima), con distancia ≤ 1,6 × mínima"),
    ], [4.2, 12.6])
    nota(d, "Estos pesos son heurísticos: los eligió el equipo de desarrollo con ayuda de IA como punto de partida razonable. Deben calibrarse y validarse con expertas en seguridad urbana y con datos reales antes de un uso masivo (ver documento de IA responsable).")

    salida = RAIZ / "docs" / "Diagramas_UML_LumaRutaSegura.docx"
    d.save(salida)
    return salida


if __name__ == "__main__":
    print(generar())
