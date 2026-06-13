'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Clock, ShoppingCart, ChevronRight, ArrowLeft,
  LayoutGrid, Cookie, GlassWater, Milk, Flame, Package,
  Sparkles, Pizza, Sandwich, Coffee, IceCream, Beef, Salad,
  Wine, UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product, Category, Business } from '@/types';
import ProductCard from '@/components/ProductCard';
import CartSheet from '@/components/CartSheet';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { useCart } from '@/store/cart';
import { useBusiness } from '@/store/business';
import { useAuth } from '@/store/auth';
import { applyBranding } from '@/lib/branding';

// REDISEÑO (Parte 2) — solo capa visual. La carga, el branding, el filtrado y
// TODA la animación del splash (logo sube + spinner → viaja al header) quedan
// idénticas; solo se pulen clases (header, chips, pill del carrito, skeletons).

interface ConfigResp {
  abiertoAhora: boolean;
  horaApertura: string;
  horaCierre: string;
}

// Convierte "23:00" -> "11:00 PM"
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Avatar del negocio: logo si existe, inicial sobre su color si no.
// Splash y header usan ESTE mismo componente para que el logo "aterrice"
// sin ningun cambio visual.
function BizAvatar({ biz, size }: { biz: Business; size: number }) {
  if (biz.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={biz.logo}
        alt={biz.nombre}
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-xl flex items-center justify-center font-extrabold text-black"
      style={{
        width: size,
        height: size,
        background: biz.colorPrimary,
        fontSize: size * 0.42,
      }}
    >
      {biz.nombre.charAt(0)}
    </span>
  );
}

// useSearchParams exige un limite de Suspense en Next 14 App Router.
export default function Menu() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Cargando...</div>}>
      <MenuContent />
    </Suspense>
  );
}

function MenuContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useAuth((s) => s.token);

  const activeBiz = useBusiness((s) => s.active);
  const setActiveBiz = useBusiness((s) => s.setActive);
  const lockedApp = useBusiness((s) => s.lockedApp);
  const bizHydrated = useBusiness((s) => s.hydrated);
  // White-label: "volver" regresa a la app del grupo, no al marketplace global
  const backHref = lockedApp ? `/app/${lockedApp.slug}` : '/negocios';

  // Slug del negocio: de la URL, o del store si recargo sin query
  const slug = params.get('business') || activeBiz?.slug || '';

  const [biz, setBiz] = useState<Business | null>(activeBiz);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [config, setConfig] = useState<ConfigResp | null>(null);
  const [nombre, setNombre] = useState<string>('');
  const [loading, setLoading] = useState(true);
  // Splash de entrada al negocio: 'show' (logo + spinner), 'dock' (el logo
  // viaja a su lugar en el header), 'done' (menu normal).
  const [splashPhase, setSplashPhase] = useState<'show' | 'dock' | 'done'>(
    'show',
  );
  const splashLogoRef = useRef<HTMLDivElement>(null);
  const headerLogoRef = useRef<HTMLSpanElement>(null);
  const splashStartRef = useRef<number>(Date.now());
  const [notFound, setNotFound] = useState(false);
  const hydrated = useCart((s) => s.hydrated);
  const count = useCart((s) => s.count());
  const total = useCart((s) => s.total());

  // Carga del negocio + su catalogo. Depende del slug.
  useEffect(() => {
    if (!bizHydrated) return; // espera a saber si hay negocio en store
    if (!slug) {
      router.replace(backHref);
      return;
    }
    setLoading(true);
    setSplashPhase('show');
    splashStartRef.current = Date.now();
    const q = `?business=${encodeURIComponent(slug)}`;

    // Branding del negocio (y aplicar colores)
    api<Business>(`/businesses/${slug}`)
      .then((b) => {
        setBiz(b);
        setActiveBiz(b);
        applyBranding(b);
      })
      .catch(() => setNotFound(true));

    Promise.all([
      api<Product[]>(`/products${q}`),
      api<ConfigResp>(`/config${q}`),
      api<Category[]>(`/categories${q}`),
    ])
      .then(([p, c, cats]) => {
        setProducts(p);
        setConfig(c);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Saludo solo si hay sesion
    if (token) {
      api<{ nombre: string }>('/users/me')
        .then((u) => setNombre(u.nombre?.split(' ')[0] || ''))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, bizHydrated]);

  // Entrada del logo del splash (sube suave al montar)
  useEffect(() => {
    if (splashPhase !== 'show') return;
    const node = splashLogoRef.current;
    if (!node) return;
    node.style.opacity = '0';
    node.style.transform = 'translate(-50%, calc(-50% + 36px))';
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        node.style.transition =
          'transform .55s cubic-bezier(.2,.8,.2,1), opacity .45s ease';
        node.style.opacity = '1';
        node.style.transform = 'translate(-50%, -50%)';
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splashPhase, slug]);

  // Acople: al terminar la carga (y tras un minimo para que la animacion se
  // aprecie), el logo del splash viaja en UNA transicion continua hasta la
  // posicion exacta del logo del header. Sin cortes: el header lo revela en
  // el mismo pixel donde aterriza.
  useEffect(() => {
    if (loading || !biz || notFound || splashPhase !== 'show') return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduced) {
      setSplashPhase('done');
      return;
    }
    const wait = Math.max(0, 900 - (Date.now() - splashStartRef.current));
    const t = setTimeout(() => {
      const node = splashLogoRef.current;
      const target = headerLogoRef.current;
      if (!node || !target) {
        setSplashPhase('done');
        return;
      }
      const from = node.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = to.width / from.width;
      setSplashPhase('dock');
      requestAnimationFrame(() => {
        node.style.transition = 'transform .6s cubic-bezier(.4,0,.2,1)';
        node.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`;
      });
      setTimeout(() => setSplashPhase('done'), 640);
    }, wait);
    return () => clearTimeout(t);
  }, [loading, biz, notFound, splashPhase]);

  // Filtrado por categoria + busqueda
  const filtered = products.filter((p) => {
    const matchCat = activeCat === 'all' || p.categoryId === activeCat;
    const matchSearch =
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const showCartButton = hydrated && count > 0 && config?.abiertoAhora;


  if (notFound) {
    return (
      <main className="px-5 py-16 text-center">
        <p className="text-lg font-bold">Negocio no encontrado</p>
        <p className="text-muted text-sm mt-1">
          Puede que ya no este disponible.
        </p>
        <button
          onClick={() => router.replace(backHref)}
          className="btn-primary mt-6 max-w-xs mx-auto"
        >
          Ver negocios
        </button>
      </main>
    );
  }

  return (
    <main className={`pb-28 ${showCartButton ? 'pb-40' : ''}`}>
      {/* ===== Splash de entrada al negocio ===== */}
      {splashPhase !== 'done' && (
        <div
          className="fixed inset-0 z-[70] pointer-events-none"
          aria-hidden="true"
        >
          {/* Fondo del negocio: se desvanece cuando el logo viaja */}
          <div
            className="absolute inset-0"
            style={{
              background: 'var(--color-bg)',
              opacity: splashPhase === 'dock' ? 0 : 1,
              transition: 'opacity .45s ease .12s',
            }}
          />
          {/* Logo: centrado, luego viaja al header en una sola transicion */}
          <div
            ref={splashLogoRef}
            className="absolute"
            style={{
              left: '50%',
              top: '38%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {biz ? (
              <BizAvatar biz={biz} size={96} />
            ) : (
              <span className="block w-24 h-24 rounded-xl bg-card animate-pulse" />
            )}
          </div>
          {/* Nombre + ruta de carga (motivo de marca): se desvanecen al acoplar */}
          <div
            className="absolute inset-x-0 flex flex-col items-center gap-4"
            style={{
              top: '48%',
              opacity: splashPhase === 'dock' ? 0 : 1,
              transition: 'opacity .3s ease',
            }}
          >
            <p className="text-lg font-extrabold">{biz?.nombre || ''}</p>
            <div className="route-loading w-28" />
          </div>
        </div>
      )}

      {/* ===== Header ===== */}
      <div className="bg-card border-b border-white/10 px-4 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backHref)}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-white shrink-0 transition active:scale-90"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <span
            ref={headerLogoRef}
            className="shrink-0"
            style={{
              opacity: splashPhase === 'done' ? 1 : 0,
              transition: 'opacity .15s',
            }}
          >
            {biz ? <BizAvatar biz={biz} size={44} /> : <Logo size={44} />}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-extrabold leading-tight truncate">
              {nombre ? `Hola, ${nombre} 👋` : biz?.nombre || 'Cargando...'}
            </h1>
            {nombre && biz && (
              <p className="text-xs text-muted truncate">{biz.nombre}</p>
            )}
            {config && (
              <div className="flex items-center gap-3 text-xs mt-0.5">
                <span className="flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      config.abiertoAhora ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-muted">
                    {config.abiertoAhora ? 'Abierto ahora' : 'Cerrado'}
                  </span>
                </span>
                {config.abiertoAhora && (
                  <span className="flex items-center gap-1 text-muted">
                    <Clock size={12} /> 25-40 min
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setSearchOpen((s) => !s)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-white shrink-0 transition active:scale-90"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* ===== Barra de busqueda (desplegable) ===== */}
      {searchOpen && (
        <div className="px-4 pb-2 animate-fade-in">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              autoFocus
              className="input pl-11"
              placeholder="Buscar en este negocio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Aviso de cerrado */}
      {config && !config.abiertoAhora && (
        <div className="mx-4 bg-red-500/15 text-red-300 rounded-xl p-3 my-2 text-sm">
          Cerrado ahora. Horario: {to12h(config.horaApertura)} a{' '}
          {to12h(config.horaCierre)}. Puedes ver el menu pero no enviar pedidos.
        </div>
      )}

      {/* ===== Chips de categorias ===== */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <CatChip
            label="Todos"
            icon={LayoutGrid}
            active={activeCat === 'all'}
            onClick={() => setActiveCat('all')}
          />
          {categories.map((cat) => (
            <CatChip
              key={cat.id}
              label={cat.nombre}
              icon={getCatIcon(cat.nombre)}
              active={activeCat === cat.id}
              onClick={() => setActiveCat(cat.id)}
            />
          ))}
        </div>
      )}

      {/* ===== Grid de productos ===== */}
      <div className="px-4 mt-1">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-xl h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-center py-10">
            {search
              ? `No encontramos "${search}".`
              : 'No hay productos en esta categoria.'}
          </p>
        ) : (
          <div key={activeCat + search} className="flex flex-col gap-2.5 stagger">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* ===== Carrito flotante ===== */}
      {showCartButton && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-[78px] inset-x-5 bg-primary text-black rounded-full pl-3.5 pr-4 py-2.5 flex justify-between items-center z-30 animate-fade-in-up shadow-xl shadow-primary/30 active:scale-[0.98] transition"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative">
              <ShoppingCart size={20} strokeWidth={2.4} />
              <span className="absolute -top-2 -right-2 bg-accent-red text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            </span>
            <span className="font-bold text-sm">Ver pedido</span>
          </span>
          <span className="flex items-center gap-0.5 font-extrabold text-sm tabular-nums">
            RD${total.toFixed(2)}
            <ChevronRight size={18} strokeWidth={2.6} />
          </span>
        </button>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        businessSlug={slug}
      />
      <BottomNav />
    </main>
  );
}

function getCatIcon(name: string): LucideIcon {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('empanada') || n.includes('snack') || n.includes('galleta')) return Cookie;
  if (n.includes('refresc') || n.includes('soda') || n.includes('agua')) return GlassWater;
  if (n.includes('batida') || n.includes('jugo') || n.includes('smoothie')) return Milk;
  if (n.includes('salsa') || n.includes('picante') || n.includes('aji')) return Flame;
  if (n.includes('combo') || n.includes('paquete')) return Package;
  if (n.includes('limpieza') || n.includes('limpie')) return Sparkles;
  if (n.includes('pizza')) return Pizza;
  if (n.includes('sandwich') || n.includes('sub') || n.includes('torta')) return Sandwich;
  if (n.includes('cafe') || n.includes('coffee') || n.includes('te ') || n.includes('infus')) return Coffee;
  if (n.includes('helado') || n.includes('postre') || n.includes('dulce')) return IceCream;
  if (n.includes('carne') || n.includes('res') || n.includes('pollo') || n.includes('puerco')) return Beef;
  if (n.includes('ensalada') || n.includes('vegetal') || n.includes('vegano')) return Salad;
  if (n.includes('bebida') || n.includes('vino') || n.includes('cerveza')) return Wine;
  return UtensilsCrossed;
}

// Chip de categoria estilo "tarjeta"
function CatChip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-[64px] h-[64px] rounded-2xl transition-all shrink-0 active:scale-95 ${
        active
          ? 'bg-card border-2 border-primary'
          : 'bg-card border-2 border-transparent'
      }`}
    >
      <Icon size={22} className={active ? 'text-primary' : 'text-white/70'} />
      <span
        className={`text-[10px] font-medium whitespace-nowrap ${
          active ? 'text-primary' : 'text-white'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
