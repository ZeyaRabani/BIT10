import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/bit10.did'
import { type StaticImageData } from 'next/image'
import ICPImg from '@/assets/tokens/icp.svg'
import CkBTCImg from '@/assets/tokens/ckbtc.svg'
import CkETHImg from '@/assets/tokens/cketh.svg'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { toast } from 'sonner'
import { Principal } from '@dfinity/principal'
import { idlFactory as buyidlFactory2 } from '@/lib/buy.did'
import { newTokenSwap } from '@/actions/dbActions'
import { getTokenName } from '@/lib/utils'

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

export const buyPayTokensICP = [
    { label: 'ICP', value: 'ICP', img: ICPImg as StaticImageData, address: 'ryjl3-tyaaa-aaaaa-aaaba-cai', tokenType: 'ICRC', slug: ['internet computer'] },
    { label: 'ckBTC', value: 'ckBTC', img: CkBTCImg as StaticImageData, address: 'mxzaz-hqaaa-aaaar-qaada-cai', tokenType: 'ICRC', slug: ['bitcoin'] },
    { label: 'ckETH', value: 'ckETH', img: CkETHImg as StaticImageData, address: 'ss2fx-dyaaa-aaaar-qacoq-cai', tokenType: 'ICRC', slug: ['ethereum'] },
]

export const buyReceiveTokensICP = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', tokenType: 'ICRC', slug: ['top crypto'] },
]

export const sellPayTokensICP = [
    { label: 'BIT10.DEFI', value: 'BIT10.DEFI', img: BIT10Img as StaticImageData, address: 'bin4j-cyaaa-aaaap-qh7tq-cai', tokenType: 'ICRC', slug: ['defi'] },
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', tokenType: 'ICRC', slug: ['top crypto'] },
]

export const sellReceiveTokensICP = [
    { label: 'ICP', value: 'ICP', img: ICPImg as StaticImageData, address: 'ryjl3-tyaaa-aaaaa-aaaba-cai', tokenType: 'ICRC', slug: ['internet computer'] },
]

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

                const value = Number(balance) / (canisterId == 'ss2fx-dyaaa-aaaar-qacoq-cai' ? 1000000000000000000 : 100000000);
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

export const buyICPBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenOutAmount, tokenInAmount, icpAddress }: { tokenInAddress: string, tokenOutAddress: string, tokenOutAmount: string, tokenInAmount: number, icpAddress: string }) => {
    try {
        const swapCanisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [swapCanisterId, tokenInAddress]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed) {
            toast.info('Allow the transaction on your wallet to proceed.');

            const actor = await window.ic.plug.createActor({
                canisterId: tokenInAddress,
                interfaceFactory: idlFactory,
            }) as ICRC2ActorType;

            const price = Number(tokenInAmount) * 1.5; // More in case of sudden price change 
            const amount = Math.round(price * 100000000).toFixed(0);
            const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

            const args = {
                spender: {
                    owner: Principal.fromText(swapCanisterId),
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
                    canisterId: swapCanisterId,
                    interfaceFactory: buyidlFactory2,
                });

                const args2 = {
                    token_in_address: tokenInAddress,
                    token_out_address: tokenOutAddress,
                    token_out_amount: tokenOutAmount
                };

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const transfer = await actor2.icp_buy(args2);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (transfer.Ok) {
                    const formatTimestamp = (nanoseconds: string): string => {
                        const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                        const date = new Date(Number(milliseconds));

                        return date.toISOString().replace('T', ' ').replace('Z', '+00');
                    };

                    const result = await newTokenSwap({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        newTokenSwapId: transfer.Ok.swap_id,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        principalId: transfer.Ok.user_wallet_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tickInName: transfer.Ok.token_in_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickInAmount: transfer.Ok.token_in_amount.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickInUSDAmount: transfer.Ok.token_in_usd_amount.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickInTxBlock: transfer.Ok.token_in_tx_hash.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickOutName: transfer.Ok.token_out_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickOutAmount: transfer.Ok.token_out_amount.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickOutTxBlock: transfer.Ok.token_out_tx_hash.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        transactionType: transfer.Ok.transaction_type,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        network: transfer.Ok.network,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                        transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
                    });

                    await fetch('/bit10-token-request', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            newTokenSwapId: transfer.Ok.swap_id,
                            principalId: icpAddress,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                            tickOutName: getTokenName(transfer.Ok.token_out_address),
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                } else if (transfer.Err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
            } else {
                toast.error('Approval failed.');
            }
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};

export const sellICPBIT10Token = async ({ tokenInAddress, tokenOutAddress, tokenInAmount, icpAddress }: { tokenInAddress: string, tokenOutAddress: string, tokenInAmount: number, icpAddress: string }) => {
    try {
        const swapCanisterId = '6phs7-6yaaa-aaaap-qpvoq-cai';

        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [swapCanisterId, tokenInAddress]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed) {
            toast.info('Allow the transaction on your wallet to proceed.');

            const actor = await window.ic.plug.createActor({
                canisterId: tokenInAddress,
                interfaceFactory: idlFactory,
            }) as ICRC2ActorType;

            const price = Number(tokenInAmount) * 1.5; // More in case of sudden price change 
            const amount = Math.round(price * 100000000).toFixed(0);
            const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

            const args = {
                spender: {
                    owner: Principal.fromText(swapCanisterId),
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
                    canisterId: swapCanisterId,
                    interfaceFactory: buyidlFactory2,
                });

                const args2 = {
                    token_in_address: tokenInAddress,
                    token_in_amount: tokenInAmount.toString(),
                    token_out_address: tokenOutAddress
                };

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const transfer = await actor2.icp_sell(args2);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (transfer.Ok) {
                    const formatTimestamp = (nanoseconds: string): string => {
                        const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                        const date = new Date(Number(milliseconds));

                        return date.toISOString().replace('T', ' ').replace('Z', '+00');
                    };

                    const result = await newTokenSwap({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        newTokenSwapId: transfer.Ok.swap_id,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        principalId: transfer.Ok.user_wallet_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tickInName: transfer.Ok.token_in_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickInAmount: transfer.Ok.token_in_amount.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickInUSDAmount: transfer.Ok.token_in_usd_amount.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickInTxBlock: transfer.Ok.token_in_tx_hash.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickOutName: transfer.Ok.token_out_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickOutAmount: transfer.Ok.token_out_amount.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        tickOutTxBlock: transfer.Ok.token_out_tx_hash.toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        transactionType: transfer.Ok.transaction_type,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                        network: transfer.Ok.network,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                        transactionTimestamp: formatTimestamp(transfer.Ok.transaction_timestamp)
                    });

                    await fetch('/bit10-token-request', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            newTokenSwapId: transfer.Ok.swap_id,
                            principalId: icpAddress,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
                            tickOutName: getTokenName(transfer.Ok.token_out_address),
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
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                } else if (transfer.Err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
            } else {
                toast.error('Approval failed.');
            }
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
