'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Delivery {
  id: string;
  nombre: string;
  telefono: string;
}

export default function AdminDeliverys() {
  const [deliverys, setDeliverys] = useState<Delivery[]>([]);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => api<Delivery[]>('/deliveries').then(setDeliverys);
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setError('');
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Completa el nombre y el telefono');
      return;
    }
    // Validacion simple: 10 digitos
    const tel = form.telefono.replace(/\D/g, '');
    if (tel.length !== 10) {
      setError('El telefono debe tener 10 digitos');
      return;
    }
    setBusy(true);
    try {
      await api('/deliveries', {
        method: 'POST',
        body: JSON.stringify({ nombre: form.nombre, telefono: tel }),
      });
      setForm({ nombre: '', telefono: '' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, nombre: string) => {
    if (!confirm(`Eliminar al delivery "${nombre}"?`)) return;
    await api(`/deliveries/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-5">Deliverys</h1>

      {/* Formulario agregar */}
      <div className="bg-card rounded-2xl p-4 mb-6 space-y-3">
        <p className="font-semibold">Agregar nuevo delivery</p>
        <input
          className="input"
          placeholder="Nombre del repartidor"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          className="input"
          placeholder="Telefono (10 digitos, para WhatsApp)"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
        {error && <p className="text-primary text-sm">{error}</p>}
        <button onClick={add} disabled={busy} className="btn-primary">
          {busy ? 'Agregando...' : 'Agregar delivery'}
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {deliverys.map((d) => (
          <div
            key={d.id}
            className="bg-card rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{d.nombre}</p>
              <p className="text-muted text-sm">{d.telefono}</p>
            </div>
            <button
              onClick={() => remove(d.id, d.nombre)}
              className="text-red-300 text-sm px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              🗑️ Eliminar
            </button>
          </div>
        ))}
        {deliverys.length === 0 && (
          <p className="text-muted text-center py-8 text-sm">
            No hay deliverys registrados. Agrega uno arriba.
          </p>
        )}
      </div>
    </div>
  );
}
