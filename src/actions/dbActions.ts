/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { db } from '@/server/db'
import { userSignups, teUsers, teSwap, teRequestBtc, teLiquidityHub, referralJune2025, referralJune2025Tasks, teDexSwap } from '@/server/db/schema'

import crypto from 'crypto'
import { eq, desc, and } from 'drizzle-orm'

interface NewTokenBuy {
    newTokenBuyId: string;
    principalId: string;
    tickInName: string;
    tickInAmount: string;
    tickInUSDAmount: string;
    tickInTxBlock: string;
    tickOutName: string;
    tickOutAmount: string;
    tickOutTxBlock: string;
    transactionType: 'Swap' | 'Reverse Swap';
    network: 'ICP' | 'Solana Devnet';
    transactionTimestamp: string;
}

interface NewLiquidity {
    newLiquidationId: string;
    tickInAddress: string;
    tickInName: string;
    tickInAmount: number;
    duration: number;
    tickInNetwork: string;
    tickInTxBlock: string;
    liquidationType: 'Staked Liquidity';
    liquidationMode: string;
    transactionTimestamp: string;
}

interface NewDEXSwap {
    poolId: string;
    amountIn: string;
    amountOut: string;
    sourceChain: string;
    destinationChain: string;
    swapType: string;
    tickInWalletAddress: string;
    tickOutWalletAddress: string;
    tokenInAddress: string;
    tokenOutAddress: string;
    slippage: string;
    status: string;
    txHashIn: string;
    txHashOut: string;
    timestamp: number;
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

export const newTokenBuy = async ({ newTokenBuyId, principalId, tickInName, tickInAmount, tickInUSDAmount, tickInTxBlock, tickOutName, tickOutAmount, tickOutTxBlock, transactionType, network, transactionTimestamp }: NewTokenBuy) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generatenewTokenBuyId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newTokenBuyId = 'swap_' + generatenewTokenBuyId;

        await db.insert(teSwap).values({
            tokenSwapId: newTokenBuyId,
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

export const userRecentDEXSwapActivity = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            status: teDexSwap.status,
            tickInWalletAddress: teDexSwap.tickInWalletAddress,
            amountIn: teDexSwap.amountIn,
            amountOut: teDexSwap.amountOut,
            tokenInAddress: teDexSwap.tokenInAddress,
            tokenOutAddress: teDexSwap.tokenOutAddress,
            txHashIn: teDexSwap.txHashIn,
            txHashOut: teDexSwap.txHashOut,
            timestamp: teDexSwap.timestamp
        })
            .from(teDexSwap)
            .where(eq(teDexSwap.tickInWalletAddress, paymentAddress.toLowerCase()))
            .orderBy(desc(teDexSwap.timestamp));
        return data;
    } catch (error) {
        return 'Error fetching user recent DEX activity';
    }
}

export const userRecentBIT10BuyActivity = async ({ paymentAddress }: { paymentAddress: string }) => {
    try {
        const data = await db.select({
            tokenSwapId: teSwap.tokenSwapId,
            transactionType: teSwap.transactionType,
            tickInAmount: teSwap.tickInAmount,
            tickInName: teSwap.tickInName,
            tickOutAmount: teSwap.tickOutAmount,
            tickOutName: teSwap.tickOutName,
            tickOutTxBlock: teSwap.tickOutTxBlock,
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

export const newLiquidityProvider = async ({ newLiquidationId, tickInAddress, tickInName, tickInAmount, duration, tickInNetwork, tickInTxBlock, liquidationType, liquidationMode, transactionTimestamp }: NewLiquidity) => {
    try {
        // const uuid = crypto.randomBytes(16).toString('hex');
        // const generateNewLiquidityId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
        // const newLiquidityId = 'liquidity_' + generateNewLiquidityId;

        await db.insert(teLiquidityHub).values({
            liquidationId: newLiquidationId,
            tickInAddress: tickInAddress,
            tickInName: tickInName,
            tickInAmount: tickInAmount,
            duration: duration,
            tickInNetwork: tickInNetwork,
            tickInTxBlock: tickInTxBlock,
            liquidationType: liquidationType, // Staked Liquidity
            liquidationMode: liquidationMode, // Stake / Withdraw
            transactionStatus: 'Unconfirmed', // Confirmed || Failed
            transactionTimestamp: transactionTimestamp
        });

        return 'Staking successfully'
    } catch (error) {
        return 'Error staking tokens';
    }
};

export const userStakedLiquidityHistory = async ({ userAddress }: { userAddress: string }) => {
    try {
        const data = await db.select({
            liquidationId: teLiquidityHub.liquidationId,
            tickInName: teLiquidityHub.tickInName,
            tickInAmount: teLiquidityHub.tickInAmount,
            duration: teLiquidityHub.duration,
            liquidationMode: teLiquidityHub.liquidationMode,
            transactionTimestamp: teLiquidityHub.transactionTimestamp
        })
            .from(teLiquidityHub)
            .where(and(
                eq(teLiquidityHub.tickInAddress, userAddress),
                eq(teLiquidityHub.liquidationType, 'Staked Liquidity')
            ))
            .orderBy(desc(teLiquidityHub.transactionTimestamp));
        return data;
    } catch (error) {
        return 'Error fetching user staked liquidity history';
    }
}

export const newDEXSwap = async ({ poolId, amountIn, amountOut, sourceChain, destinationChain, swapType, tickInWalletAddress, tickOutWalletAddress, tokenInAddress, tokenOutAddress, slippage, status, txHashIn, txHashOut, timestamp }: NewDEXSwap) => {
    try {
        await db.insert(teDexSwap).values({
            poolId: poolId,
            amountIn: amountIn,
            amountOut: amountOut,
            sourceChain: sourceChain,
            destinationChain: destinationChain,
            swapType: swapType,
            tickInWalletAddress: tickInWalletAddress,
            tickOutWalletAddress: tickOutWalletAddress,
            tokenInAddress: tokenInAddress,
            tokenOutAddress: tokenOutAddress,
            slippage: slippage,
            status: status,
            txHashIn: txHashIn,
            txHashOut: txHashOut,
            timestamp: timestamp
        });

        return 'DEX Swap was successful'
    } catch (error) {
        return 'Error swapping tokens';
    }
};
