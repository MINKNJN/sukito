// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // 이미지 최적화
  images: {
    domains: ['d2ojyvx5ines08.cloudfront.net'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐시
  },

  // EC2 빌드 안정화 설정 (Next.js 15.3.0 호환)
  // swcMinify: true, // Next.js 15.3.0에서 제거됨
  
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

  // SEO 최적화
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
        ],
      },
    ];
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap.xml',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;