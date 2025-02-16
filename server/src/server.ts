import http from 'http'
import dotenv from 'dotenv'
import { handleBit10DEFI } from './routes/bit10DEFI'
import { handleBit10DEFICurrentPrice } from './routes/bit10DEFICurrentPrice'
import { handleBit10BRC20 } from './routes/bit10BRC20'
import { handleBit10BRC20CurrentPrice } from './routes/bit10BRC20CurrentPrice'
import { handleBit10BRC20HistoricalData } from './routes/bit10BRC20HistoricalData'
import { handleBit10TOP } from './routes/bit10TOP'
import { handleBit10TOPCurrentPrice } from './routes/bit10TOPCurrentPrice'
import { handleBit10TOPHistoricalData } from './routes/bit10TOPHistoricalData'
import { handleBit10MEME } from './routes/bit10MEME'
import { handleBit10MEMECurrentPrice } from './routes/bit10MEMECurrentPrice'
import { handleBit10MEMEHistoricalData } from './routes/bit10MEMEHistoricalData'
import { handleTestBit10MEMERebalance } from './routes/testBit10MEMERebalance'
import { handleTestBit10TOPRebalance } from './routes/testBit10TOPRebalance'

dotenv.config();

const PORT = 8080;

const routeHandlers: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>> = {
    '/bit10-defi': handleBit10DEFI,
    '/bit10-defi?day=1': handleBit10DEFI,
    '/bit10-defi?day=7': handleBit10DEFI,
    '/bit10-defi-current-price': handleBit10DEFICurrentPrice,
    '/bit10-brc20': handleBit10BRC20,
    '/bit10-brc20?day=1': handleBit10BRC20,
    '/bit10-brc20?day=7': handleBit10BRC20,
    '/bit10-brc20-current-price': handleBit10BRC20CurrentPrice,
    '/bit10-brc20-historical-data': handleBit10BRC20HistoricalData,
    '/test-bit10-top': handleBit10TOP,
    '/test-bit10-top?day=1': handleBit10TOP,
    '/test-bit10-top?day=7': handleBit10TOP,
    '/test-bit10-top-current-price': handleBit10TOPCurrentPrice,
    '/bit10-top-historical-data': handleBit10TOPHistoricalData,
    '/test-bit10-top-rebalance': handleTestBit10TOPRebalance,
    '/test-bit10-meme': handleBit10MEME,
    '/test-bit10-meme?day=1': handleBit10MEME,
    '/test-bit10-meme?day=7': handleBit10MEME,
    '/test-bit10-meme-current-price': handleBit10MEMECurrentPrice,
    '/bit10-meme-historical-data': handleBit10MEMEHistoricalData,
    '/test-bit10-meme-rebalance': handleTestBit10MEMERebalance,
};

const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {
    const handler = routeHandlers[request.url || ''];

    if (handler) {
        handler(request, response).catch((error) => {
            console.error(`Error handling ${request.url}:`, error);
            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(500);
            response.end('Internal Server Error');
        });
    } else {
        response.setHeader('Content-Type', 'text/plain');
        response.writeHead(404);
        response.end('Not Found');
    }
};

const server = http.createServer(requestHandler);

server.listen(PORT, '::', () => {
    console.log(`🚀 Server is running on port ${PORT} (IPv6 and IPv4)`);
});
