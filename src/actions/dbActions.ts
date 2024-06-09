"use server"

import { db } from '@/db/db'
import { user_signups, users, token_swap } from '@/db/schema'
import crypto from 'crypto'
import { eq, desc } from 'drizzle-orm'

interface NewUserType {
    paymentAddress: string;
    ordinalsAddress: string;
    stacksAddress: string;
}

interface NewTokenSwap {
    paymentAddress: string;
    ordinalsAddress: string;
    stacksAddress: string;
    paymentAmount: string;
    paymentName: string;
    paymentAmountUSD: string;
    bit10tokenAmount: string;
    bit10tokenName: string;
    transactionSignature: string;
}

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(user_signups).values({ email });
        return newSignUpUser;
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const addNewUser = async ({ paymentAddress, ordinalsAddress, stacksAddress }: NewUserType) => {
    try {
        const uuid = crypto.randomBytes(16).toString('hex');
        const generateNewUserId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        const newUserId = 'user_' + generateNewUserId;

        const existingUsers = await db.select({ user_address: users.user_payment_address }).from(users).where(eq(users.user_payment_address, paymentAddress));

        if (existingUsers && existingUsers.length > 0) {
            return 'User already exists';
        } else {
            await db.insert(users).values({
                user_id: newUserId,
                user_payment_address: paymentAddress,
                user_ordinals_address: ordinalsAddress,
                user_stacks_address: stacksAddress,
                created_at: new Date().toISOString()
            });
        }
    } catch (error) {
        return 'Error adding new user';
    }
};

export const newTokenSwap = async ({ paymentAddress, ordinalsAddress, stacksAddress, paymentAmount, paymentName, paymentAmountUSD, bit10tokenAmount, bit10tokenName, transactionSignature }: NewTokenSwap) => {
    try {
        const uuid = crypto.randomBytes(16).toString('hex');
        const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

        await db.insert(token_swap).values({
            token_swap_id: newTokenSwapId,
            user_payment_address: paymentAddress,
            user_ordinals_address: ordinalsAddress,
            user_stacks_address: stacksAddress,
            token_purchase_amount: paymentAmount,
            token_purchase_name: paymentName,
            token_purchase_usd_amount: paymentAmountUSD,
            bit10_token_quantity: bit10tokenAmount,
            bit10_token_name: bit10tokenName,
            token_transaction_signature: transactionSignature,
            token_bought_at: new Date().toISOString()
        });

        return 'Token swap added successfully'
    } catch (error) {
        return 'Error swaping tokens';
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

export const userPortfolioDetails = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            token_purchase_amount: token_swap.token_purchase_amount,
            token_purchase_name: token_swap.token_purchase_name,
            token_purchase_usd_amount: token_swap.token_purchase_usd_amount,
            bit10_token_quantity: token_swap.bit10_token_quantity,
            bit10_token_name: token_swap.bit10_token_name,
        })
            .from(token_swap)
            .where(eq(token_swap.user_payment_address, paymentAddress)).orderBy(token_swap.bit10_token_name);
        return data;
    } catch (error) {
        return 'Error fetching user portfolio details';
    }
}

export const userRecentActivity = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            token_swap_id: token_swap.token_swap_id,
            token_purchase_amount: token_swap.token_purchase_amount,
            token_purchase_name: token_swap.token_purchase_name,
            bit10_token_quantity: token_swap.bit10_token_quantity,
            bit10_token_name: token_swap.bit10_token_name,
            token_transaction_signature: token_swap.token_transaction_signature,
            token_bought_at: token_swap.token_bought_at,
        })
            .from(token_swap)
            .where(eq(token_swap.user_payment_address, paymentAddress)).orderBy(desc(token_swap.token_bought_at));
        return data;
    } catch (error) {
        return 'Error fetching user recent activity';
    }
}
