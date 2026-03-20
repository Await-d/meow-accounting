/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001/api',
  },

  // 公共环境变量 (运行时可用)
  publicRuntimeConfig: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001/api',
  },

  // 输出配置
  output: 'standalone',

  // 图片优化配置
  images: {
    unoptimized: true,
  },

  // Webpack 配置 - 移除CSS相关配置，使用Next.js内置处理
  webpack: (config, { isServer }) => {
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

module.exports = nextConfig;