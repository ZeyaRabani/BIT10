import { db } from '../db';
import { bit10SolComparison } from '../db/schema';
import { desc, gte } from 'drizzle-orm';
import type { IncomingMessage, ServerResponse } from 'http';
import NodeCache from 'node-cache';
import cron from 'node-cron';

const cache = new NodeCache({ stdTTL: 21600 }); // 6 hr TTL (seconds)

const YEARS_TO_CACHE = [1, 2, 3, 4, 5];

async function fetchData(years: number) {
    try {
        const now = new Date();
        const startDateCalc = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());

        const result = await db.select({
            date: bit10SolComparison.date,
            bit10Sol: bit10SolComparison.bit10Sol,
            btc: bit10SolComparison.btc,
            sol: bit10SolComparison.sol,
            eth: bit10SolComparison.eth,
            sp500: bit10SolComparison.sp500,
            gold: bit10SolComparison.gold
        })
            .from(bit10SolComparison)
            .where(gte(bit10SolComparison.date, startDateCalc.toISOString()))
            .orderBy(desc(bit10SolComparison.date))
            .execute();

        return result;
    } catch (error) {
        console.error('Error reading comparison data:', error);
        return null;
    }
}

async function getCachedData(years: number) {
    const cacheKey = `bit10-sol-comparison-${years}-years`;
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

cron.schedule('0 */6 * * *', async () => { // 6 hr
    console.log('Running scheduled cache refresh...');
    await warmUpCache().catch(error => console.error('Error during scheduled cache refresh:', error));
}, {
    timezone: 'America/New_York'
});

warmUpCache().catch(error => console.error('Error during initial cache warm-up:', error));

export const handleBIT10SOLComparisonData = async (request: IncomingMessage, response: ServerResponse) => {
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

        const bit10_sol = await getCachedData(years);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bit10_sol }));
    } catch (error) {
        console.error('Error serving data:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};
