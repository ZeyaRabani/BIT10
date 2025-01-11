/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.js')
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const config = {
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
                source: '/contact-form/:slug*',
                destination: '/api/contact-form/:slug*',
            },
            {
                source: '/bit10-testnet-welcome/:slug*',
                destination: '/api/bit10-testnet-welcome/:slug*',
            },
            {
                source: '/bit10-review/:slug*',
                destination: '/api/bit10-review/:slug*',
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
    }
};

export default withNextIntl(config);
