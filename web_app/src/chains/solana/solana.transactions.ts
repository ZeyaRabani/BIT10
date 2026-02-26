import { createICPActor, getCustomConnection } from './solana.client';
import { toast } from 'sonner';
import { idlFactory as exchangeIDLFactory } from '@/lib/canisters/bit10_exchange.did';
import { idlFactory as rewardsIDLFactory } from '@/lib/canisters/rewards.did';
import { BIT10_EXCHANGE_CANISTER_ID, BIT10_REWARDS_CANISTER_ID, delay } from './solana.constants';
import type { StepUpdateCallback, TransactionResponse, SwapResponse, CashbackResponse } from './solana.types';
import { PublicKey, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint, createBurnCheckedInstruction } from '@solana/spl-token';

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
export const buyBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, walletAddress, wallet, onStepUpdate }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string, wallet: any, onStepUpdate?: StepUpdateCallback }) => {
    try {
        onStepUpdate?.(0, { status: 'processing', description: 'Checking wallet connection...' });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
            onStepUpdate?.(0, { status: 'error', error: 'Wallet not connected. Please connect your wallet to continue.' });
            toast.error('Please connect your wallet first');
            return null;
        }

        const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');
        // const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        const USDC_MINT = new PublicKey(tokenInAddress);

        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);
        const connection = getCustomConnection();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const fromPubkey = wallet.publicKey;

        if (tokenInAddress !== USDC_MINT.toBase58()) {
            onStepUpdate?.(0, { status: 'error', error: 'Only USDC is accepted as payment token' });
            toast.error('Only USDC is accepted as payment token');
            return null;
        }

        const usdcMintInfo = await connection.getAccountInfo(USDC_MINT);
        if (!usdcMintInfo) {
            onStepUpdate?.(0, { status: 'error', error: 'USDC mint does not exist on this network' });
            toast.dismiss();
            toast.error('USDC mint does not exist on this network');
            return null;
        }

        const isToken2022 = usdcMintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        const usdcTokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        const BIT10_MINT = new PublicKey(tokenOutAddress);
        const bit10MintInfo = await connection.getAccountInfo(BIT10_MINT);

        if (!bit10MintInfo) {
            onStepUpdate?.(0, { status: 'error', error: 'BIT10 token mint does not exist on this network' });
            toast.dismiss();
            toast.error('BIT10 token mint does not exist on this network');
            return null;
        }

        const isBit10Token2022 = bit10MintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        const bit10TokenProgramId = isBit10Token2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const bit10ATA = await getAssociatedTokenAddress(BIT10_MINT, fromPubkey, false, bit10TokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
        const bit10AccountInfo = await connection.getAccountInfo(bit10ATA);

        if (!bit10AccountInfo) {
            onStepUpdate?.(0, { status: 'processing', description: 'Preparing your wallet to receive BIT10 tokens...' });
            toast.loading('Creating Associated Token Account for BIT10 token');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const createATAInstruction = createAssociatedTokenAccountInstruction(fromPubkey, bit10ATA, fromPubkey, BIT10_MINT, bit10TokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
            const { blockhash } = await connection.getLatestBlockhash('finalized');

            const messageV0 = new TransactionMessage({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                payerKey: fromPubkey,
                recentBlockhash: blockhash,
                instructions: [
                    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
                    createATAInstruction
                ]
            }).compileToV0Message();

            const ataTransaction = new VersionedTransaction(messageV0);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const ataSignature = await wallet.sendTransaction(ataTransaction, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await connection.confirmTransaction(ataSignature, 'confirmed');

            toast.dismiss();
            toast.success('Associated Token Account created successfully!');
        }

        onStepUpdate?.(0, { status: 'success', description: 'Wallet connected and ready!' });
        onStepUpdate?.(0, { status: 'processing', description: 'Preparing transaction details...' });

        if (!actor.solana_create_transaction || !actor.solana_buy) throw new Error('Exchange methods not available');

        const create_transaction = (await actor.solana_create_transaction({
            user_wallet_address: walletAddress,
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount,
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount,
            referral: []
        })) as TransactionResponse;

        const toPubkey = new PublicKey(create_transaction.to);
        const amount = Number(create_transaction.value);
        const memoData = decodeHexData(create_transaction.data);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const fromUsdcATA = await getAssociatedTokenAddress(USDC_MINT, fromPubkey, false, usdcTokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);
        const toUsdcATA = await getAssociatedTokenAddress(USDC_MINT, toPubkey, false, usdcTokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);

        const usdcAccountInfo = await connection.getTokenAccountBalance(fromUsdcATA);
        const usdcBalance = usdcAccountInfo.value.amount;

        if (Number(usdcBalance) < amount) {
            onStepUpdate?.(0, {
                status: 'error',
                error: `Insufficient USDC balance. Have: ${usdcAccountInfo.value.uiAmountString} USDC, Need: ${amount / 10 ** usdcAccountInfo.value.decimals} USDC`
            });
            toast.dismiss();
            toast.error(`Insufficient USDC balance`);
            return null;
        }

        const usdcMint = await getMint(connection, USDC_MINT, undefined, usdcTokenProgramId);

        const instructions = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
            new TransactionInstruction({
                keys: [],
                programId: MEMO_PROGRAM_ID,
                data: Buffer.from(memoData, 'utf-8')
            }),
            // Transfer USDC from user's ATA to canister's USDC ATA
            createTransferCheckedInstruction(
                fromUsdcATA,
                USDC_MINT,
                toUsdcATA,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                fromPubkey,
                amount,
                usdcMint.decimals,
                [],
                usdcTokenProgramId
            )
        ];

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

        const messageV0 = new TransactionMessage({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            payerKey: fromPubkey,
            recentBlockhash: blockhash,
            instructions
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        onStepUpdate?.(0, { status: 'processing', description: 'Please approve the transaction in your wallet...' });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const signature = await wallet.sendTransaction(transaction, connection, {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

        if (confirmation.value.err) {
            onStepUpdate?.(0, { status: 'error', error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}` });

            toast.dismiss();
            toast.error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            return null;
        }

        onStepUpdate?.(0, { status: 'success', description: 'Transaction submitted successfully.' });
        onStepUpdate?.(1, { status: 'processing', description: 'Waiting for Solana network confirmation...' });

        toast.dismiss();
        toast.info('Transaction sent! Waiting for confirmation...');

        onStepUpdate?.(1, { status: 'success', description: 'Transaction confirmed on the blockchain.' });
        onStepUpdate?.(2, { status: 'processing', description: 'Confirming your transaction across the network. This may take a few moments.' });

        const transferPromise = actor.solana_buy(signature) as Promise<SwapResponse>;
        const transfer = await transferPromise;

        if ('Ok' in transfer) {
            await delay(2000);
            onStepUpdate?.(2, { status: 'success' });

            onStepUpdate?.(3, { status: 'processing', description: 'Validating transaction integrity and preparing final execution.' });

            await delay(2000);
            onStepUpdate?.(3, { status: 'success' });

            onStepUpdate?.(4, { status: 'processing', description: 'Verifying transaction and executing swap...' });
            onStepUpdate?.(4, { status: 'success', description: 'Token swap completed successfully!' });
            toast.success('Token swap was successful!');
        } else if ('Err' in transfer) {
            await delay(8000);
            onStepUpdate?.(2, { status: 'success' });

            onStepUpdate?.(3, { status: 'processing', description: 'Validating transaction integrity and preparing final execution.' });

            await delay(8000);
            onStepUpdate?.(3, { status: 'success' });

            onStepUpdate?.(4, { status: 'processing', description: 'Verifying transaction and executing swap...' });

            let error = 'An error occurred while processing your request. Please try again!';

            if (transfer.Err.includes('Insufficient balance')) {
                error = 'Insufficient funds';
            } else if (transfer.Err.includes('less than available supply')) {
                error = 'The requested amount exceeds the available supply. Please enter a lower amount.';
            }

            onStepUpdate?.(4, { status: 'error', error });
            toast.error(error);
        } else {
            await delay(8000);
            onStepUpdate?.(2, { status: 'success' });

            onStepUpdate?.(3, { status: 'processing', description: 'Validating transaction integrity and preparing final execution.' });

            await delay(8000);
            onStepUpdate?.(3, { status: 'success' });

            onStepUpdate?.(4, { status: 'processing', description: 'Verifying transaction and executing swap...' });
            onStepUpdate?.(4, { status: 'error', error: 'Token swap failed. Please try again.' });
            toast.error('Token swap failed. Please try again.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        onStepUpdate?.(0, { status: 'error', error: 'An error occurred while processing your request. Please try again!' });
        toast.error('An error occurred while processing your request. Please try again!');
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sellBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, walletAddress, wallet, onStepUpdate }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string, wallet: any, onStepUpdate?: StepUpdateCallback }) => {
    try {
        onStepUpdate?.(0, { status: 'processing', description: 'Preparing sell transaction...' });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
            onStepUpdate?.(0, { status: 'error', error: 'Please connect your wallet first' });
            toast.error('Please connect your wallet first');
            return null;
        }

        const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');

        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);

        const TOKEN_MINT = new PublicKey(tokenInAddress);
        const connection = getCustomConnection();
        const mintInfo = await connection.getAccountInfo(TOKEN_MINT);

        if (!mintInfo) {
            onStepUpdate?.(0, { status: 'error', error: 'Token mint does not exist on this network' });
            toast.dismiss();
            toast.error('Token mint does not exist on this network');
            return null;
        }

        const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        if (!actor.solana_create_sell_transaction || !actor.solana_sell) throw new Error('Exchange methods not available');

        onStepUpdate?.(0, { status: 'processing', description: 'Preparing transaction details...' });

        const create_transaction = (await actor.solana_create_sell_transaction({
            user_wallet_address: walletAddress,
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount,
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount,
            referral: []
        })) as TransactionResponse;

        const fromPubkey = new PublicKey(create_transaction.from);
        const amount = Number(create_transaction.value);

        const fromATA = await getAssociatedTokenAddress(
            TOKEN_MINT,
            fromPubkey,
            false,
            tokenProgramId,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const mint = await getMint(connection, TOKEN_MINT, undefined, tokenProgramId);
        const decimals = mint.decimals;

        const instructions = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })
        ];

        const memoData = decodeHexData(create_transaction.data);
        const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(memoData, 'utf-8')
        });

        instructions.push(memoInstruction);

        const burnInstruction = createBurnCheckedInstruction(
            fromATA,
            TOKEN_MINT,
            fromPubkey,
            amount,
            decimals,
            [],
            tokenProgramId
        );

        instructions.push(burnInstruction);

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

        const messageV0 = new TransactionMessage({
            payerKey: fromPubkey,
            recentBlockhash: blockhash,
            instructions
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        onStepUpdate?.(0, { status: 'processing', description: 'Please approve the sell transaction in your wallet...' });

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

        onStepUpdate?.(0, { status: 'success', description: 'Transaction submitted successfully.' });
        onStepUpdate?.(1, { status: 'processing', description: 'Waiting for blockchain confirmation...' });

        toast.info('Transaction sent! Waiting for confirmation...');

        onStepUpdate?.(1, { status: 'success', description: 'Transaction confirmed on the blockchain.' });
        onStepUpdate?.(2, { status: 'processing', description: 'Confirming your transaction across the network. This may take a few moments.' });

        const transferPromise = actor.solana_sell(signature) as Promise<SwapResponse>;
        const transfer = await transferPromise;

        if ('Ok' in transfer) {
            await delay(2000);
            onStepUpdate?.(2, { status: 'success' });

            onStepUpdate?.(3, { status: 'processing', description: 'Validating transaction integrity and preparing final execution.' });

            await delay(2000);
            onStepUpdate?.(3, { status: 'success' });

            onStepUpdate?.(4, { status: 'processing', description: 'Verifying transaction and completing token sale...' });
            onStepUpdate?.(4, { status: 'success', description: 'Token sale completed successfully!' });
            toast.success('Token swap was successful!');
        } else if ('Err' in transfer) {
            await delay(8000);
            onStepUpdate?.(2, { status: 'success' });

            onStepUpdate?.(3, { status: 'processing', description: 'Validating transaction integrity and preparing final execution.' });

            await delay(8000);
            onStepUpdate?.(3, { status: 'success' });

            onStepUpdate?.(4, { status: 'processing', description: 'Verifying transaction and completing token sale...' });

            let error = 'An error occurred while processing your request. Please try again!';

            if (transfer.Err.includes('Insufficient balance')) {
                error = 'Insufficient funds';
            } else if (transfer.Err.includes('less than available supply')) {
                error = 'The requested amount exceeds the available supply. Please enter a lower amount.';
            }

            onStepUpdate?.(4, { status: 'error', error });
            toast.error(error);
        } else {
            await delay(8000);
            onStepUpdate?.(2, { status: 'success' });

            onStepUpdate?.(3, { status: 'processing', description: 'Validating transaction integrity and preparing final execution.' });

            await delay(8000);
            onStepUpdate?.(3, { status: 'success' });

            onStepUpdate?.(4, { status: 'processing', description: 'Verifying transaction and completing token sale...' });
            onStepUpdate?.(4, { status: 'error', error: 'Token sale failed. Please try again.' });
            toast.error('Token sale failed. Please try again.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        onStepUpdate?.(0, { status: 'error', error: 'An error occurred while processing your request. Please try again!' });
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
