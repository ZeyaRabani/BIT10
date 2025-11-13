import http from 'http'
const { Actor, HttpAgent } = require('@dfinity/agent')
import { idlFactory } from '../../../lib/buy.did'

export const handleBuyBIT10Trx = async (req: http.IncomingMessage, res: http.ServerResponse) => {
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

                // Create agent
                const agent = new HttpAgent({ host: 'https://icp-api.io' });

                // Fetch root key for local development (remove in production)
                // await agent.fetchRootKey();

                const actor = Actor.createActor(idlFactory, {
                    agent,
                    canisterId,
                });

                const transfer = await actor.base_buy(trx_hash);

                // Handle the variant response (Ok or Err)
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