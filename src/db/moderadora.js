// Asigna el rol MODERADORA a una cuenta ya registrada. El rol nunca se concede desde la aplicación.
// Uso: npm run moderadora -- correo@dominio.com
import { db, iniciarDb } from './index.js';
import { crearEsquema } from './schema.js';
import { ahoraIso } from '../models/util.js';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email.includes('@')) {
  console.error('Uso: npm run moderadora -- correo@dominio.com');
  process.exit(1);
}
await iniciarDb();
await crearEsquema();
const u = await db.uno('SELECT id, nombre FROM usuarias WHERE email = ?', [email]);
if (!u) {
  console.error(`No existe una cuenta con ${email}. La persona debe registrarse primero en la aplicación.`);
  await db.cerrar();
  process.exit(1);
}
await db.ejecutar("UPDATE usuarias SET rol = 'MODERADORA' WHERE id = ?", [u.id]);
await db.ejecutar('INSERT INTO auditoria (actor_id, accion, detalle, creada_en) VALUES (NULL, ?, ?, ?)', ['ROL_MODERADORA_ASIGNADO', `cuenta ${u.id} (asignación manual por línea de comandos)`, ahoraIso()]);
console.log(`Listo: ${u.nombre} (${email}) ahora es moderadora.`);
await db.cerrar();
