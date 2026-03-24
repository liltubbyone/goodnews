/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config) => {
    // Prevent client bundle from trying to resolve Node-only modules
    // used inside server-only functions (e.g. fs in loadArticlesFromFile)
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false }
    return config
  },
}

module.exports = nextConfig
