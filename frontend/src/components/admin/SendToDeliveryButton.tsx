'use client';
import type { Order } from '@/types';
import { buildDeliveryWhatsApp } from '@/lib/whatsapp';

export default function SendToDeliveryButton({
  order,
  onSent,
}: {
  order: Order;
  onSent?: () => void;
}) {
  const handleClick = () => {
    if (!order.delivery) {
      alert('Primero asigna un delivery al pedido.');
      return;
    }
    const url = buildDeliveryWhatsApp(order);
    window.open(url, '_blank'); // en movil abre la app de WhatsApp
    onSent?.();
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#25D366] active:bg-[#1da851] text-white font-semibold rounded-xl px-4 py-3 w-full flex items-center justify-center gap-2"
    >
      <span className="text-lg">📲</span>
      Enviar a delivery por WhatsApp
    </button>
  );
}
