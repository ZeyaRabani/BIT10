/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/consistent-type-imports */
export async function GET() {
    const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;

    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ICP,STX,CFX,MAPO,RIF,SOV&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

    try {
        const res = await fetch(url)
        const data = await res.json()
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
