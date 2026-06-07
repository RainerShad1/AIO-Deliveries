/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Permite cargar imagenes de productos desde cualquier host (ajusta en produccion)
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
module.exports = nextConfig;
