import { db } from '../db'
import { bit10TopRebalance, bit10TopHistoricalData, bit10CollateralTokenPrices } from '../db/schema'
import { desc, eq } from 'drizzle-orm'
import { idlFactory } from '../lib/buy.did'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'
const { Actor, HttpAgent } = require('@icp-sdk/core/agent')

type ApiResponse = {
    timestmpz: string;
    data: Coin[];
}

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

type BIT10TOPEntry = {
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

const JSON_FILE_PATH = path.resolve(__dirname, '../../../data/cg_token_list.json');
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BIT10_TOP_FILTER_JSON_FILE_PATH = path.resolve(__dirname, '../../../data/filter_bit10_top.json');
const BIT10_TOP_JSON_FILE_PATH = path.join(__dirname, '../../../data/bit10_top.json');

if (!COINGECKO_API_KEY) {
    console.error('❌ COINMARKETCAP_API_KEY is not defined.');
    process.exit(1);
}

export const fetchAndUpdateBIT10TOPData = async () => {
    const API_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&x_cg_demo_api_key=${COINGECKO_API_KEY}`;
    try {
        const response = await axios.get(API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': COINGECKO_API_KEY },
        });

        const apiResponse = response.data;
        const currentTime = new Date().toISOString();

        const allTokenEntry: ApiResponse = {
            timestmpz: currentTime,
            data: apiResponse,
        };

        await fs.writeFile(JSON_FILE_PATH, JSON.stringify(allTokenEntry, null, 2));

        const filterRaw = await fs.readFile(BIT10_TOP_FILTER_JSON_FILE_PATH, 'utf-8');
        const filterList: FilterEntry[] = JSON.parse(filterRaw);

        const filterSet = new Set(filterList.map(f => f.id));

        const filteredTokens = allTokenEntry.data
            .filter(token => !filterSet.has(token.id))
            .sort((a, b) => b.market_cap - a.market_cap)
            .slice(0, 10);

        if (filteredTokens.length === 0) {
            console.warn('⚠️ No tokens matched the filter list.');
            return;
        }

        const totalMarketCap = filteredTokens.reduce((sum, token) => sum + token.market_cap, 0);

        const TWENTY_ONE_TRILLION = 25000000000000; // 25 Trillion
        const tokenPrice = (totalMarketCap / TWENTY_ONE_TRILLION) * 100;

        const coinData: CoinData[] = filteredTokens.map(token => ({
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            image: token.image,
            price: token.current_price,
            marketCap: token.market_cap,
        }));

        await db.insert(bit10TopHistoricalData).values({
            timestmpz: currentTime,
            tokenPrice: tokenPrice,
            data: coinData,
        });

        const newEntry: BIT10TOPEntry = { timestmpz: currentTime, tokenPrice, data: coinData };
        let cachedData: Record<string, BIT10TOPEntry[]> = {};

        try {
            const fileContent = await fs.readFile(BIT10_TOP_JSON_FILE_PATH, 'utf-8');
            cachedData = JSON.parse(fileContent);
        } catch (error) {
            console.warn('⚠️ JSON file not found or unreadable. Creating a new one.');
        }

        cachedData['bit10_top_current_price'] = [newEntry];

        await fs.writeFile(BIT10_TOP_JSON_FILE_PATH, JSON.stringify(cachedData, null, 2));

        console.log('✅ BIT10.TOP historical data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.TOP data:', error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBIT10TOPData); // 30 sec
cron.schedule('*/10 * * * *', fetchAndUpdateBIT10TOPData); // 10 min

export const fetchAndUpdateBIT10TOPRebalanceData = async () => {
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

        const existingData = await db.select()
            .from(bit10TopRebalance)
            .orderBy(desc(bit10TopRebalance.timestmpz))
            .limit(1)
            .execute();

        if (priceOfTokenToBuyResult.length === 0 || latestData.length === 0 || existingData.length === 0) {
            throw new Error('No token data found for BIT10.TOP');
        }

        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        const bit10_tokens = await actor.bit10_token();
        if (!bit10_tokens || typeof bit10_tokens !== 'object' || !('tokens' in bit10_tokens)) {
            throw new Error('Invalid bit10_tokens response');
        }
        const tokensArray = bit10_tokens.tokens as [string, { name: string }][];

        const bit10TopEntry = tokensArray.find(([_, value]) => value.name === 'BIT10.TOP');

        // @ts-expect-error
        const priceOfTokenToBuy = latestData[0].tokenPrice * bit10TopEntry[1].total_supply;

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

        console.log('✅ BIT10.TOP Rebalance data updated successfully.');
    } catch (error) {
        console.error('❌ Error updating BIT10.TOP Rebalance data:', error);
    }
}

// cron.schedule('*/30 * * * * *', fetchAndUpdateBIT10TOPRebalanceData); // 30 sec
cron.schedule('0 10 * * 5', fetchAndUpdateBIT10TOPRebalanceData); // Every Friday at 3:30 PM IST
