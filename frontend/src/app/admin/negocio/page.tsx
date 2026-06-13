'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const NEUTRAL_PRIMARY = '#9CA3AF';
const FIXED_BG = '#0B0B0F';
const FIXED_CARD = '#15151D';
const FIXED_ACCENT = '#E53935';

interface Branding {
  nombre: string;
  slug: string;
  plan?: string;
  paidUntil?: string | null;
  logo?: string | null;
  bannerUrl?: string | null;
  colorPrimary: string;
  colorBg: string;
  colorCard: string;
  colorAccent: string;
}

async function extractBrandColor(url: string): Promise<string | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const SIZE = 32;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
        const freq: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          const brightness = (r + g + b) / 3;
          const saturation = Math.max(r, g, b) - Math.min(r, g, b);
          if (brightness < 25 || brightness > 230 || saturation < 40) continue;
          const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
          freq[key] = (freq[key] || 0) + 1;
        }
        const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        if (!best) { resolve(null); return; }
        const [r, g, b] = best[0].split(',').map(Number);
        resolve(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

export default function MiNegocio() {
  const [data, setData] = useState<Branding | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [detecting, setDetecting] = useState(false);
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
        return api<{ horaApertura: string; horaCierre: string; abierto: boolean }>(
          `/config?business=${b.slug}`,
        );
      })
      .then((h) => setHorario({ horaApertura: h.horaApertura, horaCierre: h.horaCierre, abierto: h.abierto }))
      .catch(() => {});
  }, []);

  // Auto-detect on initial load if logo exists
  useEffect(() => {
    if (!data?.logo) return;
    runDetect(data.logo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.logo]);

  const runDetect = async (logoUrl: string) => {
    if (!logoUrl) {
      setData((d) => d ? { ...d, colorPrimary: NEUTRAL_PRIMARY } : d);
      return;
    }
    setDetecting(true);
    const color = await extractBrandColor(logoUrl);
    setDetecting(false);
    setData((d) => d ? { ...d, colorPrimary: color ?? NEUTRAL_PRIMARY } : d);
  };

  const saveHorario = async (
    patch?: Partial<{ horaApertura: string; horaCierre: string; abierto: boolean }>,
  ) => {
    if (!horario) return;
    const next = { ...horario, ...patch };
    setHorario(next);
    setSavingHorario(true);
    setMsgHorario('');
    try {
      await api('/config', { method: 'PATCH', body: JSON.stringify(next) });
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
          colorBg: FIXED_BG,
          colorCard: FIXED_CARD,
          colorAccent: FIXED_ACCENT,
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

      {/* ===== Suscripcion ===== */}
      {data.paidUntil !== undefined && (
        <div className="bg-card rounded-2xl p-4 mb-4 max-w-2xl text-sm">
          {data.paidUntil === null ? (
            <p className="text-blue-300">Plan {data.plan || 'BETA'} — sin vencimiento (cortesia).</p>
          ) : new Date(data.paidUntil) < new Date() ? (
            <p className="text-red-300 font-semibold">
              ⚠️ Suscripcion vencida el{' '}
              {new Date(data.paidUntil).toLocaleDateString('es-DO')}. Tu tienda
              esta oculta para los clientes. Contacta a la plataforma para renovar.
            </p>
          ) : (
            <p className="text-green-300">
              Plan {data.plan} — al dia. Vence el{' '}
              {new Date(data.paidUntil).toLocaleDateString('es-DO')}.
            </p>
          )}
        </div>
      )}

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
                onChange={(e) => setHorario({ ...horario, horaApertura: e.target.value })}
                onBlur={() => saveHorario()}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Cierra a las</label>
              <input
                type="time"
                className="input"
                value={horario.horaCierre}
                onChange={(e) => setHorario({ ...horario, horaCierre: e.target.value })}
                onBlur={() => saveHorario()}
              />
            </div>
          </div>
          {msgHorario && <p className="text-xs text-primary mt-2">{msgHorario}</p>}
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
            <label className="text-sm font-medium block mb-1">Logo (opcional)</label>
            <input
              className="input"
              placeholder="https://...logo.png"
              value={data.logo || ''}
              onChange={(e) => set('logo', e.target.value)}
              onBlur={(e) => runDetect(e.target.value)}
            />
            <div className="flex items-center gap-2 mt-1.5 min-h-[20px]">
              {data.logo ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                    style={{ background: data.colorPrimary }}
                  />
                  <span className="text-xs text-muted">
                    {detecting ? 'Detectando color...' : `Color principal: ${data.colorPrimary}`}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted">
                  Sin logo — colores neutros
                </span>
              )}
            </div>
          </div>

          <button onClick={save} disabled={saving || detecting} className="btn-primary">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {msg && <p className="text-sm text-primary">{msg}</p>}
        </div>

        {/* Vista previa */}
        <div>
          <p className="text-sm font-medium mb-2">Vista previa</p>
          <div
            className="rounded-2xl overflow-hidden border border-white/10 relative h-32"
            style={{ background: FIXED_CARD }}
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
            El color principal se extrae automaticamente de tu logo.
          </p>
        </div>
      </div>
    </div>
  );
}
