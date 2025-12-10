import { type StaticImageData } from 'next/image'
import SOLImg from '@/assets/tokens/sol.svg'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { toast } from 'sonner'
import { env } from '@/env'
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Connection, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { formatCompactNumber, getTokenName } from '@/lib/utils'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory as buyidlFactory2 } from '@/lib/buy.did'
import { newTokenSwap } from '@/actions/dbActions'

export const buyPayTokensSolana = [
    { label: 'SOL', value: 'Solana', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111111', tokenType: 'SPL', slug: ['sol', 'solana'] },
]

export const buyReceiveTokensSolana = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', tokenType: 'SPL', slug: ['top crypto'] },
]

export const sellPayTokensSolana = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', tokenType: 'SPL', slug: ['top crypto'] },
]

export const sellReceiveTokensSolana = [
    { label: 'SOL', value: 'Solana', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111111', tokenType: 'SPL', slug: ['sol', 'solana'] },
]

const getCustomConnection = (): Connection => {
    const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
    });
};

const decodeHexData = (hex: string): string => {
    if (hex.startsWith('0x')) {
        hex = hex.substring(2);
    }

    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buySolanaBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenOutAmount, tokenInAmount, solanaAddress, wallet }: { tokenInAddress: string, tokenOutAddress: string, tokenOutAmount: string, tokenInAmount: string, solanaAddress: string, wallet: any }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
            toast.error('Please connect your wallet first');
            return null;
        }

        const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');

        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(buyidlFactory2, {
            agent,
            canisterId,
        });

        const TOKEN_MINT = new PublicKey(tokenOutAddress);
        const connection = getCustomConnection();

        const mintInfo = await connection.getAccountInfo(TOKEN_MINT);

        if (!mintInfo) {
            toast.dismiss();
            toast.error('Token mint does not exist on this network');
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const fromPubkey = wallet.publicKey;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
        const ata = await getAssociatedTokenAddress(TOKEN_MINT, fromPubkey, false, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const accountInfo = await connection.getAccountInfo(ata);
        const ataExists = accountInfo !== null;

        if (!ataExists) {
            toast.loading('Creating Associated Token Account');

            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                const createATAInstruction = createAssociatedTokenAccountInstruction(fromPubkey, ata, fromPubkey, TOKEN_MINT, tokenProgramId, ASSOCIATED_TOKEN_PROGRAM_ID);

                const { blockhash } = await connection.getLatestBlockhash('finalized');

                const messageV0 = new TransactionMessage({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    payerKey: fromPubkey,
                    recentBlockhash: blockhash,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    instructions: [
                        ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
                        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
                        createATAInstruction
                    ],
                }).compileToV0Message();

                const ataTransaction = new VersionedTransaction(messageV0);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const ataSignature = await wallet.sendTransaction(ataTransaction, connection, {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                });

                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                await connection.confirmTransaction(ataSignature, 'confirmed');

                toast.dismiss();
                toast.success('Associated Token Account created successfully!');
            } catch (ataError) {
                toast.dismiss();
                toast.error('Failed to create Associated Token Account');
                throw ataError;
            }
        } else {
            toast.dismiss();
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const create_transaction = await actor.solana_create_transaction({
            user_wallet_address: solanaAddress,
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount,
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const toPubkey = new PublicKey(create_transaction.to);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const amount = Number(create_transaction.value);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const memoData = decodeHexData(create_transaction.data);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const balance = await connection.getBalance(fromPubkey);

        if (balance < amount) {
            toast.dismiss();
            toast.error(`Insufficient balance. Have: ${balance / 1e9} SOL, Need: ${amount / 1e9} SOL`);
            return null;
        }

        const instructions = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
            new TransactionInstruction({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                keys: [{ pubkey: fromPubkey, isSigner: true, isWritable: false }],
                programId: MEMO_PROGRAM_ID,
                data: Buffer.from(memoData, 'utf-8'),
            }),
            SystemProgram.transfer({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                fromPubkey,
                toPubkey,
                lamports: amount,
            })
        ];

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

        const messageV0 = new TransactionMessage({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            payerKey: fromPubkey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const signature = await wallet.sendTransaction(transaction, connection, {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

        if (confirmation.value.err) {
            toast.dismiss();
            toast.error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            return null;
        }

        toast.dismiss();
        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const transfer = await actor.solana_buy(signature);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (transfer.Ok) {
            const formatTimestamp = (nanoseconds: string): string => {
                const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
            };

            const result = await newTokenSwap({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                newTokenSwapId: transfer.Ok.swap_id,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                principalId: transfer.Ok.user_wallet_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInName: transfer.Ok.token_in_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInAmount: transfer.Ok.token_in_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInUSDAmount: transfer.Ok.token_in_usd_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInTxBlock: transfer.Ok.token_in_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutName: transfer.Ok.token_out_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutAmount: transfer.Ok.token_out_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutTxBlock: transfer.Ok.token_out_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                transactionType: transfer.Ok.transaction_type,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                network: transfer.Ok.network,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
            });

            await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    newTokenSwapId: transfer.Ok.swap_id,
                    principalId: solanaAddress,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                    tickOutName: getTokenName(transfer.Ok.token_out_address),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    tickOutAmount: transfer.Ok.token_out_amount.toString(),
                    transactionTimestamp: new Date().toISOString(),
                }),
            });

            if (result === 'Token swap successfully') {
                toast.success('Token swap was successful!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
        } else if (transfer.Err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const errorMessage = String(transfer.Err);
            if (errorMessage.includes('Insufficient balance')) {
                toast.error('Insufficient funds');
            } else if (errorMessage.includes('less than available supply')) {
                toast.error('The requested amount exceeds the available supply. Please enter a lower amount.');
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sellSolanaBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenOutAmount, tokenInAmount, solanaAddress, wallet }: { tokenInAddress: string, tokenOutAddress: string, tokenOutAmount: string, tokenInAmount: string, solanaAddress: string, wallet: any }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
            toast.error('Please connect your wallet first');
            return null;
        }

        const MEMO_PROGRAM_ID = new PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo');

        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(buyidlFactory2, {
            agent,
            canisterId,
        });

        const connection = getCustomConnection();
        const TOKEN_MINT = new PublicKey(tokenInAddress);

        const mintInfo = await connection.getAccountInfo(TOKEN_MINT);

        if (!mintInfo) {
            toast.dismiss();
            toast.error('Token mint does not exist on this network');
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const isToken2022 = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const create_transaction = await actor.solana_create_sell_transaction({
            user_wallet_address: solanaAddress,
            token_in_address: tokenInAddress,
            token_in_amount: tokenInAmount,
            token_out_address: tokenOutAddress,
            token_out_amount: tokenOutAmount,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const fromPubkey = new PublicKey(create_transaction.from);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const toPubkey = new PublicKey(create_transaction.to);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const amount = Number(create_transaction.value);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
        const fromATA = await getAssociatedTokenAddress(
            TOKEN_MINT,
            fromPubkey,
            false,
            tokenProgramId,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
        const toATA = await getAssociatedTokenAddress(
            TOKEN_MINT,
            toPubkey,
            false,
            tokenProgramId,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const mint = await getMint(connection, TOKEN_MINT, undefined, tokenProgramId);
        const decimals = mint.decimals;

        const instructions = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }),
        ];

        const transferInstruction = createTransferCheckedInstruction(
            fromATA,
            TOKEN_MINT,
            toATA,
            fromPubkey,
            amount,
            decimals,
            [],
            tokenProgramId
        );

        instructions.push(transferInstruction);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const memoData = decodeHexData(create_transaction.data);

        const memoInstruction = new TransactionInstruction({
            keys: [
                { pubkey: fromPubkey, isSigner: true, isWritable: false }
            ],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(memoData, 'utf-8'),
        });

        instructions.push(memoInstruction);

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

        const messageV0 = new TransactionMessage({
            payerKey: fromPubkey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const signature = await wallet.sendTransaction(transaction, connection, {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 5
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

        if (confirmation.value.err) {
            toast.dismiss();
            toast.error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            return null;
        }

        toast.dismiss();
        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //  @ts-expect-error
        const transfer = await actor.solana_sell(signature);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (transfer.Ok) {
            const formatTimestamp = (nanoseconds: string): string => {
                const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                const date = new Date(Number(milliseconds));

                return date.toISOString().replace('T', ' ').replace('Z', '+00');
            };

            const result = await newTokenSwap({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                newTokenSwapId: transfer.Ok.swap_id,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                principalId: transfer.Ok.user_wallet_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInName: transfer.Ok.token_in_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInAmount: transfer.Ok.token_in_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInUSDAmount: transfer.Ok.token_in_usd_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickInTxBlock: transfer.Ok.token_in_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutName: transfer.Ok.token_out_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutAmount: transfer.Ok.token_out_amount.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tickOutTxBlock: transfer.Ok.token_out_tx_hash.toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                transactionType: transfer.Ok.transaction_type,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                network: transfer.Ok.network,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
            });

            await fetch('/bit10-token-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    newTokenSwapId: transfer.Ok.swap_id,
                    principalId: solanaAddress,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                    tickOutName: getTokenName(transfer.Ok.token_out_address),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    tickOutAmount: transfer.Ok.token_out_amount.toString(),
                    transactionTimestamp: new Date().toISOString(),
                }),
            });

            if (result === 'Token swap successfully') {
                toast.success('Token swap was successful!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
        } else if (transfer.Err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const errorMessage = String(transfer.Err);
            if (errorMessage.includes('Insufficient balance')) {
                toast.error('Insufficient funds');
            } else if (errorMessage.includes('less than available supply')) {
                toast.error('The requested amount exceeds the available supply. Please enter a lower amount.');
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
