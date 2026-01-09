import { createICPActor, getCustomConnection } from './solana.client';
import { toast } from 'sonner';
import { idlFactory as exchangeIDLFactory } from '@/lib/canisters/bit10_exchange.did';
import { idlFactory as rewardsIDLFactory } from '@/lib/canisters/rewards.did';
import { BIT10_EXCHANGE_CANISTER_ID, BIT10_REWARDS_CANISTER_ID } from './solana.constants';
import { type TransactionResponse, type SwapResponse, type CashbackResponse } from './solana.types';
import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';

const decodeHexData = (hex: string): string => {
    if (hex.startsWith('0x')) {
        hex = hex.substring(2);
    }

    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buyBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, walletAddress, wallet }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string, wallet: any }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
            toast.error('Please connect your wallet first');
            return null;
        }

        const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');
        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);
        const TOKEN_MINT = new PublicKey(tokenOutAddress);
        const connection = getCustomConnection();
        const mintInfo = await connection.getAccountInfo(TOKEN_MINT);

        if (!mintInfo) {
            toast.dismiss();
            toast.error('Token mint does not exist on this network');
            return null;
        }

        const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const fromPubkey = wallet.publicKey;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const ata = await getAssociatedTokenAddress(TOKEN_MINT, fromPubkey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
        const accountInfo = await connection.getAccountInfo(ata);
        const ataExists = accountInfo !== null;

        if (!ataExists) {
            toast.loading('Creating Associated Token Account');

            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const createATAInstruction = createAssociatedTokenAccountInstruction(fromPubkey, ata, fromPubkey, TOKEN_MINT, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
                const { blockhash } = await connection.getLatestBlockhash('finalized');

                const messageV0 = new TransactionMessage({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    payerKey: fromPubkey,
                    recentBlockhash: blockhash,
                    instructions: [
                        ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
                        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
                        createATAInstruction
                    ],
                }).compileToV0Message();

                const ataTransaction = new VersionedTransaction(messageV0);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const ataSignature = await wallet.sendTransaction(ataTransaction, connection, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });

                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                await connection.confirmTransaction(ataSignature, 'confirmed');

                toast.dismiss();
                toast.success('Associated Token Account created successfully!');
            } catch (ataError) {
                toast.dismiss();
                toast.error('Failed to create Associated Token Account');
                throw ataError;
            }
        } else {
            toast.dismiss();
        }

        if (actor.solana_create_transaction && actor.solana_buy) {
            const create_transaction = await actor.solana_create_transaction({
                user_wallet_address: walletAddress,
                token_in_address: tokenInAddress,
                token_in_amount: tokenInAmount,
                token_out_address: tokenOutAddress,
                token_out_amount: tokenOutAmount
            }) as TransactionResponse;

            const toPubkey = new PublicKey(create_transaction.to);
            const amount = Number(create_transaction.value);
            const memoData = decodeHexData(create_transaction.data);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const balance = await connection.getBalance(fromPubkey);

            if (balance < amount) {
                toast.dismiss();
                toast.error(`Insufficient balance. Have: ${balance / 1e9} SOL, Need: ${amount / 1e9} SOL`);
                return null;
            }

            const instructions = [
                ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
                new TransactionInstruction({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    keys: [{ pubkey: fromPubkey, isSigner: true, isWritable: false }],
                    programId: MEMO_PROGRAM_ID,
                    data: Buffer.from(memoData, 'utf-8'),
                }),
                SystemProgram.transfer({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    fromPubkey,
                    toPubkey,
                    lamports: amount,
                })
            ];

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

            const messageV0 = new TransactionMessage({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                payerKey: fromPubkey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            const transaction = new VersionedTransaction(messageV0);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const signature = await wallet.sendTransaction(transaction, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

            if (confirmation.value.err) {
                toast.dismiss();
                toast.error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
                return null;
            }

            toast.dismiss();
            toast.info('Transaction sent! Waiting for confirmation...');

            // Wait for 10 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const transfer = await actor.solana_buy(signature) as SwapResponse;

            if ('Ok' in transfer) {
                toast.success('Token swap was successful!');
            } else if (transfer.Err) {
                const errorMessage = transfer.Err;
                if (errorMessage.includes('Insufficient balance')) {
                    toast.error('Insufficient funds');
                } else if (errorMessage.includes('less than available supply')) {
                    toast.error('The requested amount exceeds the available supply. Please enter a lower amount.');
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        } else {
            toast.error('An error occurred while processing your request. Please try again!');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
    }
};

// ToDo: Fix the error for sellBIT10Token
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sellBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, walletAddress, wallet }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string, wallet: any }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
            toast.error('Please connect your wallet first');
            return null;
        }

        const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');
        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);
        const TOKEN_MINT = new PublicKey(tokenOutAddress);
        const connection = getCustomConnection();
        const mintInfo = await connection.getAccountInfo(TOKEN_MINT);

        if (!mintInfo) {
            toast.dismiss();
            toast.error('Token mint does not exist on this network');
            return null;
        }

        const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        if (actor.solana_create_sell_transaction && actor.solana_sell) {
            const create_transaction = await actor.solana_create_sell_transaction({
                user_wallet_address: walletAddress,
                token_in_address: tokenInAddress,
                token_in_amount: tokenInAmount,
                token_out_address: tokenOutAddress,
                token_out_amount: tokenOutAmount
            }) as TransactionResponse;

            const fromPubkey = new PublicKey(create_transaction.from);
            const toPubkey = new PublicKey(create_transaction.to);
            const amount = Number(create_transaction.value);
            const fromATA = await getAssociatedTokenAddress(TOKEN_MINT, fromPubkey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
            const toATA = await getAssociatedTokenAddress(TOKEN_MINT, toPubkey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
            const mint = await getMint(connection, TOKEN_MINT, undefined, tokenProgramId);
            const decimals = mint.decimals;

            const instructions = [
                ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
            ];

            const transferInstruction = createTransferCheckedInstruction(fromATA, TOKEN_MINT, toATA, fromPubkey, amount, decimals, [], tokenProgramId);

            instructions.push(transferInstruction);

            const memoData = decodeHexData(create_transaction.data);

            const memoInstruction = new TransactionInstruction({
                keys: [
                    { pubkey: fromPubkey, isSigner: true, isWritable: false }
                ],
                programId: MEMO_PROGRAM_ID,
                data: Buffer.from(memoData, 'utf-8'),
            });

            instructions.push(memoInstruction);

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            const messageV0 = new TransactionMessage({ payerKey: fromPubkey, recentBlockhash: blockhash, instructions }).compileToV0Message();
            const transaction = new VersionedTransaction(messageV0);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const signature = await wallet.sendTransaction(transaction, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 5
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

            if (confirmation.value.err) {
                toast.dismiss();
                toast.error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
                return null;
            }

            toast.dismiss();
            toast.info('Transaction sent! Waiting for confirmation...');

            // Wait for 10 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const transfer = await actor.solana_sell(signature) as SwapResponse;

            if ('Ok' in transfer) {
                toast.success('Token swap was successful!');
            } else if (transfer.Err) {
                const errorMessage = transfer.Err;
                if (errorMessage.includes('Insufficient balance')) {
                    toast.error('Insufficient funds');
                } else if (errorMessage.includes('less than available supply')) {
                    toast.error('The requested amount exceeds the available supply. Please enter a lower amount.');
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        } else {
            toast.error('An error occurred while processing your request. Please try again!');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
    }
};

export const verifyTransaction = async ({ mode, trxHash }: { mode: string, trxHash: string }) => {
    try {
        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);

        if (actor.solana_buy && actor.solana_sell) {
            let transfer;
            if (mode === 'buy') {
                transfer = await actor.solana_buy(trxHash) as SwapResponse;
            } else {
                transfer = await actor.solana_sell(trxHash) as SwapResponse;
            }

            if ('Ok' in transfer) {
                toast.success('Token swap was successful!');
            } else if (transfer.Err) {
                const errorMessage = transfer.Err;
                if (errorMessage.includes('Insufficient balance')) {
                    toast.error('Insufficient funds');
                } else if (errorMessage.includes('less than available supply')) {
                    toast.error('The requested amount exceeds the available supply. Please enter a lower amount.');
                } else if (errorMessage.includes('Transaction already processed')) {
                    toast.error('This transaction has already been processed.');
                } else if (errorMessage.includes('Invalid transaction hash format')) {
                    toast.error('This transaction hash is not valid.');
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        } else {
            toast.error('An error occurred while processing your request. Please try again!');
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};

export const claimCashback = async ({ walletAddress }: { walletAddress: string }) => {
    try {
        const actor = createICPActor(rewardsIDLFactory, BIT10_REWARDS_CANISTER_ID);

        if (actor.claim_solana_reward) {
            const claimResult = await actor.claim_solana_reward(walletAddress) as CashbackResponse;

            if ('Ok' in claimResult) {
                toast.success('Cashback claimed successfully!');
            } else if (claimResult.Err) {
                const errorMessage = claimResult.Err;
                if (errorMessage.includes('Cashback claiming is not yet available')) {
                    toast.error('Cashback claiming is not available yet.');
                } else if (errorMessage.includes('Cashback claiming period has ended')) {
                    toast.error('The Cashback claiming period has ended.');
                } else if (errorMessage.includes('Cashback already claimed')) {
                    toast.error('Cashback has already been claimed!');
                } else if (errorMessage.includes('No purchase made after Cashback Round started') || errorMessage.includes('All recorded transactions occurred before the reward eligibility window.')) {
                    toast.error('No purchase made after the Cashback Round started.');
                } else if (errorMessage.includes('Net eligible token quantity is below 0.9 threshold required for reward.') || errorMessage.includes('Calculated cashback is zero or negative.')) {
                    toast.error('Not Eligible');
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        } else {
            toast.error('An error occurred while processing your request. Please try again!');
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
