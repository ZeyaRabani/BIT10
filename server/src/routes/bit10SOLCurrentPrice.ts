import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs/promises';
import path from 'path';
import NodeCache from 'node-cache';
import cron from 'node-cron';

type CoinData = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    price: number;
    marketCap: number;
};

type BIT10SOLEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_sol.json');
const cache = new NodeCache();
let latestData: { bit10_sol_current_price: BIT10SOLEntry[] } | null = null;

async function fetchData() {
    try {
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const parsedData: { bit10_sol_current_price: BIT10SOLEntry[] } = JSON.parse(fileContent);
        if (parsedData.bit10_sol_current_price.length > 0) {
            latestData = { bit10_sol_current_price: [parsedData.bit10_sol_current_price[0]] };
            cache.set('bit10_sol_current_price_data', latestData.bit10_sol_current_price[0]);
            console.log('BIT10.SOL Current Data refreshed at:', new Date().toISOString());
        }
    } catch (error) {
        console.error('Error reading JSON file for BIT10.SOL:', error);
    }
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('*/10 * * * *', () => { // 10 min
    fetchData().catch(error => console.error('Error in fetchData:', error));
});

fetchData().catch(error => console.error('Error in initial data fetch:', error));

export const handleBIT10SOLCurrentPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    const cachedData = cache.get<BIT10SOLEntry>('bit10_sol_current_price_data') || latestData;

    if (cachedData) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(cachedData));
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'No data available' }));
};
