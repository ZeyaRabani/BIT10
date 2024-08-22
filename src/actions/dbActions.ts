"use server"

import { db } from '@/db/db'
import { user_signups, te_users, te_token_swap, te_request_btc } from '@/db/schema'
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
}

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(user_signups).values({ email });
        return newSignUpUser;
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const userSignUps = async () => {
    try {
        const data = await db.select()
            .from(user_signups)
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

        const existingUsers = await db.select({ user_address: te_users.user_principal_id }).from(te_users).where(eq(te_users.user_principal_id, principalId));

        if (existingUsers && existingUsers.length > 0) {
            return 'User already exists';
        } else {
            await db.insert(te_users).values({
                user_id: newUserId,
                user_principal_id: principalId,
                created_at: new Date().toISOString()
            });
        }
    } catch (error) {
        return 'Error adding new user';
    }
};

export const newTokenSwap = async ({ newTokenSwapId, principalId, paymentAmount, paymentName, paymentAmountUSD, bit10tokenQuantity, bit10tokenName }: NewTokenSwap) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

        await db.insert(te_token_swap).values({
            token_swap_id: newTokenSwapId,
            user_principal_id: principalId,
            token_purchase_amount: paymentAmount,
            token_purchase_name: paymentName,
            token_purchase_usd_amount: paymentAmountUSD,
            bit10_token_quantity: bit10tokenQuantity,
            bit10_token_name: bit10tokenName,
            token_transaction_status: 'Unconfirmed', // Confirmed || Failed
            token_bought_at: new Date().toISOString()
        });

        return 'Token swap added successfully'
    } catch (error) {
        return 'Error swaping tokens';
    }
};

export const userRecentActivity = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            token_swap_id: te_token_swap.token_swap_id,
            token_purchase_amount: te_token_swap.token_purchase_amount,
            token_purchase_name: te_token_swap.token_purchase_name,
            bit10_token_quantity: te_token_swap.bit10_token_quantity,
            bit10_token_name: te_token_swap.bit10_token_name,
            token_transaction_status: te_token_swap.token_transaction_status,
            token_bought_at: te_token_swap.token_bought_at,
        })
            .from(te_token_swap)
            .where(eq(te_token_swap.user_principal_id, paymentAddress)).orderBy(desc(te_token_swap.token_bought_at));
        return data;
    } catch (error) {
        return 'Error fetching user recent activity';
    }
}

export const requestBIT10BTC = async ({ email, principalId }: { email: string, principalId: string }) => {
    try {
        await db.insert(te_request_btc).values({
            email: email,
            user_principal_id: principalId
        });
        return 'Request added successfully';
    } catch (error) {
        return 'Error adding request';
    }
};

export const swapDetails = async ({ swapId }: { swapId: string }) => {
    try {
        const data = await db.select({
            token_swap_id: te_token_swap.token_swap_id,
            user_principal_id: te_token_swap.user_principal_id,
            token_purchase_amount: te_token_swap.token_purchase_amount,
            token_purchase_name: te_token_swap.token_purchase_name,
            token_transaction_status: te_token_swap.token_transaction_status,
            token_bought_at: te_token_swap.token_bought_at,
        })
            .from(te_token_swap)
            .where(eq(te_token_swap.token_swap_id, swapId));
        return data;
    } catch (error) {
        return 'Error fetching swap details';
    }
}
