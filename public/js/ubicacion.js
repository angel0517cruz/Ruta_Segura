// Geolocalización del navegador. La posición se queda en el dispositivo: el servidor solo recibe
// coordenadas cuando la usuaria las envía de forma explícita (al planear una ruta o al aportar un dato).
export function posicionActual() {
  return new Promise((resolver, rechazar) => {
    if (!('geolocation' in navigator)) return rechazar(new Error('Tu navegador no ofrece ubicación.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy }),
      (e) => rechazar(new Error(e.code === 1 ? 'No diste permiso de ubicación. Puedes elegir el punto en el mapa.' : 'No pudimos obtener tu ubicación. Elige el punto en el mapa.')),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 15000 },
    );
  });
}

export function seguirPosicion(alCambiar, alFallar) {
  if (!('geolocation' in navigator)) { alFallar?.(new Error('Sin GPS')); return () => {}; }
  const id = navigator.geolocation.watchPosition(
    (p) => alCambiar({ lat: p.coords.latitude, lng: p.coords.longitude, precision: p.coords.accuracy }),
    (e) => alFallar?.(e),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}
