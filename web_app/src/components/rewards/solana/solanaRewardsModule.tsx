import { toast } from 'sonner'
import { env } from '@/env'
import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { formatCompactNumber } from '@/lib/utils'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as cahsbackIDLFactory } from '@/lib/cashback.did'

const getCustomConnection = (): Connection => {
    const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
    });
};

export const fetchSolanaTokenBalance = async ({ tokenAddress, publicKey, decimals = 9 }: { tokenAddress: string, publicKey: PublicKey, decimals?: number }): Promise<string> => {
    const customConnection = getCustomConnection();

    try {
        if (tokenAddress === 'So11111111111111111111111111111111111111111') {
            let balance: number | undefined;
            let retries = 3;

            while (retries > 0) {
                try {
                    balance = await customConnection.getBalance(publicKey);
                    break;
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                }
            }

            if (balance === undefined) {
                throw new Error('Failed to fetch balance after retries');
            }

            const balanceSOL = formatCompactNumber(balance / LAMPORTS_PER_SOL);
            return balanceSOL;
        } else {
            const tokenAddressPublicKey = new PublicKey(tokenAddress);

            const programsToTry = [
                { programId: TOKEN_PROGRAM_ID, name: 'Token Program' },
                { programId: TOKEN_2022_PROGRAM_ID, name: 'Token-22 Program' }
            ];

            for (const { programId } of programsToTry) {
                try {
                    const associatedTokenAddress = await getAssociatedTokenAddress(tokenAddressPublicKey, publicKey, false, programId);
                    const tokenAccount = await getAccount(customConnection, associatedTokenAddress, 'confirmed', programId);
                    const balance = parseFloat(tokenAccount.amount.toString()) / (10 ** decimals);
                    return balance.toFixed(decimals).toString();
                } catch (error) {
                    if (programId === TOKEN_2022_PROGRAM_ID) {
                        const message = error instanceof Error ? error.message : '';
                        if (message.includes('could not find account') || message.includes('Account not found')) {
                            return '0';
                        }
                        throw error;
                    }
                    continue;
                }
            }
            return '0';
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('403')) {
            toast.error('RPC access forbidden. Please check your connection settings.');
        } else {
            toast.error('Error fetching balance. Please try again.');
        }

        return '0';
    }
};

export const claimSolanaCashback = async ({ walletAddress }: { walletAddress: string }) => {
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
        const claimResult = await actor.claim_solana_reward(walletAddress);

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
