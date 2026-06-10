'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/store/cart';
import { useBusiness } from '@/store/business';

export default function BottomNav() {
  const path = usePathname();
  const hydrated = useCart((s) => s.hydrated);
  const count = useCart((s) => s.count());
  const activeSlug = useBusiness((s) => s.active?.slug);
  const lockedApp = useBusiness((s) => s.lockedApp);
  // "Menu" lleva al negocio activo; si no hay: a la app del grupo (white-label)
  // o al marketplace, segun como entro el cliente.
  const fallback = lockedApp ? `/app/${lockedApp.slug}` : '/negocios';
  const menuHref = activeSlug ? `/menu?business=${activeSlug}` : fallback;
  const items = [
    { href: menuHref, label: 'Tienda', Icon: Home, match: '/menu' },
    { href: '/orders', label: 'Pedidos', Icon: ShoppingBag, match: '/orders' },
    { href: '/perfil', label: 'Perfil', Icon: User, match: '/perfil' },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-white/10 flex pb-[env(safe-area-inset-bottom)]">
      {items.map(({ href, label, Icon, match }) => {
        const active = path.startsWith(match);
        return (
          <Link
            key={match}
            href={href}
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs transition-colors ${
              active ? 'text-primary' : 'text-muted'
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={active ? 2.6 : 2} />
              {match === '/menu' && hydrated && count > 0 && (
                <span
                  key={count}
                  className="absolute -top-1.5 -right-2.5 bg-primary text-black text-[10px] font-bold rounded-full px-1.5 animate-pulse-once"
                >
                  {count}
                </span>
              )}
            </div>
            <span className={active ? 'font-semibold' : ''}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
