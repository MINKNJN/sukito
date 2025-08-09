// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['sharp'],
  
  // 이미지 최적화
  images: {
    domains: ['d2ojyvx5ines08.cloudfront.net'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 성능 최적화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@next/font'],
  },
  
  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
