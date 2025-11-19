import type { IncomingMessage, ServerResponse } from 'http'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

type CoinGeckoMarketData = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number | null;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: any | null;
    last_updated: string;
};

type CachedCoinGeckoData = {
    timestmpz: string;
    data: CoinGeckoMarketData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/coingecko_cache.json');

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

if (!COINGECKO_API_KEY) {
    console.error('❌ COINGECKO_API_KEY is not defined.');
    process.exit(1);
}

export const fetchAndCacheCoinGeckoData = async () => {
    const API_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&x_cg_demo_api_key=${COINGECKO_API_KEY}`;

    try {
        const response = await axios.get(API_URL);
        const marketData: CoinGeckoMarketData[] = response.data;

        const timestmpz = new Date().toISOString();

        const cachedData: Record<string, CachedCoinGeckoData> = {
            'coingecko_markets': {
                timestmpz,
                data: marketData
            }
        };

        await fs.writeFile(jsonFilePath, JSON.stringify(cachedData, null, 2));

        console.log('✅ CoinGecko market data cached successfully at', timestmpz);
    } catch (error) {
        console.error('❌ Error fetching and caching CoinGecko data:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response:', error.response?.data);
        }
    }
};

export const getCachedCoinGeckoData = async (): Promise<CachedCoinGeckoData | null> => {
    try {
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const cachedData = JSON.parse(fileContent);

        if (cachedData['coingecko_markets']) {
            const cached = cachedData['coingecko_markets'];
            const cacheTime = new Date(cached.timestmpz).getTime();
            const now = Date.now();
            const ageInMinutes = (now - cacheTime) / (1000 * 60);

            // console.log(`📊 Cache age: ${ageInMinutes.toFixed(2)} minutes`);

            if (ageInMinutes < 5) {
                return cached;
            } else {
                console.warn('⚠️ Cache is older than 5 minutes');
                return null;
            }
        }

        return null;
    } catch (error) {
        console.warn('⚠️ JSON file not found or unreadable:', error);
        return null;
    }
};

export const handleGetCoinGeckoData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const cachedData = await getCachedCoinGeckoData();

        if (cachedData) {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(cachedData));
        } else {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'No cached data available',
                message: 'Cache is either empty or expired. Please try again in a moment.'
            }));
        }
    } catch (error) {
        console.error('❌ Error handling CoinGecko data request:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }));
    }
};

cron.schedule('*/5 * * * *', fetchAndCacheCoinGeckoData); // Every 5 minutes
