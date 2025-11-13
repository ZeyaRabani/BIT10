import http from 'http'
import dotenv from 'dotenv'
import { fetchAndUpdateBIT10DEFIData } from './services/bit10DEFI'
import { fetchAndUpdateBIT10BRC20Data } from './services/bit10BRC20'
import { fetchAndUpdateBIT10TOPData } from './services/bit10TOP'
import { fetchAndUpdateBIT10MEMEData } from './services/bit10MEME'
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
import { handleBIT10TOPPrice, handleBIT10TOPBalance } from './institutions/api/v1/bit10TopPrice'
import { handleBuyBIT10 } from './institutions/api/v1/buyBIT10'
import { handleBuyBIT10Trx } from './institutions/api/v1/buyBIT10Trx'

dotenv.config();

const PORT = 8080;

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
    '/api/v1/balancer/bit10top/price': handleBIT10TOPPrice,
    '/api/v1/balancer/bit10top/balance': handleBIT10TOPBalance,
    '/api/v1/trades/buy': handleBuyBIT10,
    '/api/v1/trades/buy-bit10-trx': handleBuyBIT10Trx
};

const requestHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
        const urlPath = new URL(req.url || '/', `http://${req.headers.host}`).pathname;
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

server.listen(PORT, '::', async () => {
    console.log(`🚀 Server is running on port ${PORT} (IPv6 and IPv4)`);
    try {
        const results = await Promise.allSettled([
            fetchAndUpdateBIT10DEFIData(),
            fetchAndUpdateBIT10BRC20Data(),
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
