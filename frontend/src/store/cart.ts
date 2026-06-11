import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { useBusiness } from '@/store/business';

// Negocio dueno de cada linea: el carrito puede mezclar varios negocios y
// se agrupa/envia por negocio (una orden por negocio seleccionado).
export interface CartBiz {
  id: string;
  slug: string;
  nombre: string;
}

export interface CartLine {
  product: Product;
  cantidad: number;
  biz: CartBiz;
}

interface CartState {
  lines: CartLine[];
  hydrated: boolean;
  add: (p: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  clearSlugs: (slugs: string[]) => void; // vacia solo los negocios enviados
  total: () => number;
  count: () => number;
  setHydrated: (v: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      hydrated: false,
      add: (p) =>
        set((s) => {
          // El negocio activo (la tienda que el cliente esta navegando) es
          // el dueno de la linea. Sin negocio activo no se puede agregar.
          const active = useBusiness.getState().active;
          if (!active) return s;
          const biz: CartBiz = {
            id: active.id,
            slug: active.slug,
            nombre: active.nombre,
          };
          const found = s.lines.find((l) => l.product.id === p.id);
          if (found) {
            return {
              lines: s.lines.map((l) =>
                l.product.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l,
              ),
            };
          }
          return { lines: [...s.lines, { product: p, cantidad: 1, biz }] };
        }),
      remove: (id) =>
        set((s) => ({ lines: s.lines.filter((l) => l.product.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.product.id !== id)
              : s.lines.map((l) =>
                  l.product.id === id ? { ...l, cantidad: qty } : l,
                ),
        })),
      clear: () => set({ lines: [] }),
      clearSlugs: (slugs) =>
        set((s) => ({
          lines: s.lines.filter((l) => !slugs.includes(l.biz.slug)),
        })),
      total: () =>
        get().lines.reduce(
          (sum, l) => sum + Number(l.product.precio) * l.cantidad,
          0,
        ),
      count: () => get().lines.reduce((n, l) => n + l.cantidad, 0),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      // Nombre nuevo: las lineas viejas (sin negocio) quedan descartadas.
      name: 'aio-cart',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
