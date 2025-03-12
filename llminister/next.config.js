/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
}

// Force port 3000
process.env.PORT = '3000';

module.exports = nextConfig
