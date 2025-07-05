import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import NodeCache from 'node-cache'
import cron from 'node-cron'

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    chain: string;
    tokenAddress: string;
    price: number;
};

type Bit10MEMEEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_meme.json');
const cache = new NodeCache();
let latestData: { bit10_meme_current_price: Bit10MEMEEntry[] } | null = null;

async function fetchData() {
    try {
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const parsedData: { bit10_meme_current_price: Bit10MEMEEntry[] } = JSON.parse(fileContent);
        if (parsedData.bit10_meme_current_price.length > 0) {
            latestData = { bit10_meme_current_price: [parsedData.bit10_meme_current_price[0]] };
            cache.set('bit10_meme_current_price_data', latestData.bit10_meme_current_price[0]);
            console.log('Test BIT10.MEME Current Data refreshed at:', new Date().toISOString());
        }
    } catch (error) {
        console.error('Error reading JSON file for Test BIT10.MEME:', error);
    }
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('*/20 * * * *', () => { // 20 min
    fetchData().catch(error => console.error('Error in fetchData:', error));
});

fetchData();

export const handleBit10MEMECurrentPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    const cachedData = cache.get<Bit10MEMEEntry>('bit10_meme_current_price_data') || latestData;

    if (cachedData) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(cachedData));
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'No data available' }));
};
