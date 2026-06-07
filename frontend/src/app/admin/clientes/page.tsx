'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Client {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
}

export default function AdminClientes() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    setMsg('');
    try {
      const r = await api<Client[]>(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(r);
      if (r.length === 0) setMsg('No se encontraron clientes.');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSearching(false);
    }
  };

  const resetPassword = async (c: Client) => {
    const nueva = prompt(
      `Nueva contrasena para ${c.nombre} (minimo 8 caracteres):`,
    );
    if (!nueva) return;
    if (nueva.length < 8) {
      alert('La contrasena debe tener al menos 8 caracteres');
      return;
    }
    setResetting(c.id);
    try {
      await api(`/users/${c.id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: nueva }),
      });
      setMsg(
        `Contrasena de ${c.nombre} actualizada. Comunicasela de forma segura.`,
      );
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setResetting(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Clientes</h1>
      <p className="text-muted text-sm mb-5">
        Busca un cliente para restablecer su contrasena cuando la olvide
        (recuperacion asistida).
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Buscar por nombre o cedula"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button
          onClick={search}
          disabled={searching}
          className="bg-primary text-black rounded-xl px-5 font-semibold"
        >
          {searching ? '...' : 'Buscar'}
        </button>
      </div>

      {msg && (
        <div className="bg-card rounded-xl p-3 mb-4 text-sm text-amber-300">
          {msg}
        </div>
      )}

      <div className="space-y-2">
        {results.map((c) => (
          <div
            key={c.id}
            className="bg-card rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{c.nombre}</p>
              <p className="text-muted text-sm">
                Cedula: {c.cedula} · Tel: {c.telefono}
              </p>
            </div>
            <button
              onClick={() => resetPassword(c)}
              disabled={resetting === c.id}
              className="bg-primary/15 text-primary text-sm rounded-lg px-3 py-2 font-semibold"
            >
              {resetting === c.id ? '...' : '🔑 Resetear clave'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
