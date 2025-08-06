// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sharp'],
  experimental: {
    // Next.js 15.3.0에 맞는 설정
  },
};

export default nextConfig;
