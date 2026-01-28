import http from 'http'
const { Actor, HttpAgent } = require('@dfinity/agent')
import { idlFactory } from '../../../lib/buy.did'

async function fetchPriceData(): Promise<{ ethPrice: number; bit10Price: number } | null> {
    return new Promise((resolve) => {
        const options = {
            hostname: 'eagleai-api.bit10.app',
            port: process.env.PORT,
            path: '/api/v1/balancer/bit10top/price',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const priceData = JSON.parse(data);

                    const bit10Price = priceData.tokenPrice;

                    const ethData = priceData.data.find(
                        (coin: any) => coin.symbol === 'ETH' || coin.symbol === 'WETH'
                    );

                    if (!ethData || !ethData.currentPrice) {
                        console.error('ETH price not found in price data');
                        resolve(null);
                        return;
                    }

                    resolve({
                        ethPrice: ethData.currentPrice,
                        bit10Price: bit10Price
                    });
                } catch (error) {
                    console.error('Error parsing price data:', error);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error fetching price data:', error);
            resolve(null);
        });

        req.end();
    });
}

/**
 * @swagger
 * /api/v1/trades/buy:
 *   post:
 *     summary: Create a BIT10 buy transaction on Base
 *     description: |
 *       Creates a new transaction for buying BIT10 tokens on the Base blockchain.
 *       This endpoint requires authentication via API key and creates a transaction on the ICP canister.
 *       
 *       **Authentication**: Requires a Bearer token in the Authorization header
 *       
 *       **NOTE**: Use the following details for the request body
 *       - user_wallet_address = The address where you want to receive the BIT10 token. Type: String.
 *       - token_in_address = The address should be **0x0000000000000000000000000000000000000000b** for native ETH on Base. Type: String.
 *       - token_out_address = The address should be **0x2d309c7c5fbbf74372edfc25b10842a7237b92de** for BIT10.TOP on Base. Type: String.
 *       - token_out_amount = The number of BIT10.TOP tokens (on Base) you want to receive. Type: String.
 * 
 *       **Process Flow**:
 *       1. Validates API key
 *       2. Validates required fields
 *       3. Fetches current ETH and BIT10.TOP prices from /api/v1/balancer/bit10top/price
 *       4. Creates transaction on Base using ICP canister (6phs7-6yaaa-aaaap-qpvoq-cai)
 *       5. Returns transaction details
 *     tags: [Trades]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_wallet_address
 *               - token_in_address
 *               - token_out_address
 *               - token_out_amount
 *             properties:
 *               user_wallet_address:
 *                 type: string
 *                 description: User's wallet address to receive BIT10 tokens
 *               token_in_address:
 *                 type: string
 *                 description: Input token address (ETH on Base). Use "0x0000000000000000000000000000000000000000b" as input for native ETH on Base
 *               token_out_address:
 *                 type: string
 *                 description: Output token address (BIT10.TOP on Base). Use "0x2d309c7c5fbbf74372edfc25b10842a7237b92de" as input for BIT10.TOP token on Base.
 *               token_out_amount:
 *                 type: string
 *                 description: Amount of BIT10.TOP tokens to receive
 *           example:
 *             user_wallet_address: "0xuser1234567890abcdefuser1234567890abcdef"
 *             token_in_address: "0x0000000000000000000000000000000000000000b"
 *             token_out_address: "0x2d309c7c5fbbf74372edfc25b10842a7237b92de"
 *             token_out_amount: "1"
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 from:
 *                   type: string
 *                   description: The address reciving the BIT10 token
 *                 to:
 *                   type: string
 *                   description: The address for sending the token
 *                 value:
 *                   type: string
 *                   description: The hex value for the tokens to send
 *                 data:
 *                   type: string
 *                   description: The encoded data/memo that is required for the transaction
 *             example:
 *               from: "0xuser1234567890abcdefuser1234567890abcdef"
 *               to: "0xc642a4dd078267674857a739d0e5e8f6f6bf8fb1"
 *               value: "0xc4c50a3bb69de"
 *               data: "0x30783264333039633"
 *       400:
 *         description: Missing required fields or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing or invalid authorization header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       405:
 *         description: Method not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error or canister call failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export const handleBuyBIT10 = async (req: http.IncomingMessage, res: http.ServerResponse) => {
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

                const { token_in_address, token_out_address, user_wallet_address, token_out_amount } = requestData;

                if (!token_in_address || !token_out_address || !user_wallet_address || !token_out_amount) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Missing required fields',
                        message: 'All fields are required: token_in_address, token_out_address, user_wallet_address, token_out_amount'
                    }));
                    return;
                }

                const priceData = await fetchPriceData();

                if (!priceData) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Failed to fetch price data',
                        message: 'Could not retrieve current ETH and BIT10.TOP prices'
                    }));
                    return;
                }

                const tokenOutAmountNum = parseFloat(token_out_amount);
                if (isNaN(tokenOutAmountNum) || tokenOutAmountNum <= 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Invalid token_out_amount',
                        message: 'token_out_amount must be a valid positive number'
                    }));
                    return;
                }

                const calculatedTokenInAmount = (priceData.bit10Price / priceData.ethPrice) * tokenOutAmountNum;
                const token_in_amount = calculatedTokenInAmount.toFixed(18);

                const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';
                const agent = new HttpAgent({ host: 'https://icp-api.io' });

                const actor = Actor.createActor(idlFactory, {
                    agent,
                    canisterId,
                });

                const response = await actor.base_create_transaction({
                    user_wallet_address: user_wallet_address,
                    token_in_address: token_in_address,
                    token_in_amount: token_in_amount,
                    token_out_address: token_out_address,
                    token_out_amount: token_out_amount,
                    referral : ['OVZA8WKN'] // Referral code for EagleAI Labs
                });

                const enhancedResponse = {
                    ...response
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(enhancedResponse));
            } catch (error) {
                console.error('Error processing buy request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                let errorMessage = 'Failed to process buy request';
                if (error && typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = (error as { message?: string }).message || errorMessage;
                }
                res.end(JSON.stringify({
                    error: 'Request processing failed',
                    message: errorMessage
                }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Method Not Allowed',
            message: 'Use POST method with JSON body containing: token_in_address, token_out_address, user_wallet_address, token_out_amount'
        }));
    }
};
