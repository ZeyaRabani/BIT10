import type { IncomingMessage, ServerResponse } from 'http'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(__dirname, '../data/bit10_brc20_test.json');
const REBALANCE_PATH = path.join(__dirname, '../data/bit10_brc20_rebalance.json');

interface Token {
    id: number;
    name: string;
    symbol: string;
    price: number | null;
}

interface DataEntry {
    timestmpz: string;
    tokenPrice: number;
    data: Token[];
}

interface RebalanceEntry {
    timestmpz: string;
    numberOfTokenChanged: number;
    newToken: Token[];
    oldToken: Token[];
}

interface JsonData {
    bit10_brc20: DataEntry[];
}

export const handleBit10BRC20Rebalance = async (request: IncomingMessage, response: ServerResponse) => {
    try {
        const jsonData: JsonData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as JsonData;
        const rebalanceData: RebalanceEntry[] = JSON.parse(fs.readFileSync(REBALANCE_PATH, 'utf-8')) as RebalanceEntry[];

        const todayDate: string = new Date().toISOString().split('T')[0] ?? '';
        const lastWeekDate: Date = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekDateString: string = lastWeekDate.toISOString().split('T')[0] ?? '';

        const todayEntries = jsonData.bit10_brc20.filter((entry) => entry.timestmpz.startsWith(todayDate));
        const lastWeekEntries = jsonData.bit10_brc20.filter((entry) => entry.timestmpz.startsWith(lastWeekDateString));

        if (todayEntries.length === 0 || lastWeekEntries.length === 0) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ message: "No data available for comparison." }));
            return;
        }

        const todayLastEntry = todayEntries[todayEntries.length - 1];
        const lastWeekLastEntry = lastWeekEntries[lastWeekEntries.length - 1];

        const newTokens: Token[] = [];
        const oldTokens: Token[] = [];
        const lastWeekTokenMap = new Map<number, Token>();

        if (lastWeekLastEntry) {
            lastWeekLastEntry.data.forEach((token) => {
                lastWeekTokenMap.set(token.id, token);
            });
        }

        if (todayLastEntry) {
            todayLastEntry.data.forEach((todayToken) => {
                const lastWeekToken = lastWeekTokenMap.get(todayToken.id);
                if (!lastWeekToken) {
                    newTokens.push(todayToken);
                } else {
                    lastWeekTokenMap.delete(todayToken.id);
                }
            });
        }

        lastWeekTokenMap.forEach(oldToken => {
            oldTokens.push(oldToken);
        });

        const rebalanceEntry: RebalanceEntry = {
            timestmpz: new Date().toISOString(),
            numberOfTokenChanged: newTokens.length,
            newToken: newTokens,
            oldToken: oldTokens,
        };

        let existingData;
        try {
            existingData = JSON.parse(fs.readFileSync(REBALANCE_PATH, 'utf-8')) as { bit10_brc20_rebalance: Array<{ timestmpz: string, numberOfTokenChanged: number, newToken: Token[], oldToken: Token[] }> };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            existingData = { bit10_brc20_rebalance: [] };
        }

        existingData.bit10_brc20_rebalance.unshift(rebalanceEntry);

        fs.writeFileSync(REBALANCE_PATH, JSON.stringify(existingData, null, 2));

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(rebalanceData));

    } catch (error) {
        console.error(error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: "Internal server error." }));
    }
};
