import { createICPActor } from './bsc.client';
import { toast } from 'sonner';
import { idlFactory as exchangeIDLFactory } from '@/lib/canisters/bit10_exchange.did';
import { idlFactory as rewardsIDLFactory } from '@/lib/canisters/rewards.did';
import { BIT10_EXCHANGE_CANISTER_ID, BIT10_REWARDS_CANISTER_ID } from './bsc.constants';
import { type TransactionResponse, type SwapResponse, type CashbackResponse } from './bsc.types';
import { ethers } from 'ethers';

export const buyBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, walletAddress }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string }) => {
    try {
        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);

        if (actor.bsc_create_transaction && actor.bsc_buy) {
            const create_transaction = await actor.bsc_create_transaction({
                user_wallet_address: walletAddress,
                token_in_address: tokenInAddress,
                token_in_amount: tokenInAmount,
                token_out_address: tokenOutAddress,
                token_out_amount: tokenOutAmount
            }) as TransactionResponse;

            const tx = {
                to: create_transaction.to,
                value: create_transaction.value,
                data: create_transaction.data,
                from: create_transaction.from
            };

            const ethereumProvider = window.ethereum as ethers.Eip1193Provider | undefined;
            if (!ethereumProvider) {
                throw new Error('Ethereum provider not found. Please install MetaMask or another wallet.');
            }

            const provider = new ethers.BrowserProvider(ethereumProvider);
            const signer = await provider.getSigner();

            const txResponse = await signer.sendTransaction(tx);

            toast.info('Transaction sent! Waiting for confirmation...');

            // Wait for 10 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const transfer = await actor.bsc_buy(txResponse.hash) as SwapResponse;

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

export const sellBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, walletAddress }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, walletAddress: string }) => {
    try {
        const actor = createICPActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);

        if (actor.bsc_create_sell_transaction && actor.bsc_sell) {
            const create_transaction = await actor.bsc_create_sell_transaction({
                user_wallet_address: walletAddress,
                token_in_address: tokenInAddress,
                token_in_amount: tokenInAmount,
                token_out_address: tokenOutAddress,
                token_out_amount: tokenOutAmount
            }) as TransactionResponse;

            const tx = {
                to: create_transaction.to,
                value: create_transaction.value,
                data: create_transaction.data,
                from: create_transaction.from
            };

            const ethereumProvider = window.ethereum as ethers.Eip1193Provider | undefined;
            if (!ethereumProvider) {
                throw new Error('Ethereum provider not found. Please install MetaMask or another wallet.');
            }

            const provider = new ethers.BrowserProvider(ethereumProvider);
            const signer = await provider.getSigner();

            const txResponse = await signer.sendTransaction(tx);

            toast.info('Transaction sent! Waiting for confirmation...');

            // Wait for 10 seconds
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const transfer = await actor.bsc_sell(txResponse.hash) as SwapResponse;

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

        if (actor.bsc_buy && actor.bsc_sell) {
            let transfer;
            if (mode === 'buy') {
                transfer = await actor.bsc_buy(trxHash) as SwapResponse;
            } else {
                transfer = await actor.bsc_sell(trxHash) as SwapResponse;
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

        if (actor.claim_bsc_reward) {
            const claimResult = await actor.claim_bsc_reward(walletAddress) as CashbackResponse;

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
