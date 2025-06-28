import type { IncomingMessage, ServerResponse } from 'http'
import { db } from '../db'
import { referralJune2025Tasks, referralJune2025, swap, teSwap, teLiquidityHub } from '../db/schema'
import fs from 'fs/promises'
import path from 'path'
import NodeCache from 'node-cache'
import cron from 'node-cron'
import { and, eq, gt, inArray, count } from 'drizzle-orm'

type Bit10ReferralType = {
    bit10_june_2025_referral: {
        address: string;
        total_points: number;
        position: number;
        referred_users: string[];
        referral_points: {
            total_no_of_liquidity_hub_transaction_by_referral_on_testnet: number;
            total_no_of_swap_by_referral_on_testnet: number;
            total_no_of_swap_by_referral_on_mainnet: number;
        }[];
        tasks_completed: {
            swap_on_mainnet: boolean;
            swap_on_internet_computer_testnet: boolean;
            liquidity_hub_tx_on_internet_computer_testnet: boolean;
        };
    }[];
};

const jsonFilePath = path.join(__dirname, '../../../data/bit10_june_2025_referral.json');
const cache = new NodeCache();
let latestData: { bit10_june_2025_referral: Bit10ReferralType[] } | null = null;

const start_dare = '5 July, 2025 00:00:00' // Time in GMT+5:30

async function calculateReferral() {
    try {
        const addresses = await db.select({ address: referralJune2025Tasks.address })
            .from(referralJune2025Tasks);

        const referrals = await db.select({
            referralCode: referralJune2025.referralCode,
            userId: referralJune2025.userId
        }).from(referralJune2025);

        const referralMap = new Map<string, string[]>();
        for (const referral of referrals) {
            if (!referralMap.has(referral.referralCode)) {
                referralMap.set(referral.referralCode, []);
            }
            referralMap.get(referral.referralCode)?.push(referral.userId);
        }

        const startDate = new Date(start_dare);

        const newData: Bit10ReferralType = {
            bit10_june_2025_referral: (await Promise.all(addresses.map(async (addr, index) => {
                const hasSwapOnICPTestnet = await db.select()
                    .from(teSwap)
                    .where(and(
                        eq(teSwap.userPrincipalId, addr.address),
                        gt(teSwap.transactionTimestamp, startDate.toISOString()),
                        eq(teSwap.network, 'ICP')
                    ))
                    .then(res => res.length > 0);

                const referredUsers = referralMap.get(addr.address) || [];

                const referredTeliquidityHubTransactions = referredUsers.length > 0 ? await db.select()
                    .from(teLiquidityHub)
                    .where(and(
                        inArray(teLiquidityHub.tickInAddress, referredUsers),
                        gt(teLiquidityHub.transactionTimestamp, startDate.toISOString())
                    ))
                    .then(res => res.length) : 0;

                const referredTestnetSwapCount = referredUsers.length > 0 ? await db.select()
                    .from(teSwap)
                    .where(and(
                        inArray(teSwap.userPrincipalId, referredUsers),
                        gt(teSwap.transactionTimestamp, startDate.toISOString())
                    ))
                    .then(res => res.length) : 0;

                const swapCount = await db.select({ count: count() })
                    .from(swap)
                    .where(and(
                        eq(swap.userPrincipalId, addr.address),
                        gt(swap.transactionTimestamp, startDate.toISOString())
                    ))
                    .then(res => res[0]?.count || 0);

                const hasSwapOnMainnet = swapCount > 0;

                const referredSwapTransactions = referredUsers.length > 0 ? await db.select()
                    .from(swap)
                    .where(and(
                        inArray(swap.userPrincipalId, referredUsers),
                        gt(swap.transactionTimestamp, startDate.toISOString()),
                        eq(swap.transactionType, 'Swap')
                    ))
                    .then(res => res.length) : 0;

                const liquidityHubSwapCount = await db.select({ count: count() })
                    .from(teLiquidityHub)
                    .where(and(
                        eq(teLiquidityHub.tickInAddress, addr.address),
                        gt(teLiquidityHub.transactionTimestamp, startDate.toISOString())
                    ))
                    .then(res => res[0]?.count || 0);

                const hasSwapOnICPLiquidityHub = liquidityHubSwapCount > 0;

                return {
                    address: addr.address,
                    total_points: (hasSwapOnMainnet === true ? 10 : 0) + (hasSwapOnICPTestnet === true ? 10 : 0) + (hasSwapOnICPLiquidityHub === true ? 10 : 0) + (referredTeliquidityHubTransactions * 5) + (referredTestnetSwapCount * 5) + (referredSwapTransactions * 20),
                    position: index + 1,
                    referred_users: referredUsers,
                    referral_points: [{
                        total_no_of_liquidity_hub_transaction_by_referral_on_testnet: referredTeliquidityHubTransactions,
                        total_no_of_swap_by_referral_on_testnet: referredTestnetSwapCount,
                        total_no_of_swap_by_referral_on_mainnet: referredSwapTransactions
                    }],
                    tasks_completed: {
                        swap_on_mainnet: hasSwapOnMainnet,
                        swap_on_internet_computer_testnet: hasSwapOnICPTestnet,
                        liquidity_hub_tx_on_internet_computer_testnet: hasSwapOnICPLiquidityHub
                    }
                };
            }))).sort((a, b) => b.total_points - a.total_points)
                .map((item, index) => ({ ...item, position: index + 1 }))
        };

        await fs.writeFile(jsonFilePath, JSON.stringify(newData, null, 2));
        console.log('Referral data updated with latest addresses');

    } catch (error) {
        console.error('Error in calculateReferral:', error);
    }
}

async function fetchData() {
    try {
        const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
        const parsedData: { bit10_june_2025_referral: Bit10ReferralType[] } = JSON.parse(fileContent);
        if (parsedData.bit10_june_2025_referral.length > 0) {
            latestData = parsedData;
            cache.set('bit10_june_2025_referral_data', parsedData.bit10_june_2025_referral);
            console.log('Referral Current Data refreshed at:', new Date().toISOString());
        }
    } catch (error) {
        console.error('Error reading JSON file for Referral:', error);
    }
}

// cron.schedule('*/30 * * * * *', async () => { // 30 sec
cron.schedule('*/5 * * * *', async () => { // 5 min
    try {
        await calculateReferral();
        await fetchData();
    } catch (error) {
        console.error('Error in scheduled tasks:', error);
    }
});

calculateReferral().catch(error => console.error('Error in initial calculateReferral data fetch:', error));
fetchData().catch(error => console.error('Error in initial data fetch:', error));

export const handleBit10Referral = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'GET') {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Method Not Allowed' }));
        return;
    }

    try {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const address = url.searchParams.get('address');

        if (address) {
            const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
            const jsonData: Bit10ReferralType = JSON.parse(fileContent);

            const matchingData = jsonData.bit10_june_2025_referral.find(entry =>
                entry.address.toLowerCase() === address.toLowerCase()
            );

            if (matchingData) {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(matchingData));
            } else {
                response.writeHead(404, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Address not found' }));
            }
        } else {
            const cachedData = cache.get<Bit10ReferralType>('bit10_june_2025_referral_data') || latestData;

            if (cachedData) {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(cachedData));
            } else {
                response.writeHead(404, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'No data available' }));
            }
        }
    } catch (error) {
        console.error('Error handling referral request:', error);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Internal server error' }));
    }
};
