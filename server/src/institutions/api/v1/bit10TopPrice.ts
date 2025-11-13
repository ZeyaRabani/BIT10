import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import NodeCache from 'node-cache'
import cron from 'node-cron'
import { HermesClient } from '@pythnetwork/hermes-client'

type CoinDataInput = {
    id: number;
    name: string;
    symbol: string;
    marketCap: number;
    price: number;
}

type CoinDataOutput = {
    id: number;
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

const TOTAL_SUPPLY = 25_000_000_000_000; // 25 Trillion

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
            setTimeout(() => {
                console.log('Attempting to restart price stream...');
                const activePriceIds = Array.from(currentPrices.keys());
                if (activePriceIds.length > 0) {
                    startPriceStream(activePriceIds);
                }
            }, 5000);
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

cron.schedule('*/18 * * * *', async () => {
    try {
        console.log('Running scheduled update...');
        await loadPythFeed();
        await fetchBaseData();
    } catch (error) {
        console.error('Error in scheduled data update:', error);
    }
})

async function initialize() {
    try {
        await initializePythConnection();
        await loadPythFeed();
        await fetchBaseData();
    } catch (error) {
        console.error('Error in initial data loading:', error);
    }
}

initialize();

export const handleBIT10TOPPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    const cachedData = cache.get<BIT10TOPEntryOutput>('api_v1_balancer_bit10top_price') || latestData;

    if (cachedData) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(cachedData));
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'No data available' }));
}

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

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(balanceResponse));
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'No data available' }));
}
