import type { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import axios from 'axios'
import NodeCache from 'node-cache'
import fs from 'fs/promises'
import path from 'path'

const cache = new NodeCache({
    stdTTL: 10,  // 10 seconds cache time
    checkperiod: 5,  // Check for expired keys every 5 seconds
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

const jsonFilePath = path.join(__dirname, '../../../data/test_verify_transaction.json');

const getCachedJsonData = async (): Promise<any> => {
    const cachedData = cache.get('jsonData');
    if (cachedData) {
        return cachedData;
    }

    const jsonData = await fs.readFile(jsonFilePath, 'utf-8');
    const parsedData = JSON.parse(jsonData);
    cache.set('jsonData', parsedData);
    return parsedData;
};

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
                message: txData.data.confirmations <= 0 ? 'Transaction not confirmed yet' : 'Transaction invalid',
                txid,
                timestamp: new Date().toISOString()
            };
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
                : 'First output address does not match expected address',
            txid,
            timestamp: new Date().toISOString()
        };

        return result;
    } catch (error) {
        console.error('Error fetching transaction data:', error);
        throw error;
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

        // First check if the transaction exists in the JSON file
        const existingData = await getCachedJsonData();
        const existingTransaction = existingData.find((item: any) => item.txid === txid);

        if (existingTransaction) {
            // If found in JSON file, return it
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(existingTransaction));
            return;
        }

        // If not found in JSON file, proceed with API call
        let txData;
        switch (chain.toLowerCase()) {
            case 'bitcoin_testnet':
                txData = await getBTCTestnetTransactionData(txid);
                break;
            // case 'solana_devnet':
            //     txData = await getSOLTestnetTransactionData(txid);
            //     break;
            default:
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid chain' }));
                return;
        }

        // Add new transaction to JSON file
        existingData.push(txData);
        await fs.writeFile(jsonFilePath, JSON.stringify(existingData, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(txData));
    } catch (error) {
        const txError = error as TransactionError;
        if (txError.message === 'Not found') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Transaction not found' }));
        } else {
            res.writeHead(txError.status || 500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: txError.message || 'Internal Server Error'
            }));
        }
    }
};
