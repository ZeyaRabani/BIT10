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
    price: number;
};

type Bit10DEFIEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_defi.json');
const cache = new NodeCache({ stdTTL: 1800 });

const fetchAndUpdateData = async () => {
    const coinmarketCapKey = process.env.COINMARKETCAP_API_KEY;

    if (!coinmarketCapKey) {
        console.error("COINMARKETCAP_API_KEY is not defined.");
        return;
    }

    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=8916,4847,7334,4956,3701,8669`;

    try {
        const result = await axios.get(url, {
            headers: { 'X-CMC_PRO_API_KEY': coinmarketCapKey },
        });

        const dataEntries = Object.values(result.data.data) as {
            id: number;
            name: string;
            symbol: string;
            quote: { USD: { price: number } };
        }[];

        const coinsData = dataEntries.map((entry) => ({
            id: entry.id,
            name: entry.name,
            symbol: entry.symbol,
            price: entry.quote.USD.price,
        }));

        const totalPrice = coinsData.reduce((sum, coin) => sum + coin.price, 0);
        const tokenPrice = totalPrice / coinsData.length;

        const newEntry: Bit10DEFIEntry = {
            timestmpz: new Date().toISOString(),
            tokenPrice,
            data: coinsData,
        };

        let existingData = await readJsonFile(jsonFilePath);
        existingData.bit10_defi.unshift(newEntry);
        cache.set('bit10_defi_data', existingData);

        await writeJsonFile(jsonFilePath, existingData);
        console.log('BIT10.DEFI data updated successfully.');
    } catch (error) {
        console.error('Error fetching BIT10.DEFI data:', error);
    }
};

// cron.schedule('*/30 * * * * *', fetchAndUpdateData); // 30 sec
cron.schedule('*/30 * * * *', fetchAndUpdateData); // 30 min

const filterDataByDays = (data: Bit10DEFIEntry[], days: number): Bit10DEFIEntry[] => {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.filter((entry) => new Date(entry.timestmpz).getTime() >= cutoffTime);
};

export const handleBit10DEFI = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.DEFI' }));
        return;
    }

    try {
        let existingData = cache.get<{ bit10_defi: Bit10DEFIEntry[] }>('bit10_defi_data');

        if (!existingData) {
            existingData = await readJsonFile(jsonFilePath);
            cache.set('bit10_defi_data', existingData);
        }

        const url = new URL(request.url || '', `http://${request.headers?.host || 'localhost'}`);
        const dayParam = url.searchParams.get('day');

        let responseData = existingData?.bit10_defi || [];
        if (dayParam === '1') responseData = filterDataByDays(responseData, 1);
        else if (dayParam === '7') responseData = filterDataByDays(responseData, 7);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bit10_defi: responseData }));
    } catch (error) {
        console.error('Error handling BIT10.DEFI request:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};

async function readJsonFile(filePath: string) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { bit10_defi: [] };
    }
}

async function writeJsonFile(filePath: string, data: object) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing file:", error);
    }
}
