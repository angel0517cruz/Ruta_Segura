# Referencia de la API

Base: `/api`. JSON. Salvo indicación, requiere `Authorization: Bearer <token>`.
Errores: `{ "error": { "codigo", "mensaje", "detalles?" } }`.

## Públicos
| Método y ruta | Descripción |
|---|---|
| `GET /salud` | `{ estado: "ok", demo }` |
| `GET /municipios` | Tabla de referencia de municipios |
| `POST /auth/registro` | `{nombre, email, password, municipio_id?}` → `201 {token, usuaria}` |
| `POST /auth/login` | `{email, password}` → `{token, usuaria}` · 401 · 429 (bloqueo) |

## Reportes
| Método y ruta | Descripción |
|---|---|
| `POST /reportes` | `{municipio_id, referencia, categoria, descripcion?, lat?, lng?, hora?}` · categoría: `ACOSO`, `ILUMINACION`, `DESOLADO`. La referencia debe existir en el municipio (422 `REFERENCIA_NO_ENCONTRADA`), el punto debe quedar a ≤ 600 m (422 `PUNTO_NO_COINCIDE`) y, si Nominatim no responde, no se publica (503). 403 `PUBLICACION_LIMITADA` si moderación limitó a la autora |
| `GET /reportes?municipio_id&categoria&lat&lng&limite` | Ordenados por cercanía si hay `lat,lng`; si no, por fecha. Sin identidad de autoras |
| `DELETE /reportes/:id` | Solo la autora |
| `POST /reportes/:id/denunciar` | `{motivo?}` · 2 denuncias → `EN_REVISION` |
| `GET /geocodificar?q&municipio_id` | Lugares de Nominatim dentro del municipio: `{disponible, resultados[{nombre, lat, lng}]}` |

## Rutas, caminata y transporte
| Método y ruta | Descripción |
|---|---|
| `POST /rutas/planificar` | `{origen:{lat,lng}, destino:{lat,lng}, hora?}` → `{rutas[{puntaje, desglose, tramos, coords, ...}], recomendada, aviso}` |
| `POST /viajes` | `{ruta:{coords, puntaje}, origen_texto?, destino_texto?}` |
| `GET /viajes/actual` | Viaje en curso y su placa vigente |
| `POST /viajes/:id/desvio` · `/finalizar` · `/cancelar` | Estados del viaje |
| `PUT /viajes/:id/placa` | `{placa: "ABC123", foto?: "data:image/jpeg;base64,..."}` (cifrada, con vencimiento) |
| `GET /viajes/:id/placa` · `DELETE ...` | Solo la dueña |

## Mapa
| Método y ruta | Descripción |
|---|---|
| `GET /mapa-calor?municipio_id&hora` | Celdas `{lat,lng,intensidad,reportes}` |
| `GET /mapa-calor/calles?sur&oeste&norte&este&hora` | Riesgo por calle (Overpass); `disponible:false` si no responde |
| `GET /capas/:municipioId` | Luminarias, cámaras, comercios y datos vigentes de la comunidad |

## Comunidad
| Método y ruta | Descripción |
|---|---|
| `POST /verificaciones` | `{tipo: RUTA_OK|LUMINARIA_DANADA|COMERCIO_ABIERTO|REPORTE_CONFIRMADO, lat, lng, reporte_id?}` → puntos e insignias nuevas |
| `GET /perfil` | Nivel, puntos, insignias y actividad |

## Moderación (rol MODERADORA)
La moderadora ve a las autoras solo por un alias (`N-xxxxx`); ninguna ruta devuelve nombre, correo ni id, y **no existe ninguna ruta para borrar cuentas**.

| Método y ruta | Descripción |
|---|---|
| `GET /moderacion/cola` | Reportes `EN_REVISION` (2 o más denuncias) |
| `GET /moderacion/reportes?estado&municipio_id&limite` | Todos los reportes, de cualquier estado |
| `POST /moderacion/reportes/:id/resolver` | `{decision: OCULTAR\|RESTAURAR\|RESUELTO, nota (≥ 5)}` |
| `POST /moderacion/reportes/:id/limitar-autora` | `{dias: 0-30, nota}` limita (o levanta con 0) la publicación de la autora del reporte |
| `GET /moderacion/puntos?municipio_id` · `POST /moderacion/puntos` | Lista y crea luminarias, cámaras y comercios |
| `POST /moderacion/puntos/:id/estado` | `{activo, nota}` activa o desactiva un punto |
| `GET /moderacion/luminarias-danadas` · `POST .../:id/reparar` | Luminarias reportadas por la comunidad y su cierre `{nota}` |
| `GET /moderacion/metricas` | Reportes por estado, tipo, municipio y hora; luminarias pendientes; aportes; autoras limitadas |
| `GET /moderacion/auditoria` | Últimos 60 eventos |
