import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs/promises'
import path from 'path'
import NodeCache from 'node-cache'
import cron from 'node-cron'

type Token = {
    id: number;
    name: string;
    symbol: string;
    price: number;
    noOfTokens: number;
};

type Changes = {
    added: Token[];
    removed: Token[];
    retained: Token[];
};

type TestBit10TOPRebalanceData = {
    timestmpz: string;
    priceOfTokenToBuy: number;
    newTokens: Token[];
    changes: Changes;
    indexValue: number;
};

const jsonFilePath = path.join(__dirname, '../../../data/test_bit10_top_rebalance.json');
const cache = new NodeCache({ stdTTL: 1800 });

const fetchAndUpdateData = async () => {
    try {
        const priceOfTokenToBuy = 30;
        const historicalDataPath = path.join(__dirname, '../../../data/bit10_top_historical_data.json');

        const historicalData = await readJsonFile(historicalDataPath) as {
            bit10_top_historical_data: {
                timestmpz: string;
                tokenPrice: number;
                data: Token[];
            }[];
        };

        const latestData = historicalData.bit10_top_historical_data[0];

        if (!latestData?.data?.length) {
            throw new Error('No token data found in latest historical data');
        }

        const newTokens = latestData.data.map(token => ({
            ...token,
            noOfTokens: priceOfTokenToBuy / token.price
        }));

        const existingData = await readJsonFile(jsonFilePath) as { test_bit10_top_rebalance: TestBit10TOPRebalanceData[] };

        const latestRebalance = existingData.test_bit10_top_rebalance[0]?.newTokens || [];

        const addedTokens = latestData.data.filter(historicalToken =>
            !latestRebalance.some(rebalanceToken => rebalanceToken.id === historicalToken.id)
        ).map(token => ({
            ...token,
            noOfTokens: priceOfTokenToBuy / token.price
        }));

        const removedTokens = latestRebalance.filter(rebalanceToken =>
            !latestData.data.some(historicalToken => historicalToken.id === rebalanceToken.id)
        );

        const retainedTokens = latestData.data.filter(historicalToken =>
            latestRebalance.some(rebalanceToken => rebalanceToken.id === historicalToken.id)
        ).map(token => ({
            ...token,
            noOfTokens: priceOfTokenToBuy / token.price
        }));

        const rebalanceData: TestBit10TOPRebalanceData = {
            timestmpz: latestData.timestmpz,
            priceOfTokenToBuy,
            newTokens,
            changes: {
                added: addedTokens,
                removed: removedTokens,
                retained: retainedTokens
            },
            indexValue: latestData.tokenPrice
        };

        existingData.test_bit10_top_rebalance.unshift(rebalanceData);
        cache.set('bit10_top_rebalance_data', existingData);

        await writeJsonFile(jsonFilePath, existingData);

        console.log('Adding rebalance data for BIT10.TOP');
    } catch (error) {
        console.error('Error fetching rebalance data for BIT10.TOP:', error);
    }
}

// cron.schedule('*/30 * * * * *', () => { // 30 sec
cron.schedule('0 10 * * 5', () => { // Every Friday at 3:30 PM IST
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData for BIT10.TOP Rebalance:', error));
});

export const handleTestBit10TOPRebalance = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.TOP Rebalance Data' }));
        return;
    }

    try {
        let existingData = cache.get<{ test_bit10_top_rebalance: TestBit10TOPRebalanceData[] }>('bit10_top_rebalance_data');

        if (!existingData) {
            existingData = await readJsonFile(jsonFilePath);
            cache.set('bit10_top_rebalance_data', existingData);
        }

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Failed to read or parse the JSON file' }));
    }
};

async function readJsonFile(filePath: string) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { test_bit10_top_rebalance: [] };
    }
}

async function writeJsonFile(filePath: string, data: object) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing file:', error);
    }
}
