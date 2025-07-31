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
  // Vercel 함수 크기 제한 늘리기
  serverRuntimeConfig: {
    maxRequestBodySize: '15mb',
  },
};

export default nextConfig;
