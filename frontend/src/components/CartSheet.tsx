'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import type { Address, Order } from '@/types';
import OrderConfirmed from '@/components/OrderConfirmed';

export default function CartSheet({
  open,
  onClose,
  businessSlug,
}: {
  open: boolean;
  onClose: () => void;
  businessSlug: string;
}) {
  const router = useRouter();
  const { lines, setQty, total, clear } = useCart();
  const token = useAuth((s) => s.token);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cantidad de pedidos activos (enviado o en camino) y aviso de confirmacion
  const [pedidosActivos, setPedidosActivos] = useState(0);
  const [confirmarOtro, setConfirmarOtro] = useState(false);

  // Animacion de "Pedido confirmado": guarda el id del pedido recien creado
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmedNumero, setConfirmedNumero] = useState<string>('');

  useEffect(() => {
    if (open && token) {
      api<Address[]>('/users/me/addresses')
        .then((a) => {
          setAddresses(a);
          if (a[0]) setAddressId(a[0].id);
        })
        .catch(() => {});

      // Revisar si el cliente ya tiene pedidos en proceso
      api<Order[]>('/orders/mine')
        .then((orders) => {
          const activos = orders.filter((o) =>
            ['ENVIADO', 'EN_CAMINO'].includes(o.status),
          );
          setPedidosActivos(activos.length);
        })
        .catch(() => {});

      // Reset del aviso cada vez que se abre
      setConfirmarOtro(false);
    }
  }, [open, token]);

  // Crea el pedido de verdad
  const enviarPedido = async () => {
    setError('');
    setLoading(true);
    try {
      const order = await api<{ id: string; numero: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          business: businessSlug,
          addressId,
          nota: nota || undefined,
          items: lines.map((l) => ({
            productId: l.product.id,
            cantidad: l.cantidad,
          })),
        }),
      });
      clear();
      // Mostrar animacion de "Pedido confirmado"; al terminar navega al seguimiento
      setConfirmedId(order.id);
      setConfirmedNumero(order.numero);
    } catch (e: any) {
      setError(e.message); // ej: "El negocio esta cerrado"
      setLoading(false);
    }
  };

  // Al tocar "Confirmar pedido": si no hay sesion, mandamos a crear cuenta
  // (guardando el negocio para volver a su tienda). Si hay activos y aun no
  // confirmo, mostramos el aviso. Si no, enviamos.
  const handleConfirmar = () => {
    if (!token) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('return_to_business', businessSlug);
      }
      onClose();
      router.push('/register');
      return;
    }
    if (pedidosActivos > 0 && !confirmarOtro) {
      setConfirmarOtro(true);
      return;
    }
    enviarPedido();
  };

  if (!open) return null;

  // Si el pedido fue confirmado, mostramos la animacion a pantalla completa
  if (confirmedId) {
    return (
      <OrderConfirmed
        numero={confirmedNumero}
        onDone={() => {
          onClose();
          router.push(`/orders/${confirmedId}`);
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-4">Tu pedido</h2>

        {lines.map((l) => (
          <div
            key={l.product.id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex-1">
              <p className="font-medium">{l.product.nombre}</p>
              <p className="text-muted text-sm">RD${l.product.precio}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(l.product.id, l.cantidad - 1)}
                className="w-8 h-8 bg-card rounded-full"
              >
                -
              </button>
              <span className="w-5 text-center">{l.cantidad}</span>
              <button
                onClick={() => setQty(l.product.id, l.cantidad + 1)}
                className="w-8 h-8 bg-card rounded-full"
              >
                +
              </button>
            </div>
          </div>
        ))}

        {token &&
          (addresses.length === 0 ? (
            <button
              onClick={() => {
                onClose();
                router.push('/perfil');
              }}
              className="w-full text-left bg-amber-500/10 text-amber-300 text-sm mt-4 rounded-xl p-3"
            >
              No tienes direcciones guardadas. Toca aqui para agregar una en tu
              perfil →
            </button>
          ) : (
            <select
              className="input mt-4"
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.etiqueta} — {a.direccion}
                </option>
              ))}
            </select>
          ))}

        <textarea
          className="input mt-3"
          rows={2}
          placeholder="Nota para tu pedido (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />

        {error && <p className="text-primary text-sm mt-3">{error}</p>}

        <div className="flex justify-between text-lg font-bold mt-4 mb-3">
          <span>Total</span>
          <span className="text-accent">RD${total().toFixed(2)}</span>
        </div>

        {/* Aviso: ya hay un pedido activo */}
        {confirmarOtro ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 animate-fade-in">
            <p className="font-semibold text-amber-300">
              Ya tienes {pedidosActivos === 1 ? 'un pedido' : `${pedidosActivos} pedidos`} en proceso
            </p>
            <p className="text-muted text-sm mt-1 mb-3">
              Este seria un pedido aparte, no se suma al anterior. Quieres
              continuar de todos modos?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarOtro(false)}
                className="flex-1 bg-surface border border-white/10 rounded-xl py-3 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={enviarPedido}
                disabled={loading}
                className="flex-1 bg-primary text-black rounded-xl py-3 text-sm font-semibold"
              >
                {loading ? 'Enviando...' : 'Si, hacer otro pedido'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConfirmar}
            disabled={loading || lines.length === 0 || (!!token && !addressId)}
            className="btn-primary"
          >
            {loading
              ? 'Enviando...'
              : token
                ? 'Confirmar pedido'
                : 'Iniciar sesion para pedir'}
          </button>
        )}
      </div>
    </div>
  );
}
