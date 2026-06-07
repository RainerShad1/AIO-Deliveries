'use client';
import { useEffect, useState } from 'react';

/**
 * Evita errores de hidratacion (#418/#423) en paginas que dependen de estado
 * persistido en localStorage (Zustand persist). Renderiza un fallback hasta
 * que el componente se ha montado en el cliente.
 */
export default function HydrationGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
