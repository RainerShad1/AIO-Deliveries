'use client';
import { useEffect } from 'react';

/**
 * Pantalla de "Pedido confirmado" con animacion y sonido.
 * Se muestra unos segundos tras enviar el pedido y luego llama a onDone().
 */
export default function OrderConfirmed({
  numero,
  onDone,
}: {
  numero?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    // Reproducir sonido de confirmacion (puede fallar si no hubo interaccion;
    // pero aqui el usuario acaba de tocar "Confirmar", asi que esta permitido)
    const audio = new Audio('/order-confirmed.mp3');
    audio.play().catch(() => {});

    // Tras 2.2s, continuar al seguimiento del pedido
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg animate-fade-in">
      {/* Circulo con check animado */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center animate-check-pop">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" className="check-path" />
            </svg>
          </div>
        </div>
        {/* Anillos que se expanden */}
        <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ring" />
      </div>

      <h2 className="text-2xl font-extrabold mt-6 animate-fade-in-up">
        Pedido confirmado!
      </h2>
      {numero && (
        <p className="text-muted mt-1 animate-fade-in-up">{numero}</p>
      )}
      <p className="text-muted text-sm mt-4 animate-fade-in">
        Preparando tu pedido...
      </p>
    </div>
  );
}
