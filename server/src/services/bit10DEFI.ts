import { db } from '../db'
import { bit10Defi } from '../db/schema'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

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
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const API_URL = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=8916,4847,7334,4956,3701,8669`;

if (!COINMARKETCAP_API_KEY) {
    console.error("❌ COINMARKETCAP_API_KEY is not defined.");
    process.exit(1);
}

export const fetchAndUpdateBit10DEFIData = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY },
        });

        const coinsData: CoinData[] = Object.values(response.data.data).map((entry: any) => ({
            id: entry.id,
            name: entry.name,
            symbol: entry.symbol,
            price: entry.quote.USD.price,
        }));

        const tokenPrice = coinsData.reduce((sum, coin) => sum + coin.price, 0) / coinsData.length;
        const timestmpz = new Date().toISOString();

        await db.transaction(async (tx) => {
            await tx.insert(bit10Defi).values({
                timestmpz: timestmpz,
                tokenPrice: tokenPrice,
                data: coinsData,
            });
        });

        const newEntry: Bit10DEFIEntry = { timestmpz, tokenPrice, data: coinsData };
        let cachedData: Record<string, Bit10DEFIEntry[]> = {};

        try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
            cachedData = JSON.parse(fileContent);
        } catch (error) {
            console.warn("⚠️ JSON file not found or unreadable. Creating a new one.");
        }

        cachedData['bit10_defi_current_price'] = [newEntry];

        await fs.writeFile(jsonFilePath, JSON.stringify(cachedData, null, 2));

        console.log("✅ BIT10.DEFI data updated successfully.");
    } catch (error) {
        console.error("❌ Error updating BIT10.DEFI data:", error);
    }
};

// cron.schedule('*/30 * * * * *', fetchAndUpdateBit10DEFIData); // 30 sec
cron.schedule('*/20 * * * *', fetchAndUpdateBit10DEFIData); // 20 min
