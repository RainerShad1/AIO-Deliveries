import type { Business } from '@/types';

// Escribe los colores del negocio en las variables CSS de :root.
// Todos los bg-primary/text-primary/etc. del app pasan a usar estos valores.
export function applyBranding(b: Business | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  if (!b) {
    // Volver a la paleta por defecto de la plataforma
    root.removeProperty('--color-primary');
    root.removeProperty('--color-primary-dark');
    root.removeProperty('--color-bg');
    root.removeProperty('--color-card');
    root.removeProperty('--color-accent');
    return;
  }
  root.setProperty('--color-primary', b.colorPrimary);
  root.setProperty('--color-primary-dark', darken(b.colorPrimary, 0.1));
  root.setProperty('--color-bg', b.colorBg);
  root.setProperty('--color-card', b.colorCard);
  root.setProperty('--color-accent', b.colorAccent);
}

// Oscurece un hex un porcentaje dado (para el estado :active de los botones).
function darken(hex: string, amount: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const num = parseInt(m, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
