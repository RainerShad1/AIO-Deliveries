import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business } from '@/types';

// Negocio que el cliente esta navegando. Se persiste para que al recargar
// dentro de una tienda siga aplicando su branding y consultando su catalogo.
interface BusinessState {
  active: Business | null;
  // White-label: si la sesion entro por /app/<slug>, la navegacion queda
  // encerrada en ese grupo (no se muestra el marketplace global).
  lockedApp: { slug: string; nombre: string; logo?: string | null } | null;
  hydrated: boolean;
  setActive: (b: Business | null) => void;
  setLockedApp: (g: BusinessState['lockedApp']) => void;
  setHydrated: (v: boolean) => void;
}

export const useBusiness = create<BusinessState>()(
  persist(
    (set) => ({
      active: null,
      lockedApp: null,
      hydrated: false,
      setActive: (b) => set({ active: b }),
      setLockedApp: (g) => set({ lockedApp: g }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'app-central-business',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
