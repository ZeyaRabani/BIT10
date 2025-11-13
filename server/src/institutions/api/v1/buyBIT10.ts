import http from 'http'
const { Actor, HttpAgent } = require('@dfinity/agent')
import { idlFactory } from '../../../lib/buy.did'

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

                const { token_in_amount, token_in_address, token_out_address, user_wallet_address, token_out_amount } = requestData;

                if (!token_in_amount || !token_in_address || !token_out_address || !user_wallet_address || !token_out_amount) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Missing required fields',
                        message: 'All fields are required: token_in_amount, token_in_address, token_out_address, user_wallet_address, token_out_amount'
                    }));
                    return;
                }

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
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } catch (error) {
                console.error('Error calling canister:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                let errorMessage = 'Failed to call ICP canister';
                if (error && typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = (error as { message?: string }).message || errorMessage;
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
            message: 'Use POST method with JSON body containing: token_in_amount, token_in_address, token_out_address, user_wallet_address, token_out_amount'
        }));
    }
};