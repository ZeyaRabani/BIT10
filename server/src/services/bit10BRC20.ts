import { db } from '../db'
import { bit10Brc20Rebalance, bit10Brc20HistoricalData, bit10CollateralTokenPrices } from '../db/schema'
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
        slug: string;
        token_address: string;
    }
    quote: {
        USD: {
            price: number;
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
    tokenAddress: string;
    price: number;
};

type Bit10BRC20Entry = {
    timestmpz: string;
    tokenPrice: number;
    data: CoinData[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_brc20.json');
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

if (!COINMARKETCAP_API_KEY) {
    console.error('❌ COINMARKETCAP_API_KEY is not defined.');
    process.exit(1);
}

export const fetchAndUpdateBit10BRC20Data = async () => {
    // limit is 10
    const API_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/category?id=654a0c87ba37f269c8016129&limit=10`;

    try {
        const response = await axios.get(API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY },
        });

        const apiResponse: ApiResponse = response.data as ApiResponse;

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
        const timestmpz = new Date().toISOString();

        await db.transaction(async (tx) => {
            await tx.insert(bit10Brc20HistoricalData).values({
                timestmpz: timestmpz,
                tokenPrice: tokenPrice,
                data: coinsData,
            });
        });

        const newEntry: Bit10BRC20Entry = { timestmpz, tokenPrice, data: coinsData };
        let cachedData: Record<string, Bit10BRC20Entry[]> = {};

        try {
            const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
            cachedData = JSON.parse(fileContent);
        } catch (error) {
            console.warn('⚠️ JSON file not found or unreadable. Creating a new one.');
        }

        cachedData['bit10_brc20_current_price'] = [newEntry];

        await fs.writeFile(jsonFilePath, JSON.stringify(cachedData, null, 2));

        console.log('✅ BIT10.BRC20 historical data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.BRC20 data:', error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBit10BRC20Data); // 30 sec
cron.schedule('*/20 * * * *', fetchAndUpdateBit10BRC20Data); // 20 min

export const fetchAndUpdateBit10BRC20RebalanceData = async () => {
    try {
        const priceOfTokenToBuyResult = await db.select({
            priceoftokentobuy: bit10CollateralTokenPrices.priceOfTokenToBuy
        })
            .from(bit10CollateralTokenPrices)
            .where(eq(bit10CollateralTokenPrices.bit10TokenName, 'BIT10.BRC20'))
            .execute();

        const latestData = await db.select()
            .from(bit10Brc20HistoricalData)
            .orderBy(desc(bit10Brc20HistoricalData.timestmpz))
            .limit(1)
            .execute();

        const currentData = await db.select()
            .from(bit10Brc20Rebalance)
            .orderBy(desc(bit10Brc20Rebalance.timestmpz))
            .limit(1)
            .execute();

        const existingData = await db.select()
            .from(bit10Brc20Rebalance)
            .orderBy(desc(bit10Brc20Rebalance.timestmpz))
            .limit(1)
            .execute();

        if (priceOfTokenToBuyResult.length === 0 || latestData.length === 0 || existingData.length === 0) {
            throw new Error('No token data found for BIT10.BRC20');
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
            await tx.insert(bit10Brc20Rebalance).values({
                timestmpz: latestData[0].timestmpz,
                indexValue: latestData[0].tokenPrice,
                priceOfTokenToBuy: priceOfTokenToBuy,
                newTokens: newTokens,
                added: addedTokens,
                removed: removedTokens,
                retained: retainedTokens
            });
        });

        console.log('✅ BIT10.BRC20 Rebalance data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.BRC20 Rebalance data:', error);
    }
}

// cron.schedule('*/10 * * * * *', fetchAndUpdateBit10BRC20RebalanceData); // 30 sec
cron.schedule('0 10 * * 5', fetchAndUpdateBit10BRC20RebalanceData); // Every Friday at 3:30 PM IST
