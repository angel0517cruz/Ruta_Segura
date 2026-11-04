// Configuración centralizada. Todo lo sensible llega por variables de entorno (ver .env.example).
import { randomBytes } from 'node:crypto';

const env = process.env;
const produccion = env.NODE_ENV === 'production';

function secreto(nombre) {
  const valor = env[nombre];
  if (valor && valor.length >= 32) return valor;
  if (produccion) throw new Error(`${nombre} es obligatorio en producción (mínimo 32 caracteres).`);
  // En desarrollo se genera uno efímero: las sesiones se pierden al reiniciar y no queda ninguno en el código.
  return randomBytes(32).toString('hex');
}

export const config = {
  produccion,
  puerto: Number(env.PORT || 3000),
  databaseUrl: env.DATABASE_URL || '',
  dbSchema: env.DB_SCHEMA || '', // schema propio dentro de una base PostgreSQL compartida
  sqlitePath: env.SQLITE_PATH || 'data/ruta_segura.db',
  jwtSecret: secreto('JWT_SECRET'),
  jwtExpira: env.JWT_EXPIRA || '2h',
  claveDatos: secreto('DATA_KEY'), // cifra placas y fotos en reposo (AES-256-GCM)
  bcryptCosto: Number(env.BCRYPT_COSTO || 12),
  placaTtlHoras: Number(env.PLACA_TTL_HORAS || 2), // retención tras finalizar el viaje
  placaTtlMaxHoras: 12, // tope si el viaje nunca se cierra
  limiteReportesHora: Number(env.LIMITE_REPORTES_HORA || 10),
  puntosDiariosMax: 40,
  verificarUbicacion: env.VERIFICAR_UBICACION !== '0', // exige que referencia y punto existan (Nominatim)
  radioCoincidenciaM: 600, // distancia máxima entre el punto marcado y el lugar geocodificado
  umbralDenuncias: 2, // denuncias de usuarias que envían un reporte a revisión humana
  apis: {
    nominatim: env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
    overpass: env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
    ruteo: env.ROUTING_URL || 'https://routing.openstreetmap.de/routed-foot',
    userAgent: env.APP_USER_AGENT || 'NovaRutaSegura/1.0 (proyecto academico; ver README)',
    habilitadas: env.APIS_EXTERNAS !== '0', // 0 en pruebas y modo sin conexión
    timeoutMs: 6000,
  },
  demo: env.SEED_DEMO === '1' || !produccion,
};
