'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Clock, ShoppingCart, ChevronRight, ArrowLeft } from 'lucide-react';
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

  // Emoji por categoria (visual, para los chips)
  const catEmoji: Record<string, string> = {
    Empanadas: '🥟',
    Refrescos: '🥤',
    Batidas: '🍓',
    Salsas: '🌶️',
    Combos: '📦',
    Bebidas: '🥤',
    Snacks: '🍪',
    Limpieza: '🧼',
  };

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
      {/* ===== Header ===== */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backHref)}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-white shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          {biz?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={biz.logo}
              alt={biz.nombre}
              className="w-11 h-11 rounded-xl object-cover shrink-0"
            />
          ) : (
            <Logo size={44} />
          )}
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
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-white shrink-0"
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
            emoji="🍽️"
            active={activeCat === 'all'}
            onClick={() => setActiveCat('all')}
          />
          {categories.map((cat) => (
            <CatChip
              key={cat.id}
              label={cat.nombre}
              emoji={catEmoji[cat.nombre] || '🍴'}
              active={activeCat === cat.id}
              onClick={() => setActiveCat(cat.id)}
            />
          ))}
        </div>
      )}

      {/* ===== Grid de productos ===== */}
      <div className="px-4 mt-1">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted text-center py-10">
            {search
              ? `No encontramos "${search}".`
              : 'No hay productos en esta categoria.'}
          </p>
        ) : (
          <div key={activeCat + search} className="grid grid-cols-3 gap-2 stagger">
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
          className="fixed bottom-[78px] inset-x-5 bg-primary text-black rounded-full pl-3.5 pr-4 py-2 flex justify-between items-center z-30 animate-fade-in-up shadow-xl shadow-primary/30"
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
          <span className="flex items-center gap-0.5 font-extrabold text-sm">
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

// Chip de categoria estilo "tarjeta"
function CatChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-[64px] h-[64px] rounded-2xl transition-all shrink-0 ${
        active
          ? 'bg-card border-2 border-primary'
          : 'bg-card border-2 border-transparent'
      }`}
    >
      <span className="text-2xl leading-none">{emoji}</span>
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
