// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
};

export default nextConfig;
