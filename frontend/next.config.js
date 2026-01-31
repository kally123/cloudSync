/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Use API_URL for server-side rewrite (internal Docker hostname works here)
        // Client requests to /api/* will be proxied through Next.js server
        destination: process.env.API_URL 
          ? `${process.env.API_URL}/api/:path*`
          : 'http://localhost:8080/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
