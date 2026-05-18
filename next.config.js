/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co'         },
      { protocol: 'https', hostname: 'image.tmdb.org'         },
      { protocol: 'https', hostname: 'i.scdn.co'              },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'images.unsplash.com'    },
    ],
  },
  reactStrictMode: true,
}
module.exports = nextConfig
