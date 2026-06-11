'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useCart, CartLine } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import type { Address, Order } from '@/types';
import OrderConfirmed from '@/components/OrderConfirmed';
import AuthModal from '@/components/AuthModal';

interface Group {
  slug: string;
  nombre: string;
  lines: CartLine[];
  subtotal: number;
}

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
  const { lines, setQty, clearSlugs } = useCart();
  const token = useAuth((s) => s.token);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);

  const [pedidosActivos, setPedidosActivos] = useState(0);
  const [confirmarOtro, setConfirmarOtro] = useState(false);

  // Negocios seleccionados para enviar (maximo 2 a la vez)
  const [selected, setSelected] = useState<string[]>([]);

  // Confirmacion (puede ser mas de un pedido a la vez)
  const [confirmed, setConfirmed] = useState<
    { id: string; numero: string }[] | null
  >(null);
  const [authOpen, setAuthOpen] = useState(false);

  // ===== Agrupar el carrito por negocio =====
  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const l of lines) {
      const g = map.get(l.biz.slug) || {
        slug: l.biz.slug,
        nombre: l.biz.nombre,
        lines: [],
        subtotal: 0,
      };
      g.lines.push(l);
      g.subtotal += Number(l.product.precio) * l.cantidad;
      map.set(l.biz.slug, g);
    }
    return [...map.values()];
  }, [lines]);

  // Mantener la seleccion valida: solo negocios presentes; si quedo vacia,
  // preseleccionar hasta 2 (el negocio actual primero si esta en el carrito).
  useEffect(() => {
    setSelected((prev) => {
      const valid = prev.filter((s) => groups.some((g) => g.slug === s));
      if (valid.length > 0) return valid;
      const orden = [...groups].sort((a, b) =>
        a.slug === businessSlug ? -1 : b.slug === businessSlug ? 1 : 0,
      );
      return orden.slice(0, 2).map((g) => g.slug);
    });
  }, [groups, businessSlug]);

  const toggleBiz = (slug: string) => {
    setHint('');
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 2) {
        setHint('Maximo 2 negocios por envio. Deselecciona uno primero.');
        return prev;
      }
      return [...prev, slug];
    });
  };

  const totalSeleccionado = groups
    .filter((g) => selected.includes(g.slug))
    .reduce((s, g) => s + g.subtotal, 0);

  const cargarDatosCliente = () => {
    api<Address[]>('/users/me/addresses')
      .then((a) => {
        setAddresses(a);
        if (a[0]) setAddressId(a[0].id);
      })
      .catch(() => {});
    api<Order[]>('/orders/mine')
      .then((orders) => {
        setPedidosActivos(
          orders.filter((o) => ['ENVIADO', 'EN_CAMINO'].includes(o.status))
            .length,
        );
      })
      .catch(() => {});
    setConfirmarOtro(false);
  };

  useEffect(() => {
    if (open && token) cargarDatosCliente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  // ===== Enviar: UNA orden por negocio seleccionado =====
  const enviarPedidos = async () => {
    setError('');
    setLoading(true);
    const ok: { id: string; numero: string; slug: string }[] = [];
    const fallos: string[] = [];

    for (const g of groups.filter((x) => selected.includes(x.slug))) {
      try {
        const order = await api<{ id: string; numero: string }>('/orders', {
          method: 'POST',
          body: JSON.stringify({
            business: g.slug,
            addressId,
            nota: nota || undefined,
            items: g.lines.map((l) => ({
              productId: l.product.id,
              cantidad: l.cantidad,
            })),
          }),
        });
        ok.push({ ...order, slug: g.slug });
      } catch (e: any) {
        fallos.push(`${g.nombre}: ${e.message}`);
      }
    }

    // Solo se vacian del carrito los negocios que SI se enviaron
    if (ok.length > 0) clearSlugs(ok.map((o) => o.slug));

    if (fallos.length > 0) {
      setError(fallos.join(' · '));
      setLoading(false);
    }
    if (ok.length > 0) {
      setConfirmed(ok.map(({ id, numero }) => ({ id, numero })));
    }
  };

  const handleConfirmar = () => {
    if (!token) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('return_to_business', businessSlug);
      }
      setAuthOpen(true);
      return;
    }
    if (pedidosActivos > 0 && !confirmarOtro) {
      setConfirmarOtro(true);
      return;
    }
    enviarPedidos();
  };

  const handleAuthSuccess = () => {
    setAuthOpen(false);
    cargarDatosCliente();
  };

  if (!open) return null;

  if (confirmed) {
    const multi = confirmed.length > 1;
    return (
      <OrderConfirmed
        numero={confirmed.map((c) => c.numero).join(' · ')}
        onDone={() => {
          onClose();
          // Un pedido: directo a su seguimiento. Varios: a la lista.
          router.push(multi ? '/orders' : `/orders/${confirmed[0].id}`);
        }}
      />
    );
  }

  const nadaSeleccionado = selected.length === 0 || totalSeleccionado === 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/60 animate-overlay-in"
        onClick={onClose}
      >
        <div
          className="bg-surface w-full rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-1">Tu pedido</h2>
          {groups.length > 1 && (
            <p className="text-muted text-xs mb-3">
              Tienes articulos de {groups.length} negocios. Marca cuales enviar
              (max. 2): se crea un pedido por negocio.
            </p>
          )}

          {/* ===== Grupos por negocio ===== */}
          {groups.map((g) => {
            const on = selected.includes(g.slug);
            return (
              <div
                key={g.slug}
                className={`rounded-2xl border p-3 mb-3 transition-colors ${
                  on ? 'border-primary/60 bg-primary/5' : 'border-white/10'
                }`}
              >
                <button
                  onClick={() => toggleBiz(g.slug)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  {/* Circulito de seleccion */}
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      on
                        ? 'bg-primary border-primary text-black'
                        : 'border-white/30'
                    }`}
                    aria-hidden="true"
                  >
                    {on && <Check size={14} strokeWidth={3.5} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-bold block truncate">{g.nombre}</span>
                    <span className="text-muted text-xs">
                      {g.lines.reduce((n, l) => n + l.cantidad, 0)} articulo
                      {g.lines.reduce((n, l) => n + l.cantidad, 0) !== 1
                        ? 's'
                        : ''}{' '}
                      · RD${g.subtotal.toFixed(2)}
                    </span>
                  </span>
                </button>

                <div className="mt-2 pl-9">
                  {g.lines.map((l) => (
                    <div
                      key={l.product.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm truncate">
                          {l.product.nombre}
                        </p>
                        <p className="text-muted text-xs">
                          RD${l.product.precio}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setQty(l.product.id, l.cantidad - 1)}
                          className="w-7 h-7 bg-card rounded-full text-sm"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-sm">
                          {l.cantidad}
                        </span>
                        <button
                          onClick={() => setQty(l.product.id, l.cantidad + 1)}
                          className="w-7 h-7 bg-card rounded-full text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {hint && <p className="text-amber-300 text-xs mb-2">{hint}</p>}

          {token &&
            (addresses.length === 0 ? (
              <button
                onClick={() => {
                  onClose();
                  router.push('/perfil');
                }}
                className="w-full text-left bg-amber-500/10 text-amber-300 text-sm mt-2 rounded-xl p-3"
              >
                No tienes direcciones guardadas. Toca aqui para agregar una en
                tu perfil →
              </button>
            ) : (
              <select
                className="input mt-2"
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
            <span>
              Total{' '}
              {groups.length > 1 && (
                <span className="text-muted text-xs font-normal">
                  ({selected.length} negocio{selected.length !== 1 ? 's' : ''})
                </span>
              )}
            </span>
            <span className="text-accent">
              RD${totalSeleccionado.toFixed(2)}
            </span>
          </div>

          {confirmarOtro ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 animate-fade-in">
              <p className="font-semibold text-amber-300">
                Ya tienes{' '}
                {pedidosActivos === 1
                  ? 'un pedido'
                  : `${pedidosActivos} pedidos`}{' '}
                en proceso
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
                  onClick={enviarPedidos}
                  disabled={loading}
                  className="flex-1 bg-primary text-black rounded-xl py-3 text-sm font-semibold"
                >
                  {loading ? 'Enviando...' : 'Si, continuar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConfirmar}
              disabled={
                loading ||
                lines.length === 0 ||
                (!!token && (nadaSeleccionado || !addressId))
              }
              className="btn-primary"
            >
              {loading
                ? 'Enviando...'
                : !token
                  ? 'Iniciar sesion para pedir'
                  : selected.length > 1
                    ? `Confirmar ${selected.length} pedidos`
                    : 'Confirmar pedido'}
            </button>
          )}
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
