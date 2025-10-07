import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/bit10.did'
import { idlFactory as buyidlFactory2 } from '@/lib/buy.did'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { type StaticImageData } from 'next/image'
import { toast } from 'sonner'
import { formatAmount } from '@/lib/utils'
import { Principal } from '@dfinity/principal'
import crypto from 'crypto'
import { newTokenBuy } from '@/actions/dbActions'

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

export const paymentTokenbuyICP = [
    { label: 'BIT10.BTC', value: 'BIT10.BTC', img: BIT10Img as StaticImageData, tokenType: 'ICRC', chain: 'icp', address: 'eegan-kqaaa-aaaap-qhmgq-cai', slug: ['bitcoin'] }
]

export const bit10TokenbuyICP = [
    { label: 'Test BIT10.TOP', value: 'Test BIT10.TOP', img: BIT10Img as StaticImageData, tokenType: 'ICRC', chain: 'icp', address: 'wbckh-zqaaa-aaaap-qpuza-cai', slug: [] },
    { label: 'Test BIT10.MEME', value: 'Test BIT10.MEME', img: BIT10Img as StaticImageData, tokenType: 'ICRC', chain: 'icp', address: 'yeoei-eiaaa-aaaap-qpvzq-cai', slug: [] }
]

export const fetchICPTokenBalance = async (canisterId: string, principal: string): Promise<number> => {
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

                const value = Number(balance) / 100000000;
                const formattedValue = formatAmount(Number(value));
                return Number(formattedValue);
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
        toast.error('Error fetching Sepolia balance');
        return 0;
    }
};

export const buyICPBIT10Token = async (tickInName: string, tickOutName: string, tickOutAmount: number, selectedTickInAmount: number, icpAddress: string) => {
    try {
        const bit10BTCCanisterId = 'eegan-kqaaa-aaaap-qhmgq-cai';
        const swapCanisterId = 'feujt-7iaaa-aaaap-qqc4q-cai';

        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [bit10BTCCanisterId, swapCanisterId]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (hasAllowed && selectedTickInAmount) {
            toast.info('Allow the transaction on your wallet to proceed.');

            const selectedCanisterId = bit10BTCCanisterId;

            const actor = await window.ic.plug.createActor({
                canisterId: selectedCanisterId,
                interfaceFactory: idlFactory,
            }) as ICRC2ActorType;

            const selectedAmount = selectedTickInAmount * 2; // More in case of sudden price change

            const price = selectedAmount;
            const amount = Math.round((price * 100000000) + 1000).toFixed(0); // For transfer fee
            const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000)

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

            if (approve.Ok && icpAddress) {
                toast.success('Approval was successful! Proceeding with transfer...');

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor2 = await window.ic.plug.createActor({
                    canisterId: swapCanisterId,
                    interfaceFactory: buyidlFactory2,
                });

                const args2 = {
                    tick_in_name: tickInName,
                    tick_out_name: tickOutName,
                    tick_out_amount: tickOutAmount
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const transfer = await actor2.icp_swap(args2);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (transfer.Ok) {
                    const uuid = crypto.randomBytes(16).toString('hex');
                    const generateNewTokenSwapId = uuid.substring(0, 8) + uuid.substring(9, 13) + uuid.substring(14, 18) + uuid.substring(19, 23) + uuid.substring(24);
                    const newTokenSwapId = 'swap_' + generateNewTokenSwapId;

                    const formatTimestamp = (nanoseconds: string): string => {
                        const milliseconds = BigInt(nanoseconds) / BigInt(1_000_000);
                        const date = new Date(Number(milliseconds));

                        return date.toISOString().replace('T', ' ').replace('Z', '+00');
                    };

                    const result = await newTokenBuy({
                        newTokenBuyId: newTokenSwapId,
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
                            newTokenSwapId: newTokenSwapId,
                            principalId: icpAddress,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickOutName: transfer.Ok.token_out_address,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                            tickOutAmount: transfer.Ok.token_out_amount,
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
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }
            } else {
                toast.error('Approval failed.');
            }
        } else {
            toast.error('Transfer failed.');
        }
    } catch (error) {
        toast.error('An error occurred while processing your request. Please try again!');
        throw error;
    }
};
