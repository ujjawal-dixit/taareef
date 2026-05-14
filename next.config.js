// next.config.js
// Next.js 14 does not support .ts config — use .js with JSDoc.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co'        },
      { protocol: 'https', hostname: 'image.tmdb.org'        },
      { protocol: 'https', hostname: 'i.scdn.co'             },
      { protocol: 'https', hostname: 'covers.openlibrary.org'},
      { protocol: 'https', hostname: 'images.unsplash.com'   },
      { protocol: 'https', hostname: 'i.imgur.com'           },
    ],
  },

  // Strict mode for catching issues early
  reactStrictMode: true,
}

module.exports = nextConfig
