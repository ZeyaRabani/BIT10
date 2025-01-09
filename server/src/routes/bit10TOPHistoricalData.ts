import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const jsonFilePath = path.join(__dirname, '../../data/bit10_top_historical_data.json');

async function fetchAndUpdateData() {
    const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;
    // limit is 15
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=15&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

    try {
        const result = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': coinmarket_cap_key,
            },
        });

        interface Coin {
            id: number;
            name: string;
            symbol: string;
            tags: string[];
            platform: {
                token_address: string;
            } | null;
            quote: {
                USD: {
                    price: number;
                };
            };
        }

        interface ApiResponse {
            data: Coin[];
        }

        const apiResponse: ApiResponse = result.data as ApiResponse;

        const filteredCoins = apiResponse.data.filter(coin => !coin.tags.includes('stablecoin')).slice(0, 10);

        const coinsData = filteredCoins.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            tokenAddress: coin.platform?.token_address,
            price: coin.quote.USD.price
        }));

        const totalPrice = coinsData.reduce((sum, token) => sum + (token?.price ?? 0), 0);
        const tokenPrice = coinsData.length > 0 ? totalPrice / coinsData.length : 0;

        const newEntry = {
            timestmpz: new Date().toISOString(),
            tokenPrice,
            data: coinsData
        };

        let existingData;
        try {
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_top_historical_data: Array<{ timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, tokenAddress?: string, price: number }> }> };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            existingData = { bit10_top_historical_data: [] };
        }

        existingData.bit10_top_historical_data.unshift(newEntry);

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

export const handleBit10TOPHistoricalData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_top_historical_data: Array<{ timestmpz: string, data: Array<{ id: number, name: string, symbol: string, price: number }> }> };
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