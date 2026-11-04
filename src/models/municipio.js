import { haversine } from '../../shared/geo.js';
import { db } from '../db/index.js';

export const Municipio = {
  todos: () => db.todos('SELECT id, nombre, lat, lng FROM municipios ORDER BY nombre'),
  porId: (id) => db.uno('SELECT id, nombre, lat, lng FROM municipios WHERE id = ?', [id]),
  /** Municipio de la tabla de referencia más cercano a un punto (máx. 30 km). */
  async masCercano(p) {
    const todos = await Municipio.todos();
    let mejor = null;
    for (const m of todos) {
      const d = haversine(p, m);
      if (!mejor || d < mejor.d) mejor = { ...m, d };
    }
    return mejor && mejor.d <= 30_000 ? mejor : null;
  },
};
