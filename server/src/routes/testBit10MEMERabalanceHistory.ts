import { db } from '../db'
import { testBit10MemeRebalance } from '../db/schema'
import { desc } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 1800 });

async function fetchData() {
    const cacheKey = 'test_bit10_meme_rebalance_data';

    const cachedData = cache.get(cacheKey);
    if (cachedData) return Promise.resolve(cachedData);

    try {
        const result = await db.select()
            .from(testBit10MemeRebalance)
            .orderBy(desc(testBit10MemeRebalance.timestmpz))
            .execute();

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error reading rebalance data for Test BIT10.MEME:', error);
        return [];
    }
}

export const handleTestBit10MEMERebalanceData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const rebalanceData = await fetchData();

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ rebalanceData }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
