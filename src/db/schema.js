// Esquema relacional. Un solo DDL con marcadores que se adaptan al dialecto (PostgreSQL / SQLite).
// Las longitudes de los VARCHAR coinciden con las validaciones de la API y con el diccionario de datos del ERS.
import { db } from './index.js';

const plantilla = `
CREATE TABLE IF NOT EXISTS municipios (
  id {{PK}},
  nombre VARCHAR(40) NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarias (
  id {{PK}},
  nombre VARCHAR(60) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol VARCHAR(12) NOT NULL DEFAULT 'USUARIA' CHECK (rol IN ('USUARIA','MODERADORA')),
  municipio_id INTEGER REFERENCES municipios(id),
  puntos INTEGER NOT NULL DEFAULT 0,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  bloqueada_hasta {{TS}},
  limitada_hasta {{TS}},
  creada_en {{TS}} NOT NULL
);

CREATE TABLE IF NOT EXISTS puntos_seguridad (
  id {{PK}},
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('LUMINARIA','CAMARA','COMERCIO')),
  nombre VARCHAR(60),
  municipio_id INTEGER NOT NULL REFERENCES municipios(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  abre INTEGER,
  cierra INTEGER,
  fuente VARCHAR(10) NOT NULL DEFAULT 'demo',
  activo INTEGER NOT NULL DEFAULT 1,
  creado_por INTEGER REFERENCES usuarias(id)
);
CREATE INDEX IF NOT EXISTS idx_puntos_mun ON puntos_seguridad(municipio_id, tipo);

CREATE TABLE IF NOT EXISTS reportes (
  id {{PK}},
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  municipio_id INTEGER NOT NULL REFERENCES municipios(id),
  referencia VARCHAR(120) NOT NULL,
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('ACOSO','ILUMINACION','DESOLADO','LUMINARIA_DANADA')),
  descripcion VARCHAR(280),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  precision_ubicacion VARCHAR(10) NOT NULL DEFAULT 'EXACTA' CHECK (precision_ubicacion IN ('EXACTA','APROXIMADA')),
  hora INTEGER NOT NULL,
  estado VARCHAR(12) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','EN_REVISION','OCULTO','RESUELTO')),
  confirmaciones INTEGER NOT NULL DEFAULT 0,
  denuncias INTEGER NOT NULL DEFAULT 0,
  fuente VARCHAR(10) NOT NULL DEFAULT 'usuaria',
  creado_en {{TS}} NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reportes_mun ON reportes(municipio_id, estado);

CREATE TABLE IF NOT EXISTS verificaciones (
  id {{PK}},
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RUTA_OK','LUMINARIA_DANADA','COMERCIO_ABIERTO','REPORTE_CONFIRMADO')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  reporte_id INTEGER REFERENCES reportes(id),
  puntos INTEGER NOT NULL,
  resuelta INTEGER NOT NULL DEFAULT 0,
  creada_en {{TS}} NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verif_usuaria ON verificaciones(usuaria_id, creada_en);

CREATE TABLE IF NOT EXISTS denuncias_reporte (
  reporte_id INTEGER NOT NULL REFERENCES reportes(id),
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  motivo VARCHAR(200),
  creada_en {{TS}} NOT NULL,
  PRIMARY KEY (reporte_id, usuaria_id)
);

CREATE TABLE IF NOT EXISTS insignias_usuaria (
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  codigo VARCHAR(20) NOT NULL,
  otorgada_en {{TS}} NOT NULL,
  PRIMARY KEY (usuaria_id, codigo)
);

CREATE TABLE IF NOT EXISTS viajes (
  id {{PK}},
  usuaria_id INTEGER NOT NULL REFERENCES usuarias(id),
  municipio_id INTEGER REFERENCES municipios(id),
  origen_texto VARCHAR(120),
  destino_texto VARCHAR(120),
  ruta_json TEXT,
  puntaje INTEGER,
  estado VARCHAR(10) NOT NULL DEFAULT 'EN_CURSO' CHECK (estado IN ('EN_CURSO','FINALIZADO','CANCELADO')),
  desvios INTEGER NOT NULL DEFAULT 0,
  iniciado_en {{TS}} NOT NULL,
  finalizado_en {{TS}}
);
CREATE INDEX IF NOT EXISTS idx_viajes_usuaria ON viajes(usuaria_id, estado);

-- Datos temporales: cifrados y eliminados al vencer expira_en (ver services/limpieza.js).
CREATE TABLE IF NOT EXISTS placas_temporales (
  id {{PK}},
  viaje_id INTEGER NOT NULL UNIQUE REFERENCES viajes(id),
  placa_cifrada VARCHAR(120) NOT NULL,
  foto_cifrada TEXT,
  creada_en {{TS}} NOT NULL,
  expira_en {{TS}} NOT NULL
);

CREATE TABLE IF NOT EXISTS auditoria (
  id {{PK}},
  actor_id INTEGER REFERENCES usuarias(id),
  accion VARCHAR(40) NOT NULL,
  detalle VARCHAR(300),
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
