import { db } from '../db'
import { bit10Comparison } from '../db/schema'
import { desc, gte } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 86400 }); // 24 hr

async function fetchData(years: number) {
    try {
        const now = new Date();
        const startDate = new Date(now.setFullYear(now.getFullYear() - years)).toISOString();

        const result = await db.select({
            date: bit10Comparison.date,
            bit10Top: bit10Comparison.bit10Top,
            btc: bit10Comparison.btc,
            sp500: bit10Comparison.sp500
        })
            .from(bit10Comparison)
            .where(gte(bit10Comparison.date, startDate))
            .orderBy(desc(bit10Comparison.date))
            .execute();

        return result;
    } catch (error) {
        console.error('Error reading comparison data:', error);
        return null;
    }
}

async function getCachedData(years: number) {
    const cacheKey = `bit10-comparison-${years}-years`;
    let cachedData = cache.get(cacheKey);

    if (cachedData === undefined) {
        cachedData = await fetchData(years);
        if (cachedData) {
            cache.set(cacheKey, cachedData);
        } else {
            cache.set(cacheKey, [], 300);
        }
    }

    return cachedData;
}

export const handleBit10ComparisonData = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const years = parseInt(url.searchParams.get('year') || '1', 10);

        if (isNaN(years) || years < 1) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid year parameter' }));
            return;
        }

        const bit10_top = await getCachedData(years);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bit10_top }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
