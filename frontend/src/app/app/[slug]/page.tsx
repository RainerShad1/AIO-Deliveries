'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { Business } from '@/types';
import { useBusiness } from '@/store/business';
import { applyBranding } from '@/lib/branding';
import BottomNav from '@/components/BottomNav';

interface GroupResp {
  slug: string;
  nombre: string;
  logo?: string | null;
  businesses: Business[];
}

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

// Puerta de la APP PROPIA de un cliente (white-label): /app/<slug>.
// Muestra SOLO los negocios de ese grupo, con su marca, y "encierra" la
// navegacion en el grupo (BottomNav y back no escapan al marketplace).
export default function WhiteLabelApp() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const setActive = useBusiness((s) => s.setActive);
  const setLockedApp = useBusiness((s) => s.setLockedApp);
  const [group, setGroup] = useState<GroupResp | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    applyBranding(null);
    api<GroupResp>(`/businesses/group/${slug}`)
      .then((g) => {
        setGroup(g);
        setLockedApp({ slug: g.slug, nombre: g.nombre, logo: g.logo });
        // Un solo negocio: directo a su tienda, sin pantalla intermedia.
        if (g.businesses.length === 1) {
          const b = g.businesses[0];
          setActive(b);
          applyBranding(b);
          router.replace(`/menu?business=${b.slug}`);
        }
      })
      .catch(() => setNotFound(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const entrar = (b: Business) => {
    setActive(b);
    applyBranding(b);
    router.push(`/menu?business=${b.slug}`);
  };

  if (notFound) {
    return (
      <main className="px-5 py-16 text-center">
        <p className="text-lg font-bold">App no encontrada</p>
        <p className="text-muted text-sm mt-1">
          Verifica el enlace con el negocio.
        </p>
      </main>
    );
  }

  if (!group) return <div className="p-6 text-muted">Cargando...</div>;

  return (
    <main className="pb-28">
      {/* Cabecera con la marca del CLIENTE (no de AIO) */}
      <div className="px-5 pt-10 pb-5 flex flex-col items-center text-center">
        {group.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.logo}
            alt={group.nombre}
            className="w-20 h-20 rounded-2xl object-cover"
          />
        ) : (
          <span className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-extrabold text-black">
            {group.nombre.charAt(0)}
          </span>
        )}
        <h1 className="text-2xl font-extrabold mt-3">{group.nombre}</h1>
        <p className="text-muted text-sm mt-1">Elige donde quieres pedir</p>
      </div>

      <div className="px-4 space-y-3 stagger">
        {group.businesses.length === 0 ? (
          <p className="text-muted text-center py-10">
            No hay tiendas disponibles por ahora.
          </p>
        ) : (
          group.businesses.map((b) => {
            const open = abiertoAhora(b);
            return (
              <button
                key={b.id}
                onClick={() => entrar(b)}
                className="w-full text-left rounded-2xl overflow-hidden border border-white/10 relative h-28 transition active:scale-[0.99]"
                style={{ background: b.colorCard }}
              >
                {b.bannerUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.bannerUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(11,11,15,0.15) 0%, rgba(11,11,15,0.55) 45%, rgba(11,11,15,0.92) 100%)',
                      }}
                    />
                  </>
                )}
                <span
                  className="absolute left-1.5 top-1.5 bottom-1.5 w-1.5 rounded-full"
                  style={{ background: b.colorPrimary }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 pl-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/20"
                      />
                    ) : (
                      <span
                        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-extrabold text-black text-sm"
                        style={{ background: b.colorPrimary }}
                      >
                        {b.nombre.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                    <p className="font-bold text-white truncate">{b.nombre}</p>
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
                        <Clock size={11} /> {to12h(b.horaApertura)}-
                        {to12h(b.horaCierre)}
                      </span>
                    </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 shrink-0" />
                </div>
              </button>
            );
          })
        )}
      </div>
      <BottomNav />
    </main>
  );
}
