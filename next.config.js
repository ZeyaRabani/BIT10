/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/tools/:path*',
                destination: 'https://pro-api.coinmarketcap.com/v1/tools/:path*',
            },
            {
                source: '/api/:path*',
                destination: 'https://pro-api.coinmarketcap.com/:path*',
            }
        ]
    },
}

module.exports = nextConfig
