import { db } from '../db'
import { bit10TopRebalance, bit10TopHistoricalData, bit10CollateralTokenPrices } from '../db/schema'
import { desc, eq } from 'drizzle-orm'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

type Coin = {
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

type ApiResponse = {
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

const jsonFilePath = path.join(__dirname, '../../../data/bit10_top.json');
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

if (!COINMARKETCAP_API_KEY) {
    console.error("❌ COINMARKETCAP_API_KEY is not defined.");
    process.exit(1);
}

export const fetchAndUpdateBit10TOPData = async () => {
    // limit is 15
    const API_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=15`;

    try {
        const response = await axios.get(API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY },
        });

        const apiResponse: ApiResponse = response.data as ApiResponse;

        const filteredCoins = apiResponse.data.filter(coin => !coin.tags.includes('stablecoin')).slice(0, 10);

        const coinsData = filteredCoins.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.quote.USD.price
        }));

        const totalPrice = coinsData.reduce((sum, token) => sum + token.price, 0);
        const tokenPrice = (totalPrice / coinsData.length) / 1000;
        const timestmpz = new Date().toISOString();

        await db.transaction(async (tx) => {
            await tx.insert(bit10TopHistoricalData).values({
                timestmpz: timestmpz,
                tokenPrice: tokenPrice,
                data: coinsData,
            });
        });

        const newEntry: Bit10TOPEntry = { timestmpz, tokenPrice, data: coinsData };
        let cachedData: Record<string, Bit10TOPEntry[]> = {};

        try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
            cachedData = JSON.parse(fileContent);
        } catch (error) {
            console.warn("⚠️ JSON file not found or unreadable. Creating a new one.");
        }

        cachedData['bit10_top_current_price'] = [newEntry];

        await fs.writeFile(jsonFilePath, JSON.stringify(cachedData, null, 2));

        console.log("✅ BIT10.TOP historical data updated successfully.");
    } catch (error) {
        console.error("❌ Error updating BIT10.TOP data:", error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBit10TOPData); // 30 sec
cron.schedule('*/30 * * * *', fetchAndUpdateBit10TOPData); // 30 min

export const fetchAndUpdateBit10TOPRebalanceData = async () => {
    try {
        const priceOfTokenToBuyResult = await db.select({
            priceoftokentobuy: bit10CollateralTokenPrices.priceOfTokenToBuy
        })
            .from(bit10CollateralTokenPrices)
            .where(eq(bit10CollateralTokenPrices.bit10TokenName, 'BIT10.TOP'))
            .execute();

        const latestData = await db.select()
            .from(bit10TopHistoricalData)
            .orderBy(desc(bit10TopHistoricalData.timestmpz))
            .limit(1)
            .execute();

        const currentData = await db.select()
            .from(bit10TopRebalance)
            .orderBy(desc(bit10TopRebalance.timestmpz))
            .limit(1)
            .execute();

        const existingData = await db.select()
            .from(bit10TopRebalance)
            .orderBy(desc(bit10TopRebalance.timestmpz))
            .limit(1)
            .execute();

        if (priceOfTokenToBuyResult.length === 0 || latestData.length === 0 || existingData.length === 0) {
            throw new Error('No token data found for BIT10.TOP');
        }

        const tokenValues = (currentData[0].newTokens as Array<{ id: number; price: number }>).map((currentToken) => {
            const existingToken = (existingData[0].newTokens as Array<{ id: number; noOfTokens: number }>).find((t) => t.id === currentToken.id);
            if (!existingToken) return 0;
            return currentToken.price * existingToken.noOfTokens;
        });

        const validTokenValues = tokenValues.filter(value => value > 0);
        const priceOfTokenToBuy = (validTokenValues.reduce((sum, value) => sum + value, 0) / validTokenValues.length) + priceOfTokenToBuyResult[0].priceoftokentobuy;

        const newTokens = (latestData[0].data as Array<{ price: number }>).map((token) => ({
            ...token,
            noOfTokens: priceOfTokenToBuy / token.price
        }));

        const latestRebalance = (existingData[0]?.newTokens as Array<{ id: string }>) || [];

        const addedTokens = (latestData[0].data as Array<{ id: string; price: number }>)
            .filter((historicalToken: { id: string }) =>
                !latestRebalance.some((rebalanceToken: { id: string }) => rebalanceToken.id === historicalToken.id)
            ).map((token: { id: string; price: number }) => ({
                ...token,
                noOfTokens: priceOfTokenToBuy / token.price
            }));

        const removedTokens = latestRebalance.filter((rebalanceToken: { id: string }) =>
            !(latestData[0].data as Array<{ id: string }>).some((historicalToken: { id: string }) => historicalToken.id === rebalanceToken.id)
        );

        const retainedTokens = (latestData[0].data as Array<{ id: string; price: number }>)
            .filter((historicalToken: { id: string; price: number }) =>
                latestRebalance.some((rebalanceToken: { id: string }) => rebalanceToken.id === historicalToken.id)
            ).map((token: { id: string; price: number }) => ({
                ...token,
                noOfTokens: priceOfTokenToBuy / token.price
            }));

        await db.transaction(async (tx) => {
            await tx.insert(bit10TopRebalance).values({
                timestmpz: latestData[0].timestmpz,
                indexValue: latestData[0].tokenPrice,
                priceOfTokenToBuy: priceOfTokenToBuy,
                newTokens: newTokens,
                added: addedTokens,
                removed: removedTokens,
                retained: retainedTokens
            });
        });

        console.log("✅ BIT10.TOP Rebalance data updated successfully.");
    } catch (error) {
        console.error("❌ Error updating BIT10.TOP Rebalance data:", error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBit10TOPRebalanceData); // 30 sec
cron.schedule('0 10 * * 5', fetchAndUpdateBit10TOPRebalanceData); // Every Friday at 3:30 PM IST
