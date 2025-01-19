import { env } from '@/env'

export async function GET() {
    const node_server = env.NODE_SERVER;
    const url = `${node_server}/bit10-defi?day=1`;

    try {
        const res = await fetch(url)
        const data = await res.json() as { timestmpz: string, tokenPrice: number, data: { id: number, name: string, symbol: string, price: number }[] }
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error fetching data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
