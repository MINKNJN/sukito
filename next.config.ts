// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // 이미지 최적화
  images: {
    domains: ['d2ojyvx5ines08.cloudfront.net'],
    formats: ['image/webp', 'image/avif'],
  },

  // EC2 빌드 안정화 설정
  swcMinify: true,
  
  // 빌드 최적화 - 프로덕션만
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
  }),

  // 메모리 사용량 최적화
  webpack: (config, { dev, isServer }) => {
    // 개발 환경에서는 최소한의 최적화만
    if (dev) return config;

    // 프로덕션에서만 추가 최적화
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;