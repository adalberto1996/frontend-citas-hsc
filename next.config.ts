import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Habilitar Turbopack en dev
  output: "standalone",
  experimental: {
    turbo: {
      // Configuración de Turbopack si es necesaria
    },
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000",
  },

  // Optimizaciones
  poweredByHeader: false,

  // Configuración de imágenes (si usas next/image)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
