import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    price: number;
};

type Bit10TOPEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/test_bit10_top.json');
const cache = new NodeCache();

let latestData: { test_bit10_top: Bit10TOPEntry[] } | null = null;

async function fetchData() {
    try {
        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        latestData = JSON.parse(fileContent);
        console.log('Test BIT10.TOP Current Data refreshed at:', new Date().toISOString());

        cache.set('test_bit10_top_current_price_data', latestData);
    } catch (error) {
        console.error('Error reading JSON file for Test BIT10.TOP Current Data:', error);
        latestData = null;
    }
}

setInterval(() => {
    fetchData().catch(error => console.error('Error in fetchData:', error));
}, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// }, 30 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

export const handleTestBit10TOPCurrentPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for Test BIT10.TOP Current Price' }));
        return;
    }

    try {
        const cachedData = cache.get('test_bit10_top_current_price_data') as { test_bit10_top: Bit10TOPEntry[] };

        if (cachedData) {
            const firstElement = cachedData.test_bit10_top[0];
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(200);
            response.end(JSON.stringify(firstElement));
            return;
        }

        if (!latestData || !latestData.test_bit10_top?.length) {
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(404);
            response.end(JSON.stringify({ error: 'No data available for Test BIT10.TOP Current Data' }));
            return;
        }

        const firstElement = latestData.test_bit10_top[0];
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(firstElement));
    } catch (error) {
        console.error('Error serving data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error serving data for Test BIT10.TOP Current Data' }));
    }
};
