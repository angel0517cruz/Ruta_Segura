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
| `POST /reportes` | `{municipio_id, referencia, categoria, descripcion?, lat?, lng?, hora?}` · categoría: `ACOSO`, `ILUMINACION`, `DESOLADO` |
| `GET /reportes?municipio_id&categoria&lat&lng&limite` | Ordenados por cercanía si hay `lat,lng`; si no, por fecha. Sin identidad de autoras |
| `DELETE /reportes/:id` | Solo la autora |
| `POST /reportes/:id/denunciar` | `{motivo?}` · 2 denuncias → `EN_REVISION` |
| `GET /geocodificar?q&municipio_id` | Nominatim con caché |

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
| Método y ruta | Descripción |
|---|---|
| `GET /moderacion/cola` | Reportes `EN_REVISION` |
| `POST /moderacion/:id/resolver` | `{decision: OCULTAR|RESTAURAR, nota (≥ 5)}` |
| `GET /moderacion/auditoria` | Últimos 50 eventos |
