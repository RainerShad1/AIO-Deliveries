import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business } from '@/types';

// Negocio que el cliente esta navegando. Se persiste para que al recargar
// dentro de una tienda siga aplicando su branding y consultando su catalogo.
interface BusinessState {
  active: Business | null;
  hydrated: boolean;
  setActive: (b: Business | null) => void;
  setHydrated: (v: boolean) => void;
}

export const useBusiness = create<BusinessState>()(
  persist(
    (set) => ({
      active: null,
      hydrated: false,
      setActive: (b) => set({ active: b }),
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
