import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
    eslint: {
    ignoreDuringBuilds: true, // disables ESLint check during `next build`
  },
  //   webpack: (config, { isServer }) => {
  //   // Prevent 'canvas' from being bundled on client builds
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...(config.resolve.fallback || {}),
  //       canvas: false,
  //     };
  //   }

  //   return config;
  // },
};

export default nextConfig;
