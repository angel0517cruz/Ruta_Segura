// Estado global mínimo de la aplicación.
const guardado = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

export const estado = {
  usuaria: null,
  municipios: [],
  municipioId: guardado('nova.municipio', null),
  hora: null, // hora elegida en el reloj nocturno (null = ahora)
  viaje: null,
  onboardingVisto: guardado('nova.onboarding', false),
  get municipio() { return this.municipios.find((m) => m.id === this.municipioId) ?? this.municipios[0]; },
  elegirMunicipio(id) { this.municipioId = id; guardar('nova.municipio', id); document.dispatchEvent(new CustomEvent('municipio')); },
  marcarOnboarding() { this.onboardingVisto = true; guardar('nova.onboarding', true); },
};

export const esNocheHora = (h) => h >= 18 || h < 6;
/** Hora inicial: la actual si es de noche; de día, 8 p. m. (la app se piensa para caminar de noche). */
export function horaInicial() { const h = horaActualColombia(); return esNocheHora(h) ? h : 20; }

export function horaActualColombia() {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }).format(new Date())) % 24;
}
