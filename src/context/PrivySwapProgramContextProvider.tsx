"use client"

import { type FC, type ReactNode, createContext, useContext, useMemo } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@project-serum/anchor'
import { PublicKey, type Transaction } from '@solana/web3.js'
import { IDL, type TeSwap } from '@/lib/te_swap.idl'
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'

const PROGRAM_ID = new PublicKey('DKEKk7aLibx28g6DVMZXk3MinED489KRHfoM3wnnrd2s');
const TOKEN_MINT = new PublicKey('5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K');

interface ProgramContextState {
    program: Program<TeSwap> | null;
    programId: PublicKey;
    tokenMint: PublicKey;
}

export const ProgramContext = createContext<ProgramContextState>({
    program: null,
    programId: PROGRAM_ID,
    tokenMint: TOKEN_MINT,
});

export const useProgram = () => useContext(ProgramContext);

interface PrivySwapProgramContextProviderProps {
    children: ReactNode;
}

export const PrivySwapProgramContextProvider: FC<PrivySwapProgramContextProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    const { authenticated, user } = usePrivy();
    const { wallets } = useSolanaWallets();

    const program = useMemo(() => {
        if (!authenticated || !user?.wallet?.address || wallets.length === 0) return null;

        const solanaWallet = wallets[0];

        if (!solanaWallet) {
            return null;
        }

        const provider = new AnchorProvider(
            connection,
            {
                publicKey: new PublicKey(solanaWallet.address),
                signTransaction: async (tx: Transaction) => {
                    try {
                        const signedTx = await solanaWallet.signTransaction(tx);
                        return signedTx;
                    } catch (error) {
                        throw error;
                    }
                },
                signAllTransactions: async (txs: Transaction[]) => {
                    try {
                        const signedTxs = await solanaWallet.signAllTransactions(txs);
                        return signedTxs;
                    } catch (error) {
                        throw error;
                    }
                }
            },
            AnchorProvider.defaultOptions()
        );

        return new Program<TeSwap>(IDL, PROGRAM_ID, provider);
    }, [connection, authenticated, user, wallets]);

    return (
        <ProgramContext.Provider
            value={{
                program,
                programId: PROGRAM_ID,
                tokenMint: TOKEN_MINT,
            }}
        >
            {children}
        </ProgramContext.Provider>
    );
};
