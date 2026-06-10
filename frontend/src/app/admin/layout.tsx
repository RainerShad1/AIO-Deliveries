'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Productos', icon: '🥟' },
  { href: '/admin/deliverys', label: 'Deliverys', icon: '🛵' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { href: '/admin/reports', label: 'Reportes', icon: '📈' },
  { href: '/admin/negocio', label: 'Mi negocio', icon: '🎨' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, role, hydrated, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [bizName, setBizName] = useState('');

  useEffect(() => {
    // Esperar la rehidratacion antes de decidir redirigir
    if (!hydrated) return;
    if (!token || role !== 'ADMIN') router.replace('/login');
  }, [hydrated, token, role, router]);

  useEffect(() => {
    if (hydrated && token && role === 'ADMIN') {
      api<{ nombre: string }>('/config/branding')
        .then((b) => setBizName(b.nombre))
        .catch(() => {});
    }
  }, [hydrated, token, role]);

  // Mientras rehidrata o si no es admin, no renderizamos el panel
  if (!hydrated) {
    return <div className="p-6 text-muted">Cargando...</div>;
  }
  if (!token || role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 bg-surface border-b md:border-b-0 md:border-r border-white/10 md:min-h-screen p-4 flex md:flex-col gap-2 md:gap-1">
        <div className="flex items-center gap-2 mb-2">
          <Logo size={36} />
          <div className="font-extrabold text-base hidden md:block leading-tight">
            {bizName || 'Mi negocio'}
          </div>
        </div>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`px-3 py-2 rounded-xl text-sm flex-1 md:flex-none text-center md:text-left ${
              path === n.href
                ? 'bg-primary text-black'
                : 'text-muted hover:bg-card'
            }`}
          >
            <span className="md:mr-2">{n.icon}</span>
            <span className="hidden md:inline">{n.label}</span>
          </Link>
        ))}
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="px-3 py-2 rounded-xl text-sm text-muted hover:bg-card md:mt-auto"
        >
          🚪<span className="hidden md:inline md:ml-2">Salir</span>
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
