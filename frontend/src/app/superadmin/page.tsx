'use client';
import { useEffect, useState } from 'react';
import { Plus, Store, Package, ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';

interface BizRow {
  id: string;
  slug: string;
  nombre: string;
  activo: boolean;
  colorPrimary: string;
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

  const load = () => {
    api<BizRow[]>('/superadmin/businesses')
      .then(setBusinesses)
      .catch(() => {})
      .finally(() => setLoading(false));
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
