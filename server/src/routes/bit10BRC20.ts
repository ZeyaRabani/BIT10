import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import NodeCache from 'node-cache'
import cron from 'node-cron'

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    tokenAddress: string;
    price: number;
};

type Bit10BRC20Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_brc20.json');
const jsonRebalanceFilePath = path.join(__dirname, '../../../data/bit10_brc20_rebalance.json');
const cache = new NodeCache({ stdTTL: 1800 });

const fetchAndUpdateData = async () => {
    const coinmarketCapKey = process.env.COINMARKETCAP_API_KEY;

    if (!coinmarketCapKey) {
        console.error('COINMARKETCAP_API_KEY is not defined.');
        return;
    }

    try {
        const rebalanceData = await readJsonFile(jsonRebalanceFilePath);
        const changes = rebalanceData.bit10_brc20_rebalance?.[0]?.changes || {};
        const addedIds = changes.added?.map((token: { id: number }) => token.id) || [];
        const retainedIds = changes.retained?.map((token: { id: number }) => token.id) || [];
        const combinedIds = [...addedIds, ...retainedIds];

        if (combinedIds.length === 0) {
            console.warn('No token IDs found for BIT10.BRC20 rebalance.');
            return;
        }

        const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${combinedIds.join(',')}`;
        const result = await axios.get(url, {
            headers: { 'X-CMC_PRO_API_KEY': coinmarketCapKey },
        });

        const dataEntries = Object.values(result.data.data) as {
            id: number;
            name: string;
            symbol: string;
            platform: {
                token_address: string
            };
            quote: {
                USD: {
                    price: number
                }
            };
        }[];

        const coinsData = dataEntries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            symbol: entry.symbol,
            tokenAddress: entry.platform.token_address,
            price: entry.quote.USD.price
        }));

        const totalPrice = coinsData.reduce((sum, coin) => sum + coin.price, 0);
        const tokenPrice = totalPrice / coinsData.length;

        const newEntry: Bit10BRC20Entry = {
            timestmpz: new Date().toISOString(),
            tokenPrice,
            data: coinsData,
        };

        let existingData = await readJsonFile(jsonFilePath);
        existingData.bit10_brc20.unshift(newEntry);
        cache.set('bit10_brc20_data', existingData);

        await writeJsonFile(jsonFilePath, existingData);
        console.log('BIT10.BRC20 data updated successfully.');
    } catch (error) {
        console.error('Error fetching BIT10.BRC20 data:', error);
    }
};

// cron.schedule('*/30 * * * * *', fetchAndUpdateData); // 30 sec
cron.schedule('*/30 * * * *', fetchAndUpdateData); // 30 min

const filterDataByDays = (data: Bit10BRC20Entry[], days: number): Bit10BRC20Entry[] => {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.filter((entry) => new Date(entry.timestmpz).getTime() >= cutoffTime);
};

export const handleBit10BRC20 = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.BRC20' }));
        return;
    }

    try {
        let existingData = cache.get<{ bit10_brc20: Bit10BRC20Entry[] }>('bit10_brc20_data');

        if (!existingData) {
            existingData = await readJsonFile(jsonFilePath);
            cache.set('bit10_brc20_data', existingData);
        }

        const url = new URL(request.url || '', `http://${request.headers?.host || 'localhost'}`);
        const dayParam = url.searchParams.get('day');

        let responseData = existingData?.bit10_brc20 || [];
        if (dayParam === '1') responseData = filterDataByDays(responseData, 1);
        else if (dayParam === '7') responseData = filterDataByDays(responseData, 7);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bit10_brc20: responseData }));
    } catch (error) {
        console.error('Error handling BIT10.BRC20 request:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};

async function readJsonFile(filePath: string) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { bit10_brc20: [] };
    }
}

async function writeJsonFile(filePath: string, data: object) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing file:', error);
    }
}
