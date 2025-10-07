import { type StaticImageData } from 'next/image'
import SOLImg from '@/assets/tokens/sol.svg'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { toast } from 'sonner'
import { formatAmount } from '@/lib/utils'
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { type Program } from '@project-serum/anchor'
import { type TeSwap } from '@/lib/te_swap.idl'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'
import crypto from 'crypto'
import { newTokenBuy } from '@/actions/dbActions'

interface SwapParams {
    tickInName: string;
    tickOutName: string;
    tickOutAmount: number;
}

export const paymentTokenSOLDevnet = [
    { label: 'SOL', value: 'SOL', img: SOLImg as StaticImageData, tokenType: 'SPL', address: 'So11111111111111111111111111111111111111111', slug: ['solana'] },
]

export const bit10TokenbuySOLDevnet = [
    { label: 'Test BIT10.DEFI', value: 'Test BIT10.DEFI', img: BIT10Img as StaticImageData, tokenType: 'SPL', address: '5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K', slug: ['top 6 defi'] }
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchSOLDevnetTokenBalance = async (address: string, publicKey: any, connection: any): Promise<string> => {
    try {
        if (address === 'So11111111111111111111111111111111111111111') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const walletAddress = publicKey;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const balance = await connection.getBalance(walletAddress);
            const balanceSOL = formatAmount(balance / LAMPORTS_PER_SOL);

            return balanceSOL;
        } else {
            toast.error('Fetching SPL token balance not implemented in this function.');
            return '0';
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching Sepolia balance');
        return '0';
    }
};

async function executeSwap(program: Program<TeSwap>, tokenMint: PublicKey, params: SwapParams) {
    const { tickInName, tickOutName, tickOutAmount } = params;

    const swapResultKeypair = Keypair.generate();

    const user = program.provider.publicKey!;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [smartContractPda, _] = PublicKey.findProgramAddressSync(
        [Buffer.from('smart_contract_seed')],
        program.programId
    );

    const smartContractTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        smartContractPda,
        true
    );

    const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        user
    );

    const userTokenAccountInfo = await program.provider.connection.getAccountInfo(userTokenAccount);
    if (!userTokenAccountInfo) {
        const createUserAccountTx = new anchor.web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
                user,
                userTokenAccount,
                user,
                tokenMint
            )
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await program.provider.sendAndConfirm(createUserAccountTx);
    }

    const recipient = new PublicKey('Cq6JPmEspG6oNcUC47WHuEJWU1K4knsLzHYHSfvpnDHk');
    const recipientTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        recipient
    );

    const recipientTokenAccountInfo = await program.provider.connection.getAccountInfo(recipientTokenAccount);
    if (!recipientTokenAccountInfo) {
        const createAccountTx = new anchor.web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
                user,
                recipientTokenAccount,
                recipient,
                tokenMint
            )
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await program.provider.sendAndConfirm(createAccountTx);
    }

    try {
        const tx = await program.methods
            .swap({
                tickInName,
                tickOutName,
                tickOutAmount: new BN(tickOutAmount),
            })
            .accounts({
                swapResult: swapResultKeypair.publicKey,
                user,
                systemProgram: SystemProgram.programId,
                payer: user,
                recipient,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                recipientTokenAccount,
                smartContractPda,
                smartContractTokenAccount,
                userTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                mint: tokenMint,
            })
            .signers([swapResultKeypair])
            .rpc();

        const result = await program.account.swapResult.fetch(swapResultKeypair.publicKey);

        return { success: true, transactionId: tx, swapResult: result };
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        return { success: false, error };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buySOLDevnetBIT10Token = async (tickInName: string, tickOutName: string, tickOutAmount: number, program: any, tokenMint: any, wallet: any) => {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const transfer = await executeSwap(program, tokenMint, {
            tickInName: tickInName,
            tickOutName: tickOutName,
            tickOutAmount: tickOutAmount
        });

        if (transfer.swapResult) {
            const uuid = crypto.randomBytes(16).toString('hex');
            const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
            const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

            const formatTimestamp = (seconds: string): string => {
                const milliseconds = BigInt(seconds) * BigInt(1_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
            };

            const result = await newTokenBuy({
                newTokenBuyId: newTokenSwapId,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                principalId: wallet.publicKey.toString(),
                tickInName: transfer.swapResult.tickInName,
                tickInAmount: transfer.swapResult.tickInAmount.toString(),
                tickInUSDAmount: transfer.swapResult.tickInUsdAmount.toString(),
                tickInTxBlock: transfer.transactionId.toString(),
                tickOutName: transfer.swapResult.tickOutName,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                tickOutAmount: transfer.swapResult.tickOutAmount.words[0].toString(),
                tickOutTxBlock: transfer.transactionId.toString(),
                transactionType: transfer.swapResult.transactionType as 'Swap' | 'Reverse Swap',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                network: transfer.swapResult.network,
                transactionTimestamp: formatTimestamp(transfer.swapResult.transactionTimestamp)
            });

            await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newTokenSwapId: newTokenSwapId,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    principalId: wallet.publicKey.toString(),
                    tickOutName: transfer.swapResult.tickOutName,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    tickOutAmount: transfer.swapResult.tickOutAmount.words[0].toString(),
                    transactionTimestamp: new Date().toISOString(),
                }),
            });

            if (result === 'Token swap successfully') {
                toast.success('Token swap was successful!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
        } else {
            toast.error('Transction approval failed.');
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
