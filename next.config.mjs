/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/coinmarketcap/:slug*',
                destination: `/api/coinmarketcap/:slug*`,
            },
            {
                source: '/bit10-defi-request/:slug*',
                destination: `/api/bit10-defi-request/:slug*`,
            },
            {
                source: '/bit10-btc-request/:slug*',
                destination: `/api/bit10-btc-request/:slug*`,
            },
            {
                source: '/ingest/:path*',
                destination: 'https://us.i.posthog.com/:path*',
            },
        ]
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

export default nextConfig;
