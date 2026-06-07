'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/store/cart';

export default function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [popping, setPopping] = useState(false);

  const handleAdd = () => {
    add(product);
    setPopping(false);
    requestAnimationFrame(() => setPopping(true));
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden transition-transform duration-200 active:scale-95">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imagen}
          alt={product.nombre}
          className="w-full h-20 object-cover bg-surface"
        />
        {/* Boton + flotante sobre la imagen */}
        <button
          onClick={handleAdd}
          onAnimationEnd={() => setPopping(false)}
          className={`absolute -bottom-2 right-1.5 bg-primary text-black rounded-full w-7 h-7 flex items-center justify-center shadow-lg shadow-primary/40 ${
            popping ? 'animate-pop' : ''
          }`}
          aria-label={`Agregar ${product.nombre}`}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
      <div className="p-2 pt-2.5">
        <h3 className="font-semibold text-xs leading-tight line-clamp-2 min-h-[2rem]">
          {product.nombre}
        </h3>
        <p className="font-extrabold text-primary text-xs mt-1">
          RD${product.precio}
        </p>
      </div>
    </div>
  );
}
