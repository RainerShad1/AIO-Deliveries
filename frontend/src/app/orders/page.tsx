'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order, Product } from '@/types';
import { useAuth } from '@/store/auth';
import { useCart } from '@/store/cart';
import { useBusiness } from '@/store/business';
import BottomNav from '@/components/BottomNav';
import AuthModal from '@/components/AuthModal';

export default function MyOrders() {
  const router = useRouter();
  const { token, hydrated } = useAuth();
  const { add } = useCart();
  const setActiveBiz = useBusiness((s) => s.setActive);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [repeatMsg, setRepeatMsg] = useState('');
  // Facturas desplegadas (ids de pedidos con "Ver mas" abierto)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen] = useState(false);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setLoading(false);
      return;
    }
    api<Order[]>('/orders/mine')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated, token]);

  const repeatOrder = async (order: Order) => {
    const slug = order.business?.slug;
    if (!slug) {
      setRepeatMsg('No pudimos identificar el negocio de ese pedido.');
      return;
    }
    // Traemos los productos activos DE ESE negocio para validar disponibilidad
    let activeProducts: Product[] = [];
    try {
      activeProducts = await api<Product[]>(
        `/products?business=${encodeURIComponent(slug)}`,
      );
    } catch {
      setRepeatMsg('No pudimos cargar el menu de ese negocio.');
      return;
    }
    const activeMap = new Map(activeProducts.map((p) => [p.id, p]));

    // IMPORTANTE: activar el negocio ANTES de agregar — el carrito firma cada
    // linea con el negocio activo (carrito multi-negocio).
    if (order.business) {
      setActiveBiz({
        id: order.businessId || '',
        slug,
        nombre: order.business.nombre,
        logo: order.business.logo,
        colorPrimary: '#FFD400',
        colorBg: '#0B0B0F',
        colorCard: '#15151D',
        colorAccent: '#E53935',
        horaApertura: '00:00',
        horaCierre: '23:59',
        abierto: true,
      });
    }

    let agregados = 0;
    let omitidos = 0;
    order.items.forEach((it) => {
      const prod = activeMap.get(it.product.id);
      if (prod) {
        for (let i = 0; i < it.cantidad; i++) add(prod);
        agregados++;
      } else {
        omitidos++;
      }
    });

    if (agregados === 0) {
      setRepeatMsg('Ninguno de esos productos esta disponible ahora.');
      return;
    }
    if (omitidos > 0) {
      setRepeatMsg(
        `Agregamos los productos disponibles. ${omitidos} ya no estan en el menu.`,
      );
      setTimeout(() => router.push(`/menu?business=${slug}`), 1400);
      return;
    }
    router.push(`/menu?business=${slug}`);
  };

  // Separamos activos de finalizados para ordenar mejor la vista
  const activos = orders.filter((o) =>
    ['ENVIADO', 'EN_CAMINO'].includes(o.status),
  );
  const finalizados = orders.filter((o) =>
    ['ENTREGADO', 'CANCELADO'].includes(o.status),
  );

  // Estado visual: icono + color por estado, visible sin abrir el pedido
  const ESTADOS: Record<
    string,
    { icon: string; label: string; cls: string }
  > = {
    ENVIADO: {
      icon: '🕐',
      label: 'Enviado',
      cls: 'bg-amber-500/15 text-amber-300',
    },
    EN_CAMINO: {
      icon: '🛵',
      label: 'En camino',
      cls: 'bg-blue-500/15 text-blue-300',
    },
    ENTREGADO: {
      icon: '✅',
      label: 'Entregado',
      cls: 'bg-green-500/15 text-green-300',
    },
    CANCELADO: {
      icon: '❌',
      label: 'Cancelado',
      cls: 'bg-red-500/15 text-red-300',
    },
  };

  const renderOrder = (o: Order) => {
    const est = ESTADOS[o.status] || ESTADOS.ENVIADO;
    const abierta = expanded.has(o.id);
    const cantidadTotal = o.items.reduce((n, it) => n + it.cantidad, 0);
    return (
      <div key={o.id} className="bg-card rounded-2xl p-4">
        {/* Cabecera: negocio + estado con icono */}
        <div className="flex items-center gap-3">
          {o.business?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={o.business.logo}
              alt=""
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
          ) : (
            <span className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-extrabold flex items-center justify-center shrink-0">
              {o.business?.nombre?.charAt(0) || '·'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold truncate">
              {o.business?.nombre || 'Negocio'}
            </p>
            <p className="text-muted text-xs">
              {o.numero} ·{' '}
              {new Date(o.createdAt).toLocaleDateString('es-DO', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 shrink-0 ${est.cls}`}
          >
            {est.icon} {est.label}
          </span>
        </div>

        {/* Resumen */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted">
            {cantidadTotal} articulo{cantidadTotal !== 1 ? 's' : ''}
          </span>
          <span className="font-extrabold text-primary">RD${o.total}</span>
        </div>

        {/* Factura desplegable */}
        {abierta && (
          <div className="mt-3 bg-surface rounded-xl p-3 text-sm animate-fade-in">
            <p className="text-muted text-xs font-bold mb-2">FACTURA</p>
            {o.items.map((it) => (
              <div
                key={it.id}
                className="flex justify-between py-1 border-b border-white/5 last:border-0"
              >
                <span className="min-w-0 pr-2 truncate">
                  {it.cantidad}× {it.product.nombre}
                </span>
                <span className="text-muted shrink-0">
                  RD$
                  {(Number(it.precioUnit) * it.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
            {o.nota && (
              <p className="text-muted text-xs mt-2 italic">
                Nota: {o.nota}
              </p>
            )}
            {o.delivery && (
              <p className="text-muted text-xs mt-1">
                🛵 Repartidor: {o.delivery.nombre}
              </p>
            )}
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="text-primary">RD${o.total}</span>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => toggleExpand(o.id)}
            className="flex-1 bg-surface border border-white/10 rounded-xl py-2.5 text-sm text-muted"
          >
            {abierta ? 'Ver menos ▴' : 'Ver mas ▾'}
          </button>
          <button
            onClick={() => router.push(`/orders/${o.id}`)}
            className="flex-1 bg-surface border border-white/10 rounded-xl py-2.5 text-sm text-muted"
          >
            Seguimiento
          </button>
          <button
            onClick={() => repeatOrder(o)}
            className="flex-1 bg-primary/15 text-primary rounded-xl py-2.5 text-sm font-semibold"
          >
            🔁 Repetir
          </button>
        </div>
      </div>
    );
  };


  if (!hydrated) return <div className="p-6 text-muted">Cargando...</div>;

  if (!token) {
    return (
      <main className="px-4 pt-16 max-w-md mx-auto text-center pb-28">
        <ShoppingBag
          size={60}
          strokeWidth={1.5}
          className="mx-auto text-primary mb-4"
        />
        <h1 className="text-xl font-extrabold">Tus pedidos</h1>
        <p className="text-muted text-sm mt-2 mb-6">
          Inicia sesion o crea tu cuenta para ver el historial de tus pedidos.
        </p>
        <button onClick={() => setAuthOpen(true)} className="btn-primary">
          Iniciar sesion / Registrarme
        </button>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="px-4 pt-6">
      <h1 className="text-2xl font-bold mb-4">Mis pedidos</h1>

      {repeatMsg && (
        <div className="bg-amber-500/15 text-amber-300 rounded-xl p-3 mb-4 text-sm animate-fade-in">
          {repeatMsg}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted text-center py-10">Aun no tienes pedidos.</p>
      ) : (
        <div className="space-y-6">
          {activos.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-muted mb-2">
                En proceso
              </h2>
              <div className="space-y-3 stagger">{activos.map(renderOrder)}</div>
            </section>
          )}
          {finalizados.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-muted mb-2">Anteriores</h2>
              <div className="space-y-3 stagger">
                {finalizados.map(renderOrder)}
              </div>
            </section>
          )}
        </div>
      )}
      <BottomNav />
    </main>
  );
}
