import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // TMDB posters (V2)
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      // Spotify album art (V2)
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      // Unsplash (static example images)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
