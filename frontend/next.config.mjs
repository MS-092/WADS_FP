/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Enable server components optimization
    serverComponentsExternalPackages: [],
  },
  
  async rewrites() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return [
      {
        source: '/service/:path*',
        destination: isDevelopment
          ? 'http://localhost:5000/service/:path*'
          : 'https://e2425-wads-l4acg6-server.csbihub.id/service/:path*',
      },
    ]
  },
}

export default nextConfig
