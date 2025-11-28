import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import dotenv from 'dotenv'
import { fetchAndUpdateBIT10DEFIData } from './services/bit10DEFI'
// import { fetchAndUpdateBIT10BRC20Data } from './services/bit10BRC20'
import { fetchAndUpdateBIT10TOPData } from './services/bit10TOP'
import { fetchAndUpdateBIT10MEMEData } from './services/bit10MEME'
import { fetchAndUpdateBIT10TOPComparisonData } from './services/bit10TOPComparison'
import { handleBIT10DEFICurrentPrice } from './routes/bit10DEFICurrentPrice'
import { handleBIT10DEFIFilterData } from './routes/bit10DEFIFilterData'
import { handleBIT10BRC20CurrentPrice } from './routes/bit10BRC20CurrentPrice'
import { handleBIT10BRC20FilterData } from './routes/bit10BRC20FilterData'
import { handleBIT10BRC20RebalanceData } from './routes/bit10BRC20RabalanceHistory'
import { handleBIT10TOPCurrentPrice } from './routes/bit10TOPCurrentPrice'
import { handleBIT10TOPFilterData } from './routes/bit10TOPFilterData'
import { handleBIT10TopRebalanceData } from './routes/bit10TOPRabalanceHistory'
import { handleBIT10MEMECurrentPrice } from './routes/bit10MEMECurrentPrice'
import { handleBIT10MEMEFilterData } from './routes/bit10MEMEFilterData'
import { handleTestBIT10MEMERebalanceData } from './routes/testBit10MEMERabalanceHistory'
import { handleVerifyTransaction } from './routes/verifyTransaction'
import { handelCreateTransaction } from './routes/createTransaction'
import { handleBIT10ComparisonData } from './routes/bit10Comparison'
import { handleTokenCurrentPrices } from './routes/tokenPrices'
import { handleBIT10TOPPrice, handleBIT10TOPBalance, getPriceData, cleanup as cleanupPriceData } from './institutions/api/v1/bit10TopPrice'
import { handleBuyBIT10 } from './institutions/api/v1/buyBIT10'
import { handleBuyBIT10Trx } from './institutions/api/v1/buyBIT10Trx'
import { handleSellBIT10 } from './institutions/api/v1/sellBIT10'
import { handleSellBIT10Trx } from './institutions/api/v1/sellBIT10Trx'
import { swaggerSpec } from './swagger'

dotenv.config();

const PORT = 8080;

let priceUpdateInterval: NodeJS.Timeout | null = null;
let isShuttingDown = false;

const routeHandlers: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>> = {
    '/bit10-defi-current-price': handleBIT10DEFICurrentPrice,
    '/bit10-defi': handleBIT10DEFIFilterData,
    '/bit10-brc20-current-price': handleBIT10BRC20CurrentPrice,
    '/bit10-brc20': handleBIT10BRC20FilterData,
    '/bit10-brc20-rebalance': handleBIT10BRC20RebalanceData,
    '/bit10-top-current-price': handleBIT10TOPCurrentPrice,
    '/bit10-top': handleBIT10TOPFilterData,
    '/bit10-top-rebalance': handleBIT10TopRebalanceData,
    '/test-bit10-meme-current-price': handleBIT10MEMECurrentPrice,
    '/test-bit10-meme': handleBIT10MEMEFilterData,
    '/test-bit10-meme-rebalance': handleTestBIT10MEMERebalanceData,
    '/verify-transaction': handleVerifyTransaction,
    '/create-transaction': handelCreateTransaction,
    '/bit10-comparison': handleBIT10ComparisonData,
    '/token-prices': handleTokenCurrentPrices,
    '/api/v1/balancer/bit10top/price': handleBIT10TOPPrice,
    '/api/v1/balancer/bit10top/balance': handleBIT10TOPBalance,
    '/api/v1/trades/buy': handleBuyBIT10,
    '/api/v1/trades/buy-bit10-trx': handleBuyBIT10Trx,
    '/api/v1/trades/sell': handleSellBIT10,
    '/api/v1/trades/sell-bit10-trx': handleSellBIT10Trx
};

const generateSwaggerHTML = () => {
    return `
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>BIT10 API Documentation</title>
    <link rel='stylesheet' type='text/css' href='https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css' />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            padding: 0;
        }
        .topbar {
            display: none;
        }
        .websocket-info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .websocket-info h3 {
            color: #495057;
            margin-top: 0;
        }
        .websocket-info code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, monospace;
        }
    </style>
</head>
<body>
    <div id='swagger-ui'></div>
    <script src='https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js'></script>
    <script src='https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js'></script>
    <script>
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                url: '/api-docs.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: 'StandaloneLayout',
                persistAuthorization: true
            });
        };
    </script>
</body>
</html>
    `;
};

const requestHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (isShuttingDown) {
        res.writeHead(503, { 'Content-Type': 'text/plain' });
        res.end('Server is shutting down');
        return;
    }

    try {
        const urlPath = new URL(req.url || '/', `http://${req.headers.host}`).pathname;

        if (urlPath === '/api-docs' || urlPath === '/api-docs/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(generateSwaggerHTML());
            return;
        }

        if (urlPath === '/api-docs.json') {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(swaggerSpec, null, 2));
            return;
        }

        const handler = routeHandlers[urlPath];

        if (handler) {
            await handler(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (error) {
        console.error(`❌ Error handling ${req.url}:`, error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
};

const server = http.createServer(requestHandler);

const wss = new WebSocketServer({
    server,
    path: '/ws/price-feed'
});

const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
    if (isShuttingDown) {
        ws.close(1001, 'Server is shutting down');
        return;
    }

    clients.add(ws);
    console.log(`🔗 WebSocket client connected. Total clients: ${clients.size}`);

    const currentData = getPriceData();
    if (currentData) {
        try {
            ws.send(JSON.stringify(currentData));
        } catch (error) {
            console.error('Error sending initial data:', error);
        }
    }

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`🔌 WebSocket client disconnected. Total clients: ${clients.size}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });

    ws.on('ping', () => {
        if (!isShuttingDown) {
            ws.pong();
        }
    });
});

priceUpdateInterval = setInterval(() => {
    if (isShuttingDown || clients.size === 0) return;

    const priceData = getPriceData();
    if (priceData) {
        const message = JSON.stringify(priceData);

        const clientsCopy = [...clients];

        clientsCopy.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Error sending price update:', error);
                    clients.delete(client);
                }
            } else {
                clients.delete(client);
            }
        });
    }
}, 1000);

server.listen(PORT, '::', async () => {
    console.log(`🚀 Server is running on port ${PORT} (IPv6 and IPv4)`);
    console.log(`📡 WebSocket server is running on wss://localhost:${PORT}/ws/price-feed`);

    try {
        const results = await Promise.allSettled([
            fetchAndUpdateBIT10TOPComparisonData(),
            fetchAndUpdateBIT10DEFIData(),
            fetchAndUpdateBIT10TOPData(),
            fetchAndUpdateBIT10MEMEData()
        ]);

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`❌ Error fetching initial data for index ${index}:`, result.reason);
            }
        });

        console.log('✅ Initial BIT10 data fetched successfully.');
    } catch (error) {
        console.error('❌ Error fetching initial BIT10 data:', error);
    }
});

async function shutdown() {
    if (isShuttingDown) return;

    console.log('🛑 Starting graceful shutdown...');
    isShuttingDown = true;

    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
        console.log('✅ Price update interval cleared');
    }

    clients.forEach(client => {
        try {
            client.close(1001, 'Server is shutting down');
        } catch (error) {
            console.error('Error closing WebSocket client:', error);
        }
    });
    clients.clear();
    console.log('✅ All WebSocket connections closed');

    wss.close(() => {
        console.log('✅ WebSocket server closed');
    });

    try {
        await cleanupPriceData();
        console.log('✅ Price data resources cleaned up');
    } catch (error) {
        console.error('❌ Error cleaning up price data resources:', error);
    }

    server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('🎯 Graceful shutdown complete');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('⚠️  Forceful shutdown after timeout');
        process.exit(1);
    }, 30000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
});
