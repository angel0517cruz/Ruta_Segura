// Utilidades de datos compartidas por los modelos.
export const ahoraIso = () => new Date().toISOString();
export const enHoras = (h) => new Date(Date.now() + h * 3600_000).toISOString();
export const haceHoras = (h) => new Date(Date.now() - h * 3600_000).toISOString();
export const haceDias = (d) => haceHoras(d * 24);

/** PostgreSQL devuelve Date en TIMESTAMPTZ; SQLite devuelve texto. Se unifica a ISO-8601. */
export const aIso = (v) => (v == null ? null : new Date(v).toISOString());
