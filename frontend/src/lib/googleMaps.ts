// Carga el script de Google Maps JS una sola vez (singleton) y lo reutiliza.
// La API key viene SIEMPRE de variable de entorno, nunca hardcodeada.
let promise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps solo carga en el navegador'));
  }
  // Ya esta cargado
  if ((window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }
  if (promise) return promise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) {
    return Promise.reject(
      new Error('Falta NEXT_PUBLIC_GOOGLE_MAPS_KEY en el entorno'),
    );
  }

  promise = new Promise((resolve, reject) => {
    const cb = '__initGoogleMaps';
    (window as any)[cb] = () => resolve((window as any).google);
    const s = document.createElement('script');
    // libraries=places habilita el buscador de direcciones (Autocomplete)
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es&region=DO&callback=${cb}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(s);
  });
  return promise;
}
