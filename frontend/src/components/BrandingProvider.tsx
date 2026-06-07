'use client';
import { useEffect } from 'react';
import { useBusiness } from '@/store/business';
import { applyBranding } from '@/lib/branding';

// Reaplica el branding del negocio activo cuando el store rehidrata desde
// localStorage (al recargar dentro de una tienda). No pinta nada: solo efecto.
export default function BrandingProvider() {
  const active = useBusiness((s) => s.active);
  const hydrated = useBusiness((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) applyBranding(active);
  }, [hydrated, active]);

  return null;
}
