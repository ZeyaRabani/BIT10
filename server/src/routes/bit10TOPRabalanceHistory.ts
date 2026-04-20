import { db } from '../db';
import { bit10TopRebalance } from '../db/schema';
import { desc } from 'drizzle-orm';
import type { IncomingMessage, ServerResponse } from 'http';
import NodeCache from 'node-cache';

const cache = new NodeCache();

const REBALANCE_HOUR_GMT = 11;
const REBALANCE_MINUTE_GMT = 1;

function getSecondsUntilNextRebalance(): number {
    const now = new Date();

    const nextRebalance = new Date(now);
    nextRebalance.setUTCHours(REBALANCE_HOUR_GMT, REBALANCE_MINUTE_GMT, 0, 0);

    if (now >= nextRebalance) {
        nextRebalance.setUTCDate(nextRebalance.getUTCDate() + 1);
    }

    return Math.floor((nextRebalance.getTime() - now.getTime()) / 1000);
}

const CACHE_KEY = 'bit10_top_rebalance_data';

async function fetchData() {
    const cachedData = cache.get(CACHE_KEY);

    if (cachedData !== undefined) {
        return cachedData;
    }

    try {
        const result = await db.select().from(bit10TopRebalance).orderBy(desc(bit10TopRebalance.timestmpz)).execute();

        const ttl = getSecondsUntilNextRebalance();
        cache.set(CACHE_KEY, result, ttl);

        console.log(`✅ BIT10.TOP rebalance cache set. Expires in ${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`);

        return result;
    } catch (error) {
        console.error('Error reading rebalance data for BIT10.TOP:', error);
        cache.set(CACHE_KEY, [], 300);
        return [];
    }
}

export const handleBIT10TopRebalanceData = async (request: IncomingMessage, response: ServerResponse) => {
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
