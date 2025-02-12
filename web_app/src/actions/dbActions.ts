/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { db } from '@/server/db'
import { mbUsers, userSignups, mbPrincipalIdWhitelist, swap, teSwap } from '@/server/db/schema'
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

export const addNewUser = async ({ principalId }: { principalId: string }) => {
    try {
        const uuid = crypto.randomBytes(16).toString('hex');
        const generateNewUserId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        const newUserId = 'user_' + generateNewUserId;

        const existingUsers = await db.select({ user_address: mbUsers.userPrincipalId }).from(mbUsers).where(eq(mbUsers.userPrincipalId, principalId));

        if (existingUsers && existingUsers.length > 0) {
            return 'User already exists';
        } else {
            await db.insert(mbUsers).values({
                userId: newUserId,
                userPrincipalId: principalId,
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {
        return 'Error adding new user';
    }
};

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(userSignups).values({ email });
        return newSignUpUser;
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const whitelistedPrincipalIds = async () => {
    try {
        const data = await db.select().from(mbPrincipalIdWhitelist)
        return data;
    } catch (error) {
        return 'Error fetching whitelisted users';
    }
}

export const newTokenSwap = async ({ newTokenSwapId, principalId, tickInName, tickInAmount, tickInUSDAmount, tickInTxBlock, tickOutName, tickOutAmount, tickOutTxBlock, transactionType, network, transactionTimestamp }: NewTokenSwap) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

        await db.insert(swap).values({
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
            tokenSwapId: swap.tokenSwapId,
            transactionType: swap.transactionType,
            tickInAmount: swap.tickInAmount,
            tickInName: swap.tickInName,
            tickOutAmount: swap.tickOutAmount,
            tickOutName: swap.tickOutName,
            tokenBoughtAt: swap.transactionTimestamp
        })
            .from(swap)
            .where(eq(swap.userPrincipalId, paymentAddress))
            .orderBy(desc(swap.transactionTimestamp));
        return data;
    } catch (error) {
        return 'Error fetching user recent activity';
    }
}

export const transactionDetails = async ({ transactionId }: { transactionId: string }) => {
    try {
        const data = await db.select({
            transactionId: swap.tokenSwapId,
            transactionType: swap.transactionType,
            transactionTime: swap.transactionTimestamp,
            transactionFromAccount: swap.userPrincipalId,
            transactionTickInAmount: swap.tickInAmount,
            transactionTickInName: swap.tickInName,
            transactionTickOutAmount: swap.tickOutAmount,
            transactionTickOutName: swap.tickOutName,
        })
            .from(swap)
            .where(eq(swap.tokenSwapId, transactionId));
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