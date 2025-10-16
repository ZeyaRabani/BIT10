import { toast } from 'sonner'
import { env } from '@/env'
import { PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { formatAmount } from '@/lib/utils'

const getCustomConnection = (): Connection => {
    const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
    });
};

export const fetchSolanaBIT10Balance = async ({ tokenAddress, publicKey, decimals = 9 }: { tokenAddress: string, publicKey: PublicKey, decimals?: number }): Promise<string> => {
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

            const balanceSOL = formatAmount(balance / LAMPORTS_PER_SOL);
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
