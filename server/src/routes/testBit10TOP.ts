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

type TestBit10TOPEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/test_bit10_top.json');
const cache = new NodeCache();

async function fetchAndUpdateData() {
    try {
        const jsonRebalanceFilePath = path.join(__dirname, '../../../data/test_bit10_top_rebalance.json');
        const rebalanceData = JSON.parse(fs.readFileSync(jsonRebalanceFilePath, 'utf-8'));

        const changes = rebalanceData.test_bit10_top_rebalance[0].changes;
        const addedIds = changes.added.map((token: { id: number }) => token.id);
        const retainedIds = changes.retained.map((token: { id: number }) => token.id);

        const combinedIds = [...addedIds, ...retainedIds];

        const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;
        const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${combinedIds.join(',')}&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

        const result = await axios.get(url);

        const dataEntries = Object.values(result.data.data) as {
            id: number;
            name: string;
            symbol: string;
            quote: {
                USD: {
                    price: number;
                };
            };
        }[];

        const coinsData = dataEntries.map(entry => ({
            id: entry.id,
            name: entry.name,
            symbol: entry.symbol,
            price: entry.quote.USD.price
        }))

        const totalPrice = dataEntries.reduce((sum, entry) => sum + entry.quote.USD.price, 0);
        const tokenPrice = totalPrice / dataEntries.length;

        const newEntry = {
            timestmpz: new Date().toISOString(),
            tokenPrice,
            data: coinsData
        };

        let existingData;
        try {
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { test_bit10_top: TestBit10TOPEntry[] };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            console.error('Error fetching data for Test BIT10.TOP:', err);
            existingData = { test_bit10_top: [] };
        }

        existingData.test_bit10_top.unshift(newEntry);

        cache.set('test_bit10_top_data', existingData);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
        console.log('Adding data for Test BIT10.TOP');
    } catch (error) {
        console.error('Error fetching data for Test BIT10.TOP:', error);
    }
}

setInterval(() => {
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData for Test BIT10.TOP:', error));
}, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// }, 3 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

const filterDataByDays = (data: TestBit10TOPEntry[], days: number): TestBit10TOPEntry[] => {
    const currentTime = Date.now();
    const cutoffTime = currentTime - days * 24 * 60 * 60 * 1000;
    return data.filter((entry) => new Date(entry.timestmpz).getTime() >= cutoffTime);
};

export const handleTestBit10TOP = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for Test BIT10.TOP' }));
        return;
    }

    try {
        let existingData = cache.get<{ test_bit10_top: TestBit10TOPEntry[] }>('test_bit10_top_data');

        if (!existingData) {
            if (fs.existsSync(jsonFilePath)) {
                existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
                cache.set('test_bit10_top_data', existingData);
            } else {
                existingData = { test_bit10_top: [] };
            }
        }

        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const dayParam = url.searchParams.get('day');

        let responseData = existingData?.test_bit10_top || [];

        if (dayParam === '1') {
            responseData = filterDataByDays(responseData, 1);
        } else if (dayParam === '7') {
            responseData = filterDataByDays(responseData, 7);
        }

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify({ test_bit10_top: responseData }));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data for Test BIT10.TOP' }));
    }
};
