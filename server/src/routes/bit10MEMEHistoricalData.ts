import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import cron from 'node-cron'

interface Coin {
    id: number;
    name: string;
    symbol: string;
    platform: {
        slug: string | null;
        token_address: string | null;
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

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    tokenAddress: string;
    price: number;
};

type Bit10MEMEEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_meme_historical_data.json');

async function fetchAndUpdateData() {
    const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;

    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/category?id=6051a82566fc1b42617d6dc6&limit=10&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

    try {
        const result = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': coinmarket_cap_key,
            },
        });

        const apiResponse: ApiResponse = result.data as ApiResponse;

        const coinsData = apiResponse.data.coins.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            chain: coin.platform?.slug ?? '',
            tokenAddress: coin.platform?.token_address ?? '',
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
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_meme_historical_data: Bit10MEMEEntry[] };
        } catch (err) {
            console.error('Error fetching historical data for BIT10.MEME:', err);
            existingData = { bit10_meme_historical_data: [] };
        }

        existingData.bit10_meme_historical_data.unshift(newEntry);

        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));
        console.log('Adding historical data for BIT10.MEME');
    } catch (error) {
        console.error('Error fetching historical data for BIT10.MEME:', error);
    }
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('*/30 * * * *', () => { // 30 min.
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData for BIT10.MEME:', error));
});

export const handleBit10MEMEHistoricalData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.MEME Historical Data' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_meme_historical_data: Bit10MEMEEntry[] };
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data for BIT10.MEME Historical Data' }));
    }
};
