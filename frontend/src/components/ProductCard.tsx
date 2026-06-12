'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/store/cart';

// REDISEÑO (Parte 2) — solo capa visual. La lógica (useCart, add, pop) intacta.
export default function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [popping, setPopping] = useState(false);

  const handleAdd = () => {
    add(product);
    setPopping(false);
    requestAnimationFrame(() => setPopping(true));
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-white/10 transition-transform duration-200 active:scale-95">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imagen}
          alt={product.nombre}
          className="w-full h-24 object-cover bg-surface"
        />
        {/* Degradado de protección: integra la imagen con la tarjeta */}
        <span
          className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, var(--color-card) 0%, transparent 100%)',
          }}
        />
        {/* Botón + flotante sobre la imagen */}
        <button
          onClick={handleAdd}
          onAnimationEnd={() => setPopping(false)}
          className={`absolute -bottom-2.5 right-2 bg-primary text-black rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-primary/40 transition active:scale-90 ${
            popping ? 'animate-pop' : ''
          }`}
          aria-label={`Agregar ${product.nombre}`}
        >
          <Plus size={17} strokeWidth={3} />
        </button>
      </div>
      <div className="p-2.5 pt-3">
        <h3 className="font-semibold text-xs leading-tight line-clamp-2 min-h-[2rem]">
          {product.nombre}
        </h3>
        <p className="font-extrabold text-primary text-sm mt-1.5 tabular-nums">
          <span className="text-[0.7em] align-[0.12em] mr-px">RD$</span>
          {product.precio}
        </p>
      </div>
    </div>
  );
}
