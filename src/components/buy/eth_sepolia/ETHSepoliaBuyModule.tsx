import ETHImg from '@/assets/tokens/eth.svg'
import USDCImg from '@/assets/tokens/usdc.svg'
import BIT10Img from '@/assets/tokens/bit10.svg'
import { type StaticImageData } from 'next/image'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/buy.did'
import { ERC20_ABI } from '@/lib/erc20Abi'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { type usePublicClient } from 'wagmi'
import crypto from 'crypto'
import { newTokenBuy } from '@/actions/dbActions'
import { getTokenName } from '@/lib/utils'

export const paymentTokenETHSepolia = [
    { label: 'ETH', value: 'Ethereum', img: ETHImg as StaticImageData, tokenType: 'ERC20', address: '0x0000000000000000000000000000000000000000e', slug: ['ethereum'] },
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, tokenType: 'ERC20', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', slug: ['usdc', 'stable coin'] }
]

export const bit10TokenbuyETHSepolia = [
    { label: 'Test BIT10.TOP', value: 'Test BIT10.TOP', img: BIT10Img as StaticImageData, tokenType: 'ERC20', address: '0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D', slug: [] }
]

export const fetchSepoliaTokenBalance = async (tokenAddress: string, address: string | undefined, publicClient: ReturnType<typeof usePublicClient>): Promise<string> => {
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
export const buySepoliaBIT10Token = async (tickInName: string, selectedTickInAmount: number, tickOutName: string, tickOutAmount: number, address: string | undefined, walletClient: any) => {
    try {
        let tickInAddress;
        if (tickInName === 'Ethereum') {
            tickInAddress = '0x0000000000000000000000000000000000000000e';
        } else if (tickInName === 'USD Coin') {
            tickInAddress = '0xD274D1F25ddAefC2D5177e163754907da94C5FCa';
        }

        let tickOutAddress;
        if (tickOutName === 'Test BIT10.TOP') {
            tickOutAddress = '0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D';
        }

        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = 'feujt-7iaaa-aaaap-qqc4q-cai';

        const agent = new HttpAgent({ host });

        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const create_transaction = await actor.eth_create_transaction({
            user_wallet_address: address,
            token_in_address: tickInAddress,
            token_in_amount: selectedTickInAmount.toString(),
            token_out_address: tickOutAddress,
            token_out_amount: tickOutAmount.toString()
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
        const transfer = await actor.eth_swap(txHash);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!transfer?.Ok) {
            toast.error('Swap verification failed');
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/ban-ts-comment
        // @ts-expect-error
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
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                principalId: transfer.Ok.user_wallet_address,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
                    newTokenSwapId: newTokenSwapId,
                    principalId: address,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    tickOutName: getTokenName(transfer.Ok.token_out_address),
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
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
        } else {
            toast.error('An error occurred while processing your request. Please try again!');
        }
    } catch (error) {
        toast.error('Error creating Sepolia transaction');
        throw error;
    }
}
