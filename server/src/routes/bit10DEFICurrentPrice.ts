import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'

const jsonFilePath = path.join(__dirname, '../../data/bit10_defi.json');

let latestData: { bit10_defi: Array<{ timestmpz: string; data: Array<{ id: number; name: string; symbol: string; price: number }> }> } | null = null;

const refreshData = () => {
    try {
        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        latestData = JSON.parse(fileContent);
        console.log('BIT10.DEFI Current Data refreshed at', new Date().toISOString());
    } catch (error) {
        console.error('Error reading JSON file for BIT10.DEFI Current Data:', error);
        latestData = null;
    }
};

// Initial data load
refreshData();

setInterval(refreshData, 30 * 60 * 1000); // 30 * 60 * 1000 = 1800000 milliseconds = 30 min
// setInterval(refreshData, 3 * 1000); // 3 * 1000 = 3000 milliseconds = 3 seconds

export const handleBit10DEFICurrentPrice = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(405);
        response.end(JSON.stringify({ error: 'Method Not Allowed for BIT10.DEFI Current Data' }));
        return;
    }

    try {
        if (!latestData || !latestData.bit10_defi?.length) {
            response.setHeader('Content-Type', 'application/json');
            response.writeHead(404);
            response.end(JSON.stringify({ error: 'No data available for BIT10.DEFI Current Data' }));
            return;
        }

        const firstElement = latestData.bit10_defi[0];
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(200);
        response.end(JSON.stringify(firstElement));
    } catch (error) {
        console.error('Error serving data:', error);
        response.setHeader('Content-Type', 'application/json');
        response.writeHead(500);
        response.end(JSON.stringify({ error: 'Error serving data for BIT10.DEFI Current Data' }));
    }
};
