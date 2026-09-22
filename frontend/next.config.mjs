/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Fix chunk loading issues on mobile
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      maxSize: 244000,
    };
    return config;
  },
};

export default nextConfig;
