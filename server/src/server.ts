/* eslint-disable @typescript-eslint/no-unused-vars */
import http from 'http'
import dotenv from 'dotenv'
import { handleBit10DEFI } from './routes/bit10DEFI'
import { handleBit10DEFICurrentPrice } from './routes/bit10DEFICurrentPrice'
import { handleBit10BRC20 } from './routes/bit10BRC20'
import { handleBit10BRC20CurrentPrice } from './routes/bit10BRC20CurrentPrice'
import { handleBit10BRC20HistoricalData } from './routes/bit10BRC20HistoricalData'
import { handleBit10TOPHistoricalData } from './routes/bit10TOPHistoricalData'

dotenv.config();

const PORT = 8080;

const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.url === '/bit10-defi') {
        handleBit10DEFI(request, response).catch((error) => {
            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(500);
            response.end('Internal Server Error');
        });
    } else if (request.url === '/bit10-defi-current-price') {
        handleBit10DEFICurrentPrice(request, response).catch((error) => {
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
    } else if (request.url === '/bit10-brc20-current-price') {
        handleBit10BRC20CurrentPrice(request, response).catch((error) => {
            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(500);
            response.end('Internal Server Error');
        });
    } else if (request.url === '/bit10-brc20-historical-data') {
        handleBit10BRC20HistoricalData(request, response).catch((error) => {
            response.setHeader('Content-Type', 'text/plain');
            response.writeHead(500);
            response.end('Internal Server Error');
        });
    } else if (request.url === '/bit10-top-historical-data') {
        handleBit10TOPHistoricalData(request, response).catch((error) => {
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
