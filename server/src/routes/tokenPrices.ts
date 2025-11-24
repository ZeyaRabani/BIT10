import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import NodeCache from 'node-cache'
import cron from 'node-cron'
import { URL } from 'url'

type CoinData = {
    id: string;
    symbol: string;
    name: string;
    image?: string;
    price: number;
    marketCap?: number;
    chain?: string;
    tokenAddress?: string;
};

type BIT10Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

type BIT10Data = {
    bit10_top_current_price?: BIT10Entry[];
    bit10_defi_current_price?: BIT10Entry[];
    bit10_meme_current_price?: BIT10Entry[];
    bit10_brc20_current_price?: BIT10Entry[];
};

type CGTokenData = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: any;
    last_updated: string;
};

type CGTokenList = {
    timestmpz: string;
    data: CGTokenData[];
};

const BIT10_CONFIG = {
    'BE5500SM5O': {
        filePath: path.join(__dirname, '../../../data/bit10_defi.json'),
        dataKey: 'bit10_defi_current_price',
        cacheKey: 'bit10_defi_data',
        name: 'BIT10.DEFI'
    },
    '7T3QTESSTZG': {
        filePath: path.join(__dirname, '../../../data/bit10_brc20.json'),
        dataKey: 'bit10_brc20_current_price',
        cacheKey: 'bit10_brc20_data',
        name: 'BIT10.BRC20'
    },
    '85K37E6CQCU': {
        filePath: path.join(__dirname, '../../../data/bit10_top.json'),
        dataKey: 'bit10_top_current_price',
        cacheKey: 'bit10_top_data',
        name: 'BIT10.TOP'
    },
    'ZQKAQ39D22S': {
        filePath: path.join(__dirname, '../../../data/bit10_meme.json'),
        dataKey: 'bit10_meme_current_price',
        cacheKey: 'bit10_meme_data',
        name: 'BIT10.MEME'
    }
};

const TOKEN_ID_CONFIG: Record<string, string> = {
    'UJ99GFG0BX': 'bitcoin',
    'L3O6OYISMG9': 'ethereum',
    'QXTKEITI1T': 'binancecoin',
    '0BYGPNHOOYNA': 'solana',
    'SZ1J8CHNYI': 'internet-computer',
    'BCWDZEEALZN': 'usd-coin'
};

const cache = new NodeCache();
const cgTokenListPath = path.join(__dirname, '../../../data/cg_token_list.json');

async function fetchDataForBit10Id(bit10Id: keyof typeof BIT10_CONFIG) {
    const config = BIT10_CONFIG[bit10Id];

    try {
        const fileContent = await fs.readFile(config.filePath, 'utf-8');
        const parsedData: BIT10Data = JSON.parse(fileContent);
        const dataArray = parsedData[config.dataKey as keyof BIT10Data] as BIT10Entry[];

        if (dataArray && dataArray.length > 0) {
            const latestEntry = dataArray[0];
            cache.set(config.cacheKey, latestEntry);
        }
    } catch (error) {
        console.error(`Error reading JSON file for ${config.name}:`, error);
    }
}

async function fetchCGTokenList() {
    try {
        const fileContent = await fs.readFile(cgTokenListPath, 'utf-8');
        const parsedData: CGTokenList = JSON.parse(fileContent);

        if (parsedData.data && parsedData.data.length > 0) {
            cache.set('cg_token_list', parsedData);

            parsedData.data.forEach(token => {
                cache.set(`cg_token_${token.id}`, token);
            });

            console.log('CoinGecko Token List refreshed at:', new Date().toISOString(),
                `- Total tokens: ${parsedData.data.length}`);
        }
    } catch (error) {
        console.error('Error reading CoinGecko token list:', error);
    }
}

async function fetchData() {
    const bit10Promises = Object.keys(BIT10_CONFIG).map(bit10Id =>
        fetchDataForBit10Id(bit10Id as keyof typeof BIT10_CONFIG)
    );

    const cgPromise = fetchCGTokenList();

    await Promise.all([...bit10Promises, cgPromise]);
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('*/10 * * * *', () => { // 10 min
    fetchData().catch(error => console.error('Error in fetchData:', error));
});

fetchData().catch(error => console.error('Error in initial data fetch:', error));

export const handleTokenCurrentPrices = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const bit10_id = url.searchParams.get('bit10_id');
        const token_id = url.searchParams.get('token_id');

        if (!bit10_id || !token_id) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'Missing required parameters',
                message: 'Both bit10_id and token_id are required',
                received: {
                    bit10_id: bit10_id || null,
                    token_id: token_id || null
                }
            }));
            return;
        }

        if (!(bit10_id in BIT10_CONFIG)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'Invalid bit10_id',
                message: `bit10_id must be one of: ${Object.keys(BIT10_CONFIG).join(', ')}`,
                received: bit10_id
            }));
            return;
        }

        if (!(token_id in TOKEN_ID_CONFIG)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'Invalid token_id',
                message: `token_id must be one of: ${Object.keys(TOKEN_ID_CONFIG).join(', ')}`,
                received: token_id
            }));
            return;
        }

        const config = BIT10_CONFIG[bit10_id as keyof typeof BIT10_CONFIG];
        const cachedData = cache.get<BIT10Entry>(config.cacheKey);

        if (!cachedData) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'No data available',
                message: `No cached data found for ${config.name}. Please try again later.`
            }));
            return;
        }

        const cgTokenId = TOKEN_ID_CONFIG[token_id];
        const cgToken = cache.get<CGTokenData>(`cg_token_${cgTokenId}`);

        if (!cgToken) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                error: 'Token price not available',
                message: `No price data found for token: ${cgTokenId}. Please try again later.`
            }));
            return;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
            timestamp: cachedData.timestmpz,
            bit10_price: cachedData.tokenPrice,
            token_price: cgToken.current_price
        }));

    } catch (error) {
        console.error('Error processing request:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred while processing your request'
        }));
    }
};
