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
                source: '/contact-form',
                destination: '/api/contact-form',
            },
            {
                source: '/bit10-testnet-welcome',
                destination: '/api/bit10-testnet-welcome',
            },
            {
                source: '/bit10-review',
                destination: '/api/bit10-review',
            },
            {
                source: '/bit10-token-request',
                destination: '/api/bit10-token-request',
            },
            {
                source: '/bit10-comparison-data-:time',
                destination: '/api/bit10-comparison-data/:time*',
            },
            {
                source: '/bit10-mint-request',
                destination: '/api/bit10-mint-request',
            },
            {
                source: '/bit10-latest-price-:index_fund',
                destination: '/api/bit10-latest-price/:index_fund',
            },
            {
                source: '/bit10-historic-data-:index_fund-:time',
                destination: '/api/bit10-historic-data/:index_fund/:time',
            },
            {
                source: '/bit10-latest-rebalance-:index_fund',
                destination: '/api/bit10-latest-rebalance/:index_fund',
            },
            {
                source: '/bit10-rebalance-history-:index_fund',
                destination: '/api/bit10-rebalance-history/:index_fund',
            },
            {
                source: '/referral-leaderboard',
                destination: '/api/referral-leaderboard',
            },
            {
                source: '/referral-user-:user_address',
                destination: '/api/referral-user/:user_address',
            }
        ]
    },
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@react-native-async-storage/async-storage': 'next/dist/compiled/react',
            'react-native': 'react-native-web',
        };

        config.externals.push({
            'pino-pretty': 'commonjs pino-pretty',
            'pino': 'commonjs pino'
        });

        if (isServer) {
            config.externals.push({
                'bufferutil': 'bufferutil',
                'utf-8-validate': 'utf-8-validate',
            });
        }

        return config;
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    }
};

export default withNextIntl(config);
