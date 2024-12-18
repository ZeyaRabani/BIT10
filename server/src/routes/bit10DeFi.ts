import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'

interface DataType {
    name: string;
    id: number;
    tokenAddress: string;
}

export const bit10DeFi: DataType[] = [
    { name: 'ICP', id: 8916, tokenAddress: '60a182a......547cc70480' },
    { name: 'STX', id: 4847, tokenAddress: 'SP1P4R......KMG4WN3E55' },
    { name: 'CFX', id: 7334, tokenAddress: '0x9f9........dbc3fac035' },
    { name: 'MAPO', id: 4956, tokenAddress: '0x0D15.......2735133E79' },
    { name: 'RIF', id: 3701, tokenAddress: '0x0D15.......2735133E79' },
    { name: 'SOV', id: 8669, tokenAddress: '0x0D15.......2735133E79' },
];

const jsonFilePath = path.join(__dirname, '../data/bit10_defi.json')

async function fetchAndUpdateData() {
    const coinmarket_cap_key = process.env.COINMARKETCAP_API_KEY;
    const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ICP,STX,CFX,MAPO,RIF,SOV&CMC_PRO_API_KEY=${coinmarket_cap_key}`;

    try {
        const res = await fetch(url);
        type Quote = {
            price: number;
        };

        type TokenData = {
            id: number;
            name: string;
            quote: {
                USD: Quote;
            };
        };

        type ApiResponse = {
            data: Record<string, TokenData[]>;
        };

        const data: ApiResponse = await res.json() as ApiResponse;

        const result = bit10DeFi.map(token => {
            const foundTokens = data.data[token.name];

            if (Array.isArray(foundTokens) && foundTokens.length > 0) {
                const foundToken = foundTokens[0];
                if (foundToken && foundToken.id === token.id) {
                    return {
                        id: token.id,
                        name: foundToken.name,
                        symbol: token.name,
                        price: foundToken.quote.USD.price,
                        address: token.tokenAddress,
                    };
                } else {
                    return null;
                }
            }
            return null;
        }).filter(Boolean);

        let existingData;
        try {
            existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_defi: Array<{ timestmpz: string, tokenPrice: number, data: { id: number, name: string, symbol: string, price: number, address: string }[] }> };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            existingData = { bit10_defi: [] };
        }

        const totalPrice = result.reduce((sum, token) => sum + (token?.price ?? 0), 0);
        const tokenPrice = result.length > 0 ? totalPrice / result.length : 0;

        const newEntry = {
            timestmpz: new Date().toISOString(),
            tokenPrice,
            data: result.filter((token): token is { id: number; name: string; symbol: string; price: number; address: string } => token !== null)
        };

        existingData.bit10_defi.unshift(newEntry);
        fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2));

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// 30 min.
setInterval(() => {
    fetchAndUpdateData().catch(error => console.error('Error in fetchAndUpdateData:', error));
}, 3000000);
// }, 3000);

export async function handleBit10DeFi(request: IncomingMessage, response: ServerResponse) {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as { bit10_defi: Array<{ timestmpz: string, data: { id: number, name: string, symbol: string, price: number, address: string }[] }> };
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(existingData));
    } catch (error) {
        console.error('Error reading data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error reading data' }));
    }
}