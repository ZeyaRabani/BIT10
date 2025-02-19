import { db } from '../db'
import { bit10Brc20Rebalance } from '../db/schema'
import { desc } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 6 * 24 * 60 * 60 });

async function fetchData() {
    const cacheKey = 'bit10Brc20RebalanceData';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        return cachedData;
    }

    try {
        const result = await db.select()
            .from(bit10Brc20Rebalance)
            .orderBy(desc(bit10Brc20Rebalance.timestmpz))
            .execute();

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error reading rebalance data for BIT10.BRC20:', error);
    }
}

export const handleBit10BRC20RebalanceData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const rebalanceData = await fetchData();
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify({ rebalanceData }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
