'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/store/auth';
import type { Order, OrderStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import BottomNav from '@/components/BottomNav';

const STEPS: OrderStatus[] = ['ENVIADO', 'EN_CAMINO', 'ENTREGADO'];

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => {});

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    // Unirse a la sala personal para recibir cambios de estado
    const join = () => {
      if (userId) socket.emit('join', `user:${userId}`);
    };
    join();
    socket.on('connect', join); // re-join tras reconexion (red movil)
    const handler = (updated: Order) => {
      if (updated.id === id) setOrder(updated);
    };
    socket.on('order:status', handler);
    return () => {
      socket.off('connect', join);
      socket.off('order:status', handler);
    };
  }, [id, userId]);

  if (!order) return <div className="p-6 text-muted">Cargando...</div>;

  const currentIdx = STEPS.indexOf(order.status as OrderStatus);
  const cancelado = order.status === 'CANCELADO';

  return (
    <main className="px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{order.numero}</h1>
        <StatusBadge status={order.status} />
      </div>

      {/* Estimado de llegada segun el estado */}
      {order.status === 'ENVIADO' && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">🕒</span>
          <div>
            <p className="font-semibold">Llega en 15–30 min aprox.</p>
            <p className="text-muted text-sm">
              Estamos preparando tu pedido.
            </p>
          </div>
        </div>
      )}
      {order.status === 'EN_CAMINO' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">🛵</span>
          <div>
            <p className="font-semibold">Llega pronto, 10–15 min aprox.</p>
            <p className="text-muted text-sm">Tu pedido va en camino.</p>
          </div>
        </div>
      )}
      {order.status === 'ENTREGADO' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold">Pedido entregado</p>
            <p className="text-muted text-sm">Buen provecho!</p>
          </div>
        </div>
      )}

      {/* Linea de progreso */}
      {!cancelado && (
        <div className="flex items-center mb-8">
          {STEPS.map((step, i) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                  i <= currentIdx
                    ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/40'
                    : 'bg-card text-muted'
                }`}
              >
                {i < currentIdx ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-1 bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: i < currentIdx ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 mb-4 animate-fade-in-up">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between py-1">
            <span>
              {it.cantidad}x {it.product.nombre}
            </span>
            <span className="text-muted">RD${it.precioUnit}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-white/10">
          <span>Total</span>
          <span className="text-accent">RD${order.total}</span>
        </div>
      </div>

      {order.delivery && (
        <div className="bg-card rounded-2xl p-4">
          <p className="text-muted text-sm">Tu repartidor</p>
          <p className="font-semibold">{order.delivery.nombre}</p>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
