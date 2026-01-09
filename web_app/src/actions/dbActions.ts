"use server";

import { db } from '@/server/db';
// import { mbUsers, userSignups, mbPrincipalIdWhitelist, swap, teSwap, dex } from '@/server/db/schema';
import { userSignups, mbPrincipalIdWhitelist } from '@/server/db/schema';
// import crypto from 'crypto';
// import { eq, desc, and } from 'drizzle-orm';

// interface NewTokenBuy {
//     newTokenSwapId: string;
//     principalId: string;
//     tickInName: string;
//     tickInAmount: string;
//     tickInUSDAmount: string;
//     tickInTxBlock: string;
//     tickOutName: string;
//     tickOutAmount: string;
//     tickOutTxBlock: string;
//     transactionType: 'Swap' | 'Reverse Swap';
//     network: 'ICP';
//     transactionTimestamp: string;
// }

// interface NewDEXSwap {
//     swapId: string;
//     poolId: string;
//     amountIn: string;
//     amountOut: string;
//     sourceChain: string;
//     destinationChain: string;
//     swapType: string;
//     tickInWalletAddress: string;
//     tickOutWalletAddress: string;
//     tokenInAddress: string;
//     tokenOutAddress: string;
//     slippage: string;
//     status: string;
//     txHashIn: string;
//     txHashOut: string;
//     timestamp: number;
// }

// export const addNewUser = async ({ principalId }: { principalId: string }) => {
//     try {
//         const uuid = crypto.randomBytes(16).toString('hex');
//         const generateNewUserId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
//         const newUserId = 'user_' + generateNewUserId;

//         const existingUsers = await db.select({ user_address: mbUsers.userPrincipalId }).from(mbUsers).where(eq(mbUsers.userPrincipalId, principalId));

//         if (existingUsers && existingUsers.length > 0) {
//             return 'User already exists';
//         } else {
//             await db.insert(mbUsers).values({
//                 userId: newUserId,
//                 userPrincipalId: principalId,
//                 createdAt: new Date().toISOString()
//             });
//         }
//     } catch (error) {
//         return 'Error adding new user';
//     }
// };

export const addUserSignUps = async ({ email }: { email: string }) => {
    try {
        const newSignUpUser = await db.insert(userSignups).values({ email });
        return newSignUpUser;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error adding user to signups';
    }
};

export const addWhitelistedAddress = async ({ address }: { address: string }) => {
    try {
        await db.insert(mbPrincipalIdWhitelist).values({ userPrincipalId: address });
        return 'Wallet address added successfully';
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return 'Error adding whitelisted users';
    }
}

// export const whitelistedAddress = async () => {
//     try {
//         const data = await db.select().from(mbPrincipalIdWhitelist)
//         return data;
//     } catch (error) {
//         return 'Error fetching whitelisted users';
//     }
// }

// export const newTokenSwap = async ({ newTokenSwapId, principalId, tickInName, tickInAmount, tickInUSDAmount, tickInTxBlock, tickOutName, tickOutAmount, tickOutTxBlock, transactionType, network, transactionTimestamp }: NewTokenBuy) => {
//     try {
//         // const uuid = crypto.randomBytes(16).toString('hex');
//         // const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
//         // const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

//         await db.insert(swap).values({
//             tokenSwapId: newTokenSwapId,
//             userPrincipalId: principalId,
//             tickInName: tickInName,
//             tickInAmount: tickInAmount,
//             tickInUsdAmount: tickInUSDAmount,
//             tickInTxBlock: tickInTxBlock,
//             tickOutName: tickOutName,
//             tickOutAmount: tickOutAmount,
//             tickOutTxBlock: tickOutTxBlock,
//             transactionType: transactionType,
//             transactionStatus: 'Unconfirmed', // Confirmed || Failed
//             transactionTimestamp: transactionTimestamp,
//             network: network
//         });

//         return 'Token swap successfully'
//     } catch (error) {
//         return 'Error swaping tokens';
//     }
// };

// export const newDEXSwap = async ({ swapId, poolId, amountIn, amountOut, sourceChain, destinationChain, swapType, tickInWalletAddress, tickOutWalletAddress, tokenInAddress, tokenOutAddress, slippage, status, txHashIn, txHashOut, timestamp }: NewDEXSwap) => {
//     try {
//         await db.insert(dex).values({
//             swapId: swapId,
//             poolId: poolId,
//             amountIn: amountIn,
//             amountOut: amountOut,
//             sourceChain: sourceChain,
//             destinationChain: destinationChain,
//             swapType: swapType,
//             tickInWalletAddress: tickInWalletAddress,
//             tickOutWalletAddress: tickOutWalletAddress,
//             tokenInAddress: tokenInAddress,
//             tokenOutAddress: tokenOutAddress,
//             slippage: slippage,
//             status: status,
//             txHashIn: txHashIn,
//             txHashOut: txHashOut,
//             timestamp: timestamp
//         });

//         return 'DEX Swap was successful';
//     } catch (error) {
//         return 'Error swapping tokens';
//     }
// };

// export const userRecentBIT10BuyActivity = async ({ paymentAddress, chain }: { paymentAddress: string, chain: string }) => {
//     try {
//         const data = await db.select({
//             tokenSwapId: swap.tokenSwapId,
//             transactionType: swap.transactionType,
//             tickInAmount: swap.tickInAmount,
//             tickInName: swap.tickInName,
//             tickOutAmount: swap.tickOutAmount,
//             tickOutName: swap.tickOutName,
//             tickOutTxBlock: swap.tickOutTxBlock,
//             tokenBoughtAt: swap.transactionTimestamp,
//             network: swap.network
//         })
//             .from(swap)
//             .where(and(
//                 eq(swap.userPrincipalId, paymentAddress),
//                 eq(swap.network, chain)
//             ))
//             .orderBy(desc(swap.transactionTimestamp));
//         return data;
//     } catch (error) {
//         return 'Error fetching user recent activity';
//     }
// }

// export const userRecentDEXSwapActivity = async ({ source_chain, walletAddress }: { source_chain: string, walletAddress: string }) => {
//     try {
//         const data = await db.select({
//             swapId: dex.swapId,
//             status: dex.status,
//             tickInWalletAddress: dex.tickInWalletAddress,
//             amountIn: dex.amountIn,
//             amountOut: dex.amountOut,
//             tokenInAddress: dex.tokenInAddress,
//             tokenOutAddress: dex.tokenOutAddress,
//             sourceChain: dex.sourceChain,
//             destinationChain: dex.destinationChain,
//             txHashIn: dex.txHashIn,
//             txHashOut: dex.txHashOut,
//             timestamp: dex.timestamp
//         })
//             .from(dex)
//             .where(and(
//                 eq(dex.tickInWalletAddress, walletAddress.toLowerCase()),
//                 eq(dex.sourceChain, source_chain)
//             ))
//             .orderBy(desc(dex.timestamp));
//         return data;
//     } catch (error) {
//         return 'Error fetching user recent DEX activity';
//     }
// }

// export const transactionDetails = async ({ transactionId }: { transactionId: string }) => {
//     try {
//         const data = await db.select({
//             transactionId: swap.tokenSwapId,
//             transactionType: swap.transactionType,
//             transactionTime: swap.transactionTimestamp,
//             transactionFromAccount: swap.userPrincipalId,
//             transactionTickInAmount: swap.tickInAmount,
//             transactionTickInName: swap.tickInName,
//             transactionTickOutAmount: swap.tickOutAmount,
//             transactionTickOutName: swap.tickOutName,
//         })
//             .from(swap)
//             .where(eq(swap.tokenSwapId, transactionId));
//         return data;
//     } catch (error) {
//         return 'Error fetching transaction details';
//     }
// }

// export const testnetRevenue = async () => {
//     try {
//         const data = await db.select({
//             // tokenPurchaseAmount: teSwap.tickInAmount,
//             tokenPurchaseAmount: teSwap.tickInUsdAmount,
//             tokenBoughtAt: teSwap.transactionTimestamp
//         })
//             .from(teSwap)
//             .orderBy(teSwap.transactionTimestamp);
//         return data;
//     } catch (error) {
//         return 'Error fetching testnet revenue';
//     }
// }
