import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { toast } from 'sonner'

export const fetchICPBIT10Balance = async ({ canisterId, address }: { canisterId: string, address: string }) => {
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
