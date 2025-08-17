/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MEITUAN_APP_ID: process.env.MEITUAN_APP_ID || '',
    MEITUAN_API_BASE_URL: process.env.MEITUAN_API_BASE_URL || 'https://aigc.sankuai.com/v1/openai/native',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
