import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/bit10.did'
import { toast } from 'sonner'
import { Principal } from '@dfinity/principal'
import { idlFactory as cahsbackIDLFactory } from '@/lib/cashback.did'

export const fetchICPTokenBalance = async ({ canisterId, address }: { canisterId: string, address: string }) => {
    try {
        if (!address) {
            return '0';
        }
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        if (address) {
            const account = {
                owner: Principal.fromText(address),
                subaccount: [],
            };
            if (actor && actor.icrc1_balance_of) {
                try {
                    const balance = await actor.icrc1_balance_of(account);
                    return balance;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                }
            } else {
                toast.error('An error occurred while fetching user portfolio. Please try again!');
                return 0n;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while fetching user portfolio. Please try again!');
        return 0n
    }
}

export const claimICPCashback = async ({ walletAddress }: { walletAddress: string }) => {
    try {
        const cashbackCanisterId = '5fll2-liaaa-aaaap-qqlwa-cai';

        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [cashbackCanisterId]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed) {
            toast.info('Processing your request...');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const actor = await window.ic.plug.createActor({
                canisterId: cashbackCanisterId,
                interfaceFactory: cahsbackIDLFactory
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const claimResult = await actor.claim_icp_reward(walletAddress);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (claimResult.Ok) {
                toast.success('Cashback claimed successfully!');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            } else if (claimResult.Err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        } else {
            toast.error('Canister approval failed. Please try again!');
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
