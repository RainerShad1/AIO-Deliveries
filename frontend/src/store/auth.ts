import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from '@/types';

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  businessId: string | null; // del admin; null para cliente/super-admin
  hydrated: boolean; // indica si ya se rehidrato desde localStorage
  setSession: (
    token: string,
    role: Role,
    userId: string,
    businessId?: string | null,
  ) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      userId: null,
      businessId: null,
      hydrated: false,
      setSession: (token, role, userId, businessId = null) =>
        set({ token, role, userId, businessId }),
      setHydrated: (v) => set({ hydrated: v }),
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        set({ token: null, role: null, userId: null, businessId: null });
      },
    }),
    {
      name: 'empanadas-auth',
      // Cuando termina de rehidratar desde localStorage, marcamos hydrated=true.
      // Esto evita el desajuste servidor/cliente (errores React #418/#423).
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
