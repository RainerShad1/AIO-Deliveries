'use client';
import Link from 'next/link';
import type { Order } from '@/types';
import StatusBadge from '@/components/StatusBadge';

export default function OrderRow({ order }: { order: Order }) {
  const time = new Date(order.createdAt).toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="bg-card rounded-xl p-3 flex items-center justify-between hover:bg-white/5"
    >
      <div>
        <p className="font-semibold">{order.numero}</p>
        <p className="text-muted text-xs">
          {order.user?.nombre ?? 'Cliente'} · {time}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-accent font-bold">RD${order.total}</span>
        <StatusBadge status={order.status} />
      </div>
    </Link>
  );
}
