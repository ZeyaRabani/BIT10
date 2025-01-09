import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const jsonFilePath = path.join(__dirname, '../../data/bit10_brc20.json');

async function fetchAndUpdateData() {
    try {
        const jsonRebalanceFilePath = path.join(__dirname, '../../data/bit10_brc20_rebalance.json');
        const rebalanceData = JSON.parse(fs.readFileSync(jsonRebalanceFilePath, 'utf-8'));

        const changes = rebalanceData.bit10_brc20_rebalance[0].changes;
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
            platform: {
                token_address: string;
            }
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
            tokenAddress: entry.platform.token_address,
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
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_brc20: Array<{ timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, tokenAddress: string, price: number }> }> };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            existingData = { bit10_brc20: [] };
        }

        existingData.bit10_brc20.unshift(newEntry);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// 30 min.
setInterval(() => {
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData:', error));
}, 3000000);
// }, 3000);

export const handleBit10BRC20 = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_brc20: Array<{ timestmpz: string, data: Array<{ id: number, name: string, symbol: string, price: number }> }> };
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data' }));
    }
};