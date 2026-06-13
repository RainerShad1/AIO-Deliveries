import type { Business } from '@/types';

// Escribe los colores del negocio en las variables CSS de :root.
// Todos los bg-primary/text-primary/etc. del app pasan a usar estos valores.
export function applyBranding(b: Business | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  if (!b) {
    root.removeProperty('--color-primary');
    root.removeProperty('--color-primary-dark');
    root.removeProperty('--color-bg');
    root.removeProperty('--color-card');
    root.removeProperty('--color-accent');
    return;
  }
  // Ensure primary is bright enough to read on the dark card background (#15151D).
  const primary = ensureReadable(b.colorPrimary);
  root.setProperty('--color-primary', primary);
  root.setProperty('--color-primary-dark', darken(primary, 0.1));
  root.setProperty('--color-bg', b.colorBg);
  root.setProperty('--color-card', b.colorCard);
  root.setProperty('--color-accent', b.colorAccent);
}

// If perceived luma < 80 (out of 255), interpolate toward white until it reaches
// that threshold. Keeps the hue intact while making dark colors legible on #15151D.
function ensureReadable(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const num = parseInt(m, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const MIN = 80;
  if (luma >= MIN) return hex;
  const t = (MIN - luma) / (255 - luma);
  r = Math.min(255, Math.round(r + t * (255 - r)));
  g = Math.min(255, Math.round(g + t * (255 - g)));
  b = Math.min(255, Math.round(b + t * (255 - b)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const num = parseInt(m, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
