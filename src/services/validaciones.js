// Esquemas de entrada (zod). Toda entrada externa pasa por aquí antes de tocar la lógica o la base de datos.
import { z } from 'zod';

export const CATEGORIAS = ['ACOSO', 'ILUMINACION', 'DESOLADO', 'LUMINARIA_DANADA'];
export const TIPOS_VERIFICACION = ['RUTA_OK', 'LUMINARIA_DANADA', 'COMERCIO_ABIERTO', 'REPORTE_CONFIRMADO'];

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const punto = z.object({ lat, lng });

// Protección de terceros: se rechazan correos, teléfonos y enlaces dentro de las descripciones.
const PATRON_DATOS_PERSONALES = /([\w.+-]+@[\w-]+\.[\w.]+)|(\+?\d[\d\s().-]{6,}\d)|(https?:\/\/|www\.)/i;
export const sinDatosPersonales = (t) => !PATRON_DATOS_PERSONALES.test(t);

const textoSeguro = (min, max) =>
  z.string().trim().min(min).max(max).refine((t) => !/[<>]/.test(t), 'No uses los caracteres < o >.');

export const registroSchema = z.object({
  nombre: textoSeguro(2, 60),
  email: z.string().trim().toLowerCase().email('Correo no válido.').max(120),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres.')
    .max(72)
    .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
    .regex(/\d/, 'Incluye al menos un número.'),
  municipio_id: z.number().int().positive().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(72),
});

export const reporteSchema = z.object({
  municipio_id: z.number().int().positive(),
  referencia: textoSeguro(3, 120),
  categoria: z.enum(CATEGORIAS),
  descripcion: textoSeguro(0, 280)
    .refine(sinDatosPersonales, 'No incluyas teléfonos, correos ni enlaces: protegemos a todas las personas.')
    .optional(),
  lat: lat.optional(),
  lng: lng.optional(),
  hora: z.number().int().min(0).max(23).optional(),
});

export const filtroReportesSchema = z.object({
  municipio_id: z.coerce.number().int().positive().optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limite: z.coerce.number().int().min(1).max(200).default(60),
});

export const rutaSchema = z.object({
  origen: punto,
  destino: punto,
  hora: z.number().int().min(0).max(23).optional(),
  origen_texto: textoSeguro(0, 120).optional(),
  destino_texto: textoSeguro(0, 120).optional(),
});

export const viajeSchema = z.object({
  ruta: z.object({
    coords: z.array(punto).min(2).max(5000),
    puntaje: z.number().min(0).max(100),
  }),
  origen_texto: textoSeguro(0, 120).optional(),
  destino_texto: textoSeguro(0, 120).optional(),
});

// Placas colombianas de servicio público: ABC123 (taxi) y variantes de moto ABC12D.
export const PLACA = /^[A-Z]{3}(\d{3}|\d{2}[A-Z])$/;
export const placaSchema = z.object({
  placa: z.string().trim().toUpperCase().regex(PLACA, 'La placa debe verse como ABC123.'),
  // Foto opcional ya reducida en el navegador (JPEG). Tope ≈ 180 KB.
  foto: z
    .string()
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, 'La foto debe ser JPEG.')
    .max(250_000)
    .optional(),
});

export const verificacionSchema = z.object({
  tipo: z.enum(TIPOS_VERIFICACION),
  lat,
  lng,
  reporte_id: z.number().int().positive().optional(),
});

export const denunciaSchema = z.object({ motivo: textoSeguro(0, 200).optional() });

export const resolverSchema = z.object({
  decision: z.enum(['OCULTAR', 'RESTAURAR']),
  nota: textoSeguro(5, 300),
});

export const bboxSchema = z.object({
  sur: z.coerce.number().min(-90).max(90),
  oeste: z.coerce.number().min(-180).max(180),
  norte: z.coerce.number().min(-90).max(90),
  este: z.coerce.number().min(-180).max(180),
  hora: z.coerce.number().int().min(0).max(23).optional(),
});
