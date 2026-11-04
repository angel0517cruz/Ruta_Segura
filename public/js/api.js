// Cliente de la API. El token vive en sessionStorage (se borra al cerrar la pestaña: pensado para equipos compartidos).
const CLAVE = 'nova.token';

export const sesion = {
  token: () => { try { return sessionStorage.getItem(CLAVE); } catch { return null; } },
  guardar: (t) => { try { sessionStorage.setItem(CLAVE, t); } catch { /* modo privado */ } },
  borrar: () => { try { sessionStorage.removeItem(CLAVE); } catch { /* nada */ } },
};

export class ErrorApi extends Error {
  constructor(estado, cuerpo) {
    super(cuerpo?.error?.mensaje ?? 'No pudimos completar la acción.');
    this.estado = estado;
    this.codigo = cuerpo?.error?.codigo;
    this.detalles = cuerpo?.error?.detalles;
  }
}

async function pedir(metodo, ruta, cuerpo) {
  const t = sesion.token();
  let r;
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(0, { error: { mensaje: 'Sin conexión. Revisa tu internet e inténtalo de nuevo.', codigo: 'RED' } });
  }
  const datos = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401 && t) document.dispatchEvent(new CustomEvent('sesion-vencida'));
    throw new ErrorApi(r.status, datos);
  }
  return datos;
}

export const api = {
  get: (r) => pedir('GET', r),
  post: (r, c = {}) => pedir('POST', r, c),
  put: (r, c) => pedir('PUT', r, c),
  del: (r) => pedir('DELETE', r),
};
