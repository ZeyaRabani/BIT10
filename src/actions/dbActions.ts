"use server"

import { db } from '@/db/db'
import { user_signups, te_users, te_swap, te_request_btc } from '@/db/schema'
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

export const newTokenSwap = async ({ newTokenSwapId, principalId, tickInName, tickInAmount, tickInUSDAmount, tickInTxBlock, tickOutName, tickOutAmount, tickOutTxBlock, transactionType, network, transactionTimestamp }: NewTokenSwap) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

        await db.insert(te_swap).values({
            token_swap_id: newTokenSwapId,
            user_principal_id: principalId,
            tick_in_name: tickInName,
            tick_in_amount: tickInAmount,
            tick_in_usd_amount: tickInUSDAmount,
            tick_in_tx_block: tickInTxBlock,
            tick_out_name: tickOutName,
            tick_out_amount: tickOutAmount,
            tick_out_tx_block: tickOutTxBlock,
            transaction_type: transactionType,
            transaction_status: 'Unconfirmed', // Confirmed || Failed
            transaction_timestamp: transactionTimestamp,
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
            tokenSwapId: te_swap.token_swap_id,
            transactionType: te_swap.transaction_type,
            tickInAmount: te_swap.tick_in_amount,
            tickInName: te_swap.tick_in_name,
            tickOutAmount: te_swap.tick_out_amount,
            tickOutName: te_swap.tick_out_name,
            tokenBoughtAt: te_swap.transaction_timestamp
        })
            .from(te_swap)
            .where(eq(te_swap.user_principal_id, paymentAddress))
            .orderBy(desc(te_swap.transaction_timestamp));
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

export const transactionDetails = async ({ transactionId }: { transactionId: string }) => {
    try {
        const data = await db.select({
            transactionId: te_swap.token_swap_id,
            transactionType: te_swap.transaction_type,
            transactionTime: te_swap.transaction_timestamp,
            transactionFromAccount: te_swap.user_principal_id,
            transactionTickInAmount: te_swap.tick_in_amount,
            transactionTickInName: te_swap.tick_in_name,
            transactionTickOutAmount: te_swap.tick_out_amount,
            transactionTickOutName: te_swap.tick_out_name,
        })
            .from(te_swap)
            .where(eq(te_swap.token_swap_id, transactionId));
        return data;
    } catch (error) {
        return 'Error fetching transaction details';
    }
}
