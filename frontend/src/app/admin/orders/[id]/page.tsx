'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import SendToDeliveryButton from '@/components/admin/SendToDeliveryButton';

interface Delivery {
  id: string;
  nombre: string;
  telefono: string;
}

const NEXT_STATUS: Record<string, { label: string; value: OrderStatus }[]> = {
  ENVIADO: [{ label: 'Marcar en camino', value: 'EN_CAMINO' }],
  EN_CAMINO: [{ label: 'Marcar entregado', value: 'ENTREGADO' }],
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryId, setDeliveryId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api<Order>(`/orders/${id}`).then(setOrder);

  useEffect(() => {
    load();
    api<Delivery[]>('/deliveries')
      .then((d) => {
        setDeliveries(d);
        if (d[0]) setDeliveryId(d[0].id);
      })
      .catch(() => {});
  }, [id]);

  const changeStatus = async (status: OrderStatus) => {
    setBusy(true);
    await api(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await load();
    setBusy(false);
  };

  const assign = async () => {
    setBusy(true);
    await api(`/orders/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ deliveryId }),
    });
    await load();
    setBusy(false);
  };

  const cancel = async () => {
    if (!confirm('Cancelar este pedido?')) return;
    setBusy(true);
    await api(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELADO' }),
    });
    await load();
    setBusy(false);
  };

  if (!order) return <p className="text-muted">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{order.numero}</h1>
        <StatusBadge status={order.status} />
      </div>

      {/* Datos cliente */}
      <div className="bg-card rounded-2xl p-4 mb-3">
        <p className="font-semibold">{order.user?.nombre}</p>
        <p className="text-muted text-sm">{order.user?.telefono}</p>

        {/* Ubicacion de entrega: SIEMPRE texto, y si hay coordenadas, mapa + boton */}
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-xs text-muted mb-1">📍 Direccion de entrega</p>
          <p className="text-sm">{order.address?.direccion || '—'}</p>

          {order.address?.lat != null && order.address?.lng != null ? (
            <>
              {/* Vista previa del mapa (Static Maps si hay key) */}
              {mapsKey && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${order.address.lat},${order.address.lng}&zoom=16&size=600x220&scale=2&markers=color:red%7C${order.address.lat},${order.address.lng}&key=${mapsKey}`}
                  alt="Mapa de la entrega"
                  className="w-full rounded-xl mt-2 border border-white/10"
                />
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${order.address.lat},${order.address.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 bg-primary text-black font-semibold rounded-xl px-3 py-2 text-sm"
              >
                🧭 Navegar hasta aqui
              </a>
            </>
          ) : (
            <p className="text-amber-300/80 text-xs mt-1">
              Sin coordenadas GPS. Guiate por la direccion escrita.
            </p>
          )}
        </div>

        {order.nota && (
          <p className="text-sm mt-3 italic">Nota: {order.nota}</p>
        )}
      </div>

      {/* Items */}
      <div className="bg-card rounded-2xl p-4 mb-3">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between py-1">
            <span>
              {it.cantidad}x {it.product.nombre}
            </span>
            <span className="text-muted">
              RD${(Number(it.precioUnit) * it.cantidad).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-2 pt-2 border-t border-white/10">
          <span>Total</span>
          <span className="text-accent">RD${order.total}</span>
        </div>
      </div>

      {/* Delivery: asignar + enviar por WhatsApp */}
      {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
        <div className="bg-card rounded-2xl p-4 mb-3 space-y-3">
          <p className="font-semibold">Delivery</p>
          <div className="flex gap-2">
            <select
              className="input flex-1"
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
            >
              {deliveries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — {d.telefono}
                </option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={busy}
              className="bg-primary text-black rounded-xl px-4"
            >
              Asignar
            </button>
          </div>
          {order.delivery && (
            <p className="text-muted text-sm">
              Asignado a:{' '}
              <span className="text-white">{order.delivery.nombre}</span>
            </p>
          )}
          {order.delivery && (
            <SendToDeliveryButton
              order={order}
              onSent={() => {
                if (order.status === 'ENVIADO') changeStatus('EN_CAMINO');
              }}
            />
          )}
        </div>
      )}

      {/* Acciones de estado */}
      <div className="flex flex-wrap gap-2">
        {(NEXT_STATUS[order.status] ?? []).map((s) => (
          <button
            key={s.value}
            onClick={() => changeStatus(s.value)}
            disabled={busy}
            className="bg-primary text-black rounded-xl px-4 py-3 flex-1"
          >
            {s.label}
          </button>
        ))}
        {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
          <button
            onClick={cancel}
            disabled={busy}
            className="bg-card text-red-300 rounded-xl px-4 py-3"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="bg-card rounded-xl px-4 py-3"
        >
          🖨️ Ticket
        </button>
      </div>
    </div>
  );
}
