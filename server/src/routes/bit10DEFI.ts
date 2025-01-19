import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import NodeCache from 'node-cache'

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
const cache = new NodeCache();

const fetchAndUpdateData = async () => {
    const coinmarketCapKey = process.env.COINMARKETCAP_API_KEY;
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=8916,4847,7334,4956,3701,8669&CMC_PRO_API_KEY=${coinmarketCapKey}`;

    try {
        const result = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': coinmarketCapKey,
            },
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

        let existingData: { bit10_defi: Bit10DEFIEntry[] } = { bit10_defi: [] };

        try {
            if (fs.existsSync(jsonFilePath)) {
                existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
            }
        } catch (err) {
            console.error('Error reading existing BIT10.DEFI data:', err);
        }

        existingData.bit10_defi.unshift(newEntry);
        cache.set('bit10_defi_data', existingData);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
        console.log('BIT10.DEFI data updated successfully.');
    } catch (error) {
        console.error('Error fetching BIT10.DEFI data:', error);
    }
};

setInterval(() => {
    fetchAndUpdateData().catch((error) => console.error('Error in fetchAndUpdateData:', error));
}, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// }, 3 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

const filterDataByDays = (data: Bit10DEFIEntry[], days: number): Bit10DEFIEntry[] => {
    const currentTime = Date.now();
    const cutoffTime = currentTime - days * 24 * 60 * 60 * 1000;
    return data.filter((entry) => new Date(entry.timestmpz).getTime() >= cutoffTime);
};

export const handleBit10DEFI = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.DEFI' }));
        return;
    }

    try {
        let existingData = cache.get<{ bit10_defi: Bit10DEFIEntry[] }>('bit10_defi_data');

        if (!existingData) {
            if (fs.existsSync(jsonFilePath)) {
                existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
                cache.set('bit10_defi_data', existingData);
            } else {
                existingData = { bit10_defi: [] };
            }
        }

        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const dayParam = url.searchParams.get('day');

        let responseData = existingData?.bit10_defi || [];
        
        if (dayParam === '1') {
            responseData = filterDataByDays(responseData, 1);
        } else if (dayParam === '7') {
            responseData = filterDataByDays(responseData, 7);
        }

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify({ bit10_defi: responseData }));
    } catch (error) {
        console.error('Error handling BIT10.DEFI request:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
