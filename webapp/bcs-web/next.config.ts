/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.local', '192.168.*.*'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig