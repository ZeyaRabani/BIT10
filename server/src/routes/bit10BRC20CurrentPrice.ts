import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
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
const cache = new NodeCache();
let latestData: { bit10_brc20: Bit10BRC20Entry[] } | null = null;

async function fetchData() {
    try {
        if (!fs.existsSync(jsonFilePath)) {
            console.warn(`JSON file not found: ${jsonFilePath}`);
            latestData = null;
            return;
        }

        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        latestData = JSON.parse(fileContent);
        console.log('BIT10.BRC20 Current Data refreshed at:', new Date().toISOString());

        cache.set('bit10_brc20_current_price_data', latestData);
    } catch (error) {
        console.error('Error reading JSON file for BIT10.BRC20:', error);
        latestData = null;
    }
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('*/30 * * * *', () => { // 30 min
    fetchData().catch(error => console.error('Error in fetchData:', error));
});

fetchData().catch(error => console.error('Error in initial data fetch:', error));

export const handleBit10BRC20CurrentPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const cachedData = cache.get<{ bit10_brc20_current_price: Bit10BRC20Entry[] }>('bit10_brc20_current_price_data');

        if (cachedData?.bit10_brc20_current_price?.length) {
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(200);
            response.end(JSON.stringify(cachedData.bit10_brc20_current_price[0]));
            return;
        }

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(404);
        response.end(JSON.stringify({ error: 'No data available' }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
