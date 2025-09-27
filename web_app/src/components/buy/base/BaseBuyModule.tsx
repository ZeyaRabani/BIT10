import { type StaticImageData } from 'next/image'
import ETHImg from '@/assets/tokens/eth.svg'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { ethers } from 'ethers'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as buyidlFactory2 } from '@/lib/buy.did'
import { newTokenSwap } from '@/actions/dbActions'
import { getTokenName } from '@/lib/utils'

export const buyPayTokensBase = [
    { label: 'ETH', value: 'Ethereum', img: ETHImg as StaticImageData, address: '0x0000000000000000000000000000000000000000b', tokenType: 'ERC20', slug: ['ethereum'] },
]

export const buyReceiveTokensBase = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0x2d309c7c5FbBf74372EdfC25B10842a7237b92dE', tokenType: 'ERC20', slug: ['top crypto'] },
]

export const fetchBaseBIT10Balance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }): Promise<number> => {
    try {
        if (!address) {
            return 0;
        }

        const BASE_RPC_URL = 'https://mainnet.base.org';

        if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000b') {
            const response = await fetch(BASE_RPC_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                    id: 1
                })
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data = await response.json();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                throw new Error(data.error.message);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            const balance = BigInt(data.result);
            return Number(formatUnits(balance, 18));
        }

        const balanceDataResponse = await fetch(BASE_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    {
                        to: tokenAddress,
                        data: `0x70a08231000000000000000000000000${address.slice(2)}`
                    },
                    'latest'
                ],
                id: 2
            })
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const balanceData = await balanceDataResponse.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (balanceData.error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            throw new Error(balanceData.error.message);
        }

        const decimalsResponse = await fetch(BASE_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    {
                        to: tokenAddress,
                        data: '0x313ce567'
                    },
                    'latest'
                ],
                id: 3
            })
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const decimalsData = await decimalsResponse.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (decimalsData.error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            throw new Error(decimalsData.error.message);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const decimals = parseInt(decimalsData.result, 16);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const balance = BigInt(balanceData.result);

        return Number(formatUnits(balance, decimals));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching wallet balance');
        return 0;
    }
}

export const buyBaseBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenOutAmount, tokenInAmount, baseAddress }: { tokenInAddress: string, tokenOutAddress: string, tokenOutAmount: string, tokenInAmount: string, baseAddress: string }) => {
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
        const create_transaction = await actor.base_create_transaction({
            user_wallet_address: baseAddress,
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
        const transfer = await actor.base_buy(txResponse.hash);

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
                    principalId: baseAddress,
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
