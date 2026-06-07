'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import StatusBadge from '@/components/StatusBadge';

export default function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'today'>('today');

  useEffect(() => {
    api<Order[]>('/orders')
      .then(setOrders)
      .catch(() => {});
  }, []);

  const rows = useMemo(() => {
    if (filter === 'all') return orders;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return orders.filter((o) => new Date(o.createdAt) >= t);
  }, [orders, filter]);

  const entregados = rows.filter((o) => o.status === 'ENTREGADO');
  const ganancias = entregados.reduce((s, o) => s + Number(o.total), 0);
  const ticket = entregados.length ? ganancias / entregados.length : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          {(['today', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm ${
                filter === f ? 'bg-primary text-black' : 'bg-card text-muted'
              }`}
            >
              {f === 'today' ? 'Hoy' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4">
          <p className="text-muted text-sm">Entregados</p>
          <p className="text-2xl font-extrabold">{entregados.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <p className="text-muted text-sm">Ganancias</p>
          <p className="text-2xl font-extrabold text-accent">
            RD${ganancias.toFixed(2)}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-4">
          <p className="text-muted text-sm">Ticket prom.</p>
          <p className="text-2xl font-extrabold">RD${ticket.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr className="border-b border-white/10">
              <th className="p-3">Pedido</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-white/5">
                <td className="p-3 font-medium">{o.numero}</td>
                <td className="p-3 text-muted">{o.user?.nombre ?? '—'}</td>
                <td className="p-3 text-accent">RD${o.total}</td>
                <td className="p-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
