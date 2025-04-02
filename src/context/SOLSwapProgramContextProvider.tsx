"use client"

import { type FC, type ReactNode, createContext, useContext, useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { IDL, type TeSwap } from '@/lib/te_swap.idl'

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

interface SOLSwapProgramContextProviderProps {
    children: ReactNode;
}

export const SOLSwapProgramContextProvider: FC<SOLSwapProgramContextProviderProps> = ({ children }) => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const program = useMemo(() => {
        if (!wallet.publicKey) return null;

        const provider = new AnchorProvider(
            connection,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
            wallet as any,
            AnchorProvider.defaultOptions()
        );

        return new Program<TeSwap>(IDL, PROGRAM_ID, provider);
    }, [connection, wallet]);

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
