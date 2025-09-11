import { db } from '../db'
import { testBit10MemeRebalance, bit10MemeHistoricalData, bit10CollateralTokenPrices } from '../db/schema'
import { desc, eq } from 'drizzle-orm'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

type Coin = {
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
            market_cap: number;
        };
    };
}

type ApiResponse = {
    data: {
        coins: Coin[];
    };
}

type CoinData = {
    id: number;
    name: string;
    symbol: string;
    price: number;
};

type Bit10MEMEEntry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_meme.json');
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

if (!COINMARKETCAP_API_KEY) {
    console.error('❌ COINMARKETCAP_API_KEY is not defined.');
    process.exit(1);
}

export const fetchAndUpdateBIT10MEMEData = async () => {
    // limit is 20
    const API_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/category?id=6051a82566fc1b42617d6dc6&limit=20`;

    try {
        const response = await axios.get(API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY },
        });

        const apiResponse: ApiResponse = response.data as ApiResponse;

        let coinsData = apiResponse.data.coins
            .map((coin) => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                chain: coin.platform?.slug ?? '',
                tokenAddress: coin.platform?.token_address ?? '',
                marketCap: coin.quote.USD.market_cap,
                price: coin.quote.USD.price,
            }))
            .filter((coin) => coin.marketCap !== null);

        coinsData = coinsData
            .sort((a, b) => b.marketCap - a.marketCap)
            .slice(0, 10);

        const totalPrice = coinsData.reduce((sum, token) => sum + token.marketCap, 0);
        const tokenPrice = (totalPrice / 10000000000000) * 100; // 10T
        const timestmpz = new Date().toISOString();

        await db.transaction(async (tx) => {
            await tx.insert(bit10MemeHistoricalData).values({
                timestmpz: timestmpz,
                tokenPrice: tokenPrice,
                data: coinsData,
            });
        });

        const newEntry: Bit10MEMEEntry = { timestmpz, tokenPrice, data: coinsData };
        let cachedData: Record<string, Bit10MEMEEntry[]> = {};

        try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
            cachedData = JSON.parse(fileContent);
        } catch (error) {
            console.warn('⚠️ JSON file not found or unreadable. Creating a new one.');
        }

        cachedData['bit10_meme_current_price'] = [newEntry];

        await fs.writeFile(jsonFilePath, JSON.stringify(cachedData, null, 2));

        console.log('✅ BIT10.MEME historical data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.MEME data:', error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBIT10MEMEData); // 30 sec
cron.schedule('*/20 * * * *', fetchAndUpdateBIT10MEMEData); // 20 min

export const fetchAndUpdateBit10MEMERebalanceData = async () => {
    try {
        const priceOfTokenToBuyResult = await db.select({
            priceoftokentobuy: bit10CollateralTokenPrices.priceOfTokenToBuy
        })
            .from(bit10CollateralTokenPrices)
            .where(eq(bit10CollateralTokenPrices.bit10TokenName, 'Test BIT10.MEME'))
            .execute();

        const latestData = await db.select()
            .from(bit10MemeHistoricalData)
            .orderBy(desc(bit10MemeHistoricalData.timestmpz))
            .limit(1)
            .execute();

        const currentData = await db.select()
            .from(testBit10MemeRebalance)
            .orderBy(desc(testBit10MemeRebalance.timestmpz))
            .limit(1)
            .execute();

        const existingData = await db.select()
            .from(testBit10MemeRebalance)
            .orderBy(desc(testBit10MemeRebalance.timestmpz))
            .limit(1)
            .execute();

        if (priceOfTokenToBuyResult.length === 0 || latestData.length === 0 || existingData.length === 0) {
            throw new Error('No token data found for Test BIT10.MEME');
        }

        const tokenValues = (currentData[0].newTokens as Array<{ id: number; price: number }>).map((currentToken) => {
            const existingToken = (existingData[0].newTokens as Array<{ id: number; noOfTokens: number }>).find((t) => t.id === currentToken.id);
            if (!existingToken) return 0;
            return currentToken.price * existingToken.noOfTokens;
        });

        const validTokenValues = tokenValues.filter(value => value > 0);
        const priceOfTokenToBuy = (validTokenValues.reduce((sum, value) => sum + value, 0) / validTokenValues.length) + priceOfTokenToBuyResult[0].priceoftokentobuy;

        const totalMarketCap = (latestData[0].data as Array<{ marketCap: number }>).reduce((sum, token) => sum + token.marketCap, 0);

        const newTokens = (latestData[0].data as Array<{ price: number; marketCap: number }>).map((token) => {
            const allocation = totalMarketCap > 0 ? priceOfTokenToBuy * (token.marketCap / totalMarketCap) : 0;
            return {
                ...token,
                noOfTokens: allocation / token.price
            };
        });

        const latestRebalance = (existingData[0]?.newTokens as Array<{ id: string }>) || [];

        const addedTokens = (latestData[0].data as Array<{ id: string; price: number; marketCap: number }>)
            .filter((historicalToken: { id: string }) =>
                !latestRebalance.some((rebalanceToken: { id: string }) => rebalanceToken.id === historicalToken.id)
            ).map((token: { id: string; price: number; marketCap: number }) => {
                const allocation = totalMarketCap > 0 ? priceOfTokenToBuy * (token.marketCap / totalMarketCap) : 0;
                return {
                    ...token,
                    noOfTokens: allocation / token.price
                };
            });

        const removedTokens = latestRebalance.filter((rebalanceToken: { id: string }) =>
            !(latestData[0].data as Array<{ id: string }>).some((historicalToken: { id: string }) => historicalToken.id === rebalanceToken.id)
        );

        const retainedTokens = (latestData[0].data as Array<{ id: string; price: number; marketCap: number }>)
            .filter((historicalToken: { id: string; price: number; marketCap: number }) =>
                latestRebalance.some((rebalanceToken: { id: string }) => rebalanceToken.id === historicalToken.id)
            ).map((token: { id: string; price: number; marketCap: number }) => {
                const allocation = totalMarketCap > 0 ? priceOfTokenToBuy * (token.marketCap / totalMarketCap) : 0;
                return {
                    ...token,
                    noOfTokens: allocation / token.price
                };
            });

        await db.transaction(async (tx) => {
            await tx.insert(testBit10MemeRebalance).values({
                timestmpz: latestData[0].timestmpz,
                indexValue: latestData[0].tokenPrice,
                priceOfTokenToBuy: priceOfTokenToBuy,
                newTokens: newTokens,
                added: addedTokens,
                removed: removedTokens,
                retained: retainedTokens
            });
        });

        console.log('✅ Test BIT10.MEME Rebalance data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating Test BIT10.MEME Rebalance data:', error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBit10MEMERebalanceData); // 30 sec
cron.schedule('0 10 * * 5', fetchAndUpdateBit10MEMERebalanceData); // Every Friday at 3:30 PM IST
