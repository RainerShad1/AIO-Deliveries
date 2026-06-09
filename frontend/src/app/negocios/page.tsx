'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { Business } from '@/types';
import { useBusiness } from '@/store/business';
import { applyBranding } from '@/lib/branding';

// Convierte "23:00" -> "11:00 PM"
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function abiertoAhora(b: Business): boolean {
  if (!b.abierto) return false;
  const hhmm = new Date().toTimeString().slice(0, 5);
  return hhmm >= b.horaApertura && hhmm <= b.horaCierre;
}

export default function Negocios() {
  const router = useRouter();
  const setActive = useBusiness((s) => s.setActive);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Al entrar a la lista, volvemos a la paleta por defecto (no hay negocio activo)
  useEffect(() => {
    applyBranding(null);
    api<Business[]>('/businesses')
      .then(setBusinesses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const entrar = (b: Business) => {
    setActive(b);
    applyBranding(b);
    router.push(`/menu?business=${b.slug}`);
  };

  return (
    <main className="pb-10">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">Negocios cerca de ti</h1>
        <p className="text-muted text-sm mt-1 flex items-center gap-1">
          <MapPin size={14} /> Elige donde quieres pedir
        </p>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-28" />
          ))
        ) : businesses.length === 0 ? (
          <p className="text-muted text-center py-10">
            No hay negocios disponibles por ahora.
          </p>
        ) : (
          <div className="space-y-3 stagger">
            {businesses.map((b) => {
              const open = abiertoAhora(b);
              const horario = `${to12h(b.horaApertura)}-${to12h(b.horaCierre)}`;
              // Con banner: tarjeta tipo portada con imagen + degradado oscuro.
              if (b.bannerUrl) {
                return (
                  <button
                    key={b.id}
                    onClick={() => entrar(b)}
                    className="w-full text-left rounded-2xl overflow-hidden border border-white/10 relative h-32 transition active:scale-[0.99]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.bannerUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Degradado: transparente arriba -> oscuro abajo (legible) */}
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(11,11,15,0.15) 0%, rgba(11,11,15,0.55) 45%, rgba(11,11,15,0.92) 100%)',
                      }}
                    />
                    {/* Franja de color del negocio */}
                    <span
                      className="absolute left-1.5 top-1.5 bottom-1.5 w-1.5 rounded-full"
                      style={{ background: b.colorPrimary }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 pl-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">
                          {b.nombre}
                        </p>
                        <div className="flex items-center gap-3 text-xs mt-1">
                          <span className="flex items-center gap-1">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                open ? 'bg-green-400' : 'bg-red-400'
                              }`}
                            />
                            <span className="text-gray-200">
                              {open ? 'Abierto' : 'Cerrado'}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-gray-300">
                            <Clock size={11} /> {horario}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 shrink-0" />
                    </div>
                  </button>
                );
              }
              // Sin banner: respaldo con inicial + color (tarjeta original).
              return (
                <button
                  key={b.id}
                  onClick={() => entrar(b)}
                  className="w-full text-left rounded-2xl overflow-hidden border border-white/10 flex items-stretch transition active:scale-[0.99]"
                  style={{ background: b.colorCard }}
                >
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: b.colorPrimary }}
                  />
                  <div className="flex items-center gap-3 p-3 flex-1 min-w-0">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo}
                        alt={b.nombre}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <span
                        className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-xl font-extrabold text-black"
                        style={{ background: b.colorPrimary }}
                      >
                        {b.nombre.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{b.nombre}</p>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${
                              open ? 'bg-green-400' : 'bg-red-400'
                            }`}
                          />
                          <span className="text-muted">
                            {open ? 'Abierto' : 'Cerrado'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-muted">
                          <Clock size={11} /> {horario}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-muted shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
