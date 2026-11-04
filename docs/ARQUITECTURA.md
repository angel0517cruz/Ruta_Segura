# Arquitectura y decisiones técnicas

## 1. Vista general

```
Navegador (SPA, JS sin framework)           Servidor Node.js 22 + Express 5              Datos
┌───────────────────────────────┐         ┌──────────────────────────────────┐     ┌────────────────┐
│ public/  (VISTA)              │  HTTPS  │ routes.js → controllers/ (CONTROL)│     │ PostgreSQL     │
│  vistas/*.js  mapa.js  reloj  │ ◄─────► │ services/ (lógica de negocio)     │ ──► │ (SQLite en dev │
│ shared/geo.js  ◄── MISMO ──►  │  JWT    │ models/  (MODELO, SQL param.)     │     │  y pruebas)    │
│  (MonitorDesvio, Haversine)   │         │ middleware/ (JWT, roles, errores) │     └────────────────┘
└───────────────────────────────┘         └───────────────┬──────────────────┘
        GPS · cámara (solo en el dispositivo)             │ con caché, tiempo límite y respaldo
                                                          ▼
                                      OpenStreetMap: Nominatim · Overpass · OSRM peatonal · teselas
```

**MVC por capas.** *Modelo*: `src/models` (acceso a datos) y `src/db`. *Vista*: `public/` (SPA con enrutador por hash). *Controlador*: `src/controllers` + `src/routes.js`. La lógica de negocio (puntaje de rutas, riesgo, mapa de calor, insignias) está en `src/services`, sin tocar la base de datos, para que sea testeable.

**Código compartido.** `shared/geo.js` (Haversine, distancia a polilínea, índice espacial, `MonitorDesvio`) lo importan el servidor y el navegador. Así la regla de desvío que se prueba en `test/geo.test.js` es exactamente la que corre en el teléfono.

## 2. Decisiones técnicas (ADR resumidos)

| # | Decisión | Alternativas | Razón |
|---|---|---|---|
| 1 | **Node.js + Express 5** | Python/Flask (proyecto anterior), NestJS | Pedido de trabajar en JavaScript; un solo lenguaje cliente/servidor permite compartir `geo.js`. |
| 2 | **PostgreSQL en producción, SQLite en desarrollo** con un adaptador de ~40 líneas y SQL único con `?` | ORM (Prisma), solo PostgreSQL | Cumple el enunciado sin exigir instalar un servidor para desarrollar ni para correr 40 pruebas en memoria. |
| 3 | **JWT HS256 de 2 h en `Authorization: Bearer`**, guardado en `sessionStorage` | Cookie httpOnly, OAuth | Sin cookies no hay CSRF; `sessionStorage` se borra al cerrar la pestaña (equipos compartidos). Se mitiga XSS con CSP estricta y `textContent`. Evolución: cookie httpOnly + refresh. |
| 4 | **Frontend sin framework ni CDN** (módulos ES, Leaflet y fuentes servidos localmente) | React/Vite, CDN | CSP sin `unsafe-inline` en scripts, sin rastreadores, sin paso de compilación, arranque inmediato. |
| 5 | **Seguridad calculada en el servidor con funciones puras** | Calcularla en cliente | Los datos de la comunidad no se exponen en bruto y el algoritmo es auditable y testeable. |
| 6 | **Candidatas = OSRM peatonal + vías por «atractores»** | Dijkstra propio con costos | No hay red vial propia; reutilizar OSM y puntuar a posteriori entrega rutas reales con un algoritmo explicable. |
| 7 | **GPS procesado en el dispositivo** | Enviar posición al servidor | Privacidad por diseño; el reto excluye seguimiento en tiempo real. |
| 8 | **Placa y foto cifradas (AES-256-GCM) con vencimiento** | Texto plano, almacenamiento indefinido | Minimización y confidencialidad; se purga cada 10 min. Sin OCR en servidor (no se envían fotos a terceros). |
| 9 | **Moderación humana auditada, sobre contenido y datos (no sobre personas): alias anónimo, sanción solo temporal, sin borrar cuentas** | Moderación automática; moderadora con acceso a identidades y a eliminar cuentas | El algoritmo nunca oculta contenido; ver `docs/IA_Responsable_Nova.docx`. |
| 10 | **Degradación elegante** de las APIs externas (excepto la verificación de lugares: sin servicio, no se publica) | Fallar si no responden | Overpass llegó a tardar 25 s durante el desarrollo; la app responde con base propia y avisa. Un reporte no se publica sin comprobar que el lugar existe. |
| 11 | **Datos de demostración simulados y etiquetados** sobre calles reales de OSM | Datos inventados sin calles | Rutas reales interactúan con datos coherentes; la interfaz declara que son simulados. |

## 3. Algoritmo de ruta segura

1. **Contexto**: luminarias, cámaras, comercios (BD propia + Overpass), reportes ACTIVOS, verificaciones vigentes.
2. **Candidatas**: ruta directa y hasta 3 variantes que pasan por el mejor punto de cada lado del corredor y el mejor global (densidad de señales de seguridad). Sin red, trayectos en línea recta con aviso.
3. **Evaluación** cada 25 m: luz ≤ 45 m, cámaras ≤ 70 m, comercios abiertos a esa hora ≤ 90 m, riesgo ≤ 110 m. Puntaje = 0,7·promedio + 0,3·promedio del 20 % más débil.
4. **Elección**: utilidad = puntaje − 45·exceso relativo de distancia; se descartan rutas con más de +60 %.
5. **Explicación** en la interfaz: desglose por factor, metros extra y ganancia.

**Modelo de riesgo temporal** (compartido por rutas y mapa de calor): peso del reporte = categoría × kernel gaussiano de la hora (σ 2,5 h) × vigencia (vida media 120 días, piso 0,25) × confianza (1 + 0,25·confirmaciones, máx. 4).

Complejidad: el índice espacial en rejilla de 120 m hace cada consulta O(1) en promedio; una ruta de 2 km (~80 muestras × 4 consultas) se evalúa en milisegundos.

## 4. Seguridad (OWASP Top 10 · 2021)

| Riesgo | Control | Dónde |
|---|---|---|
| A01 Control de acceso | Roles en servidor; viajes y placas filtrados por dueña (IDOR) | `middleware/auth.js`, `models/viaje.js` |
| A02 Criptografía | bcrypt costo 12, JWT con secreto ≥ 32 car. obligatorio en producción, AES-256-GCM, HSTS | `services/auth.js`, `services/crypto.js`, `config.js` |
| A03 Inyección | SQL parametrizado, zod, `textContent` | `db/index.js`, `services/validaciones.js` |
| A04 Diseño inseguro | Minimización (GPS local, placas con vencimiento), límites de uso | `services/limpieza.js` |
| A05 Configuración | Helmet + CSP estricta, errores sin traza, sin `x-powered-by` | `app.js`, `middleware/errores.js` |
| A06 Componentes | Dependencias mínimas, `npm audit` en CI | `.github/workflows/ci.yml` |
| A07 Autenticación | Bloqueo a 5 fallos, mensaje único, tiempo igualado, límite de intentos | `controllers/authController.js` |
| A08 Integridad | `package-lock.json`, sin CDN | — |
| A09 Registro | Auditoría de moderación, errores al registro, `/api/salud` | `models/comunidad.js` |
| A10 SSRF | URLs externas solo de configuración | `services/externos.js` |

Pruebas que lo respaldan: `test/api.test.js` (tokens falsos, 403 por rol, bloqueo, IDOR de placa, texto plano ausente, inyección, cabeceras).

**Pendiente (honestidad):** prueba de penetración independiente (p. ej. OWASP ZAP), rotación de secretos, refresh tokens y verificación de correo.

## 5. Accesibilidad (WCAG 2.1 AA)

Contrastes **medidos** (relación de luminancia WCAG) sobre el fondo `#150c33`:

| Par | Relación | Requisito |
|---|---|---|
| Texto principal crema `#f8f0e3` | 16,4 : 1 | ≥ 4,5 ✔ |
| Texto suave `#d8c9b3` | 11,4 : 1 | ≥ 4,5 ✔ |
| Beige `#e8d6b8` | 13,0 : 1 | ≥ 4,5 ✔ |
| Arena `#cdb48f` | 9,3 : 1 | ≥ 4,5 ✔ |
| Marcador de posición `#b4a58f` sobre campo `#0b0620` | 8,2 : 1 | ≥ 4,5 ✔ |
| Alerta `#ff6f9c` | 7,1 : 1 | ≥ 4,5 ✔ |
| Botón primario: blanco sobre `#7c4dff` (extremo más claro del degradado) | 4,8 : 1 | ≥ 4,5 ✔ |
| Botón de peligro: blanco sobre `#d6336c` | 4,6 : 1 | ≥ 4,5 ✔ |
| Borde de campos y controles `#8a76b8` | 4,7 : 1 | ≥ 3 ✔ (1.4.11) |

Otros criterios aplicados: nombre accesible en todos los íconos, `aria-live` para estados y alertas de desvío, `radiogroup`, `aria-modal`, foco visible de 3 px, enlace «Saltar al contenido», significado no solo por color (los tramos de baja seguridad van punteados), `prefers-reduced-motion` y `prefers-contrast`, objetivos táctiles ≥ 40 px, lista de reportes como equivalente del mapa.
**Aún sin hacer:** prueba con lectores de pantalla reales (NVDA/TalkBack) y auditoría de un tercero.

## 6. Escalabilidad y sostenibilidad

- Servidor sin estado (JWT): se replica horizontalmente detrás de un balanceador.
- PostgreSQL con índices por municipio/estado; los caches de OSM están en memoria (para varias réplicas, mover a Redis).
- Un municipio nuevo = una fila en `municipios`.
- Capa gratuita (Render + PostgreSQL), datos abiertos y comunidad que mantiene los datos: sin costos de licencia ni de personal de captura.
- Límite conocido de OSM: las teselas públicas y Nominatim son para uso moderado; para tráfico alto, usar un proveedor de teselas con llave y una instancia propia de Nominatim/OSRM.

## 7. Pruebas

`npm test` ejecuta 40 pruebas (node:test, base SQLite en memoria, sin red): autenticación y autorización, reportes y moderación, rutas, mapa de calor, placa temporal cifrada, gamificación y geometría/monitor de desvío. La integración continua las corre en cada cambio.
