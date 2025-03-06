import type { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import axios from 'axios'
import NodeCache from 'node-cache'

const cache = new NodeCache({
    stdTTL: 300,  // 5 minutes cache time
    checkperiod: 120,  // Check for expired keys every 2 minutes
    useClones: false,
    deleteOnExpire: true
});
const txSecret = process.env.VERIFY_TX_SECRET;
const unisatTestKey = process.env.UNISAT_TESTNET_KEY;

interface TransactionError {
    message: string;
    status?: number;
}

interface TransactionResponse {
    status: string;
    txid: string;
    chain: string;
    timestamp: string;
    transaction_data: any;
}

const fetchFromAPI = async (url: string, headers?: Record<string, string>): Promise<any> => {
    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching data from ${url}:`, error.response?.data || error.message);
            throw {
                message: error.response?.data?.message || error.message,
                status: error.response?.status
            } as TransactionError;
        }
        throw { message: 'Unknown error occurred' } as TransactionError;
    }
};

async function getBTCTestnetTransactionData(txid: string): Promise<any> {
    const cachedData = cache.get(txid);
    if (cachedData) {
        const ttl = cache.getTtl(txid);
        console.log('Cache hit for txid:', txid, 'TTL:', new Date(ttl!).toISOString());
        return cachedData;
    }

    console.log('Cache miss for txid:', txid, 'Fetching from API...');
    const headers = {
        Authorization: `Bearer ${unisatTestKey}`,
        'Content-Type': 'application/json'
    };

    try {
        const txData = await fetchFromAPI(`https://open-api-testnet.unisat.io/v1/indexer/tx/${txid}`, headers);

        if (txData.msg !== 'ok' || txData.data.confirmations <= 0) {
            const result = {
                transaction: txData.data,
                outputs: null,
                verified: false,
                message: txData.data.confirmations <= 0 ? 'Transaction not confirmed yet' : 'Transaction invalid'
            };
            cache.set(txid, result, 60);
            console.log('Cached unconfirmed transaction data for txid:', txid, 'for 60 seconds');
            return result;
        }

        const outputs = await fetchFromAPI(`https://open-api-testnet.unisat.io/v1/indexer/tx/${txid}/outs`, headers);
        const btcAddress = '2MvxteUZggvbprjogjMQVrRZ3NSNVskCpaz';
        const firstOutput = outputs.data.find((output: { vout: number }) => output.vout === 0);

        const result = {
            transaction: txData.data,
            outputs: outputs.data,
            verified: !!firstOutput && firstOutput.address === btcAddress,
            message: firstOutput && firstOutput.address === btcAddress
                ? 'Transaction verified successfully'
                : 'First output address does not match expected address'
        };

        cache.set(txid, result, 300);
        console.log('Cached confirmed transaction data for txid:', txid, 'for 300 seconds');
        return result;
    } catch (error) {
        console.error('Error fetching transaction data:', error);
        throw error;
    }
}

async function getSOLTestnetTransactionData(txid: string): Promise<any> {
    const cachedData = cache.get(txid);
    if (cachedData) return cachedData;

    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [txid, { encoding: 'json', maxSupportedTransactionVersion: 0 }]
    };

    try {
        const response = await axios.post('https://api.devnet.solana.com', payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.data.result) {
            throw { message: 'Transaction not found', status: 404 } as TransactionError;
        }

        const result = response.data.result;
        cache.set(txid, result);
        return result;
    } catch (error) {
        throw error as TransactionError;
    }
}

export const handleVerifyTransaction = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const txid = url.searchParams.get('txid');
        const chain = url.searchParams.get('chain');
        const verificationSecret = url.searchParams.get('verification_secret');

        if (!txid || !chain || !verificationSecret) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Missing required parameters',
                required: {
                    txid: !txid ? 'missing' : 'provided',
                    chain: !chain ? 'missing' : 'provided',
                    verification_secret: !verificationSecret ? 'missing' : 'provided'
                }
            }));
            return;
        }

        if (verificationSecret !== txSecret) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid verification secret' }));
            return;
        }

        let txData;
        switch (chain.toLowerCase()) {
            case 'bitcoin_testnet':
                txData = await getBTCTestnetTransactionData(txid);
                break;
            case 'solana_devnet':
                txData = await getSOLTestnetTransactionData(txid);
                break;
            default:
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid chain' }));
                return;
        }

        const result: TransactionResponse = {
            status: 'verified',
            txid,
            chain,
            timestamp: new Date().toISOString(),
            transaction_data: txData
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    } catch (error) {
        const txError = error as TransactionError;
        res.writeHead(txError.status || 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: txError.message || 'Internal Server Error'
        }));
    }
};
