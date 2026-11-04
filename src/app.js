import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { manejadorErrores, noEncontrado } from './middleware/errores.js';
import { crearRutas } from './routes.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

export function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.produccion) app.set('trust proxy', 1);

  // Cabeceras de seguridad (OWASP A05). CSP estricta: solo recursos propios + teselas de mapa.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'style-src-attr': ["'unsafe-inline'"], // Leaflet posiciona elementos con atributos style
          'img-src': ["'self'", 'data:', 'blob:', 'https://tile.openstreetmap.org'],
          'font-src': ["'self'"],
          'connect-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'none'"],
          'frame-ancestors': ["'none'"],
          'form-action': ["'self'"],
          ...(config.produccion ? { 'upgrade-insecure-requests': [] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // OSM exige Referer; solo se envía el origen
      strictTransportSecurity: config.produccion ? undefined : false,
    }),
  );
  app.use((req, res, next) => {
    res.set('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=(), payment=()');
    next();
  });

  // La foto de la placa llega reducida (≤ ~180 KB); el resto de la API admite cuerpos pequeños.
  app.use('/api/viajes/:id/placa', express.json({ limit: '400kb' }));
  app.use(express.json({ limit: '30kb' }));

  app.use('/api', crearRutas());
  app.use('/api', noEncontrado);

  // Frontend (vista) y dependencias propias servidas localmente: sin CDN, sin rastreadores.
  const estatico = { maxAge: config.produccion ? '1h' : 0, index: false };
  app.use('/vendor/leaflet', express.static(join(raiz, 'node_modules/leaflet/dist'), { maxAge: '7d' }));
  app.use('/vendor/fonts', express.static(join(raiz, 'node_modules/@fontsource'), { maxAge: '7d' }));
  app.use('/shared', express.static(join(raiz, 'shared'), estatico));
  app.use(express.static(join(raiz, 'public'), { ...estatico, index: 'index.html' }));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(join(raiz, 'public/index.html')));

  app.use(manejadorErrores);
  return app;
}
