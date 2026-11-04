import { crearApp } from './app.js';
import { config } from './config.js';
import { prepararBase } from './db/seed.js';
import { iniciarLimpieza } from './services/limpieza.js';

await prepararBase();
iniciarLimpieza();

const servidor = crearApp().listen(config.puerto, () => {
  console.log(`Luma · Ruta Segura escuchando en http://localhost:${config.puerto}`);
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => servidor.close(() => process.exit(0)));
}
