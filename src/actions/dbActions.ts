/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { db } from '@/server/db'
import { userSignups, teUsers, teSwap, teRequestBtc } from '@/server/db/schema'

import crypto from 'crypto'
import { eq, desc } from 'drizzle-orm'

interface NewTokenSwap {
    newTokenSwapId: string;
    principalId: string;
    tickInName: string;
    tickInAmount: string;
    tickInUSDAmount: string;
    tickInTxBlock: string;
    tickOutName: string;
    tickOutAmount: string;
    tickOutTxBlock: string;
    transactionType: 'Swap' | 'Reverse Swap';
    network: 'ICP';
    transactionTimestamp: string;
}

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(userSignups).values({ email });
        return newSignUpUser;
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const userSignUps = async () => {
    try {
        const data = await db.select()
            .from(userSignups)
        return data;
    } catch (error) {
        return 'Error fetching user signups';
    }
}

export const addNewUser = async ({ principalId }: { principalId: string }) => {
    try {
        const uuid = crypto.randomBytes(16).toString('hex');
        const generateNewUserId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        const newUserId = 'user_' + generateNewUserId;

        const existingUsers = await db.select({ user_address: teUsers.userPrincipalId }).from(teUsers).where(eq(teUsers.userPrincipalId, principalId));

        if (existingUsers && existingUsers.length > 0) {
            return 'User already exists';
        } else {
            await db.insert(teUsers).values({
                userId: newUserId,
                userPrincipalId: principalId,
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {
        return 'Error adding new user';
    }
};

export const newTokenSwap = async ({ newTokenSwapId, principalId, tickInName, tickInAmount, tickInUSDAmount, tickInTxBlock, tickOutName, tickOutAmount, tickOutTxBlock, transactionType, network, transactionTimestamp }: NewTokenSwap) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

        await db.insert(teSwap).values({
            tokenSwapId: newTokenSwapId,
            userPrincipalId: principalId,
            tickInName: tickInName,
            tickInAmount: tickInAmount,
            tickInUsdAmount: tickInUSDAmount,
            tickInTxBlock: tickInTxBlock,
            tickOutName: tickOutName,
            tickOutAmount: tickOutAmount,
            tickOutTxBlock: tickOutTxBlock,
            transactionType: transactionType,
            transactionStatus: 'Unconfirmed', // Confirmed || Failed
            transactionTimestamp: transactionTimestamp,
            network: network
        });

        return 'Token swap successfully'
    } catch (error) {
        return 'Error swaping tokens';
    }
};

export const userRecentActivity = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            tokenSwapId: teSwap.tokenSwapId,
            transactionType: teSwap.transactionType,
            tickInAmount: teSwap.tickInAmount,
            tickInName: teSwap.tickInName,
            tickOutAmount: teSwap.tickOutAmount,
            tickOutName: teSwap.tickOutName,
            tokenBoughtAt: teSwap.transactionTimestamp
        })
            .from(teSwap)
            .where(eq(teSwap.userPrincipalId, paymentAddress))
            .orderBy(desc(teSwap.transactionTimestamp));
        return data;
    } catch (error) {
        return 'Error fetching user recent activity';
    }
}

export const requestBIT10BTC = async ({ email, principalId }: { email: string, principalId: string }) => {
    try {
        await db.insert(teRequestBtc).values({
            email: email,
            userPrincipalId: principalId
        });
        return 'Request added successfully';
    } catch (error) {
        return 'Error adding request';
    }
};

export const transactionDetails = async ({ transactionId }: { transactionId: string }) => {
    try {
        const data = await db.select({
            transactionId: teSwap.tokenSwapId,
            transactionType: teSwap.transactionType,
            transactionTime: teSwap.transactionTimestamp,
            transactionFromAccount: teSwap.userPrincipalId,
            transactionTickInAmount: teSwap.tickInAmount,
            transactionTickInName: teSwap.tickInName,
            transactionTickOutAmount: teSwap.tickOutAmount,
            transactionTickOutName: teSwap.tickOutName,
        })
            .from(teSwap)
            .where(eq(teSwap.tokenSwapId, transactionId));
        return data;
    } catch (error) {
        return 'Error fetching transaction details';
    }
}

export const testnetRevenue = async () => {
    try {
        const data = await db.select({
            tokenPurchaseAmount: teSwap.tickInAmount,
            tokenBoughtAt: teSwap.transactionTimestamp
        })
            .from(teSwap)
            .orderBy(teSwap.transactionTimestamp);
        return data;
    } catch (error) {
        return 'Error fetching testnet revenue';
    }
}
