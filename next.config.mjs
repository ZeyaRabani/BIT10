import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/gitbook',
                destination: 'https://gitbook.bit10.app',
                permanent: true,
            },
            {
                source: '/twitter',
                destination: 'https://twitter.com/bit10startup',
                permanent: true,
            },
            {
                source: '/telegram',
                destination: 'https://t.me/zr00083',
                permanent: true,
            },
            {
                source: '/github',
                destination: 'https://github.com/ZeyaRabani/BIT10',
                permanent: true,
            }
        ]
    },
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
                source: '/bit10-testnet-welcome/:slug*',
                destination: `/api/bit10-testnet-welcome/:slug*`,
            },
            {
                source: '/bit10-testnet-welcome-single/:slug*',
                destination: `/api/bit10-testnet-welcome-single/:slug*`,
            },
            {
                source: '/bit10-review/:slug*',
                destination: `/api/bit10-review/:slug*`,
            },
            {
                source: '/bit10-btc-request-approve/:slug*',
                destination: `/api/bit10-btc-request-approve/:slug*`,
            },
            {
                source: '/icp-interview/:slug*',
                destination: `/api/icp-interview/:slug*`,
            },
            {
                source: '/contact-form/:slug*',
                destination: `/api/contact-form/:slug*`,
            },
            {
                source: '/ingest/static/:path*',
                destination: 'https://eu-assets.i.posthog.com/static/:path*',
            },
            {
                source: '/ingest/:path*',
                destination: 'https://eu.i.posthog.com/:path*',
            },
            {
                source: '/ingest/decide',
                destination: 'https://eu.i.posthog.com/decide',
            },
            {
                source: '/bit10-defi-latest-price',
                destination: '/api/bit10-defi-latest-price',
            },
            {
                source: '/bit10-brc20-latest-price',
                destination: '/api/bit10-brc20-latest-price',
            },
            {
                source: '/bit10-token-request/:slug*',
                destination: '/api/bit10-token-request/:slug*',
            }
        ]
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
};

export default withNextIntl(nextConfig);
