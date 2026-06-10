'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Productos', icon: '🛍️' },
  { href: '/admin/deliverys', label: 'Deliverys', icon: '🛵' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { href: '/admin/reports', label: 'Reportes', icon: '📈' },
  { href: '/admin/negocio', label: 'Mi negocio', icon: '🎨' },
];

interface Brand {
  nombre: string;
  logo?: string | null;
  colorPrimary?: string;
}

// Logo del NEGOCIO (no el de la plataforma): imagen si tiene, inicial si no.
function BizLogo({ brand, size = 38 }: { brand: Brand | null; size?: number }) {
  if (brand?.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logo}
        alt={brand.nombre}
        className="rounded-xl object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-xl shrink-0 flex items-center justify-center font-extrabold text-black"
      style={{
        width: size,
        height: size,
        background: brand?.colorPrimary || '#FFD400',
        fontSize: size * 0.45,
      }}
    >
      {brand?.nombre?.charAt(0) || '·'}
    </span>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, role, hydrated, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || role !== 'ADMIN') router.replace('/login');
  }, [hydrated, token, role, router]);

  useEffect(() => {
    if (hydrated && token && role === 'ADMIN') {
      api<Brand>('/config/branding')
        .then(setBrand)
        .catch(() => {});
    }
  }, [hydrated, token, role]);

  // Cerrar el drawer al navegar
  useEffect(() => {
    setOpen(false);
  }, [path]);

  if (!hydrated) return <div className="p-6 text-muted">Cargando...</div>;
  if (!token || role !== 'ADMIN') return null;

  const salir = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen md:flex">
      {/* ===== Barra superior (movil): hamburguesa + logo del negocio ===== */}
      <header className="md:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-white/10 flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="w-10 h-10 rounded-xl bg-card flex items-center justify-center"
        >
          <Menu size={20} />
        </button>
        <BizLogo brand={brand} size={34} />
        <span className="font-extrabold text-sm truncate">
          {brand?.nombre || 'Mi negocio'}
        </span>
      </header>

      {/* Fondo oscuro al abrir el drawer */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* ===== Drawer deslizante (movil) / barra fija (escritorio) ===== */}
      <aside
        className={`fixed md:sticky md:top-0 inset-y-0 left-0 z-50 w-64 md:w-60 bg-surface border-r border-white/10 p-4 flex flex-col gap-1 md:h-screen
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center gap-3 mb-4">
          <BizLogo brand={brand} size={42} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-sm leading-tight truncate">
              {brand?.nombre || 'Mi negocio'}
            </p>
            <p className="text-muted text-[11px]">Panel de administracion</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg bg-card flex items-center justify-center shrink-0"
            aria-label="Cerrar menu"
          >
            <X size={16} />
          </button>
        </div>

        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 ${
              path === n.href
                ? 'bg-primary text-black font-semibold'
                : 'text-muted hover:bg-card'
            }`}
          >
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}

        <button
          onClick={salir}
          className="px-3 py-2.5 rounded-xl text-sm text-muted hover:bg-card mt-auto flex items-center gap-2.5"
        >
          🚪 <span>Salir</span>
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
    </div>
  );
}
