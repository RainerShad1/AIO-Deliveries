'use client';
import { useState } from 'react';

interface Props {
  onResolved: (data: { lat?: number; lng?: number; manual?: string }) => void;
}

export default function LocationGate({ onResolved }: Props) {
  const [manual, setManual] = useState('');
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);

  const askGps = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onResolved({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLoading(false);
        setDenied(true); // permitir direccion manual
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="px-5 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Donde te entregamos? 📍</h1>
      <p className="text-muted mb-6">
        Necesitamos tu ubicacion para calcular la entrega.
      </p>

      {!denied ? (
        <>
          <button onClick={askGps} disabled={loading} className="btn-primary mb-3">
            {loading ? 'Obteniendo ubicacion...' : 'Usar mi ubicacion actual'}
          </button>
          <button
            onClick={() => setDenied(true)}
            className="text-muted text-sm w-full py-2"
          >
            Prefiero escribir mi direccion
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Calle, numero, sector, referencia"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button
            onClick={() => manual.trim() && onResolved({ manual })}
            className="btn-primary"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
