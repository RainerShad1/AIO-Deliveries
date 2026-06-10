'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

// Area exclusiva del dueno de la plataforma.
export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, role, hydrated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!token || role !== 'SUPER_ADMIN') router.replace('/login');
  }, [hydrated, token, role, router]);

  if (!hydrated) return <div className="p-6 text-muted">Cargando...</div>;
  if (!token || role !== 'SUPER_ADMIN') return null;

  return (
    <div className="min-h-screen">
      <header className="bg-surface border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold">AIO Deliverys</h1>
          <p className="text-muted text-xs">Panel de plataforma</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="text-muted text-sm hover:text-white"
        >
          Salir 🚪
        </button>
      </header>
      <main className="p-5 max-w-3xl mx-auto">{children}</main>
    </div>
  );
}
