import type { Config } from 'tailwindcss';

// Los colores de marca ahora leen variables CSS que se rellenan dinamicamente
// segun el negocio activo (ver applyBranding en lib/branding.ts). Los valores
// por defecto viven en globals.css (paleta por defecto de la plataforma).
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-card)',
        card: 'var(--color-card)',
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        accent: 'var(--color-primary)',
        'accent-red': 'var(--color-accent)',
        'accent-blue': '#1976D2',
        muted: '#A0A0A0',
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '1.75rem' },
    },
  },
  plugins: [],
} satisfies Config;
