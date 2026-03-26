import { BASE_RPC_URLS } from './base.constants';
import { formatUnits } from 'viem';
import { toast } from 'sonner';

const safeBigInt = (value: string | null | undefined): bigint => {
    if (!value || value === '0x' || value === '0x0') return 0n;
    try {
        return BigInt(value);
    } catch {
        return 0n;
    }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const rpcFetchWithFallback = async (body: object, retries = 3, baseDelay = 500): Promise<{ result?: string, error?: { message: string } }> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        const rpcUrl = BASE_RPC_URLS[attempt % BASE_RPC_URLS.length]!;

        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = (await response.json()) as {
                result?: string;
                error?: { message: string };
            };

            if (data.error?.message?.toLowerCase().includes('rate limit')) {
                const delay = baseDelay * 2 ** attempt;
                await sleep(delay);
                lastError = new Error(data.error.message);
                continue;
            }

            if (data.error) throw new Error(data.error.message);

            return data;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            const isLastAttempt = attempt === retries - 1;
            if (!isLastAttempt) {
                const delay = baseDelay * 2 ** attempt;
                await sleep(delay);
            }
        }
    }

    throw lastError ?? new Error('All RPC attempts failed');
};

export const fetchTokenBalance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }) => {
    try {
        if (!address) return 0;

        if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
            const data = await rpcFetchWithFallback({
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            });

            return Number(formatUnits(safeBigInt(data.result), 18));
        }

        const paddedAddress = address.startsWith('0x') ? address.slice(2).padStart(64, '0') : address.padStart(64, '0');

        const [balanceData, decimalsData] = await Promise.all([
            rpcFetchWithFallback({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    { to: tokenAddress, data: `0x70a08231${paddedAddress}` },
                    'latest'
                ],
                id: 2
            }),
            rpcFetchWithFallback({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{ to: tokenAddress, data: '0x313ce567' }, 'latest'],
                id: 3
            })
        ]);

        const decimals = decimalsData.result && decimalsData.result !== '0x' ? parseInt(decimalsData.result, 16) : 18;

        return Number(formatUnits(safeBigInt(balanceData.result), decimals));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while fetching user blanace. Please try again!');
        return 0;
    }
}
