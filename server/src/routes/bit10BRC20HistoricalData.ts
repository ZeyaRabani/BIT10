import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const jsonFilePath = path.join(__dirname, '../../data/bit10_brc20_historical_data.json');

async function fetchAndUpdateData() {
    const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;
    // limit is 10
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/category?id=654a0c87ba37f269c8016129&limit=10&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

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
            platform: {
                slug: string;
                token_address: string;
            }
            quote: {
                USD: {
                    price: number;
                };
            };
        }

        interface ApiResponse {
            data: {
                coins: Coin[];
            };
        }

        const apiResponse: ApiResponse = result.data as ApiResponse;

        // temp
        const supportedTokens = ['ORDI', 'SATS', 'PEPEBRC', 'TRAC', 'MEME', 'RATS', 'PIZZA']
        const filteredCoins = apiResponse.data.coins.filter(coin => coin.platform && coin.platform.slug === 'bitcoin' && supportedTokens.includes(coin.symbol)).slice(0, 3);

        const coinsData = filteredCoins.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            tokenAddress: coin.platform.token_address,
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
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_brc20_historical_data: Array<{ timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, tokenAddress: string, price: number }> }> };
        } catch (err) {
            console.error('Error fetching historical data for BIT10.BRC20:', err);
            existingData = { bit10_brc20_historical_data: [] };
        }

        existingData.bit10_brc20_historical_data.unshift(newEntry);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
        console.log('Adding historical data for BIT10.BRC20');
    } catch (error) {
        console.error('Error fetching historical data for BIT10.BRC20:', error);
    }
}

setInterval(() => {
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData for BIT10.BRC20:', error));
}, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// }, 3 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

export const handleBit10BRC20HistoricalData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.BRC20 Historical Data' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_brc20_historical_data: Array<{ timestmpz: string, data: Array<{ id: number, name: string, symbol: string, price: number }> }> };
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data for BIT10.BRC20 Historical Data' }));
    }
};