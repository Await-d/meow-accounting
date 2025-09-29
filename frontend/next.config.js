/*
 * @Author: Await
 * @Date: 2025-03-04 19:18:13
 * @LastEditors: Await
 * @LastEditTime: 2025-09-29 16:50:00
 * @Description: Next.js configuration for meow accounting
 */

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

  // 实验性功能 (Next.js 14+ App Router 已稳定)
  // experimental: {
  //   // Next.js 14+ 不再需要 appDir 配置
  // },

  // Webpack 配置
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