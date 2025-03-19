import type { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import axios from 'axios'
import NodeCache from 'node-cache'
import fs from 'fs/promises'
import path from 'path'

const cache = new NodeCache({
    stdTTL: 10,  // 10 sec
    checkperiod: 5,  // 5 sec
    useClones: false,
    deleteOnExpire: true
});

const txCacheBTC = new NodeCache({
    stdTTL: 60,  // 1 min
    checkperiod: 30,
    useClones: false,
    deleteOnExpire: true
});

const txCacheSOL = new NodeCache({
    stdTTL: 8,  // 8 sec
    checkperiod: 5, // 5 sec
    useClones: false,
    deleteOnExpire: true
});

const txSecret = process.env.VERIFY_TX_SECRET;
const unisatTestKey = process.env.UNISAT_TESTNET_KEY;

interface TransactionError {
    message: string;
    status?: number;
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
    const cachedTx = txCacheBTC.get(txid) as { message?: string };
    if (cachedTx && cachedTx.message && cachedTx.message !== 'Transaction not confirmed yet' && cachedTx.message !== 'Transaction invalid') {
        return cachedTx;
    }

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
            txCacheBTC.set(txid, result);
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

        txCacheBTC.set(txid, result);
        return result;
    } catch (error: unknown) {
        if (error instanceof Error && 'status' in error && error.status === 403 && cachedTx) {
            return cachedTx;
        }
        console.error('Error fetching transaction data:', error);
        throw error;
    }
}

async function getSOLTestnetTransactionData(txid: string): Promise<any> {
    const cachedTx = txCacheSOL.get(txid) as { message?: string };
    if (cachedTx && cachedTx.message && cachedTx.message !== 'Transaction not confirmed yet' && cachedTx.message !== 'Transaction invalid') {
        return cachedTx;
    }

    try {
        const { data: txData } = await axios.post('https://api.devnet.solana.com', {
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [
                txid,
                'json'
            ]
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!txData.result) {
            const result = {
                transaction: null,
                verified: false,
                message: 'Transaction not found',
                txid,
                timestamp: new Date().toISOString()
            };
            txCacheSOL.set(txid, result);
            return result;
        }

        const transaction = txData.result.transaction;
        const txMessage = transaction.message;
        const accountKeys = txMessage.accountKeys;
        const meta = txData.result.meta;

        const transferInstruction = txMessage.instructions.find((inst: any) =>
            accountKeys[inst.programIdIndex] === '11111111111111111111111111111111' &&
            inst.accounts.length === 2
        );

        if (!transferInstruction) {
            const result = {
                // transaction: txData.result,
                verified: false,
                message: 'No transfer instruction found',
                txid,
                timestamp: new Date().toISOString()
            };
            txCacheSOL.set(txid, result);
            return result;
        }

        const sender = accountKeys[transferInstruction.accounts[0]];
        const receiver = accountKeys[transferInstruction.accounts[1]];
        const expectedAddress = 'Cq6JPmEspG6oNcUC47WHuEJWU1K4knsLzHYHSfvpnDHk';

        const receiverPreBalance = meta.preBalances[transferInstruction.accounts[1]];
        const receiverPostBalance = meta.postBalances[transferInstruction.accounts[1]];
        // const solAmount = (receiverPostBalance - receiverPreBalance) / 1000000000;
        const solAmount = receiverPostBalance - receiverPreBalance;

        const verified = receiver === expectedAddress;
        const resultMessage = verified
            ? 'Transaction verified successfully'
            : 'First output address does not match expected address';

        const result = {
            // transaction: txData.result,
            receiver,
            sender,
            solAmount: solAmount > 0 ? solAmount : 0,
            verified,
            message: resultMessage,
            txid,
            timestamp: new Date().toISOString()
        };

        txCacheSOL.set(txid, result);
        return result;
    } catch (error: unknown) {
        if (error instanceof Error && 'status' in error && error.status === 403 && cachedTx) {
            return cachedTx;
        }
        console.error('Error fetching Solana transaction data:', error);
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

        const existingData = await getCachedJsonData();
        const existingTransactionIndex = existingData.findIndex((item: any) => item.txid === txid);

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

        if (existingTransactionIndex !== -1) {
            const existingTransaction = existingData[existingTransactionIndex];
            if (existingTransaction.message === 'Transaction not confirmed yet' ||
                existingTransaction.message === 'Transaction invalid') {
                if (txData.message === 'Transaction verified successfully' ||
                    txData.message === 'First output address does not match expected address') {
                    existingData[existingTransactionIndex] = txData;
                }
            }
        } else {
            existingData.push(txData);
        }

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
