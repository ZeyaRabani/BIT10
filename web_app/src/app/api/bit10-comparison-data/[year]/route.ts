import { env } from '@/env'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ year: string }> }) {
    const node_server = env.NODE_SERVER;
    const { year } = await context.params;

    if (!year || isNaN(Number(year))) {
        return new Response(JSON.stringify({ error: 'Invalid or missing year parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const url = `${node_server}/bit10-comparison?year=${year}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Error fetching data: ${res.statusText}`);
        }

        const data = (await res.json()) as {
            date: string;
            bit10Top: string;
            btc: string;
            sp500: string;
        };

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const errorMessage = (error as Error).message;
        return new Response(JSON.stringify({ error: 'Error fetching data', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
