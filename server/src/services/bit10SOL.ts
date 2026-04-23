import { db } from '../db';
import { bit10SolHistoricalData } from '../db/schema';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';

type Coin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: null | any;
    last_updated: string;
}

type FilterEntry = {
    id: string;
    symbol: string;
};

type BIT10SOLEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

type CoinData = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    price: number;
    marketCap: number;
};

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BIT10_SOL_FILTER_JSON_FILE_PATH = path.resolve(__dirname, '../../../data/filter_bit10_sol.json');
const BIT10_SOL_JSON_FILE_PATH = path.join(__dirname, '../../../data/bit10_sol.json');

if (!COINGECKO_API_KEY) {
    console.error('❌ COINMARKETCAP_API_KEY is not defined.');
    process.exit(1);
}

export const fetchAndUpdateBIT10SOLData = async () => {
    const API_URL = `https://api.coingecko.com/api/v3/coins/markets` + `?vs_currency=usd` + `&category=solana-ecosystem` + `&order=market_cap_desc` + `&per_page=250` + `&page=1` + `&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    try {
        const response = await axios.get(API_URL);

        const apiResponse: Coin[] = response.data;
        const currentTime = new Date().toISOString();

        const filterRaw = await fs.readFile(BIT10_SOL_FILTER_JSON_FILE_PATH, 'utf-8');
        const filterList: FilterEntry[] = JSON.parse(filterRaw);
        const filterSet = new Set(filterList.map((f) => f.id));

        const filteredTokens = apiResponse
            .filter(
                (token) =>
                    !filterSet.has(token.id) &&
                    token.market_cap != null &&
                    token.market_cap > 0
            )
            .sort((a, b) => b.market_cap - a.market_cap)
            .slice(0, 10);

        if (filteredTokens.length === 0) {
            console.warn('⚠️ No tokens matched after filtering for BIT10.SOL.');
            return;
        }

        const totalMarketCap = filteredTokens.reduce(
            (sum, token) => sum + token.market_cap,
            0
        );

        const FIVE_TRILLION = 5_000_000_000_000; // 5 Trillion
        const tokenPrice = (totalMarketCap / FIVE_TRILLION) * 100;

        const coinData: CoinData[] = filteredTokens.map((token) => ({
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            image: token.image,
            price: token.current_price,
            marketCap: token.market_cap,
        }));

        await db.insert(bit10SolHistoricalData).values({
            timestmpz: currentTime,
            tokenPrice: tokenPrice,
            data: coinData,
        });

        const newEntry: BIT10SOLEntry = {
            timestmpz: currentTime,
            tokenPrice,
            data: coinData,
        };
        let cachedData: Record<string, BIT10SOLEntry[]> = {};

        try {
            const fileContent = await fs.readFile(
                BIT10_SOL_JSON_FILE_PATH,
                'utf-8'
            );
            cachedData = JSON.parse(fileContent);
        } catch (error) {
            console.warn(
                '⚠️ BIT10.SOL JSON file not found or unreadable. Creating a new one.'
            );
        }

        cachedData['bit10_sol_current_price'] = [newEntry];

        await fs.writeFile(
            BIT10_SOL_JSON_FILE_PATH,
            JSON.stringify(cachedData, null, 2)
        );

        console.log('✅ BIT10.SOL historical data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.SOL data:', error);
    }
};

// cron.schedule('*/30 * * * * *', fetchAndUpdateBIT10SOLData); // 30 sec
cron.schedule('*/10 * * * *', fetchAndUpdateBIT10SOLData); // 10 min

// ToDo: Add code for rebalance
