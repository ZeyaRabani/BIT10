import { db } from '../db'
import { bit10Comparison } from '../db/schema'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

const BIT10_TOP_JSON_FILE_PATH = path.join(__dirname, '../../../data/bit10_top.json');
const JSON_FILE_PATH = path.resolve(__dirname, '../../../data/cg_token_list.json');
const ALPHADVANTAGE_API_KEY = process.env.ALPHADVANTAGE_API_KEY;

export const fetchAndUpdateBIT10TOPComparisonData = async () => {
    try {
        const bit10TopData = JSON.parse(await fs.readFile(BIT10_TOP_JSON_FILE_PATH, 'utf-8'));
        const bit10TopPrice = bit10TopData.bit10_top_current_price[0].tokenPrice;

        const alphaVantageResponse = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${ALPHADVANTAGE_API_KEY}`
        );
        const spyPrice = alphaVantageResponse.data['Global Quote']['05. price'] * 10;

        const tetherGoldData = JSON.parse(await fs.readFile(JSON_FILE_PATH, 'utf-8'));
        const tetherGoldPrice = tetherGoldData.data.find((token: any) => token.id === 'tether-gold')?.current_price;

        const btcData = JSON.parse(await fs.readFile(JSON_FILE_PATH, 'utf-8'));
        const btcPrice = btcData.data.find((token: any) => token.id === 'bitcoin')?.current_price;

        await db.transaction(async (tx) => {
            await tx.insert(bit10Comparison).values({
                date: new Date().toISOString().split('T')[0],
                bit10Top: String(bit10TopPrice),
                btc: String(btcPrice),
                sp500: String(spyPrice),
                gold: tetherGoldPrice
            });
        });

        console.log('✅ BIT10.TOP Comparison data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.TOP Comparison data:', error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBIT10TOPComparisonData); // 30 sec
cron.schedule('0 21 * * *', fetchAndUpdateBIT10TOPComparisonData); // Every day at 4:00 PM ET
