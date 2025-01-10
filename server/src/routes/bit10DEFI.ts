import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const jsonFilePath = path.join(__dirname, '../../../data/bit10_defi.json');

async function fetchAndUpdateData() {
    const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=8916,4847,7334,4956,3701,8669&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

    try {
        const result = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': coinmarket_cap_key,
            },
        });

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
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_defi: Array<{ timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }> };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            console.error('Error fetching data for BIT10.DEFI:', err);
            existingData = { bit10_defi: [] };
        }

        existingData.bit10_defi.unshift(newEntry);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
        console.log('Adding data for BIT10.DEFI');
    } catch (error) {
        console.error('Error fetching data for BIT10.DEFI:', error);
    }
}

setInterval(() => {
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData:', error));
}, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// }, 3 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

export const handleBit10DEFI = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.DEFI' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_defi: Array<{ timestmpz: string, data: Array<{ id: number, name: string, symbol: string, price: number }> }> };
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data for BIT10.DEFI' }));
    }
};
