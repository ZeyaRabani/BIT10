export async function GET() {
    const node_server = process.env.NODE_SERVER;
    const url = `${node_server}/bit10-defi-current-price`;

    try {
        const res = await fetch(url)
        const data = await res.json() as { timestmpz: string, tokenPrice: number, data: { id: number, name: string, symbol: string, price: number }[] }
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error fetching data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
