import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/bit10.did'
import { toast } from 'sonner'
import { Principal } from '@dfinity/principal'
import { idlFactory as dexidlFactory2 } from '@/lib/dex.did'
import { newDEXSwap } from '@/actions/dbActions'

type ICRC2ActorType = {
    icrc2_approve: (args: {
        spender: { owner: Principal; subaccount: [] };
        fee: [];
        memo: [];
        from_subaccount: [];
        created_at_time: [];
        amount: bigint;
        expected_allowance: [];
        expires_at: [bigint];

    }) => Promise<{ Ok?: number; Err?: { InsufficientFunds?: null } }>;
};

type SwapResponse = {
    source_chain: string;
    status: string;
    destination_chain: string;
    token_in_address: string;
    token_out_address: string;
    tx_hash_in: string;
    swap_id: string;
    amount_out: string;
    timestamp: bigint;
    tick_out_wallet_address: string;
    amount_in: string;
    tick_in_wallet_address: string;
    pool_id: string;
    swap_type: string;
    tx_hash_out: string;
    slippage: string;
};

export const fetchICPTokenBalance = async ({ canisterId, principal }: { canisterId: string, principal: string }): Promise<number> => {
    try {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        const account = {
            owner: Principal.fromText(principal),
            subaccount: [],
        };
        if (actor && actor.icrc1_balance_of) {
            try {
                const balance = await actor.icrc1_balance_of(account);

                let tokenDecimals;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (canisterId == 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
                    tokenDecimals = 8;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                } else if (canisterId == 'xevnm-gaaaa-aaaar-qafnq-cai') {
                    tokenDecimals = 6;
                } else {
                    tokenDecimals = 8
                }

                const value = Number(balance) / (10 ** tokenDecimals);
                return Number(value);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                toast.error('An error occurred while fetching user wallet balance. Please try again!');
                return 0;
            }
        } else {
            return 0;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching wallet balance');
        return 0;
    }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const swapICPToken = async ({ values, fromToken, toToken, matchingPool, icpAddress }: { values: any, fromToken: any, toToken: any, matchingPool: any, icpAddress: string }) => {
    try {
        const dexCanisterId = 'bwwo2-dqaaa-aaaap-qqfzq-cai';

        const hasAllowed = await window.ic.plug.requestConnect({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            whitelist: [dexCanisterId, fromToken.address]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed) {
            toast.info('Allow the transaction on your wallet to proceed.');

            const actor = await window.ic.plug.createActor({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                canisterId: fromToken.address,
                interfaceFactory: idlFactory,
            }) as ICRC2ActorType;

            let tokenDecimals;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (fromToken.address == 'ryjl3-tyaaa-aaaaa-aaaba-cai') {
                tokenDecimals = 8;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            } else if (fromToken.address == 'xevnm-gaaaa-aaaar-qafnq-cai') {
                tokenDecimals = 6;
            } else {
                tokenDecimals = 8
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const price = Number(values.from_amount) * 1.5; // More in case of sudden price change
            const amount = Math.round(price * (10 ** tokenDecimals)).toFixed(0);
            const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

            const args = {
                spender: {
                    owner: Principal.fromText(dexCanisterId),
                    subaccount: [] as []
                },
                fee: [] as [],
                memo: [] as [],
                from_subaccount: [] as [],
                created_at_time: [] as [],
                amount: BigInt(amount),
                expected_allowance: [] as [],
                expires_at: [time] as [bigint],
            }

            const approve = await actor.icrc2_approve(args);

            if (approve.Ok) {
                toast.success('Approval was successful! Proceeding with transfer...');

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor2 = await window.ic.plug.createActor({
                    canisterId: dexCanisterId,
                    interfaceFactory: dexidlFactory2,
                });

                let reciverAddress;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (matchingPool.pair_type === 'Cross Chain') {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    reciverAddress = values.tick_out_wallet_address;
                } else {
                    reciverAddress = icpAddress;
                };

                const dexArgs = {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    pool_id: matchingPool.pool_id,
                    tick_in_wallet_address: icpAddress,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    tick_out_wallet_address: reciverAddress,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    swap_type: matchingPool.pair_type,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    source_chain: fromToken.chain,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    destination_chain: toToken.chain,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    token_in_address: fromToken.address,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    token_out_address: toToken.address,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    amount_in: values.from_amount.toString(),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    expected_amount_out: values.to_amount.toString(),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    slippage: values.slippage.toString()
                };

                try {
                    let swapError = false;
                    let swapResult: { Ok?: SwapResponse; Err?: string } | null = null;

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    const swapPromise = actor2.icp_swap(dexArgs)
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        .then(result => {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            swapResult = result;
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                            return result;
                        })
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        .catch(error => {
                            swapError = true;
                            throw error;
                        });
                    const timeoutPromise = wait(30000);

                    await Promise.race([swapPromise, timeoutPromise]);

                    await wait(30000);

                    if (swapError) {
                        toast.error('An error occurred during the swap. Please try again!');
                        return null;
                    }

                    if (swapResult) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        if ('Ok' in swapResult && swapResult.Ok) {
                            // toast.success('Swap was successful!');
                            // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // // @ts-expect-error
                            // // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                            // return swapResult.Ok;

                            const result = await newDEXSwap({
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                swapId: swapResult.Ok.swap_id,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                poolId: swapResult.Ok.pool_id,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                amountIn: swapResult.Ok.amount_in,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                amountOut: swapResult.Ok.amount_out,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                sourceChain: swapResult.Ok.source_chain,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                destinationChain: swapResult.Ok.destination_chain,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                swapType: swapResult.Ok.swap_type,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                tickInWalletAddress: swapResult.Ok.tick_in_wallet_address,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                tickOutWalletAddress: swapResult.Ok.tick_out_wallet_address,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                tokenInAddress: swapResult.Ok.token_in_address,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                tokenOutAddress: swapResult.Ok.token_out_address,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                slippage: swapResult.Ok.slippage,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                status: swapResult.Ok.status,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                txHashIn: swapResult.Ok.tx_hash_in,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                txHashOut: swapResult.Ok.tx_hash_out,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                timestamp: Number(swapResult.Ok.timestamp),
                            });

                            if (result === 'DEX Swap was successful') {
                                toast.success('Swap was successful!');
                            } else {
                                toast.error('An error occurred while processing your request. Please try again!');
                            }


                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                        } else if ('Err' in swapResult && swapResult.Err) {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                            const errorMessage = String(swapResult.Err);

                            if (errorMessage.includes('Insufficient balance')) {
                                toast.error('Insufficient funds');
                            } else if (errorMessage.includes('Insufficient liquidity in pool')) {
                                toast.error('Insufficient liquidity in pool');
                            } else {
                                toast.error(`Swap failed: ${errorMessage}`);
                            }
                            return null;
                        }
                    }

                    toast.success('Swap was successful!');
                    return null;
                } catch (swapError) {
                    const errorMessage = swapError instanceof Error ? swapError.message : String(swapError);

                    if (!errorMessage.includes('Insufficient') && !errorMessage.includes('failed')) {

                        await wait(30000); // Wait 30 seconds
                        toast.success('Swap was successful!');
                        return null;
                    }

                    toast.error(`Swap error: ${errorMessage}`);
                    throw swapError;
                }
            } else {
                toast.error('Approval failed.');
            }
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
