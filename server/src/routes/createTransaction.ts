import type { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import axios from 'axios'
import NodeCache from 'node-cache'

const cache = new NodeCache({
    stdTTL: 300,  // 5 min
    checkperiod: 5,  // 5 sec
    useClones: false,
    deleteOnExpire: true
});

async function createTrx({
    from_blockchain,
    from_token_symbol,
    from_token_address,
    to_blockchain,
    to_token_symbol,
    to_token_address,
    amount,
    selectedWallets,
    destinationAddress
}: {
    from_blockchain: string,
    from_token_symbol: string,
    from_token_address?: string | null,
    to_blockchain: string,
    to_token_symbol: string,
    to_token_address?: string | null,
    amount: string,
    selectedWallets: any,
    destinationAddress: string
}) {
    const apiKey = process.env.RANGO_API_KEY;
    if (!apiKey) throw new Error('RANGO_API_KEY is not set in environment variables');

    const from: any = {
        blockchain: from_blockchain,
        symbol: from_token_symbol,
    };
    if (from_token_address) {
        from.address = from_token_address;
    }

    const to: any = {
        blockchain: to_blockchain,
        symbol: to_token_symbol,
    };
    if (to_token_address) {
        to.address = to_token_address;
    }

    const bestRouteResponse = await axios.post(
        `https://api.rango.exchange/routing/best?apiKey=${apiKey}`,
        {
            from,
            to,
            checkPrerequisites: false,
            amount: amount,
            selectedWallets: selectedWallets,
        },
        {
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
            }
        }
    );

    const bestRouteData = bestRouteResponse.data;

    if (!bestRouteData.requestId || !bestRouteData.result) {
        throw new Error('No requestId or result returned from Rango best route API');
    }

    const confirmResponse = await axios.post(
        `https://api.rango.exchange/routing/confirm?apiKey=${apiKey}`,
        {
            selectedWallets: selectedWallets,
            checkPrerequisites: false,
            requestId: bestRouteData.requestId,
            destination: destinationAddress
        },
        {
            headers: {
                'accept': '*/*',
                'content-type': 'application/json',
            }
        }
    );

    const createTx = await axios.post(
        'https://api.rango.exchange/tx/create',
        {
            requestId: bestRouteData.requestId,
            step: 1,
            userSettings: {
                slippage: 3,
                infiniteApprove: false
            },
            validations: {
                balance: true,
                fee: true,
                approve: true
            }
        },
        {
            params: {
                apiKey: apiKey
            },
            headers: {
                'content-type': 'application/json'
            }
        }
    );

    return createTx.data;
}

export const handelCreateTransaction = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const from_blockchain = url.searchParams.get('from_blockchain');
        const from_token_symbol = url.searchParams.get('from_token_symbol');
        const from_token_address = url.searchParams.get('from_token_address');
        const to_blockchain = url.searchParams.get('to_blockchain');
        const to_token_symbol = url.searchParams.get('to_token_symbol');
        const to_token_address = url.searchParams.get('to_token_address');
        const amount = url.searchParams.get('amount');
        const selectedWalletsRaw = url.searchParams.get('selectedWallets');
        const destinationAddress = url.searchParams.get('destinationAddress');

        if (
            !from_blockchain ||
            !from_token_symbol ||
            !to_blockchain ||
            !to_token_symbol ||
            !amount ||
            !selectedWalletsRaw ||
            !destinationAddress
        ) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Missing required parameters',
                required: {
                    from_blockchain: !from_blockchain ? 'missing' : 'provided',
                    from_token_symbol: !from_token_symbol ? 'missing' : 'provided',
                    to_blockchain: !to_blockchain ? 'missing' : 'provided',
                    to_token_symbol: !to_token_symbol ? 'missing' : 'provided',
                    amount: !amount ? 'missing' : 'provided',
                    selectedWallets: !selectedWalletsRaw ? 'missing' : 'provided',
                    destinationAddress: !destinationAddress ? 'missing' : 'provided'
                }
            }));
            return;
        }

        let selectedWallets: any = selectedWalletsRaw;
        try {
            selectedWallets = JSON.parse(selectedWalletsRaw);
        } catch (err) {
            selectedWallets = selectedWalletsRaw.split(',').map(wallet => wallet.trim());
        }

        const cacheKey = `${from_blockchain}_${from_token_symbol}_${to_blockchain}_${to_token_symbol}`;

        let trxResult = cache.get(cacheKey);

        if (!trxResult) {
            trxResult = await createTrx({
                from_blockchain,
                from_token_symbol,
                from_token_address,
                to_blockchain,
                to_token_symbol,
                to_token_address,
                amount,
                selectedWallets,
                destinationAddress
            });
            cache.set(cacheKey, trxResult);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(trxResult));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: (error as Error).message || 'Internal Server Error'
        }));
    }
};
