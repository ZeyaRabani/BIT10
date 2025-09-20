import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/lending_and_borrowing.did'
import { ERC20_ABI } from '@/lib/erc20Abi'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { type usePublicClient } from 'wagmi'
import { newTokenLend } from '@/actions/dbActions'

const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
const canisterId = 'dp57e-fyaaa-aaaap-qqclq-cai';

const agent = new HttpAgent({ host });
const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
});

export const fetchSepoliaTokenBalance = async (
    tokenAddress: string,
    address: string | undefined,
    publicClient: ReturnType<typeof usePublicClient>
): Promise<string> => {
    try {
        if (!address || !publicClient) {
            return '0';
        }

        if (tokenAddress === '0x0000000000000000000000000000000000000000e') {
            const balance = await publicClient.getBalance({
                address: address as `0x${string}`,
            });
            return formatUnits(balance, 18);
        } else {
            const decimals = await publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'decimals',
            });

            const balance = await publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                args: [address],
            });

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            return formatUnits(balance as bigint, decimals as number);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching Sepolia balance');
        return '0';
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createETHSepoliaLendTransaction = async ({ values, tokenAddress, address, chain, walletClient }: { values: any, tokenAddress: string, address: string, chain: string, walletClient: any }) => {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const create_transaction = await actor.eth_lend_create_transaction({
            lender_address: address,
            token_chain: chain,
            token_address: tokenAddress,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            token_amount: (values.lend_amount).toString(),
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const txData = create_transaction.transaction_data;

        const transaction = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            from: txData.from,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            to: txData.to,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            data: txData.data,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            value: txData.value,
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const txHash = await walletClient.sendTransaction(transaction);

        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const lending = await actor.eth_lend(txHash);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (lending.Ok) {
            const result = await newTokenLend({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                lendId: lending.Ok.lend_id,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                lenderAddress: lending.Ok.lender_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tokenChain: lending.Ok.token_chain,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tokenAddress: lending.Ok.token_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                tokenAmount: Number(lending.Ok.token_amount).toString(),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                tokenSentTrxHash: lending.Ok.token_sent_trx_hash,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                interestRate: lending.Ok.interest_rate,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                status: lending.Ok.status,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                openedAt: lending.Ok.opened_at
            });

            if (result === 'Lending successfully') {
                toast.success('Lending was successful!');
            } else {
                toast.error('An error occurred while processing your request. Please try again!');
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } else if (lending.Err) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
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
    }
    catch (error) {
        toast.error('Error creating lending transaction');
        throw error;
    }
}
