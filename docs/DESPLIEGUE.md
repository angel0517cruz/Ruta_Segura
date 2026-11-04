# Despliegue

## Local (SQLite, sin instalar bases de datos)
```bash
npm install
cp .env.example .env        # y completa JWT_SECRET y DATA_KEY
npm start                   # http://localhost:3000
```
Cuentas de demostración (clave `Luna2026!`): `sofia@demo.co` (usuaria), `moderadora@demo.co` (moderadora).
`npm run seed -- --reset` reinicia la base y los datos de demostración.

## Docker + PostgreSQL
```bash
cp .env.example .env        # define JWT_SECRET y DATA_KEY (≥ 32 caracteres)
docker compose up --build   # app en http://localhost:3000
```

## Nube en capa gratuita (Render)
1. Sube el repositorio a GitHub.
2. En Render: **New → Blueprint** y elige el repositorio. `render.yaml` crea el servicio web (Docker) y la base PostgreSQL gratuita, y genera `JWT_SECRET` y `DATA_KEY`.
3. Edita `APP_USER_AGENT` con un correo de contacto (política de OpenStreetMap).
4. `render.yaml` genera `DEMO_PASSWORD`: es la clave secreta de `sofia@demo.co` y `moderadora@demo.co`. La ves en *Environment* del servicio. La clave pública del README (`Luna2026!`) solo funciona en local.
5. Para nombrar una moderadora real: la persona se registra y luego, en la *Shell* de Render, `npm run moderadora -- correo@dominio.com`. Cuando haya datos reales, pon `SEED_DEMO=0` y borra o cambia las cuentas iniciales.

Alternativas equivalentes: AWS (App Runner + RDS), GCP (Cloud Run + Cloud SQL) o Azure (App Service + PostgreSQL flexible); basta con `DATABASE_URL`, `JWT_SECRET` y `DATA_KEY`.

## Variables de entorno
Ver `.env.example`. En producción `JWT_SECRET` y `DATA_KEY` son obligatorias (el servidor no arranca sin ellas).

## Mantenimiento
- Purga automática de placas vencidas cada 10 min.
- Rotar secretos: cambiar `JWT_SECRET` cierra todas las sesiones; cambiar `DATA_KEY` invalida las placas guardadas (son temporales).
- Actualizar dependencias y revisar `npm audit` (corre en CI).
- Respaldo de la base PostgreSQL según el proveedor.
