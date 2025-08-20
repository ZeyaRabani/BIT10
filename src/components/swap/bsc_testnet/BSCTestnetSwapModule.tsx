import { createPublicClient, http } from 'viem'
import { bscTestnet } from 'viem/chains'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/dex.did'
import { ERC20_ABI } from '@/lib/erc20Abi'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { ethers } from 'ethers'
import { newDEXSwap } from '@/actions/dbActions'

const bscTestnetClient = createPublicClient({
    chain: bscTestnet,
    transport: http(),
});

const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
const canisterId = 't2vfi-5aaaa-aaaap-qqbfa-cai';

const agent = new HttpAgent({ host });
const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
});

export const fetchBscTestnetTokenBalance = async (tokenAddress: string, address: string | undefined): Promise<string> => {
    try {
        if (!address) {
            return '0';
        }

        if (tokenAddress === '0x0000000000000000000000000000000000000000b') {
            const balance = await bscTestnetClient.getBalance({
                address: address as `0x${string}`,
            });
            return formatUnits(balance, 18);
        } else {
            const decimals = await bscTestnetClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'decimals',
            });

            const balance = await bscTestnetClient.readContract({
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
        toast.error('Error fetching BSC Testnet balance');
        return '0';
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createBscTestnetTransaction = async (matchingPool: any, fromToken: any, toToken: any, values: any, address: string | undefined) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const tickOutWalletAddress = matchingPool.pair_type == 'Same-Chain' ? address : values.tick_out_wallet_address;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (matchingPool.pair_type == 'Cross-Chain' && !tickOutWalletAddress) {
            toast.error('Recipient address is required for cross-chain swaps');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const create_transaction = await actor.create_transaction({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            pool_id: matchingPool.pool_id,
            tick_in_wallet_address: address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            tick_out_wallet_address: tickOutWalletAddress,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            swap_type: matchingPool.pair_type,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            source_chain: fromToken?.chain,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            destination_chain: toToken?.chain,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            token_in_address: fromToken?.address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            token_out_address: toToken?.address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            amount_in: values.from_amount.toString(),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            expected_amount_out: values.to_amount.toString(),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            slippage: values.slippage.toString(),
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const txData = create_transaction.Ok.transaction_data;

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

        const txHash = await signer.sendTransaction(transaction);

        toast.info('Transaction sent! Waiting for confirmation...');

        // Wait for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 10000));

        let verifyAndSwap;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (matchingPool.pair_type == 'Same-Chain') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            verifyAndSwap = await actor.verify_and_swap({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                pool_id: matchingPool.pool_id,
                transaction_hash: txHash.hash,
            });
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            verifyAndSwap = await actor.cross_chain_verify_and_swap({
                source_chain: 'bsc',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                pool_id: matchingPool.pool_id,
                transaction_hash: txHash.hash,
            });
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!verifyAndSwap?.Ok?.Success) {
            toast.error('Swap verification failed');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const swapData = verifyAndSwap.Ok.Success;

        const result = await newDEXSwap({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            poolId: swapData.pool_id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            amountIn: swapData.amount_in,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            amountOut: swapData.amount_out,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            sourceChain: swapData.source_chain,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            destinationChain: swapData.destination_chain,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            swapType: swapData.swap_type,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            tickInWalletAddress: swapData.tick_in_wallet_address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            tickOutWalletAddress: swapData.tick_out_wallet_address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            tokenInAddress: swapData.token_in_address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            tokenOutAddress: swapData.token_out_address,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            slippage: swapData.slippage,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            status: swapData.status,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            txHashIn: swapData.tx_hash_in,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            txHashOut: swapData.tx_hash_out,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            timestamp: Number(swapData.timestamp),
        });

        if (result === 'DEX Swap was successful') {
            toast.success('Token swap was successful!');
        } else {
            toast.error('An error occurred while processing your request. Please try again!');
        }

        return txHash.hash;
    } catch (error) {
        toast.error('Error creating BSC Testnet transaction');
        throw error;
    }
};
