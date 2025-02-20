import { db } from '../db'
import { bit10Meme } from '../db/schema'
import { desc, gte } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 1800 });

async function fetchData(days: number) {
    try {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

        const result = await db.select()
            .from(bit10Meme)
            .where(gte(bit10Meme.timestmpz, startDate))
            .orderBy(desc(bit10Meme.timestmpz))
            .execute();

        return result;
    } catch (error) {
        console.error('Error reading historical data for BIT10.MEME:', error);
        return [];
    }
}

async function getCachedData(days: number) {
    const cacheKey = `bit10-meme-${days}`;
    let cachedData = cache.get(cacheKey);

    if (cachedData === undefined) {
        cachedData = await fetchData(days);
        if (cachedData) {
            cache.set(cacheKey, cachedData);
        } else {
            cache.set(cacheKey, [], 300);
        }
    }

    return cachedData;
}

export const handleBit10MEMEFilterData = async (request: IncomingMessage, response: ServerResponse) => {
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

        const bit10_meme = await getCachedData(days);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bit10_meme }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
