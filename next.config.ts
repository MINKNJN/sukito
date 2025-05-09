// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  api: {
    bodyParser: false, 
  },
};

export default nextConfig;
