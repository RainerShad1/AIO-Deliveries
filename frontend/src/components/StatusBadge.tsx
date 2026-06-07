import type { OrderStatus } from '@/types';

const MAP: Record<OrderStatus, { label: string; color: string }> = {
  ENVIADO: { label: 'Pedido enviado', color: 'bg-blue-500/20 text-blue-300' },
  EN_CAMINO: { label: 'En camino', color: 'bg-amber-500/20 text-amber-300' },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-500/20 text-green-300' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-500/20 text-red-300' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const s = MAP[status];
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${s.color}`}>
      {s.label}
    </span>
  );
}
