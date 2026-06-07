'use client';

/**
 * Logo de "Super Empanada El Meneo".
 * Usa el archivo public/logo.jpg. Para cambiarlo, reemplaza ese archivo.
 */
export default function Logo({ size = 56 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt="Super Empanada El Meneo"
      width={size}
      height={size}
      className="rounded-xl object-cover shrink-0 shadow-lg"
      style={{ width: size, height: size }}
    />
  );
}
