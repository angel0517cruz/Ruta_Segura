// Adaptador mínimo para PostgreSQL (producción) y SQLite (desarrollo/pruebas).
// El SQL se escribe una sola vez con marcadores `?`; aquí se convierte a $1, $2... para pg.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '../config.js';

let impl;

async function abrir() {
  if (config.databaseUrl) {
    const { default: pg } = await import('pg');
    const local = /sslmode=disable|localhost|127\.0\.0\.1/.test(config.databaseUrl);
    const pool = new pg.Pool({ connectionString: config.databaseUrl, ssl: local ? false : { rejectUnauthorized: false }, max: 10 });
    const conv = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
    // Aísla las tablas de Nova en su propio schema cuando la base se comparte con otro proyecto
    // (p. ej. la única base PostgreSQL gratuita que permite Render por cuenta).
    const esquema = config.dbSchema;
    if (esquema) {
      if (!/^[a-z_][a-z0-9_]{0,40}$/.test(esquema)) throw new Error('DB_SCHEMA no es un identificador válido.');
      pool.on('connect', (c) => c.query(`SET search_path TO ${esquema}`)); // antes de la primera consulta
      await pool.query(`CREATE SCHEMA IF NOT EXISTS ${esquema}`);
    }
    return {
      dialecto: 'postgres',
      async todos(sql, p = []) { return (await pool.query(conv(sql), p)).rows; },
      async ejecutar(sql, p = []) { const r = await pool.query(conv(sql), p); return { filas: r.rows, cambios: r.rowCount }; },
      async script(sql) { await pool.query(sql); },
      async cerrar() { await pool.end(); },
    };
  }
  const { DatabaseSync } = await import('node:sqlite');
  const ruta = config.sqlitePath;
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
  const sqlite = new DatabaseSync(ruta);
  sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const plano = (filas) => filas.map((f) => ({ ...f }));
  return {
    dialecto: 'sqlite',
    async todos(sql, p = []) { return plano(sqlite.prepare(sql).all(...p)); },
    async ejecutar(sql, p = []) {
      const st = sqlite.prepare(sql);
      if (/\breturning\b/i.test(sql)) { const filas = plano(st.all(...p)); return { filas, cambios: filas.length }; }
      const r = st.run(...p);
      return { filas: [], cambios: Number(r.changes) };
    },
    async script(sql) { sqlite.exec(sql); },
    async cerrar() { sqlite.close(); },
  };
}

export async function iniciarDb() {
  if (!impl) impl = await abrir();
  return impl;
}

export const db = {
  get dialecto() { return impl.dialecto; },
  todos: (...a) => impl.todos(...a),
  uno: async (...a) => (await impl.todos(...a))[0] ?? null,
  ejecutar: (...a) => impl.ejecutar(...a),
  script: (...a) => impl.script(...a),
  cerrar: async () => { if (impl) { const i = impl; impl = undefined; await i.cerrar(); } },
};
