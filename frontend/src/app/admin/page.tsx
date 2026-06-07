'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { useAdminOrders } from '@/store/adminSocket';
import MetricCard from '@/components/admin/MetricCard';
import OrderRow from '@/components/admin/OrderRow';
import SoundToggle from '@/components/admin/SoundToggle';

export default function AdminDashboard() {
  const [initial, setInitial] = useState<Order[]>([]);
  const { orders, soundOn, setSoundOn } = useAdminOrders(initial);

  useEffect(() => {
    api<Order[]>('/orders')
      .then(setInitial)
      .catch(() => {});
  }, []);

  // Metricas calculadas del dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
  const ganancias = todayOrders
    .filter((o) => o.status === 'ENTREGADO')
    .reduce((s, o) => s + Number(o.total), 0);
  const activos = orders.filter((o) =>
    ['ENVIADO', 'EN_CAMINO'].includes(o.status),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <SoundToggle on={soundOn} onToggle={() => setSoundOn(!soundOn)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Pedidos hoy" value={String(todayOrders.length)} />
        <MetricCard label="Pedidos activos" value={String(activos.length)} />
        <MetricCard
          label="Entregados hoy"
          value={String(
            todayOrders.filter((o) => o.status === 'ENTREGADO').length,
          )}
        />
        <MetricCard
          label="Ganancias hoy"
          value={`RD$${ganancias.toFixed(2)}`}
          accent
        />
      </div>

      <h2 className="font-bold mb-3">Pedidos activos</h2>
      <div className="space-y-2">
        {activos.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
        {activos.length === 0 && (
          <p className="text-muted text-center py-8">No hay pedidos activos.</p>
        )}
      </div>
    </div>
  );
}
