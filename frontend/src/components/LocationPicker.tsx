'use client';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Search } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/googleMaps';

interface Props {
  // Coordenadas iniciales (si la direccion ya tenia uno)
  value?: { lat?: number; lng?: number };
  // Se llama cada vez que el pin se mueve. address = texto sugerido por Google.
  onChange: (coords: { lat: number; lng: number }, address?: string) => void;
}

// Centro por defecto: Santo Domingo, RD
const DEFAULT = { lat: 18.4861, lng: -69.9312 };

export default function LocationPicker({ value, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const markerRef = useRef<any>(null);
  const mapObjRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  // Geocodifica unas coordenadas a texto y lo propaga al padre
  const emit = (lat: number, lng: number) => {
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: any, status: string) => {
          const addr =
            status === 'OK' && results?.[0]
              ? results[0].formatted_address
              : undefined;
          onChange({ lat, lng }, addr);
        },
      );
    } else {
      onChange({ lat, lng });
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const start =
          value?.lat && value?.lng
            ? { lat: value.lat, lng: value.lng }
            : DEFAULT;

        const map = new google.maps.Map(mapRef.current, {
          center: start,
          zoom: value?.lat ? 17 : 13,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        mapObjRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        const marker = new google.maps.Marker({
          position: start,
          map,
          draggable: true,
        });
        markerRef.current = marker;

        // Arrastrar el pin -> nuevas coordenadas
        marker.addListener('dragend', () => {
          const p = marker.getPosition();
          if (p) emit(p.lat(), p.lng());
        });
        // Tocar el mapa -> mover el pin ahi
        map.addListener('click', (e: any) => {
          marker.setPosition(e.latLng);
          emit(e.latLng.lat(), e.latLng.lng());
        });

        // Buscador de direcciones (Places Autocomplete)
        if (searchRef.current && google.maps.places) {
          const ac = new google.maps.places.Autocomplete(searchRef.current, {
            componentRestrictions: { country: 'do' },
            fields: ['geometry'],
          });
          ac.bindTo('bounds', map);
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (place.geometry?.location) {
              const loc = place.geometry.location;
              map.setCenter(loc);
              map.setZoom(17);
              marker.setPosition(loc);
              emit(loc.lat(), loc.lng());
            }
          });
        }

        setReady(true);
      })
      .catch((e) => setError(e.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boton "mi ubicacion": centra el mapa y el pin en el GPS
  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapObjRef.current && markerRef.current) {
          const loc = { lat, lng };
          mapObjRef.current.setCenter(loc);
          mapObjRef.current.setZoom(17);
          markerRef.current.setPosition(loc);
        }
        emit(lat, lng);
      },
      () => setError('No se pudo obtener tu ubicacion GPS'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Sin API key o fallo de carga: degradar a solo-GPS para no bloquear el pedido
  if (error) {
    return (
      <div className="space-y-2">
        <div className="bg-amber-500/10 text-amber-300 text-xs rounded-xl p-3">
          Mapa no disponible ({error}). Usa el boton de GPS para fijar tu
          ubicacion.
        </div>
        <button
          onClick={useGps}
          type="button"
          className="w-full rounded-xl py-3 text-sm bg-surface border border-white/10 text-white flex items-center justify-center gap-2"
        >
          <Crosshair size={16} /> Usar mi ubicacion GPS
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Buscador */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          ref={searchRef}
          className="input pl-9 text-sm"
          placeholder="Buscar mi direccion en el mapa..."
        />
      </div>

      {/* Mapa */}
      <div className="relative rounded-xl overflow-hidden border border-white/10">
        <div ref={mapRef} className="w-full h-52 bg-card" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-sm bg-card">
            Cargando mapa...
          </div>
        )}
        {/* Boton GPS flotante */}
        <button
          onClick={useGps}
          type="button"
          className="absolute bottom-2 right-2 bg-bg/90 text-white rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1 shadow"
        >
          <Crosshair size={13} /> Mi ubicacion
        </button>
      </div>

      <p className="text-muted text-[11px] flex items-center gap-1">
        <MapPin size={11} /> Arrastra el pin o toca el mapa para ajustar el punto
        exacto.
      </p>
    </div>
  );
}
