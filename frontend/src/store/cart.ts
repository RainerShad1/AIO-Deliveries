import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface CartLine {
  product: Product;
  cantidad: number;
}

interface CartState {
  lines: CartLine[];
  hydrated: boolean;
  add: (p: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
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
          const found = s.lines.find((l) => l.product.id === p.id);
          if (found) {
            return {
              lines: s.lines.map((l) =>
                l.product.id === p.id
                  ? { ...l, cantidad: l.cantidad + 1 }
                  : l,
              ),
            };
          }
          return { lines: [...s.lines, { product: p, cantidad: 1 }] };
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
      total: () =>
        get().lines.reduce(
          (sum, l) => sum + Number(l.product.precio) * l.cantidad,
          0,
        ),
      count: () => get().lines.reduce((n, l) => n + l.cantidad, 0),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'empanadas-cart',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
