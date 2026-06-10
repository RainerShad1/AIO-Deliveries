'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Branding {
  nombre: string;
  slug: string;
  logo?: string | null;
  bannerUrl?: string | null;
  colorPrimary: string;
  colorBg: string;
  colorCard: string;
  colorAccent: string;
}

export default function MiNegocio() {
  const [data, setData] = useState<Branding | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  // Estado/horario del negocio (interruptor abierto/cerrado manual)
  const [horario, setHorario] = useState<{
    horaApertura: string;
    horaCierre: string;
    abierto: boolean;
  } | null>(null);
  const [savingHorario, setSavingHorario] = useState(false);
  const [msgHorario, setMsgHorario] = useState('');

  useEffect(() => {
    api<Branding>('/config/branding')
      .then((b) => {
        setData(b);
        // El horario publico se consulta por slug
        return api<{
          horaApertura: string;
          horaCierre: string;
          abierto: boolean;
        }>(`/config?business=${b.slug}`);
      })
      .then((h) =>
        setHorario({
          horaApertura: h.horaApertura,
          horaCierre: h.horaCierre,
          abierto: h.abierto,
        }),
      )
      .catch(() => {});
  }, []);

  const saveHorario = async (
    patch?: Partial<{
      horaApertura: string;
      horaCierre: string;
      abierto: boolean;
    }>,
  ) => {
    if (!horario) return;
    const next = { ...horario, ...patch };
    setHorario(next);
    setSavingHorario(true);
    setMsgHorario('');
    try {
      await api('/config', {
        method: 'PATCH',
        body: JSON.stringify(next),
      });
      setMsgHorario('Guardado ✓');
    } catch (e: any) {
      setMsgHorario(e.message || 'Error al guardar');
    } finally {
      setSavingHorario(false);
    }
  };

  const set = (k: keyof Branding, v: string) =>
    setData((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg('');
    try {
      await api('/config/branding', {
        method: 'PATCH',
        body: JSON.stringify({
          bannerUrl: data.bannerUrl || '',
          logo: data.logo || '',
          colorPrimary: data.colorPrimary,
          colorBg: data.colorBg,
          colorCard: data.colorCard,
          colorAccent: data.colorAccent,
        }),
      });
      setMsg('Guardado ✓');
    } catch (e: any) {
      setMsg(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold mb-1">Mi negocio</h1>
      <p className="text-muted text-sm mb-6">
        Personaliza como se ve {data.nombre} para tus clientes.
      </p>

      {/* ===== Estado y horario ===== */}
      {horario && (
        <div className="bg-card rounded-2xl p-4 mb-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {horario.abierto ? '🟢 Tienda abierta' : '🔴 Tienda cerrada'}
              </p>
              <p className="text-muted text-xs mt-0.5">
                {horario.abierto
                  ? 'Recibiendo pedidos dentro del horario.'
                  : 'Cierre manual: no se reciben pedidos aunque sea horario.'}
              </p>
            </div>
            {/* Interruptor manual: abre/cierra fuera del horario automatico */}
            <button
              onClick={() => saveHorario({ abierto: !horario.abierto })}
              disabled={savingHorario}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
                horario.abierto ? 'bg-green-500' : 'bg-white/15'
              }`}
              aria-label={horario.abierto ? 'Cerrar tienda' : 'Abrir tienda'}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                  horario.abierto ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="text-xs text-muted block mb-1">Abre a las</label>
              <input
                type="time"
                className="input"
                value={horario.horaApertura}
                onChange={(e) =>
                  setHorario({ ...horario, horaApertura: e.target.value })
                }
                onBlur={() => saveHorario()}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                Cierra a las
              </label>
              <input
                type="time"
                className="input"
                value={horario.horaCierre}
                onChange={(e) =>
                  setHorario({ ...horario, horaCierre: e.target.value })
                }
                onBlur={() => saveHorario()}
              />
            </div>
          </div>
          {msgHorario && (
            <p className="text-xs text-primary mt-2">{msgHorario}</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Imagen de portada (banner)
            </label>
            <input
              className="input"
              placeholder="https://...imagen.jpg"
              value={data.bannerUrl || ''}
              onChange={(e) => set('bannerUrl', e.target.value)}
            />
            <p className="text-muted text-xs mt-1">
              Pega el enlace de una imagen. Aparece de fondo en tu tarjeta.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Logo (opcional)
            </label>
            <input
              className="input"
              placeholder="https://...logo.png"
              value={data.logo || ''}
              onChange={(e) => set('logo', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Color principal"
              value={data.colorPrimary}
              onChange={(v) => set('colorPrimary', v)}
            />
            <ColorField
              label="Color de acento"
              value={data.colorAccent}
              onChange={(v) => set('colorAccent', v)}
            />
            <ColorField
              label="Fondo"
              value={data.colorBg}
              onChange={(v) => set('colorBg', v)}
            />
            <ColorField
              label="Tarjetas"
              value={data.colorCard}
              onChange={(v) => set('colorCard', v)}
            />
          </div>

          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {msg && <p className="text-sm text-primary">{msg}</p>}
        </div>

        {/* Vista previa de la tarjeta tal como la vera el cliente */}
        <div>
          <p className="text-sm font-medium mb-2">Vista previa</p>
          <div
            className="rounded-2xl overflow-hidden border border-white/10 relative h-32"
            style={{ background: data.colorCard }}
          >
            {data.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.bannerUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {data.bannerUrl && (
              <span
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(11,11,15,0.15) 0%, rgba(11,11,15,0.55) 45%, rgba(11,11,15,0.92) 100%)',
                }}
              />
            )}
            <span
              className="absolute left-1.5 top-1.5 bottom-1.5 w-1.5 rounded-full"
              style={{ background: data.colorPrimary }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3 pl-4">
              <p className="font-bold text-white">{data.nombre}</p>
              <div className="flex items-center gap-3 text-xs mt-1">
                <span className="flex items-center gap-1 text-gray-200">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                  Abierto
                </span>
                <span className="text-gray-300">9:00 AM-10:00 PM</span>
              </div>
            </div>
          </div>
          <p className="text-muted text-xs mt-2">
            Asi aparece tu negocio en la lista. El degradado oscurece la parte
            de abajo para que el texto se lea.
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg bg-transparent border border-white/10 cursor-pointer shrink-0"
        />
        <input
          className="input flex-1 text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
