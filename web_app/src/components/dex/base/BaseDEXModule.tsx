import { ERC20_ABI } from '@/lib/erc20Abi'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { toast } from 'sonner'
import { formatUnits } from 'viem'

const baseClient = createPublicClient({
    chain: base,
    transport: http(),
});

export const fetchBaseTokenBalance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }): Promise<number> => {
    try {
        if (!address) {
            return 0;
        }
        if (tokenAddress === '0x0000000000000000000000000000000000000000b') {
            const balance = await baseClient.getBalance({
                address: address as `0x${string}`,
            });
            return Number(formatUnits(balance, 18));
        } else {
            const decimals = await baseClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'decimals',
            });

            const balance = await baseClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                args: [address],
            });
            return Number(formatUnits(balance, decimals));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('Error fetching wallet balance');
        return 0;
    }
}
