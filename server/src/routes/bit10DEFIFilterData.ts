import { db } from '../db'
import { bit10Defi } from '../db/schema'
import { desc, gte } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 1800 });

async function fetchData(days: number) {
    const cacheKey = `bit10-defi-${days}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData !== undefined) {
        return cachedData;
    }

    try {
        const startDateISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const result = await db.select()
            .from(bit10Defi)
            .where(gte(bit10Defi.timestmpz, startDateISO))
            .orderBy(desc(bit10Defi.timestmpz))
            .execute();

        if (result.length > 0) {
            cache.set(cacheKey, result);
        } else {
            cache.set(cacheKey, [], 300)
        }

        return result;
    } catch (error) {
        console.error('Error reading historical data for BIT10.DEFI:', error);
        cache.set(cacheKey, [], 300); // Prevent repeated failed queries
        return [];
    }
}

export const handleBit10DEFIFilterData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const days = parseInt(url.searchParams.get('day') || '1', 10);

        if (isNaN(days) || days < 1) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid day parameter' }));
            return;
        }

        const bit10_defi = await fetchData(days);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bit10_defi }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
