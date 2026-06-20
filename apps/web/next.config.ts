import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/shared'],
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
