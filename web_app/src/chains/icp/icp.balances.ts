import { createICPActor } from './icp.client';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '@/lib/canisters/icrc.did';
import { toast } from 'sonner';

export const fetchTokenBalance = async ({ canisterId, address }: { canisterId: string, address: string }) => {
    try {
        if (!address) {
            return 0;
        }

        const actor = createICPActor(idlFactory, canisterId);

        if (address) {
            const account = {
                owner: Principal.fromText(address),
                subaccount: [],
            };
            if (actor && actor.icrc1_balance_of) {
                try {
                    const balance = await actor.icrc1_balance_of(account);
                    const value = Number(balance) / (canisterId == 'xevnm-gaaaa-aaaar-qafnq-cai' ? 1000000 : 100000000);
                    return Number(value);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while fetching user portfolio. Please try again!');
                }
            } else {
                toast.error('An error occurred while fetching user portfolio. Please try again!');
                return 0;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while fetching user portfolio. Please try again!');
        return 0;
    }
}
