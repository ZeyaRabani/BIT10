import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import cron from 'node-cron'

interface Coin {
    id: number;
    name: string;
    symbol: string;
    tags: string[];
    quote: {
        USD: {
            price: number;
        };
    };
}

interface ApiResponse {
    data: Coin[];
}

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

const jsonFilePath = path.join(__dirname, '../../../data/bit10_top_historical_data.json');

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

        const apiResponse: ApiResponse = result.data as ApiResponse;

        const filteredCoins = apiResponse.data.filter(coin => !coin.tags.includes('stablecoin')).slice(0, 10);

        const coinsData = filteredCoins.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.quote.USD.price
        }));

        const totalPrice = coinsData.reduce((sum, coin) => sum + coin.price, 0);
        const tokenPrice = (totalPrice / coinsData.length) / 1000;

        const newEntry = {
            timestmpz: new Date().toISOString(),
            tokenPrice,
            data: coinsData
        };

        let existingData;
        try {
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_top_historical_data: Bit10TOPEntry[] };
        } catch (err) {
            console.error('Error fetching historical data for BIT10.TOP:', err);
            existingData = { bit10_top_historical_data: [] };
        }

        existingData.bit10_top_historical_data.unshift(newEntry);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
        console.log('Adding historical data for BIT10.TOP');
    } catch (error) {
        console.error('Error fetching historical data for BIT10.TOP:', error);
    }
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('*/30 * * * *', () => { // 30 min.
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData for BIT10.TOP:', error));
});

export const handleBit10TOPHistoricalData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.TOP Historical Data' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_top_historical_data: Bit10TOPEntry[] };
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data for BIT10.TOP Historical Data' }));
    }
};
