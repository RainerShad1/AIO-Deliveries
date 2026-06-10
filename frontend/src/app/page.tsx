'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LocationGate from '@/components/LocationGate';
import Logo from '@/components/Logo';
import { useAuth } from '@/store/auth';

export default function Home() {
  const router = useRouter();
  const { token, role, hydrated } = useAuth();

  // Si ya tiene sesion activa, va directo a donde corresponde segun su rol.
  useEffect(() => {
    if (hydrated && token) {
      router.replace(
        role === 'SUPER_ADMIN'
          ? '/superadmin'
          : role === 'ADMIN'
            ? '/admin'
            : '/negocios',
      );
    }
  }, [hydrated, token, role, router]);

  const handleResolved = (data: {
    lat?: number;
    lng?: number;
    manual?: string;
  }) => {
    // Guardamos la ubicacion provisional; se convertira en Address tras login.
    // El cliente puede explorar negocios sin cuenta; se le pide al pedir.
    sessionStorage.setItem('pending_location', JSON.stringify(data));
    router.push('/negocios');
  };

  // Mientras decide (rehidratando) o si ya hay sesion, no parpadea la landing
  if (!hydrated || token) {
    return <div className="p-6 text-muted">Cargando...</div>;
  }

  return (
    <main>
      <div className="bg-gradient-to-b from-primary/20 to-transparent px-5 pt-10 pb-6 flex flex-col items-center text-center">
        <Logo size={96} />
        <h1 className="text-2xl font-extrabold mt-4">
          AIO Deliverys
        </h1>
        <p className="text-primary font-semibold mt-1">
          Tus negocios favoritos, en una sola app 🛍️
        </p>
        <p className="text-muted text-sm mt-1">
          Restaurantes, colmados y mas, a tu puerta.
        </p>
      </div>
      <LocationGate onResolved={handleResolved} />
    </main>
  );
}
