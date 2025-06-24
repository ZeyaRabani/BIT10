import http from 'http'
import dotenv from 'dotenv'
import { fetchAndUpdateBit10DEFIData } from './services/bit10DEFI'
import { fetchAndUpdateBit10BRC20Data } from './services/bit10BRC20'
import { fetchAndUpdateBit10TOPData } from './services/bit10TOP'
import { fetchAndUpdateBit10MEMEData } from './services/bit10MEME'
import { handleBit10DEFICurrentPrice } from './routes/bit10DEFICurrentPrice'
import { handleBit10DEFIFilterData } from './routes/bit10DEFIFilterData'
import { handleBit10BRC20CurrentPrice } from './routes/bit10BRC20CurrentPrice'
import { handleBit10BRC20FilterData } from './routes/bit10BRC20FilterData'
import { handleBit10BRC20RebalanceData } from './routes/bit10BRC20RabalanceHistory'
import { handleBit10TOPCurrentPrice } from './routes/bit10TOPCurrentPrice'
import { handleBit10TOPFilterData } from './routes/bit10TOPFilterData'
import { handleTestBit10TOPRebalanceData } from './routes/testBit10TOPRabalanceHistory'
import { handleBit10MEMECurrentPrice } from './routes/bit10MEMECurrentPrice'
import { handleBit10MEMEFilterData } from './routes/bit10MEMEFilterData'
import { handleTestBit10MEMERebalanceData } from './routes/testBit10MEMERabalanceHistory'
import { handleVerifyTransaction } from './routes/verifyTransaction'
import { handleBit10Referral } from './routes/referral'
import { handelCreateTransaction } from './routes/createTransaction'

dotenv.config();

const PORT = 8080;

const routeHandlers: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>> = {
    '/bit10-defi-current-price': handleBit10DEFICurrentPrice,
    '/bit10-defi': handleBit10DEFIFilterData,
    '/bit10-brc20-current-price': handleBit10BRC20CurrentPrice,
    '/bit10-brc20': handleBit10BRC20FilterData,
    '/bit10-brc20-rebalance': handleBit10BRC20RebalanceData,
    '/test-bit10-top-current-price': handleBit10TOPCurrentPrice,
    '/test-bit10-top': handleBit10TOPFilterData,
    '/test-bit10-top-rebalance': handleTestBit10TOPRebalanceData,
    '/test-bit10-meme-current-price': handleBit10MEMECurrentPrice,
    '/test-bit10-meme': handleBit10MEMEFilterData,
    '/test-bit10-meme-rebalance': handleTestBit10MEMERebalanceData,
    '/verify-transaction': handleVerifyTransaction,
    '/referral': handleBit10Referral,
    '/create-transaction': handelCreateTransaction
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
            fetchAndUpdateBit10DEFIData(),
            fetchAndUpdateBit10BRC20Data(),
            fetchAndUpdateBit10TOPData(),
            fetchAndUpdateBit10MEMEData()
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
