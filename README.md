# ✦ Nova · Ruta Segura

**Ninguna camina sola.** Aplicación web colaborativa para que las mujeres se muevan con más información por el espacio público **nocturno** de Cundinamarca: parques, vías y entornos universitarios. Reto translocal · ODS 5, 11 y 16.

> **Nova no es un botón de pánico ni reemplaza a las autoridades.** En una emergencia: **123**. Orientación a mujeres: **línea 155**.

### ¿Por qué «Nova»?
*Nova* es «nueva» en latín y, en astronomía, una estrella que de pronto brilla con fuerza donde antes no se veía luz: justo lo que hace la aplicación con las calles oscuras, al volverlas visibles para toda la comunidad. También se lee como **«no va sola»**: ninguna mujer debería caminar de noche sin información ni respaldo.

## Lo que la hace distinta

| | |
|---|---|
| 🧭 **Navegación inteligente** | Compara rutas peatonales reales y recomienda la de mayor seguridad (luminarias, cámaras, comercios abiertos a *tu* hora, reportes de la comunidad) por encima de la más corta, con tope de +60 % de distancia y una explicación de cada decisión. |
| 🚨 **Alerta de desvío** | Si te alejas más de 45 m de la ruta durante 3 lecturas de GPS: borde pulsante, vibración y aviso para lectores de pantalla. Recalcula desde donde estás. Tu GPS **nunca sale del dispositivo**. |
| 🚕 **Registro rápido de transporte** | Botón «Taxi»: digita o fotografía la placa. Se guarda **cifrada**, ligada al viaje y se borra sola. Compartir con alguien de confianza en un toque. |
| 🔥 **Mapa de calor predictivo** | Mueve la luna del *reloj nocturno* y mira cómo cambia el riesgo esperado según la hora; con el mapa acercado, las calles se ponen en rojo. |
| 📍 **Lugares verificados** | Al reportar, el mapa te lleva solo al municipio y al lugar; Nova comprueba que la referencia exista y que el punto esté a ≤ 600 m de ella. |
| ⭐ **Gamificación comunitaria** | Verifica rutas, reporta luminarias dañadas, confirma comercios abiertos: ganas puntos e insignias de confianza, y esos datos mejoran el algoritmo. |
| 🧑‍⚖️ **Moderación humana, sin tocar identidades** | La moderadora revisa **todos** los reportes, los oculta o los marca como atendidos, cura luminarias/cámaras/comercios, cierra luminarias reparadas, ve métricas anónimas y puede **limitar temporalmente** la publicación de una autora, a quien ve solo por un alias. No puede ver nombres ni correos ni borrar cuentas. Todo queda auditado. |

## Cumplimiento del enunciado

- Usuarias autenticadas con **JWT** que reportan acoso, iluminación deficiente y zonas desoladas con **municipio + punto de referencia** y categoría → `POST /api/reportes`.
- Lista **ordenada por cercanía** y **filtrable por tipo** → vista *Reportes*.
- **API externa**: OpenStreetMap (Nominatim, Overpass, OSRM peatonal, teselas) → mapa con los puntos.
- **MVC**, **PostgreSQL** (SQLite en desarrollo), autenticación y autorización por roles, despliegue en la nube (Render, capa gratuita) y Docker.
- **UX / Seguridad / Usabilidad / Accesibilidad / Uso ético de la IA**: ver `docs/`.

## Ejecutar

Requiere Node.js 22 o superior.

```bash
npm install
cp .env.example .env     # completa JWT_SECRET y DATA_KEY (32+ caracteres)
npm start                # http://localhost:3000
npm test                 # 40 pruebas
```

Cuentas iniciales (clave `Luna2026!`): `sofia@demo.co` (usuaria) y `moderadora@demo.co` (moderadora). Solo existen cuando `SEED_DEMO=1` o fuera de producción; cámbialas antes de publicar.

Recorrido rápido: entra con `sofia@demo.co` → *Ruta* → «Probar con un trayecto de ejemplo» → *Buscar* → *Empezar caminata* → «Simular caminata» y «Simular desvío». Luego entra con la moderadora y abre *Moderar*.

## Estructura

```
src/            MVC: controllers/ models/ services/ middleware/ db/
public/         Vista: SPA sin framework (vistas/, mapa.js, reloj.js) + CSS violeta y crema
shared/geo.js   Geometría y MonitorDesvio, usados por servidor y navegador
test/           40 pruebas automáticas (node:test)
docs/           ERS (IEEE 830), UML, IA responsable, arquitectura, usabilidad, API, despliegue
tools/          Generadores de documentos y descarga de calles de OpenStreetMap
```

## Documentación (ciclo de vida de 5 etapas)

| Etapa | Documento |
|---|---|
| 1. Análisis | `docs/ERS_NovaRutaSegura.docx` |
| 2. Diseño | `docs/Diagramas_UML_NovaRutaSegura.docx` (casos de uso, clases, secuencia, actividades) · `docs/ARQUITECTURA.md` |
| 3. Implementación | `src/`, `public/`, `shared/` |
| 4. Pruebas | `test/` · `docs/PRUEBAS_USABILIDAD.md` |
| 5. Despliegue y mantenimiento | `docs/DESPLIEGUE.md` · `Dockerfile` · `render.yaml` · CI |
| Transversal | `docs/IA_Responsable_Nova.docx` (herramientas, prompts, evaluación crítica y supervisión humana) |

Regenerar los documentos Word: `python -m tools.docs.gen_docs` (requiere `matplotlib` y `python-docx`).

## Estado y límites

- Los **datos iniciales de luminarias, cámaras, comercios y reportes son generados** para poder probar el sistema (sobre calles reales de OpenStreetMap). Con conexión, Nova suma datos reales de OSM y de la comunidad; antes de un uso público deben reemplazarse (columna `fuente`).
- Los **pesos del algoritmo son heurísticos**, sin calibrar con expertas ni datos reales.
- **No se ha probado con usuarias reales** ni con lectores de pantalla; el protocolo está en `docs/PRUEBAS_USABILIDAD.md`.
- Falta una prueba de penetración independiente.
- Las teselas públicas de OSM son para uso moderado; en producción con tráfico alto, usa un proveedor con llave.

## Integrantes

Miguel Angel Cruz Londoño · Julian Alexander Gomez Galvis · Jose Manuel Yara Cruz

Datos de mapas © colaboradores de OpenStreetMap (ODbL).
