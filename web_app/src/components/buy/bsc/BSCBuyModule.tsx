import { type StaticImageData } from 'next/image'
import BNBImg from '@/assets/tokens/bnb.svg'
import USDCImg from '@/assets/tokens/usdc.svg'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { ERC20_ABI } from '@/lib/erc20Abi'
import { createPublicClient, http } from 'viem'
import { bsc } from 'viem/chains'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { ethers } from 'ethers'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as buyidlFactory2 } from '@/lib/buy.did'
import { newTokenSwap } from '@/actions/dbActions'
import { getTokenName } from '@/lib/utils'

const bscClient = createPublicClient({
    chain: bsc,
    transport: http(),
});

interface SwapSuccessData {
    cashbackAmount: string;
    raffleTickets: string;
    tokenOutName: string;
}

export const buyPayTokensBSC = [
    { label: 'BNB', value: 'BNB', img: BNBImg as StaticImageData, address: '0x0000000000000000000000000000000000000000bnb', tokenType: 'BEP20', slug: ['bnb'] },
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', tokenType: 'BEP20', slug: ['usdc', 'stable coin'] }
]

export const buyReceiveTokensBSC = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9', tokenType: 'BEP20', slug: ['top crypto'] }
]

export const sellPayTokensBSC = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9', tokenType: 'BEP20', slug: ['top crypto'] }
]

export const sellReceiveTokensBSC = [
    { label: 'BNB', value: 'BNB', img: BNBImg as StaticImageData, address: '0x0000000000000000000000000000000000000000bnb', tokenType: 'BEP20', slug: ['bnb'] }
]

export const fetchBSCTokenBalance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }): Promise<number> => {
    try {
        if (!address) {
            return 0;
        }

        if (tokenAddress === '0x0000000000000000000000000000000000000000bnb') {
            const balance = await bscClient.getBalance({
                address: address as `0x${string}`,
            });
            return Number(formatUnits(balance, 18));
        } else {
            const decimals = await bscClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'decimals',
            });

            const balance = await bscClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                args: [address],
            });
            return Number(formatUnits(balance, decimals));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching BNB wallet balance');
        return 0;
    }
}

export const buyBSCBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenOutAmount, tokenInAmount, bscAddress, onSuccess }: { tokenInAddress: string, tokenOutAddress: string, tokenOutAmount: string, tokenInAmount: string, bscAddress: string, onSuccess?: (data: SwapSuccessData) => void; }) => {
    try {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(buyidlFactory2, {
            agent,
            canisterId,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const create_transaction = await actor.bsc_create_transaction({
            user_wallet_address: bscAddress,
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount,
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount,
        });

        const tx = {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            to: create_transaction.to,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            value: create_transaction.value,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: create_transaction.data,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            from: create_transaction.from
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const txResponse = await signer.sendTransaction(tx);

        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const transfer = await actor.bsc_buy(txResponse.hash);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (transfer.Ok) {
            const formatTimestamp = (nanoseconds: string): string => {
                const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
            };

            const result = await newTokenSwap({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                newTokenSwapId: transfer.Ok.swap_id,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                principalId: transfer.Ok.user_wallet_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInName: transfer.Ok.token_in_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInAmount: transfer.Ok.token_in_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInUSDAmount: transfer.Ok.token_in_usd_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInTxBlock: transfer.Ok.token_in_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutName: transfer.Ok.token_out_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutAmount: transfer.Ok.token_out_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutTxBlock: transfer.Ok.token_out_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                transactionType: transfer.Ok.transaction_type,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                network: transfer.Ok.network,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
            });

            await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    newTokenSwapId: transfer.Ok.swap_id,
                    principalId: bscAddress,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                    tickOutName: getTokenName(transfer.Ok.token_out_address),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    tickOutAmount: transfer.Ok.token_out_amount.toString(),
                    transactionTimestamp: new Date().toISOString(),
                }),
            });

            if (result === 'Token swap successfully') {
                toast.success('Token swap was successful!');

                const tokenInUSDAmount = parseFloat(
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    transfer.Ok.token_in_usd_amount.toString()
                );
                const cashbackAmount = ((tokenInUSDAmount / 1.01) * 0.05).toFixed(2);

                const successData: SwapSuccessData = {
                    cashbackAmount,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    raffleTickets: transfer.Ok.token_out_amount.toString(),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    tokenOutName: getTokenName(transfer.Ok.token_out_address),
                };

                if (onSuccess) {
                    onSuccess(successData);
                }
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
        } else if (transfer.Err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const errorMessage = String(transfer.Err);
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
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};

export const sellBSCBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenOutAmount, tokenInAmount, bscAddress }: { tokenInAddress: string, tokenOutAddress: string, tokenOutAmount: string, tokenInAmount: string, bscAddress: string }) => {
    try {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(buyidlFactory2, {
            agent,
            canisterId,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const create_transaction = await actor.bsc_create_sell_transaction({
            user_wallet_address: bscAddress,
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount.toString(),
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount.toString()
        });

        const tx = {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            to: create_transaction.to,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            value: create_transaction.value,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: create_transaction.data,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            from: create_transaction.from
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const txResponse = await signer.sendTransaction(tx);

        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const transfer = await actor.bsc_sell(txResponse.hash);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (transfer.Ok) {
            const formatTimestamp = (nanoseconds: string): string => {
                const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
            };

            const result = await newTokenSwap({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                newTokenSwapId: transfer.Ok.swap_id,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                principalId: transfer.Ok.user_wallet_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInName: transfer.Ok.token_in_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInAmount: transfer.Ok.token_in_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInUSDAmount: transfer.Ok.token_in_usd_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInTxBlock: transfer.Ok.token_in_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutName: transfer.Ok.token_out_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutAmount: transfer.Ok.token_out_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutTxBlock: transfer.Ok.token_out_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                transactionType: transfer.Ok.transaction_type,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                network: transfer.Ok.network,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
            });

            await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    newTokenSwapId: transfer.Ok.swap_id,
                    principalId: bscAddress,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                    tickOutName: getTokenName(transfer.Ok.token_out_address),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    tickOutAmount: transfer.Ok.token_out_amount.toString(),
                    transactionTimestamp: new Date().toISOString(),
                }),
            });

            if (result === 'Token swap successfully') {
                toast.success('Token swap was successful!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
        } else if (transfer.Err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const errorMessage = String(transfer.Err);
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
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
