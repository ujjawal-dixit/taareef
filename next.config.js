/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co'         },
      { protocol: 'https', hostname: 'image.tmdb.org'         },
      { protocol: 'https', hostname: 'i.scdn.co'              },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com'       },
      { protocol: 'https', hostname: '*.googleusercontent.com'},
      { protocol: 'https', hostname: 'ssl.gstatic.com'        },
      { protocol: 'https', hostname: 'images.unsplash.com'    },
      { protocol: 'https', hostname: 'fastly.4sqi.net'        },
      { protocol: 'https', hostname: '*.foursquare.com'       },
    ],
  },
  reactStrictMode: true,
}
module.exports = nextConfig
