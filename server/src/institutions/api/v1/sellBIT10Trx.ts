import http from 'http'
const { Actor, HttpAgent } = require('@dfinity/agent')
import { idlFactory } from '../../../lib/buy.did'

/**
 * @swagger
 * /api/v1/trades/sell-bit10-trx:
 *   post:
 *     summary: Process a BIT10 sell transaction by hash
 *     description: |
 *       Processes an existing transaction using its transaction hash. This endpoint requires authentication 
 *       via API key and executes the sell operation on the ICP canister.
 *       
 *       **Authentication**: Requires a Bearer token in the Authorization header.
 *       
 *       **Process Flow**:
 *       1. Validates the API key.
 *       2. Validates the transaction hash.
 *       3. Calls the ICP canister to process the transaction.
 *       4. Returns the processing result (Ok/Err variant).
 *       
 *       **Use Case**: After creating a transaction via `/api/v1/trades/sell`, use this endpoint 
 *       to execute the transaction once the on-chain transaction is confirmed.
 *     tags: [Trades]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellTrxRequest'
 *           example:
 *             trx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *     responses:
 *       200:
 *         description: Transaction processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 swap_id:
 *                   type: string
 *                   description: Swap ID for the data
 *                   example: "742da57bcc48d4d0d2d06911a6a5d"
 *                 user_wallet_address:
 *                   type: string
 *                   description: Wallet address to receive BIT10 tokens
 *                   example: "0xuser1234567890abcdefuser1234567890abcdef"
 *                 token_in_address:
 *                   type: string
 *                   description: Address of the token sent by the user
 *                   example: "0xtoken1234567890abcdefuser1234567890abcdef"
 *                 token_in_amount:
 *                   type: string
 *                   description: Amount of token sent
 *                   example: "0.0011"
 *                 token_in_usd_amount:
 *                   type: string
 *                   description: USD amount for the token sent
 *                   example: "20"
 *                 token_in_tx_hash:
 *                   type: string
 *                   description: Transaction hash of the token sent
 *                   example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *                 token_out_address:
 *                   type: string
 *                   description: Address of the token received by the user
 *                   example: "0xtoken1234567890abcdefuser1234567890abcdef"
 *                 token_out_amount:
 *                   type: string
 *                   description: Amount of token received
 *                   example: "1"
 *                 token_out_tx_hash:
 *                   type: string
 *                   description: Transaction hash of the token received
 *                   example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *                 transaction_type:
 *                   type: string
 *                   description: Type of transaction. Buy, Sell, or Reverted
 *                   example: "Sell"
 *                 network:
 *                   type: string
 *                   description: Chain used for the transaction
 *                   example: "Base"
 *                 transaction_timestamp:
 *                   type: string
 *                   description: Timestamp of the transaction when completed (in nanoseconds)
 *                   example: "1760476996699879516"
 *             example:
 *               swap_id: "742da57bcc48d4d0d2d06911a6a5d"
 *               user_wallet_address: "0xuser1234567890abcdefuser1234567890abcdef"
 *               token_in_address: "0xtoken1234567890abcdefuser1234567890abcdef"
 *               token_in_amount: "742da57bcc48d4d0d2d06911a6a5d"
 *               token_in_usd_amount: "20"
 *               token_in_tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *               token_out_address: "0xtoken1234567890abcdefuser1234567890abcdef"
 *               token_out_amount: "1"
 *               token_out_tx_hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *               transaction_type: "Sell"
 *               network: "Base"
 *               transaction_timestamp: "1760476996699879516"
 *       400:
 *         description: Missing transaction hash or transaction processing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingHash:
 *                 value:
 *                   error: "Missing required field"
 *                   message: "Field required: trx_hash"
 *               processingFailed:
 *                 value:
 *                   error: "Transaction processing failed"
 *                   message: "Transaction not found or already processed"
 *               invalidHash:
 *                 value:
 *                   error: "Transaction processing failed"
 *                   message: "Invalid transaction hash format"
 *               insufficientFunds:
 *                 value:
 *                   error: "Transaction processing failed"
 *                   message: "Insufficient funds in source address"
 *       401:
 *         description: Missing or invalid authorization header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingAuth:
 *                 value:
 *                   error: "Missing Authorization header"
 *                   message: "Please provide an API key in the Authorization header using Bearer token format"
 *               invalidFormat:
 *                 value:
 *                   error: "Invalid Authorization header format"
 *                   message: "Use Bearer token format: \"Authorization: Bearer YOUR_API_KEY\""
 *       403:
 *         description: Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid API key"
 *               message: "The provided API key is not valid"
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Method Not Allowed"
 *               message: "Use POST method with a JSON body containing: trx_hash"
 *       500:
 *         description: Server error or canister call failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverConfig:
 *                 value:
 *                   error: "Server configuration error"
 *                   message: "API key not configured on server"
 *               canisterFailed:
 *                 value:
 *                   error: "Canister call failed"
 *                   message: "Failed to call ICP canister: Connection timeout"
 *               unexpectedResponse:
 *                 value:
 *                   error: "Unexpected response format"
 *                   message: "Received unexpected response from canister"
 */

export const handleSellBIT10Trx = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Missing Authorization header',
            message: 'Please provide an API key in the Authorization header using Bearer token format'
        }));
        return;
    }

    if (!authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Invalid Authorization header format',
            message: 'Use Bearer token format: "Authorization: Bearer YOUR_API_KEY"'
        }));
        return;
    }

    const clientToken = authHeader.substring(7);

    const expectedApiKey = process.env.EAGLE_AI_API;

    if (!expectedApiKey) {
        console.error('EAGLE_AI_API environment variable is not set');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Server configuration error',
            message: 'API key not configured on server'
        }));
        return;
    }

    if (clientToken !== expectedApiKey) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
        }));
        return;
    }

    if (req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);

                const { trx_hash } = requestData;

                if (!trx_hash) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Missing required field',
                        message: 'Field required: trx_hash'
                    }));
                    return;
                }

                const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

                const agent = new HttpAgent({ host: 'https://icp-api.io' });

                const actor = Actor.createActor(idlFactory, {
                    agent,
                    canisterId,
                });

                const transfer = await actor.base_sell(trx_hash);

                if (transfer.Ok) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(transfer.Ok));
                } else if (transfer.Err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Transaction processing failed',
                        message: transfer.Err
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Unexpected response format',
                        message: 'Received unexpected response from canister'
                    }));
                }
            } catch (error) {
                console.error('Error calling canister:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                let errorMessage = 'Failed to call ICP canister';
                if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
                    errorMessage = (error as any).message;
                }
                res.end(JSON.stringify({
                    error: 'Canister call failed',
                    message: errorMessage
                }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Method Not Allowed',
            message: 'Use POST method with JSON body containing: trx_hash'
        }));
    }
};
