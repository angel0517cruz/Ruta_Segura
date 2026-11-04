# 🌙 Luma · Ruta Segura

Aplicación web colaborativa para que las mujeres se muevan con más información por el espacio público **nocturno** de Cundinamarca: parques, vías y entornos universitarios. Reto translocal · ODS 5, 11 y 16.

> **Luma no es un botón de pánico ni reemplaza a las autoridades.** En una emergencia: **123**. Orientación a mujeres: **línea 155**.

## Lo que la hace distinta

| | |
|---|---|
| 🧭 **Navegación inteligente** | Compara rutas peatonales reales y recomienda la de mayor seguridad (luminarias, cámaras, comercios abiertos a *tu* hora, reportes de la comunidad) por encima de la más corta, con tope de +60 % de distancia y una explicación de cada decisión. |
| 🚨 **Alerta de desvío** | Si te alejas más de 45 m de la ruta durante 3 lecturas de GPS: borde pulsante, vibración y aviso para lectores de pantalla. Recalcula desde donde estás. Tu GPS **nunca sale del dispositivo**. |
| 🚕 **Registro rápido de transporte** | Botón «Taxi»: digita o fotografía la placa. Se guarda **cifrada**, ligada al viaje y se borra sola. Compartir con alguien de confianza en un toque. |
| 🔥 **Mapa de calor predictivo** | Mueve la luna del *reloj nocturno* y mira cómo cambia el riesgo esperado según la hora; con el mapa acercado, las calles se ponen en rojo. |
| ⭐ **Gamificación comunitaria** | Verifica rutas, reporta luminarias dañadas, confirma comercios abiertos: ganas puntos e insignias de confianza, y esos datos mejoran el algoritmo en tiempo real. |
| 🧑‍⚖️ **Humano en el circuito** | Ningún algoritmo oculta contenido: 2 denuncias llevan el reporte a una moderadora, que decide con justificación auditada. |

## Cumplimiento del enunciado

- Usuarias autenticadas con **JWT** que reportan acoso, iluminación deficiente y zonas desoladas con **municipio + punto de referencia** y categoría → `POST /api/reportes`.
- Lista **ordenada por cercanía** y **filtrable por tipo** → vista *Reportes*.
- **API externa**: OpenStreetMap (Nominatim, Overpass, OSRM peatonal, teselas) → mapa con los puntos.
- **MVC**, **PostgreSQL** (SQLite en desarrollo), autenticación/autorización por roles, despliegue en la nube (Render, capa gratuita) y Docker.
- **UX / Seguridad / Usabilidad / Accesibilidad / Uso ético de la IA**: ver `docs/`.

## Ejecutar

Requiere Node.js 22 o superior.

```bash
npm install
cp .env.example .env     # completa JWT_SECRET y DATA_KEY (32+ caracteres)
npm start                # http://localhost:3000
npm test                 # 27 pruebas
```

Cuentas de demostración (clave `Luna2026!`): `sofia@demo.co` (usuaria) y `moderadora@demo.co` (moderadora). Solo existen cuando `SEED_DEMO=1` o fuera de producción.

Para ver todo en 2 minutos: entra con `sofia@demo.co` → *Ruta* → «Probar con un trayecto de ejemplo» → *Buscar* → *Empezar caminata* → «Simular caminata» y «Simular desvío».

## Estructura

```
src/            MVC: controllers/ models/ services/ middleware/ db/
public/         Vista: SPA sin framework (vistas/, mapa.js, reloj.js) + CSS «Noche Lila»
shared/geo.js   Geometría y MonitorDesvio, usados por servidor y navegador
test/           27 pruebas automáticas (node:test)
docs/           ERS, UML, IA responsable, arquitectura, usabilidad, API, despliegue
tools/          Generadores de documentos y descarga de calles de demostración
```

## Documentación (ciclo de vida de 5 etapas)

| Etapa | Documento |
|---|---|
| 1. Análisis | `docs/ERS_LumaRutaSegura.docx` |
| 2. Diseño | `docs/Diagramas_UML_LumaRutaSegura.docx` (casos de uso, clases, secuencia, actividades) · `docs/ARQUITECTURA.md` |
| 3. Implementación | `src/`, `public/`, `shared/` |
| 4. Pruebas | `test/` · `docs/PRUEBAS_USABILIDAD.md` |
| 5. Despliegue y mantenimiento | `docs/DESPLIEGUE.md` · `Dockerfile` · `render.yaml` · CI |
| Transversal | `docs/IA_Responsable_HITL.docx` (herramientas, prompts, evaluación crítica y veeduría humana) |

Regenerar los documentos Word: `python -m tools.docs.gen_docs` (requiere `matplotlib` y `python-docx`).

## Honestidad sobre el estado del proyecto

- Los **datos iniciales son simulados** (colocados sobre calles reales de OpenStreetMap) y la interfaz lo declara. Con conexión, Luma suma luminarias, cámaras y comercios reales de OSM.
- Los **pesos del algoritmo son heurísticos**, sin calibrar con expertas ni con datos reales.
- **No se ha probado con usuarias reales** ni con lectores de pantalla; el protocolo está en `docs/PRUEBAS_USABILIDAD.md`.
- Falta una prueba de penetración independiente.
- Las teselas públicas de OSM son para uso moderado; en producción con tráfico alto, usa un proveedor con llave.

Datos de mapas © colaboradores de OpenStreetMap (ODbL).
