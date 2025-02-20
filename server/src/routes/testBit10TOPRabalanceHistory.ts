import { db } from '../db'
import { testBit10TopRebalance } from '../db/schema'
import { desc } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 6 * 24 * 60 * 60 });

async function fetchData() {
    const cacheKey = 'test_bit10_top_rebalance_data';
    const cachedData = cache.get(cacheKey);

    if (cachedData !== undefined) {
        return cachedData;
    }

    try {
        const result = await db.select()
            .from(testBit10TopRebalance)
            .orderBy(desc(testBit10TopRebalance.timestmpz))
            .execute();

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error reading rebalance data for Test BOT10.TOP:', error);
        cache.set(cacheKey, [], 300);
        return [];
    }
}

export const handleTestBit10TOPRebalanceData = async (request: IncomingMessage, response: ServerResponse) => {
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
