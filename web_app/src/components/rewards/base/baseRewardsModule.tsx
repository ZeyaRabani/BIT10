import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as cahsbackIDLFactory } from '@/lib/cashback.did'

export const fetchBaseTokenBalance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }) => {
    try {
        if (!address) {
            return '0';
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
            return formatUnits(balance, 18);
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

        return formatUnits(balance, decimals);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while fetching user portfolio. Please try again!');
        return '0'
    }
}

export const claimBaseCashback = async ({ walletAddress }: { walletAddress: string }) => {
    try {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const cashbackCanisterId = '5fll2-liaaa-aaaap-qqlwa-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(cahsbackIDLFactory, {
            agent,
            canisterId: cashbackCanisterId,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const claimResult = await actor.claim_base_reward(walletAddress);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (claimResult.Ok) {
            toast.success('Cashback claimed successfully!');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
        } else if (claimResult.Err) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const errorMessage = claimResult.Err;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            if (errorMessage.includes('Cashback claiming is not yet available')) {
                toast.error('Cashback claiming is not available yet.');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (errorMessage.includes('Cashback claiming period has ended')) {
                toast.error('The Cashback claiming period has ended.');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (errorMessage.includes('Cashback already claimed')) {
                toast.error('Cashback has already been claimed!');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (errorMessage.includes('No purchase made after Cashback Round started') || errorMessage.includes('All recorded transactions occurred before the reward eligibility window.')) {
                toast.error('No purchase made after the Cashback Round started.');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            } else if (errorMessage.includes('Net eligible token quantity is below 0.9 threshold required for reward.') || errorMessage.includes('Calculated cashback is zero or negative.')) {
                toast.error('Not Eligible');
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
