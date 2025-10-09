/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.js')
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const config = {
    images: {
        domains: ['coin-images.coingecko.com', 's2.coinmarketcap.com'],
    },
    async redirects() {
        return [
            {
                source: '/gitbook',
                destination: 'https://gitbook.bit10.app',
                permanent: true,
            },
            {
                source: '/whitepaper',
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
                destination: `/api/contact-form/:slug*`,
            },
            {
                source: '/bit10-btc-request/:slug*',
                destination: `/api/bit10-btc-request/:slug*`,
            },
            {
                source: '/bit10-latest-price-:index_fund',
                destination: '/api/bit10-latest-price/:index_fund',
            },
            {
                source: '/test-bit10-latest-price-:index_fund',
                destination: '/api/test-bit10-latest-price/:index_fund',
            },
            {
                source: '/bit10-token-request/:slug*',
                destination: '/api/bit10-token-request/:slug*',
            },
            {
                source: '/bit10-comparison-data-:time',
                destination: '/api/bit10-comparison-data/:time*',
            },
            {
                source: '/bit10-historic-data-:index_fund-:time',
                destination: '/api/bit10-historic-data/:index_fund/:time',
            },
            {
                source: '/test-bit10-historic-data-:index_fund-:time',
                destination: '/api/test-bit10-historic-data/:index_fund/:time',
            },
            {
                source: '/bit10-latest-rebalance-:index_fund',
                destination: '/api/bit10-latest-rebalance/:index_fund',
            },
            {
                source: '/test-bit10-latest-rebalance-:index_fund',
                destination: '/api/test-bit10-latest-rebalance/:index_fund',
            },
            {
                source: '/bit10-rebalance-history-:index_fund',
                destination: '/api/bit10-rebalance-history/:index_fund',
            },
            {
                source: '/test-bit10-rebalance-history-:index_fund',
                destination: '/api/test-bit10-rebalance-history/:index_fund',
            },
            {
                source: '/token-list',
                destination: '/api/token-list',
            }
        ]
    },
    webpack: (config) => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
    },
    // webpack: (config, { isServer }) => {
    //     config.resolve.alias = {
    //         ...config.resolve.alias,
    //         '@react-native-async-storage/async-storage': 'next/dist/compiled/react',
    //         'react-native': 'react-native-web',
    //     };
    //     config.externals = [
    //         ...(config.externals || []),
    //         {
    //             'pino-pretty': 'commonjs pino-pretty',
    //             'pino': 'commonjs pino'
    //         }
    //     ];
    //     if (isServer) {
    //         config.externals.push({
    //             'bufferutil': 'bufferutil',
    //             'utf-8-validate': 'utf-8-validate',
    //         });
    //     }

    //     return config;
    // },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    }
};

export default withNextIntl(config);
