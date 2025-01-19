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

type Bit10DEFIEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_defi.json');
const cache = new NodeCache();

let latestData: { bit10_defi: Bit10DEFIEntry[] } | null = null;

async function fetchData() {
    try {
        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        latestData = JSON.parse(fileContent);
        console.log('BIT10.DEFI Current Data refreshed at', new Date().toISOString());

        cache.set('bit10_defi_current_price_data', latestData);
    } catch (error) {
        console.error('Error reading JSON file for BIT10.DEFI Current Data:', error);
        latestData = null;
    }
}

setInterval(() => {
    fetchData().catch(error => console.error('Error in fetchData:', error));
}, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// }, 3 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

export const handleBit10DEFICurrentPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.DEFI Current Data' }));
        return;
    }

    try {
        const cachedData = cache.get('bit10_defi_current_price_data') as { bit10_defi: Bit10DEFIEntry[] };
        
        if (cachedData) {
            const firstElement = cachedData.bit10_defi[0];
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(200);
            response.end(JSON.stringify(firstElement));
            return;
        }

        if (!latestData || !latestData.bit10_defi?.length) {
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(404);
            response.end(JSON.stringify({ error: 'No data available for BIT10.DEFI Current Data' }));
            return;
        }

        const firstElement = latestData.bit10_defi[0];
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(firstElement));
    } catch (error) {
        console.error('Error serving data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error serving data for BIT10.DEFI Current Data' }));
    }
};
