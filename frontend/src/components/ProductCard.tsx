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
    <div className="flex items-stretch gap-3 bg-card border border-white/10 rounded-2xl p-3 transition active:scale-[0.99]">
      {/* Izquierda: texto */}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="font-bold text-sm line-clamp-2">{product.nombre}</h3>
        {product.descripcion && (
          <p className="text-xs text-muted line-clamp-2 mt-0.5">
            {product.descripcion}
          </p>
        )}
        <p className="font-extrabold text-primary text-base tabular-nums mt-auto pt-2">
          <span className="text-[0.72em] align-[0.12em]">RD$</span>
          {product.precio}
        </p>
      </div>
      {/* Derecha: imagen + botón + */}
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imagen}
          alt={product.nombre}
          className="w-24 h-24 rounded-xl object-cover bg-surface"
        />
        <button
          onClick={handleAdd}
          onAnimationEnd={() => setPopping(false)}
          className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/40 transition active:scale-90 ${
            popping ? 'animate-pop' : ''
          }`}
          aria-label={`Agregar ${product.nombre}`}
        >
          <Plus size={17} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
