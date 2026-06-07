import './globals.css';
import type { Metadata, Viewport } from 'next';
import BrandingProvider from '@/components/BrandingProvider';

// SEO basico de la plataforma. Cada tienda ajusta su propio titulo en runtime.
export const metadata: Metadata = {
  title: 'AIO Deliverys',
  description:
    'Pide a domicilio de tus negocios favoritos: restaurantes, colmados y mas, desde una sola app.',
  openGraph: {
    title: 'AIO Deliverys',
    description: 'Tus negocios favoritos a domicilio, en una sola app.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg pb-20">
        <BrandingProvider />
        {children}
      </body>
    </html>
  );
}
