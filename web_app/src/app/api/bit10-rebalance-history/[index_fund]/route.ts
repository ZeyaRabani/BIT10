import { env } from '@/env'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ index_fund: string }> }) {
    const node_server = env.NODE_SERVER;
    const { index_fund } = await context.params;
    const url = `${node_server}/bit10-${index_fund}-rebalance`;

    try {
        const res = await fetch(url);
        const { rebalanceData } = await res.json() as
            {
                rebalanceData: {
                    timestmpz: string,
                    indexValue: number,
                    priceOfTokenToBuy: number,
                    newTokens: { id: number, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
                    added: { id: number, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
                    removed: { id: number, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[],
                    retained: { id: number, name: string, symbol: string, marketCap: number, price: number, noOfTokens: number, tokenAddress?: string, chain?: string }[]
                }[]
            };

        if (!rebalanceData || rebalanceData.length === 0) {
            return new Response(JSON.stringify({ error: 'No data available' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(rebalanceData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error fetching data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
