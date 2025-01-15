/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { db } from '@/server/db'
import { mbUsers, userSignups, mbPrincipalIdWhitelist, mbTokenSwap } from '@/server/db/schema'
import crypto from 'crypto'
import { eq, desc } from 'drizzle-orm'

interface NewTokenSwap {
    newTokenSwapId: string;
    principalId: string;
    paymentAmount: string;
    paymentName: string;
    paymentAmountUSD: string;
    bit10tokenQuantity: string;
    bit10tokenName: string;
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

export const newTokenSwap = async ({ newTokenSwapId, principalId, paymentAmount, paymentName, paymentAmountUSD, bit10tokenQuantity, bit10tokenName, transactionIndex }: NewTokenSwap) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

        await db.insert(mbTokenSwap).values({
            tokenSwapId: newTokenSwapId,
            userPrincipalId: principalId,
            tokenPurchaseAmount: paymentAmount,
            tokenPurchaseName: paymentName,
            tokenPurchaseUsdAmount: paymentAmountUSD,
            bit10TokenQuantity: bit10tokenQuantity,
            bit10TokenName: bit10tokenName,
            tokenTransactionStatus: 'Unconfirmed', // Confirmed || Failed
            tokenBoughtAt: new Date().toISOString(),
            transactionIndex: transactionIndex
        });

        return 'Token swap added successfully'
    } catch (error) {
        return 'Error swaping tokens';
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