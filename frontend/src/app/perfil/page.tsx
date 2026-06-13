'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { Address } from '@/types';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import LocationPicker from '@/components/LocationPicker';
import AuthModal from '@/components/AuthModal';

interface Profile {
  id: string;
  cedula: string;
  nombre: string;
  telefono: string;
  addresses: Address[];
}

export default function Perfil() {
  const router = useRouter();
  const { token, hydrated, logout } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario de nueva direccion
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ etiqueta: '', direccion: '' });
  const [gps, setGps] = useState<{ lat?: number; lng?: number }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(true);

  const loadData = () => {
    Promise.all([
      api<Profile>('/users/me'),
      api<Address[]>('/users/me/addresses'),
    ])
      .then(([p, a]) => {
        setProfile(p);
        setAddresses(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!hydrated) return;
    if (token) loadData();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token]);

  const addAddress = async () => {
    setError('');
    if (!form.etiqueta.trim() || !form.direccion.trim()) {
      setError('Completa la etiqueta y la direccion');
      return;
    }
    // Coordenadas obligatorias: el delivery las necesita para llegar al punto.
    if (gps.lat == null || gps.lng == null) {
      setError('Marca tu ubicacion exacta en el mapa antes de guardar');
      return;
    }
    setSaving(true);
    try {
      await api('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify({
          etiqueta: form.etiqueta,
          direccion: form.direccion,
          lat: gps.lat,
          lng: gps.lng,
        }),
      });
      setForm({ etiqueta: '', direccion: '' });
      setGps({});
      setShowForm(false);
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (!confirm('Eliminar esta direccion?')) return;
    await api(`/users/me/addresses/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (!hydrated || loading) {
    return <div className="p-6 text-muted">Cargando...</div>;
  }

  // Sin sesion: pequena interfaz para entrar o registrarse, sin sacarlo
  // de la app (el modal flotante encima de una pantalla amigable).
  if (hydrated && !token) {
    return (
      <main className="px-4 pt-16 max-w-md mx-auto text-center">
        <div className="flex justify-center">
          <Logo size={72} />
        </div>
        <h1 className="text-xl font-extrabold mt-4">Tu perfil</h1>
        <p className="text-muted text-sm mt-2 mb-6">
          Inicia sesion o crea tu cuenta para guardar tus direcciones y ver
          tus pedidos.
        </p>
        <button onClick={() => setAuthOpen(true)} className="btn-primary">
          Iniciar sesion / Registrarme
        </button>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="px-4 pt-6 max-w-md mx-auto">
      {/* Encabezado con logo */}
      <div className="flex items-center gap-3 mb-6">
        <Logo size={48} />
        <div>
          <h1 className="text-xl font-extrabold leading-tight">Mi perfil</h1>
          <p className="text-muted text-xs">AIO Deliverys</p>
        </div>
      </div>

      {/* Datos del cliente */}
      {profile && (
        <div className="bg-card rounded-2xl p-4 mb-5">
          <p className="font-semibold text-lg">{profile.nombre}</p>
          <p className="text-muted text-sm mt-1">Cedula: {profile.cedula}</p>
          <p className="text-muted text-sm">Telefono: {profile.telefono}</p>
        </div>
      )}

      {/* Direcciones */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">Mis direcciones</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-primary text-sm font-semibold"
        >
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {/* Formulario nueva direccion */}
      {showForm && (
        <div className="bg-card rounded-2xl p-4 mb-4 space-y-3">
          <input
            className="input"
            placeholder="Etiqueta (Casa, Trabajo...)"
            value={form.etiqueta}
            onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
          />
          <input
            className="input"
            placeholder="Calle, numero, sector, referencia"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          />

          {/* Mapa: el cliente fija su punto exacto (obligatorio) */}
          <LocationPicker
            value={gps}
            onChange={(coords, suggested) => {
              setGps(coords);
              setError('');
              // Si el campo de texto esta vacio, prellenamos con la sugerencia
              setForm((f) =>
                f.direccion.trim() || !suggested
                  ? f
                  : { ...f, direccion: suggested },
              );
            }}
          />
          <p
            className={`text-xs ${
              gps.lat != null ? 'text-green-300' : 'text-muted'
            }`}
          >
            {gps.lat != null
              ? '✓ Ubicacion exacta marcada'
              : 'Marca tu ubicacion en el mapa'}
          </p>

          {error && <p className="text-primary text-sm">{error}</p>}
          <button
            onClick={addAddress}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Guardando...' : 'Guardar direccion'}
          </button>
        </div>
      )}

      {/* Lista de direcciones */}
      <div className="space-y-2 mb-6">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="bg-card rounded-xl p-3 flex items-start justify-between"
          >
            <div className="flex-1">
              <p className="font-medium">{a.etiqueta}</p>
              <p className="text-muted text-sm">{a.direccion}</p>
              {a.lat && (
                <p className="text-green-300/70 text-xs mt-1">📍 Con ubicacion GPS</p>
              )}
            </div>
            <button
              onClick={() => removeAddress(a.id)}
              className="text-red-300 text-sm px-2"
              aria-label="Eliminar"
            >
              🗑️
            </button>
          </div>
        ))}
        {addresses.length === 0 && (
          <p className="text-muted text-center py-6 text-sm">
            No tienes direcciones guardadas. Agrega una para poder pedir.
          </p>
        )}
      </div>

      {/* Cerrar sesion */}
      <button
        onClick={() => {
          logout();
          router.push('/login');
        }}
        className="w-full bg-card border border-white/10 rounded-xl py-3 text-muted"
      >
        Cerrar sesion
      </button>

      <BottomNav />
    </main>
  );
}
