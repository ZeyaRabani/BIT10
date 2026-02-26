import { createPlugActor, createICPActor } from './icp.client';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { idlFactory as icrcIDLFactory } from '@/lib/canisters/icrc.did';
import { idlFactory as exchangeIDLFactory } from '@/lib/canisters/bit10_exchange.did';
import { idlFactory as rewardsIDLFactory } from '@/lib/canisters/rewards.did';
import { BIT10_EXCHANGE_CANISTER_ID, BIT10_REWARDS_CANISTER_ID } from './icp.constants';
import type { StepUpdateCallback, ICRC2ActorType, SwapResponse, CashbackResponse } from './icp.types';

export const buyBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAmount, tokenOutAddress, onStepUpdate }: { tokenInAmount: string, tokenInAddress: string, tokenOutAmount: string, tokenOutAddress: string, onStepUpdate?: StepUpdateCallback }) => {
    try {
        onStepUpdate?.(0, { status: 'processing', description: 'Requesting canister access...' });
        
        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [BIT10_EXCHANGE_CANISTER_ID, tokenInAddress]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (!hasAllowed) {
            onStepUpdate?.(0, { status: 'error', error: 'Wallet connection was rejected. Please connect your wallet to continue.' });
            toast.info('Please connect your wallet to proceed.');
            return;
        }

        onStepUpdate?.(0, { status: 'success', description: 'Canister access granted!' });
        onStepUpdate?.(1, { status: 'processing', description: 'Waiting for token approval in your wallet...' });

        toast.info('Allow the transaction on your wallet to proceed.');

        const icrcActor = await createPlugActor(icrcIDLFactory, tokenInAddress) as ICRC2ActorType;

        const price = Number(tokenInAmount) * 1.5; // More in case of sudden price change 
        const amount = BigInt(Math.round(price * 100_000_000));
        const expiresAt = BigInt(Date.now()) * 1_000_000n + 300_000_000_000n;

        const approvalArgs = {
            spender: {
                owner: Principal.fromText(BIT10_EXCHANGE_CANISTER_ID),
                subaccount: [] as []
            },
            fee: [] as [],
            memo: [] as [],
            from_subaccount: [] as [],
            created_at_time: [] as [],
            amount,
            expected_allowance: [] as [],
            expires_at: [expiresAt] as [bigint],
        };

        const approveResult = await icrcActor.icrc2_approve(approvalArgs);

        if (!('Ok' in approveResult)) {
            onStepUpdate?.(1, { status: 'error', error: 'Token approval failed. Please try again.' });
            toast.error('Approval failed. Please try again.');
            return;
        }

        onStepUpdate?.(1, { status: 'success', description: 'Token spending approved successfully.' });
        onStepUpdate?.(2, { status: 'processing', description: 'Executing token swap on the network...' });

        toast.success('Approval was successful! Proceeding with transfer...');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const exchangeActor = await createPlugActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);

        const swapArgs = {
            token_in_address: tokenInAddress,
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const transfer = await exchangeActor.icp_buy(swapArgs) as SwapResponse;

        if ('Ok' in transfer) {
            onStepUpdate?.(2, { status: 'success', description: 'Token swap completed successfully!' });
            toast.success('Token swap was successful!');
        } else if (transfer.Err) {
            const errorMessage = transfer.Err;
            let error = 'An error occurred while processing your request. Please try again!';
            if (errorMessage.includes('Insufficient balance')) {
                error = 'Insufficient funds';
            } else if (errorMessage.includes('less than available supply')) {
                error = 'The requested amount exceeds the available supply. Please enter a lower amount.';
            } else if (errorMessage.includes('InsufficientAllowance')) {
                error = 'Insufficient allowance for funds. Please enter a lower amount.';
            }

            onStepUpdate?.(2, { status: 'error', error });
            toast.error(error);
        } else {
            onStepUpdate?.(2, { status: 'error', error: 'Token swap failed. Please try again.' });
            toast.error('An error occurred while processing your request. Please try again!');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        const processingStepIndex = 0;
        onStepUpdate?.(processingStepIndex, { status: 'error', error: 'An error occurred while processing your request. Please try again!' });
        toast.error('An error occurred while processing your request. Please try again!');
    }
};

export const sellBIT10Token = async ({ tokenInAmount, tokenInAddress, tokenOutAddress, onStepUpdate }: { tokenInAmount: string, tokenInAddress: string, tokenOutAddress: string, onStepUpdate?: StepUpdateCallback }) => {
    try {
        onStepUpdate?.(0, { status: 'processing', description: 'Requesting canister access...' });

        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [BIT10_EXCHANGE_CANISTER_ID, tokenInAddress]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (!hasAllowed) {
            onStepUpdate?.(0, { status: 'error', error: 'Please connect your wallet to proceed.' });
            toast.info('Please connect your wallet to proceed.');
            return;
        }

        toast.info('Allow the transaction on your wallet to proceed.');

        onStepUpdate?.(0, { status: 'success', description: 'Wallet connected and canister access granted.' });
        onStepUpdate?.(1, { status: 'processing', description: 'Waiting for token approval in your wallet...' });

        const icrcActor = await createPlugActor(icrcIDLFactory, tokenInAddress) as ICRC2ActorType;

        const price = Number(tokenInAmount) * 1.5; // More in case of sudden price change 
        const amount = BigInt(Math.round(price * 100_000_000));
        const expiresAt = BigInt(Date.now()) * 1_000_000n + 300_000_000_000n;

        const approvalArgs = {
            spender: {
                owner: Principal.fromText(BIT10_EXCHANGE_CANISTER_ID),
                subaccount: [] as []
            },
            fee: [] as [],
            memo: [] as [],
            from_subaccount: [] as [],
            created_at_time: [] as [],
            amount,
            expected_allowance: [] as [],
            expires_at: [expiresAt] as [bigint],
        };

        const approveResult = await icrcActor.icrc2_approve(approvalArgs);

        if (!('Ok' in approveResult)) {
            onStepUpdate?.(1, { status: 'error', error: 'Approval failed. Please try again.' });
            toast.error('Approval failed. Please try again.');
            return;
        }

        onStepUpdate?.(1, { status: 'success', description: 'Token spending approved successfully.' });
        onStepUpdate?.(2, { status: 'processing', description: 'Executing token sale on the network...' });

        toast.success('Approval was successful! Proceeding with transfer...');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const exchangeActor = await createPlugActor(exchangeIDLFactory, BIT10_EXCHANGE_CANISTER_ID);

        const swapArgs = {
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount,
            token_out_address: tokenOutAddress
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const transfer = await exchangeActor.icp_sell(swapArgs) as SwapResponse;

        if ('Ok' in transfer) {
            onStepUpdate?.(2, { status: 'success', description: 'Token sale completed successfully!' });
            toast.success('Token swap was successful!');
        } else if (transfer.Err) {
            const errorMessage = transfer.Err;
            let error = 'An error occurred while processing your request. Please try again!';

            if (errorMessage.includes('Insufficient balance')) {
                error = 'Insufficient funds';
            } else if (errorMessage.includes('less than available supply')) {
                error = 'The requested amount exceeds the available supply. Please enter a lower amount.';
            } else if (errorMessage.includes('InsufficientAllowance')) {
                error = 'Insufficient allowance for funds. Please enter a lower amount.';
            }

            onStepUpdate?.(2, { status: 'error', error });
            toast.error(error);
        } else {
            onStepUpdate?.(2, { status: 'error', error: 'An error occurred while processing your request. Please try again!' });
            toast.error('An error occurred while processing your request. Please try again!');
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        const currentStep = 0;
        onStepUpdate?.(currentStep, { status: 'error', error: 'An error occurred while processing your request. Please try again!' });
        toast.error('An error occurred while processing your request. Please try again!');
    }
};

export const claimCashback = async ({ walletAddress }: { walletAddress: string }) => {
    try {
        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [BIT10_REWARDS_CANISTER_ID]
        });

        const actor = createICPActor(rewardsIDLFactory, BIT10_REWARDS_CANISTER_ID);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed && actor.claim_icp_reward) {
            toast.info('Processing your request...');

            const claimResult = await actor.claim_icp_reward(walletAddress) as CashbackResponse;

            if ('Ok' in claimResult) {
                toast.success('Cashback claimed successfully!');
            } else if ('Err' in claimResult) {
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
            toast.error('Canister approval failed. Please try again!');
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
