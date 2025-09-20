import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { idlFactory } from '@/lib/bit10.did'
import { idlFactory as lendingAndBorrowingIDLFactory } from '@/lib/lending_and_borrowing.did'
import { toast } from 'sonner'
import { newTokenLend, newTokenBorrow } from '@/actions/dbActions'

const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
const agent = new HttpAgent({ host });

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

export const fetchICPTokenBalance = async (canisterId: string, address: string): Promise<number> => {
    try {
        if (!address) {
            return 0;
        }

        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        const account = {
            owner: Principal.fromText(address),
            subaccount: [],
        };

        if (actor && actor.icrc1_balance_of) {
            const balance = await actor.icrc1_balance_of(account);

            const value = Number(balance) / 100000000;

            return value;
        } else {
            toast.error('An error occurred while fetching user wallet balance. Please try again!');
            return 0;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching user balance');
        return 0;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createICPLendTransaction = async ({ values, tokenAddress, address, chain }: { values: any, tokenAddress: string, address: string, chain: string }) => {
    try {
        const lendingAndBorrowingCanister = 'dp57e-fyaaa-aaaap-qqclq-cai';

        const hasAllowed = await window.ic.plug.requestConnect({
            whitelist: [tokenAddress, lendingAndBorrowingCanister]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (hasAllowed) {
            toast.info('Allow the transaction on your wallet to proceed.');

            const actor = await window.ic.plug.createActor({
                canisterId: tokenAddress,
                interfaceFactory: idlFactory,
            }) as ICRC2ActorType;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            const selectedAmount = parseFloat(values.lend_amount) * 1.1;

            const price = selectedAmount;
            const amount = Math.round(price * 100000000).toFixed(0);
            const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

            const args = {
                spender: {
                    owner: Principal.fromText(lendingAndBorrowingCanister),
                    subaccount: [] as []
                },
                fee: [] as [],
                memo: [] as [],
                from_subaccount: [] as [],
                created_at_time: [] as [],
                amount: BigInt(amount),
                expected_allowance: [] as [],
                expires_at: [time] as [bigint],
            };

            const approve = await actor.icrc2_approve(args);

            if (approve.Ok && address) {
                toast.success('Approval was successful! Proceeding with lending...');

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor2 = await window.ic.plug.createActor({
                    canisterId: lendingAndBorrowingCanister,
                    interfaceFactory: lendingAndBorrowingIDLFactory,
                });

                const args2 = {
                    lender_address: address,
                    token_chain: chain,
                    token_address: tokenAddress,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    token_amount: (values.lend_amount).toString(),
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const lending = await actor2.icp_lend(args2);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (lending.Ok) {
                    const result = await newTokenLend({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        lendId: lending.Ok.lend_id,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        lenderAddress: lending.Ok.lender_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tokenChain: lending.Ok.token_chain,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tokenAddress: lending.Ok.token_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                        tokenAmount: Number(lending.Ok.token_amount).toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        tokenSentTrxHash: lending.Ok.token_sent_trx_hash,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        interestRate: lending.Ok.interest_rate,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        status: lending.Ok.status,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        openedAt: lending.Ok.opened_at
                    });

                    if (result === 'Lending successfully') {
                        toast.success('Lending was successful!');
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                } else if (lending.Err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const errorMessage = String(lending.Err);
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
            toast.error('Error creating lending transaction');
        }
    } catch (error) {
        toast.error('Error creating lending transaction');
        throw error;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createICPBorrowTransaction = async ({ address, values, borrowingTokenChain, borrowingTokenAddress }: { address: string, values: any, borrowingTokenChain: string, borrowingTokenAddress: string }) => {
    try {
        const lendingAndBorrowingCanister = 'dp57e-fyaaa-aaaap-qqclq-cai';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const collateralTokenAddess = values.collateral_token;

        const hasAllowed = await window.ic.plug.requestConnect({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            whitelist: [collateralTokenAddess, lendingAndBorrowingCanister]
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (hasAllowed) {
            toast.info('Allow the transaction on your wallet to proceed.');

            const actor = await window.ic.plug.createActor({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                canisterId: collateralTokenAddess,
                interfaceFactory: idlFactory,
            }) as ICRC2ActorType;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            const selectedAmount = parseFloat(values.collateral_amount) * 1.1;

            const price = selectedAmount;
            const amount = Math.round(price * 100000000).toFixed(0);
            const time = BigInt(Date.now()) * BigInt(1_000_000) + BigInt(300_000_000_000);

            const args = {
                spender: {
                    owner: Principal.fromText(lendingAndBorrowingCanister),
                    subaccount: [] as []
                },
                fee: [] as [],
                memo: [] as [],
                from_subaccount: [] as [],
                created_at_time: [] as [],
                amount: BigInt(amount),
                expected_allowance: [] as [],
                expires_at: [time] as [bigint],
            };

            const approve = await actor.icrc2_approve(args);

            if (approve.Ok && address) {
                toast.success('Approval was successful! Proceeding with borrowing...');

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const actor2 = await window.ic.plug.createActor({
                    canisterId: lendingAndBorrowingCanister,
                    interfaceFactory: lendingAndBorrowingIDLFactory,
                });

                let borrow_wallet_address;
                if (borrowingTokenChain === 'icp') {
                    borrow_wallet_address = address;
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    borrow_wallet_address = values.borrow_wallet_address;
                }

                const args2 = {
                    borrower_address: address,
                    borrow_token_chain: borrowingTokenChain,
                    borrow_token_address: borrowingTokenAddress,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    borrow_token_amount: (values.borrow_amount).toString(),
                    collateral_token_chain: 'icp',
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    collateral_token_address: values.collateral_token,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    collateral_token_amount: (values.collateral_amount).toString(),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    borrow_wallet_address: borrow_wallet_address,
                };

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                const borrowing = await actor2.icp_borrow(args2);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (borrowing.Ok) {
                    const result = await newTokenBorrow({
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowId: borrowing.Ok.borrow_id,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowerAddress: borrowing.Ok.borrower_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowTokenChain: borrowing.Ok.borrow_token_chain,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowTokenAddress: borrowing.Ok.borrow_token_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowTokenAmount: Number(borrowing.Ok.borrow_token_amount).toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowTrxHash: borrowing.Ok.borrow_trx_hash,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        collateralAddress: borrowing.Ok.collateral_token_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        collateralChain: borrowing.Ok.collateral_token_chain,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        collateralAmount: Number(borrowing.Ok.collateral_token_amount).toString(),
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        collateralTrxHash: borrowing.Ok.collateral_trx_hash,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        borrowWalletAddress: borrowing.Ok.borrow_wallet_address,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        interestRate: borrowing.Ok.interest_rate,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        status: borrowing.Ok.status,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        openedAt: borrowing.Ok.opened_at
                    });

                    if (result === 'Borrowing successfully') {
                        toast.success('Borrowing was successful!');
                    } else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                } else if (borrowing.Err) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const errorMessage = String(borrowing.Err);
                    if (errorMessage.includes('Insufficient balance')) {
                        toast.error('Insufficient funds');
                    } else if (errorMessage.includes('Insufficient liquidity.'))
                        toast.error('Insufficient liquidity in the pool. Please try again with a lower borrow amount.')
                    else {
                        toast.error('An error occurred while processing your request. Please try again!');
                    }
                } else {
                    toast.error('An error occurred while processing your request. Please try again!');
                }

            } else {
                toast.error('Approval failed.');
            }
        } else {
            toast.error('Error creating borrow transaction');
        }
    } catch (error) {
        toast.error('Error creating borrow transaction');
        throw error;
    }
};
