import { db } from '../db'
import { bit10Top } from '../db/schema'
import { desc, gte } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 1800 });

async function fetchData(days: number) {
    try {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const result = await db.select()
            .from(bit10Top)
            .where(gte(bit10Top.timestmpz, startDate.toISOString()))
            .orderBy(desc(bit10Top.timestmpz))
            .execute();

        return result;
    } catch (error) {
        console.error('Error reading historical data for BIT10.TOP:', error);
    }
}

async function getCachedData(days: number) {
    const cacheKey = `bit10-top-${days}`;
    let cachedData = cache.get(cacheKey);

    if (!cachedData) {
        cachedData = await fetchData(days);
        cache.set(cacheKey, cachedData);
    }

    return cachedData;
}

export const handleBit10TOPFilterData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const days = parseInt(url.searchParams.get('day') || '1');

        if (isNaN(days) || days < 1) {
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(400);
            response.end(JSON.stringify({ error: 'Invalid day parameter' }));
            return;
        }

        const bit10_top = await getCachedData(days);

        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify({ bit10_top }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
