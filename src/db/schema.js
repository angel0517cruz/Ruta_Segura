// Esquema relacional. Un solo DDL con marcadores que se adaptan al dialecto (PostgreSQL / SQLite).
import { db } from './index.js';

const plantilla = `
CREATE TABLE IF NOT EXISTS municipios (
  id {{PK}},
  nombre TEXT NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarias (
  id {{PK}},
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'USUARIA' CHECK (rol IN ('USUARIA','MODERADORA')),
  municipio_id INTEGER REFERENCES municipios(id),
  puntos INTEGER NOT NULL DEFAULT 0,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueada_hasta {{TS}},
  creada_en {{TS}} NOT NULL
);

CREATE TABLE IF NOT EXISTS puntos_seguridad (
  id {{PK}},
  tipo TEXT NOT NULL CHECK (tipo IN ('LUMINARIA','CAMARA','COMERCIO')),
  nombre TEXT,
  municipio_id INTEGER NOT NULL REFERENCES municipios(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  abre INTEGER,
  cierra INTEGER,
  fuente TEXT NOT NULL DEFAULT 'demo'
);
CREATE INDEX IF NOT EXISTS idx_puntos_mun ON puntos_seguridad(municipio_id, tipo);

CREATE TABLE IF NOT EXISTS reportes (
  id {{PK}},
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  municipio_id INTEGER NOT NULL REFERENCES municipios(id),
  referencia TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('ACOSO','ILUMINACION','DESOLADO','LUMINARIA_DANADA')),
  descripcion TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  precision_ubicacion TEXT NOT NULL DEFAULT 'EXACTA' CHECK (precision_ubicacion IN ('EXACTA','APROXIMADA')),
  hora INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','EN_REVISION','OCULTO')),
  confirmaciones INTEGER NOT NULL DEFAULT 0,
  denuncias INTEGER NOT NULL DEFAULT 0,
  fuente TEXT NOT NULL DEFAULT 'usuaria',
  creado_en {{TS}} NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reportes_mun ON reportes(municipio_id, estado);

CREATE TABLE IF NOT EXISTS verificaciones (
  id {{PK}},
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('RUTA_OK','LUMINARIA_DANADA','COMERCIO_ABIERTO','REPORTE_CONFIRMADO')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  reporte_id INTEGER REFERENCES reportes(id),
  puntos INTEGER NOT NULL,
  creada_en {{TS}} NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verif_usuaria ON verificaciones(usuaria_id, creada_en);

CREATE TABLE IF NOT EXISTS denuncias_reporte (
  reporte_id INTEGER NOT NULL REFERENCES reportes(id),
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  motivo TEXT,
  creada_en {{TS}} NOT NULL,
  PRIMARY KEY (reporte_id, usuaria_id)
);

CREATE TABLE IF NOT EXISTS insignias_usuaria (
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  codigo TEXT NOT NULL,
  otorgada_en {{TS}} NOT NULL,
  PRIMARY KEY (usuaria_id, codigo)
);

CREATE TABLE IF NOT EXISTS viajes (
  id {{PK}},
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  municipio_id INTEGER REFERENCES municipios(id),
  origen_texto TEXT,
  destino_texto TEXT,
  ruta_json TEXT,
  puntaje INTEGER,
  estado TEXT NOT NULL DEFAULT 'EN_CURSO' CHECK (estado IN ('EN_CURSO','FINALIZADO','CANCELADO')),
  desvios INTEGER NOT NULL DEFAULT 0,
  iniciado_en {{TS}} NOT NULL,
  finalizado_en {{TS}}
);
CREATE INDEX IF NOT EXISTS idx_viajes_usuaria ON viajes(usuaria_id, estado);

-- Datos temporales: cifrados y eliminados al vencer expira_en (ver services/limpieza.js).
CREATE TABLE IF NOT EXISTS placas_temporales (
  id {{PK}},
  viaje_id INTEGER NOT NULL UNIQUE REFERENCES viajes(id),
  placa_cifrada TEXT NOT NULL,
  foto_cifrada TEXT,
  creada_en {{TS}} NOT NULL,
  expira_en {{TS}} NOT NULL
);

CREATE TABLE IF NOT EXISTS auditoria (
  id {{PK}},
  actor_id INTEGER REFERENCES usuarias(id),
  accion TEXT NOT NULL,
  detalle TEXT,
  creada_en {{TS}} NOT NULL
);
`;

export async function crearEsquema() {
  const pg = db.dialecto === 'postgres';
  const sql = plantilla
    .replaceAll('{{PK}}', pg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replaceAll('{{TS}}', pg ? 'TIMESTAMPTZ' : 'TEXT');
  await db.script(sql);
}
