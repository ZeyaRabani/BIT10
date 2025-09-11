import { db } from '../db'
import { bit10Comparison } from '../db/schema'
import { desc, gte } from 'drizzle-orm'
import type { IncomingMessage, ServerResponse } from 'http'
import NodeCache from 'node-cache'
import cron from 'node-cron'

const cache = new NodeCache({ stdTTL: 86400 }); // 24 hr TTL (seconds)

const YEARS_TO_CACHE = [1, 3, 5, 10, 15];

async function fetchData(years: number) {
    try {
        const now = new Date();
        const startDateCalc = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());

        const result = await db.select({
            date: bit10Comparison.date,
            bit10Top: bit10Comparison.bit10Top,
            btc: bit10Comparison.btc,
            sp500: bit10Comparison.sp500
        })
            .from(bit10Comparison)
            .where(gte(bit10Comparison.date, startDateCalc.toISOString()))
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
        console.log(`Cache miss for key: ${cacheKey}. Fetching data...`);
        cachedData = await fetchData(years);
        if (cachedData) {
            cache.set(cacheKey, cachedData);
            console.log(`Data fetched and cached for key: ${cacheKey}`);
        } else {
            cache.set(cacheKey, [], 300);
            console.warn(`Failed to fetch data for key: ${cacheKey}. Caching empty array for 5 min.`);
        }
    } else {
        console.log(`Cache hit for key: ${cacheKey}`);
    }

    return cachedData;
}

async function warmUpCache() {
    console.log('Initiating cache warm-up...');
    for (const years of YEARS_TO_CACHE) {
        await getCachedData(years);
    }
    console.log('Cache warm-up completed.');
}

cron.schedule('0 16 * * *', async () => { // 4 PM ET
    console.log('Running scheduled cache refresh (4 PM ET)...');
    await warmUpCache().catch(error => console.error('Error during scheduled cache refresh:', error));
}, {
    timezone: 'America/New_York'
});

warmUpCache().catch(error => console.error('Error during initial cache warm-up:', error));

export const handleBIT10ComparisonData = async (request: IncomingMessage, response: ServerResponse) => {
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
