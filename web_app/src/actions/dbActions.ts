/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { db } from '@/server/db'
import { mbUsers, userSignups, mbPrincipalIdWhitelist, mbTokenSwap, swap, mbTokenMint, teTokenSwap } from '@/server/db/schema'
import crypto from 'crypto'
import { eq, desc } from 'drizzle-orm'

// interface NewTokenSwap {
//     newTokenSwapId: string;
//     principalId: string;
//     paymentAmount: string;
//     paymentName: string;
//     paymentAmountUSD: string;
//     bit10tokenQuantity: string;
//     bit10tokenName: string;
//     transactionIndex: string;
// }

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

interface NewTokenMint {
    newTokenMintId: string;
    principalId: string;
    mintAmount: string;
    mintName: string;
    mintAmountUSD: string;
    recieveAmount: string;
    recieveName: string;
    transactionIndex: string;
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

export const newTokenMint = async ({ newTokenMintId, principalId, mintAmount, mintName, mintAmountUSD, recieveAmount, recieveName, transactionIndex }: NewTokenMint) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewTokenMintId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenMintId = 'mint_' + generateNewTokenMintId;

        await db.insert(mbTokenMint).values({
            tokenMintId: newTokenMintId,
            userPrincipalId: principalId,
            mintingAmount: mintAmount,
            mintingTokenName: mintName,
            mintingUsdAmount: mintAmountUSD,
            recievingTokenAmount: recieveAmount,
            recievingTokenName: recieveName,
            mintingStatus: 'Unconfirmed', // Confirmed || Failed
            tokenMintAt: new Date().toISOString(),
            transactionIndex: transactionIndex
        });

        return 'Token mint added successfully'
    } catch (error) {
        return 'Error minting tokens';
    }
};

export const userRecentActivity = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            tokenSwapId: mbTokenSwap.tokenSwapId,
            tokenPurchaseAmount: mbTokenSwap.tokenPurchaseAmount,
            tokenPurchaseName: mbTokenSwap.tokenPurchaseName,
            bit10TokenQuantity: mbTokenSwap.bit10TokenQuantity,
            bit10TokenName: mbTokenSwap.bit10TokenName,
            tokenTransactionStatus: mbTokenSwap.tokenTransactionStatus,
            tokenBoughtAt: mbTokenSwap.tokenBoughtAt,
            transactionIndex: mbTokenSwap.transactionIndex
        })
            .from(mbTokenSwap)
            .where(eq(mbTokenSwap.userPrincipalId, paymentAddress))
            .orderBy(desc(mbTokenSwap.tokenBoughtAt));
        return data;
    } catch (error) {
        return 'Error fetching user recent activity';
    }
}

export const testnetRevenue = async () => {
    try {
        const data = await db.select({
            tokenPurchaseAmount: teTokenSwap.tokenPurchaseAmount,
            tokenBoughtAt: teTokenSwap.tokenBoughtAt
        })
            .from(teTokenSwap)
            .orderBy(teTokenSwap.tokenBoughtAt);
        return data;
    } catch (error) {
        return 'Error fetching testnet revenue';
    }
}