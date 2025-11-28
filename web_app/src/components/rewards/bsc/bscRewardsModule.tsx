import { ERC20_ABI } from '@/lib/erc20Abi'
import { createPublicClient, http } from 'viem'
import { bsc } from 'viem/chains'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as cahsbackIDLFactory } from '@/lib/cashback.did'

const bscClient = createPublicClient({
    chain: bsc,
    transport: http(),
});

export const fetchBSCTokenBalance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }) => {
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

export const claimBSCCashback = async ({ walletAddress }: { walletAddress: string }) => {
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
        const claimResult = await actor.claim_bsc_reward(walletAddress);

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
