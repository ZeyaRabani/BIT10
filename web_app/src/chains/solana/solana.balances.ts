import { toast } from 'sonner';
import { getCustomConnection } from './solana.client';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { formatCompactNumber } from '@/lib/utils';

export const fetchTokenBalance = async ({ tokenAddress, publicKey, decimals = 9 }: { tokenAddress: string, publicKey: PublicKey, decimals?: number }): Promise<number> => {
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
            return Number(balanceSOL);
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
                    return Number(balance.toFixed(decimals));
                } catch (error) {
                    if (programId === TOKEN_2022_PROGRAM_ID) {
                        const message = error instanceof Error ? error.message : '';
                        if (message.includes('could not find account') || message.includes('Account not found')) {
                            return 0;
                        }
                        throw error;
                    }
                    continue;
                }
            }
            return 0;
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('403')) {
            toast.error('RPC access forbidden. Please check your connection settings.');
        } else {
            toast.error('Error fetching balance. Please try again.');
        }

        return 0;
    }
};
