'use client';
import { useEffect, useState } from 'react';
import { Plus, Store, Package, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';

interface Group {
  id: string;
  slug: string;
  nombre: string;
  businesses: { id: string; nombre: string; slug: string }[];
}

interface BizRow {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
  colorPrimary: string;
  plan: string;
  paidUntil: string | null;
  enMarketplace: boolean;
  groupId: string | null;
  createdAt: string;
  admins: { id: string; nombre: string; cedula: string; telefono: string }[];
  _count: { orders: number; products: number };
}

const FORM_INICIAL = {
  nombre: '',
  slug: '',
  adminNombre: '',
  adminCedula: '',
  adminTelefono: '',
  adminPassword: '',
};

export default function SuperadminHome() {
  const [businesses, setBusinesses] = useState<BizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  // Pago: id del negocio al que se le esta registrando un pago
  const [payingId, setPayingId] = useState<string | null>(null);
  const [pago, setPago] = useState({ monto: '', meses: '1', metodo: 'transferencia', nota: '' });
  const [savingPago, setSavingPago] = useState(false);
  const [errorPago, setErrorPago] = useState('');
  // Grupos (white-label)
  const [groups, setGroups] = useState<Group[]>([]);
  const [grupoForm, setGrupoForm] = useState({ nombre: '', slug: '' });
  const [showGrupoForm, setShowGrupoForm] = useState(false);
  const [errorGrupo, setErrorGrupo] = useState('');

  const load = () => {
    api<BizRow[]>('/superadmin/businesses')
      .then(setBusinesses)
      .catch(() => {})
      .finally(() => setLoading(false));
    api<Group[]>('/superadmin/groups')
      .then(setGroups)
      .catch(() => {});
  };
  useEffect(load, []);

  // Sugerir slug automaticamente desde el nombre
  const setNombre = (nombre: string) => {
    const slug = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setForm((f) => ({ ...f, nombre, slug }));
  };

  const crear = async () => {
    setError('');
    setOkMsg('');
    if (
      !form.nombre ||
      !form.slug ||
      !form.adminNombre ||
      !form.adminCedula ||
      !form.adminTelefono ||
      !form.adminPassword
    ) {
      setError('Completa todos los campos');
      return;
    }
    setSaving(true);
    try {
      await api('/superadmin/businesses', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          adminCedula: form.adminCedula.replace(/-/g, ''),
        }),
      });
      setOkMsg(`Negocio "${form.nombre}" creado con su admin.`);
      setForm(FORM_INICIAL);
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Estado de la suscripcion para mostrar la etiqueta
  const subEstado = (b: BizRow) => {
    if (!b.paidUntil) return { label: `Plan ${b.plan} (exento)`, cls: 'bg-blue-500/15 text-blue-300' };
    const fin = new Date(b.paidUntil);
    const dias = Math.ceil((fin.getTime() - Date.now()) / 86400000);
    if (dias < 0) return { label: 'VENCIDA', cls: 'bg-red-500/20 text-red-300' };
    if (dias <= 7) return { label: `Vence en ${dias} dia${dias === 1 ? '' : 's'}`, cls: 'bg-amber-500/15 text-amber-300' };
    return { label: `Al dia · vence ${fin.toLocaleDateString('es-DO')}`, cls: 'bg-green-500/15 text-green-300' };
  };

  const registrarPago = async (businessId: string) => {
    setErrorPago('');
    const monto = parseFloat(pago.monto);
    const meses = parseInt(pago.meses, 10);
    if (isNaN(monto) || monto < 0 || isNaN(meses) || meses < 1) {
      setErrorPago('Monto y meses validos requeridos');
      return;
    }
    setSavingPago(true);
    try {
      await api(`/superadmin/businesses/${businessId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          monto,
          meses,
          metodo: pago.metodo,
          nota: pago.nota || undefined,
        }),
      });
      setPayingId(null);
      setPago({ monto: '', meses: '1', metodo: 'transferencia', nota: '' });
      load();
    } catch (e: any) {
      setErrorPago(e.message);
    } finally {
      setSavingPago(false);
    }
  };

  const crearGrupo = async () => {
    setErrorGrupo('');
    if (!grupoForm.nombre || !grupoForm.slug) {
      setErrorGrupo('Nombre y slug requeridos');
      return;
    }
    try {
      await api('/superadmin/groups', {
        method: 'POST',
        body: JSON.stringify(grupoForm),
      });
      setGrupoForm({ nombre: '', slug: '' });
      setShowGrupoForm(false);
      load();
    } catch (e: any) {
      setErrorGrupo(e.message);
    }
  };

  // Patch generico de un negocio (grupo, marketplace) con refresco optimista
  const patchBusiness = async (id: string, data: Partial<BizRow>) => {
    setBusinesses((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...data } : x)),
    );
    try {
      await api(`/superadmin/businesses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      load();
    }
  };

  const toggleActivo = async (b: BizRow) => {
    // Optimista: refleja el cambio de una; si falla, recarga
    setBusinesses((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, activo: !x.activo } : x)),
    );
    try {
      await api(`/superadmin/businesses/${b.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !b.activo }),
      });
    } catch {
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-extrabold">Negocios</h2>
          <p className="text-muted text-sm">
            {businesses.length} en la plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary text-black font-semibold rounded-xl px-4 py-2.5 text-sm flex items-center gap-1.5"
        >
          <Plus size={16} /> Nuevo negocio
        </button>
      </div>

      {okMsg && (
        <p className="bg-green-500/10 text-green-300 text-sm rounded-xl p-3 mb-4">
          {okMsg}
        </p>
      )}

      {/* ===== Formulario de alta ===== */}
      {showForm && (
        <div className="bg-card rounded-2xl p-4 mb-6 space-y-3">
          <p className="font-semibold">Datos del negocio</p>
          <input
            className="input"
            placeholder="Nombre del negocio (ej. Farmacia Central)"
            value={form.nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <div>
            <input
              className="input"
              placeholder="slug-para-url"
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase() })
              }
            />
            <p className="text-muted text-xs mt-1">
              Identificador en la URL. Se sugiere solo desde el nombre.
            </p>
          </div>

          <p className="font-semibold pt-2">Admin del negocio</p>
          <input
            className="input"
            placeholder="Nombre del administrador"
            value={form.adminNombre}
            onChange={(e) => setForm({ ...form, adminNombre: e.target.value })}
          />
          <input
            className="input"
            inputMode="numeric"
            placeholder="Cedula (11 digitos)"
            value={form.adminCedula}
            onChange={(e) => setForm({ ...form, adminCedula: e.target.value })}
          />
          <input
            className="input"
            inputMode="numeric"
            placeholder="Telefono"
            value={form.adminTelefono}
            onChange={(e) =>
              setForm({ ...form, adminTelefono: e.target.value })
            }
          />
          <input
            className="input"
            type="text"
            placeholder="Contrasena inicial (min. 8) — compartela con el dueno"
            value={form.adminPassword}
            onChange={(e) =>
              setForm({ ...form, adminPassword: e.target.value })
            }
          />

          {error && <p className="text-primary text-sm">{error}</p>}
          <button onClick={crear} disabled={saving} className="btn-primary">
            {saving ? 'Creando...' : 'Crear negocio + admin'}
          </button>
        </div>
      )}

      {/* ===== Lista ===== */}
      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {businesses.map((b) => (
            <div
              key={b.id}
              className={`bg-card rounded-2xl p-4 border border-white/10 ${
                !b.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-extrabold text-black"
                    style={{ background: b.colorPrimary }}
                  >
                    {b.nombre.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{b.nombre}</p>
                    <p className="text-muted text-xs">/{b.slug}</p>
                  </div>
                </div>
                {/* Suspender / reactivar */}
                <button
                  onClick={() => toggleActivo(b)}
                  className={`text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 ${
                    b.activo
                      ? 'bg-red-500/15 text-red-300'
                      : 'bg-green-500/15 text-green-300'
                  }`}
                >
                  {b.activo ? 'Suspender' : 'Reactivar'}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted mt-3">
                <span className="flex items-center gap-1">
                  <ShoppingBag size={13} /> {b._count.orders} pedidos
                </span>
                <span className="flex items-center gap-1">
                  <Package size={13} /> {b._count.products} productos
                </span>
                <span className="flex items-center gap-1">
                  <Store size={13} />{' '}
                  {b.admins[0]
                    ? `Admin: ${b.admins[0].nombre}`
                    : 'Sin admin'}
                </span>
              </div>

              {/* ===== White-label: grupo y visibilidad ===== */}
              <div className="flex items-center gap-2 mt-3">
                <select
                  className="input text-xs flex-1"
                  value={b.groupId || ''}
                  onChange={(e) =>
                    patchBusiness(b.id, {
                      groupId: e.target.value || null,
                    } as any)
                  }
                >
                  <option value="">Sin grupo (independiente)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      Grupo: {g.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    patchBusiness(b.id, { enMarketplace: !b.enMarketplace })
                  }
                  className={`text-xs rounded-lg px-2.5 py-2 shrink-0 ${
                    b.enMarketplace
                      ? 'bg-green-500/15 text-green-300'
                      : 'bg-white/10 text-muted'
                  }`}
                  title="Visibilidad en el marketplace publico"
                >
                  {b.enMarketplace ? '👁 En marketplace' : '🙈 Oculto'}
                </button>
              </div>

              {/* ===== Suscripcion ===== */}
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
                <span
                  className={`text-xs font-medium rounded-lg px-2.5 py-1 ${subEstado(b).cls}`}
                >
                  {subEstado(b).label}
                </span>
                <button
                  onClick={() => {
                    setPayingId(payingId === b.id ? null : b.id);
                    setErrorPago('');
                  }}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-primary/15 text-primary"
                >
                  {payingId === b.id ? 'Cancelar' : '💵 Registrar pago'}
                </button>
              </div>

              {payingId === b.id && (
                <div className="mt-3 bg-bg rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input text-sm"
                      inputMode="decimal"
                      placeholder="Monto RD$"
                      value={pago.monto}
                      onChange={(e) => setPago({ ...pago, monto: e.target.value })}
                    />
                    <select
                      className="input text-sm"
                      value={pago.meses}
                      onChange={(e) => setPago({ ...pago, meses: e.target.value })}
                    >
                      {[1, 2, 3, 6, 12].map((m) => (
                        <option key={m} value={m}>
                          {m} mes{m > 1 ? 'es' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    className="input text-sm"
                    value={pago.metodo}
                    onChange={(e) => setPago({ ...pago, metodo: e.target.value })}
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    className="input text-sm"
                    placeholder="Nota (opcional)"
                    value={pago.nota}
                    onChange={(e) => setPago({ ...pago, nota: e.target.value })}
                  />
                  {errorPago && (
                    <p className="text-primary text-xs">{errorPago}</p>
                  )}
                  <button
                    onClick={() => registrarPago(b.id)}
                    disabled={savingPago}
                    className="w-full bg-primary text-black font-semibold rounded-xl py-2.5 text-sm"
                  >
                    {savingPago
                      ? 'Registrando...'
                      : `Registrar y extender ${pago.meses} mes${parseInt(pago.meses) > 1 ? 'es' : ''}`}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== Grupos / Apps white-label ===== */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold">Apps de clientes</h2>
            <p className="text-muted text-sm">
              Cada grupo es un cliente con su propia app (white-label).
            </p>
          </div>
          <button
            onClick={() => setShowGrupoForm((v) => !v)}
            className="bg-card border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {showGrupoForm ? 'Cancelar' : '+ Nuevo grupo'}
          </button>
        </div>

        {showGrupoForm && (
          <div className="bg-card rounded-2xl p-4 mb-4 space-y-3">
            <input
              className="input"
              placeholder="Nombre del cliente (ej. Grupo Perez)"
              value={grupoForm.nombre}
              onChange={(e) => {
                const nombre = e.target.value;
                const slug = nombre
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9\s-]/g, '')
                  .trim()
                  .replace(/\s+/g, '-');
                setGrupoForm({ nombre, slug });
              }}
            />
            <input
              className="input"
              placeholder="slug-de-la-app"
              value={grupoForm.slug}
              onChange={(e) =>
                setGrupoForm({ ...grupoForm, slug: e.target.value.toLowerCase() })
              }
            />
            {errorGrupo && <p className="text-primary text-sm">{errorGrupo}</p>}
            <button onClick={crearGrupo} className="btn-primary">
              Crear grupo
            </button>
          </div>
        )}

        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="bg-card rounded-2xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold truncate">{g.nombre}</p>
                  <p className="text-muted text-xs">
                    App: <span className="text-primary">/app/{g.slug}</span> ·{' '}
                    {g.businesses.length} negocio
                    {g.businesses.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <a
                  href={`/app/${g.slug}`}
                  target="_blank"
                  className="text-xs bg-primary/15 text-primary rounded-lg px-3 py-1.5 shrink-0"
                >
                  Ver app →
                </a>
              </div>
              {g.businesses.length > 0 && (
                <p className="text-muted text-xs mt-2">
                  {g.businesses.map((x) => x.nombre).join(' · ')}
                </p>
              )}
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-muted text-sm">
              Aun no hay grupos. Crea uno y asigna negocios desde su selector.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
