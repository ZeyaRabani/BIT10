import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import NodeCache from 'node-cache'
import cron from 'node-cron'
import { HermesClient } from '@pythnetwork/hermes-client'

type CoinDataInput = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    price: number;
    marketCap: number;
}

type CoinDataOutput = {
    id: string;
    name: string;
    symbol: string;
    circulatingSupply: number;
    pythFeedId?: string;
    currentPrice?: number;
    currentMarketCap?: number;
    weightPercent?: number;
}

type BIT10TOPEntryInput = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinDataInput[];
}

type BIT10TOPEntryOutput = {
    token: string;
    tokenPrice: number;
    timestmpz: string;
    data: CoinDataOutput[];
}

type PythFeedEntry = {
    id: string;
    attributes: {
        display_symbol: string;
    }
}

const jsonFilePath = path.join(
    __dirname,
    '../../../../../data/bit10_top.json'
);
const pythFeed = path.join(
    __dirname,
    '../../../../../data/hermes_pyth_price_feed.json'
);
const cache = new NodeCache();
let latestData: BIT10TOPEntryOutput | null = null;
let pythFeedData: PythFeedEntry[] = [];
let hermesClient: HermesClient | null = null;
let currentPrices: Map<string, number> = new Map();
let priceStreamEventSource: any = null;
let baseDataCache: CoinDataInput[] = [];
let cronJob: any = null;

const TOTAL_SUPPLY = 25_000_000_000_000; // 25 Trillion

export function getPriceData(): BIT10TOPEntryOutput | null {
    return cache.get<BIT10TOPEntryOutput>('api_v1_balancer_bit10top_price') || latestData;
}

export async function cleanup() {
    console.log('🧹 Cleaning up BIT10.TOP price data resources...');

    if (cronJob) {
        try {
            cronJob.stop();
            cronJob = null;
            console.log('✅ Cron job stopped');
        } catch (error) {
            console.error('❌ Error stopping cron job:', error);
        }
    }

    if (priceStreamEventSource) {
        try {
            priceStreamEventSource.close();
            priceStreamEventSource = null;
            console.log('✅ Pyth price stream closed');
        } catch (error) {
            console.error('❌ Error closing Pyth price stream:', error);
        }
    }

    if (hermesClient) {
        hermesClient = null;
        console.log('✅ Hermes client cleared');
    }

    currentPrices.clear();
    baseDataCache = [];
    latestData = null;
    pythFeedData = [];
    cache.flushAll();
    console.log('✅ All BIT10.TOP price data cleared');
}

async function loadPythFeed() {
    try {
        const fileContent = await fs.readFile(pythFeed, 'utf-8');
        pythFeedData = JSON.parse(fileContent);
        console.log('Pyth feed data loaded successfully');
    } catch (error) {
        console.error('Error loading Pyth feed data:', error);
        throw error;
    }
}

async function initializePythConnection() {
    try {
        hermesClient = new HermesClient('https://hermes.pyth.network');
        console.log('Pyth Hermes client initialized');
    } catch (error) {
        console.error('Error initializing Pyth client:', error);
    }
}

async function startPriceStream(priceIds: string[]) {
    if (!hermesClient || priceIds.length === 0) return;

    if (priceStreamEventSource) {
        try {
            priceStreamEventSource.close();
            priceStreamEventSource = null;
        } catch (error) {
            console.error('Error closing existing stream:', error);
        }
    }

    try {
        priceStreamEventSource = await hermesClient.getPriceUpdatesStream(priceIds, {
            parsed: true,
        });

        priceStreamEventSource.onmessage = async (event: any) => {
            try {
                const data = JSON.parse(event.data);
                for (const item of data.parsed) {
                    const rawPrice = Number(item.price.price);
                    const exponent = item.price.expo;
                    const priceParsed = rawPrice * Math.pow(10, exponent);
                    currentPrices.set(item.id, priceParsed);
                }

                updateCachedDataWithCurrentPrices();
            } catch (error) {
                console.error('Error processing price update:', error);
            }
        }

        priceStreamEventSource.onerror = (error: any) => {
            console.error('Error receiving price updates:', error);

            if (priceStreamEventSource !== null) {
                setTimeout(() => {
                    console.log('Attempting to restart price stream...');
                    const activePriceIds = Array.from(currentPrices.keys());
                    if (activePriceIds.length > 0 && hermesClient) {
                        startPriceStream(activePriceIds);
                    }
                }, 5000);
            }
        }

        priceStreamEventSource.onclose = () => {
            console.log('Pyth price stream closed');
        }

        console.log(`Started price stream for ${priceIds.length} tokens`);
    } catch (error) {
        console.error('Error starting price stream:', error);
    }
}

function updateCachedDataWithCurrentPrices() {
    if (baseDataCache.length === 0) return;

    const transformedData: CoinDataOutput[] = baseDataCache.map(coin => {
        const pythEntry = pythFeedData.find(
            entry =>
                entry.attributes.display_symbol ===
                `${coin.symbol.toUpperCase()}/USD`
        );

        const pythFeedId = pythEntry?.id;
        const currentPrice = pythFeedId ? currentPrices.get(pythFeedId) : undefined;
        const circulatingSupply = coin.price !== 0 ? coin.marketCap / coin.price : 0;

        const currentMarketCap = currentPrice && circulatingSupply ? currentPrice * circulatingSupply : undefined;

        return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            circulatingSupply: circulatingSupply,
            pythFeedId: pythFeedId,
            currentPrice: currentPrice,
            currentMarketCap: currentMarketCap
        };
    })

    const totalCurrentMarketCap = transformedData.reduce((sum, coin) => {
        return sum + (coin.currentMarketCap || 0)
    }, 0);

    const dataWithWeights = transformedData.map(coin => ({
        ...coin,
        weightPercent: coin.currentMarketCap && totalCurrentMarketCap > 0
            ? (coin.currentMarketCap / totalCurrentMarketCap) * 100
            : undefined
    }));

    const tokenPrice = (totalCurrentMarketCap / TOTAL_SUPPLY) * 100;

    const outputEntry: BIT10TOPEntryOutput = {
        token: 'BIT10.TOP',
        tokenPrice: tokenPrice,
        timestmpz: new Date().toISOString(),
        data: dataWithWeights
    }

    latestData = outputEntry;
    cache.set('api_v1_balancer_bit10top_price', outputEntry);
}

async function fetchBaseData() {
    try {
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const parsedData: {
            bit10_top_current_price: BIT10TOPEntryInput[]
        } = JSON.parse(fileContent);

        if (parsedData.bit10_top_current_price.length > 0) {
            const inputEntry = parsedData.bit10_top_current_price[0];
            baseDataCache = inputEntry.data;

            const pythFeedIds: string[] = [];

            inputEntry.data.forEach(coin => {
                const pythEntry = pythFeedData.find(
                    entry =>
                        entry.attributes.display_symbol ===
                        `${coin.symbol.toUpperCase()}/USD`
                );
                if (pythEntry?.id) {
                    pythFeedIds.push(pythEntry.id)
                };
            })

            if (pythFeedIds.length > 0) {
                await startPriceStream(pythFeedIds);
            }

            updateCachedDataWithCurrentPrices();

            console.log('API v1 Balancer BIT10.TOP base data refreshed at:', new Date().toISOString());
        }
    } catch (error) {
        console.error('Error reading JSON file for BIT10.TOP:', error);
        throw error;
    }
}

cronJob = cron.schedule('*/18 * * * *', async () => {
    try {
        console.log('Running scheduled BIT10.TOP update...');
        await loadPythFeed();
        await fetchBaseData();
    } catch (error) {
        console.error('Error in scheduled BIT10.TOP data update:', error);
    }
}, {
    scheduled: true,
    timezone: 'UTC'
});

async function initialize() {
    try {
        console.log('🚀 Initializing BIT10.TOP price service...');
        await initializePythConnection();
        await loadPythFeed();
        await fetchBaseData();
        console.log('✅ BIT10.TOP price service initialized successfully');
    } catch (error) {
        console.error('❌ Error in BIT10.TOP initial data loading:', error);
    }
}

initialize();

/**
 * @swagger
 * /api/v1/balancer/bit10top/price:
 *   get:
 *     summary: Get BIT10.TOP current price and token data
 *     description: Returns the current price of the BIT10.TOP token, along with detailed information about all constituent tokens, including their prices, market caps, and weight percentages. The data is updated in real-time using Pyth Network price feeds. The price of the BIT10.TOP token is calculated in real-time (every 1 second), but token rebalancing occurs every 20 minutes. For real-time updates, use the WebSocket endpoint at `wss://eagleai-api.bit10.app/ws/price-feed`.
 *     tags: [Balancer]
 *     responses:
 *       200:
 *         description: Successful response with price and token data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BIT10TOPPrice'
 *             example:
 *               token: "BIT10.TOP"
 *               tokenPrice: 11.22
 *               timestmpz: "2025-11-14T10:30:00.000Z"
 *               data:
 *                 - id: 1
 *                   name: "Bitcoin"
 *                   symbol: "BTC"
 *                   circulatingSupply: 19500000
 *                   pythFeedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43"
 *                   currentPrice: 43250.50
 *                   currentMarketCap: 843484750000
 *                   weightPercent: 45.5
 *                 - id: 2
 *                   name: "Ethereum"
 *                   symbol: "ETH"
 *                   circulatingSupply: 120000000
 *                   pythFeedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
 *                   currentPrice: 2250.75
 *                   currentMarketCap: 270090000000
 *                   weightPercent: 30.2
 *       404:
 *         description: No data available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No data available"
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Method Not Allowed"
 */

export const handleBIT10TOPPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    const cachedData = cache.get<BIT10TOPEntryOutput>('api_v1_balancer_bit10top_price') || latestData;

    if (cachedData) {
        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        response.end(JSON.stringify(cachedData));
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'No data available' }));
}

/**
 * @swagger
 * /api/v1/balancer/bit10top/balance:
 *   get:
 *     summary: Get BIT10.TOP token composition and balance
 *     description: Returns the composition breakdown of the BIT10.TOP token, showing all constituent tokens and their weight percentages in the index. This endpoint provides a simplified view focused on the balance distribution. The weights of the BIT10.TOP token are calculated in real-time (every 1 second), but token rebalancing occurs every 20 minutes. For real-time updates, use the WebSocket endpoint at `wss://eagleai-api.bit10.app/ws/price-feed`.
 *     tags: [Balancer]
 *     responses:
 *       200:
 *         description: Successful response with balance composition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BIT10TOPBalance'
 *             example:
 *               token: "BIT10.TOP"
 *               composition:
 *                 - id: 1
 *                   name: "Bitcoin"
 *                   symbol: "BTC"
 *                   weightPercent: 45.5
 *                 - id: 2
 *                   name: "Ethereum"
 *                   symbol: "ETH"
 *                   weightPercent: 30.2
 *                 - id: 3
 *                   name: "Cardano"
 *                   symbol: "ADA"
 *                   weightPercent: 12.3
 *                 - id: 4
 *                   name: "Solana"
 *                   symbol: "SOL"
 *                   weightPercent: 8.7
 *                 - id: 5
 *                   name: "Polkadot"
 *                   symbol: "DOT"
 *                   weightPercent: 3.3
 *       404:
 *         description: No data available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "No data available"
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Method Not Allowed"
 */

export const handleBIT10TOPBalance = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    const cachedData = cache.get<BIT10TOPEntryOutput>('api_v1_balancer_bit10top_price') || latestData;

    if (cachedData) {
        const balanceResponse = {
            token: cachedData.token,
            composition: cachedData.data.map(coin => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                weightPercent: coin.weightPercent
            }))
        };

        response.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        response.end(JSON.stringify(balanceResponse));
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'No data available' }));
}

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received in BIT10.TOP module');
    cleanup();
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received in BIT10.TOP module');
    cleanup();
});
