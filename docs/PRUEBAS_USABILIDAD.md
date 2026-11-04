# Protocolo de pruebas de usabilidad

> Este documento define **cómo** probar. Las secciones de resultados están vacías a propósito: deben completarlas las personas que ejecuten las pruebas. No se inventan resultados.

## Objetivo
Comprobar que mujeres de 16 a 45 años (estudiantes, trabajadoras, madres) completan las tareas clave sin ayuda y confían en lo que la aplicación les dice.

## Participantes
Mínimo 5 personas (Nielsen: 5 detectan ~85 % de los problemas), idealmente de 2 municipios distintos, incluyendo al menos 1 persona con baja visión o que use lector de pantalla y 1 con poca experiencia tecnológica. Consentimiento informado; no se graban rostros ni se pide información personal real (usar cuentas de prueba).

## Preparación
`npm run seed` y `npm start`; teléfono con GPS; cuentas de demostración. Pedir que piensen en voz alta.

## Tareas (sin explicarles cómo)
| # | Tarea | Éxito | Meta |
|---|---|---|---|
| T1 | Crear una cuenta y entrar | Llega al mapa | ≤ 2 min |
| T2 | Reportar «poca iluminación» cerca del parque principal | Reporte publicado | ≤ 90 s, sin ayuda |
| T3 | Planear una ruta a las 10 p. m. y decir cuál elegiría y por qué | Elige y explica el puntaje | Entiende el desglose |
| T4 | Empezar la caminata, simular un desvío y reaccionar a la alerta | Nota la alerta y recalcula o silencia | Nota la alerta ≤ 5 s |
| T5 | Registrar la placa de un taxi (digitada o con foto) | Placa guardada | ≤ 45 s |
| T6 | Mover el reloj nocturno y explicar qué cambió | Dice que el riesgo cambia con la hora | — |
| T7 | Reportar una luminaria dañada y ver qué ganó | Menciona puntos/insignia | — |
| T8 | Escribir un lugar que no existe al reportar y reaccionar al mensaje | Entiende que debe elegir un lugar de la lista | Corrige sin ayuda |
| T9 (moderadora) | Encontrar el reporte que acaba de publicar, ocultarlo con justificación y limitar a su autora por alias | Completa la tarea y entiende que no ve identidades | ≤ 3 min |

## Medidas
- Tasa de éxito sin ayuda por tarea (meta global ≥ 80 %).
- Tiempo por tarea y número de errores.
- **SUS** (System Usability Scale, 10 preguntas); meta ≥ 80.
- Preguntas de confianza (1–5): «Entiendo por qué me recomienda esta ruta», «Confío en este mapa», «Sentí que mis datos están protegidos».
- Observación de accesibilidad: uso de teclado, lector de pantalla, ampliación al 200 %, modo de movimiento reducido.

## Lista rápida WCAG 2.1 AA (marcar)
- [ ] Todo se puede hacer solo con teclado y el foco siempre es visible
- [ ] Los íconos tienen nombre accesible; las imágenes, texto alternativo
- [ ] Los errores se anuncian y están junto al campo
- [ ] Contrastes revisados (ver `ARQUITECTURA.md`)
- [ ] Zoom al 200 % sin pérdida de contenido; sin scroll horizontal a 320 px
- [ ] Con «reducir movimiento» no hay animaciones continuas
- [ ] La alerta de desvío se anuncia a lectores de pantalla
- [ ] Probado con NVDA o TalkBack

## Registro de resultados (completar)
| Participante | Municipio | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | SUS | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | |

## Problemas encontrados y decisiones
| Problema | Severidad (1–4) | Decisión | Responsable | Estado |
|---|---|---|---|---|
| | | | | |
