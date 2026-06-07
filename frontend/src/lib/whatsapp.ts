import type { Order } from '@/types';

/**
 * Construye el link wa.me con el detalle completo del pedido.
 * Si el delivery tiene telefono, abre el chat directo con el;
 * si no, abre WhatsApp con el mensaje listo para reenviar.
 */
export function buildDeliveryWhatsApp(order: Order): string {
  const a = order.address;
  const mapsLink =
    a?.lat && a?.lng
      ? `https://maps.google.com/?q=${a.lat},${a.lng}`
      : 'Sin ubicacion GPS';

  const items = order.items
    .map((it) => `• ${it.cantidad}x ${it.product.nombre}`)
    .join('\n');

  const msg = [
    `🥟 *NUEVO PEDIDO ${order.numero}*`,
    ``,
    `👤 *Cliente:* ${order.user?.nombre ?? '—'}`,
    `📞 *Telefono:* ${order.user?.telefono ?? '—'}`,
    ``,
    `📍 *Direccion:* ${a?.direccion ?? '—'}`,
    `🗺️ *Ubicacion:* ${mapsLink}`,
    ``,
    `🍽️ *Pedido:*`,
    items,
    ``,
    order.nota ? `📝 *Nota:* ${order.nota}` : '',
    ``,
    `💰 *Total a cobrar:* RD$${order.total}`,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');

  const encoded = encodeURIComponent(msg);

  // Limpia el telefono del delivery: solo digitos, con codigo pais RD (1)
  const phone = order.delivery?.telefono?.replace(/\D/g, '');
  const fullPhone = phone ? (phone.length === 10 ? `1${phone}` : phone) : '';

  return fullPhone
    ? `https://wa.me/${fullPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
