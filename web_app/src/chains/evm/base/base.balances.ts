import { BASE_RPC_URL } from './base.constants';
import { formatUnits } from 'viem';
import { toast } from 'sonner';

export const fetchTokenBalance = async ({ tokenAddress, address }: { tokenAddress: string, address: string }) => {
    try {
        if (!address) {
            return 0;
        }

        if (tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000b') {
            const response = await fetch(BASE_RPC_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                    id: 1
                })
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data = await response.json();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (data.error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                throw new Error(data.error.message);
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            const balance = BigInt(data.result);
            return formatUnits(balance, 18);
        }

        const balanceDataResponse = await fetch(BASE_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    {
                        to: tokenAddress,
                        data: `0x70a08231000000000000000000000000${address.slice(2)}`
                    },
                    'latest'
                ],
                id: 2
            })
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const balanceData = await balanceDataResponse.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (balanceData.error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            throw new Error(balanceData.error.message);
        }

        const decimalsResponse = await fetch(BASE_RPC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                    {
                        to: tokenAddress,
                        data: '0x313ce567'
                    },
                    'latest'
                ],
                id: 3
            })
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const decimalsData = await decimalsResponse.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (decimalsData.error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            throw new Error(decimalsData.error.message);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const decimals = parseInt(decimalsData.result, 16);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const balance = BigInt(balanceData.result);

        return Number(formatUnits(balance, decimals));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        toast.error('An error occurred while fetching user portfolio. Please try again!');
        return 0;
    }
}
