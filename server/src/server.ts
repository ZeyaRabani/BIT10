import http from 'http'
import dotenv from 'dotenv'
import { handleBit10DeFi } from './routes/bit10DeFi'
import { handleBit10BRC20 } from './routes/bit10BRC20'
import { handleBit10BRC20Rebalance } from './routes/bit10BRC20Rebalance'

dotenv.config();

const PORT = 8080;

const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.url === '/bit10-defi') {
        handleBit10DeFi(request, response).catch((error) => {
            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(500);
            response.end('Internal Server Error');
        });
    } else if (request.url === '/bit10-brc20') {
        handleBit10BRC20(request, response).catch((error) => {
            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(500);
            response.end('Internal Server Error');
        });
    } else if (request.url === '/bit10-brc20-rebalance') {
        handleBit10BRC20Rebalance(request, response).catch((error) => {
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

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});