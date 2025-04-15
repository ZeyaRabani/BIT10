import { env } from '@/env'
import { type NextRequest } from 'next/server'

type Bit10ReferralType = {
    bit10_apr_referral: {
        address: string;
        total_points: number;
        position: number;
        referred_users: string[];
        referral_points: {
            total_no_of_liquidity_hub_transaction_by_address_on_testnet: number;
            total_no_of_liquidity_hub_transaction_by_referral_on_testnet: number;
            total_no_of_swap_by_referral_on_testnet: number;
            total_no_of_swap_or_reverse_swap_by_address_on_mainnet: number;
            total_no_of_swap_by_referral_on_mainnet: number;
        }[];
        tasks_completed: {
            swap_on_mainnet: boolean;
            swap_on_internet_computer_testnet: boolean;
        };
    }[];
};

export async function GET(request: NextRequest, context: { params: Promise<{ user_address: string }> }) {
    const node_server = env.NODE_SERVER;
    const { user_address } = await context.params;
    const url = `${node_server}/referral?address=${user_address}`;

    try {
        const res = await fetch(url)
        const data = await res.json() as Bit10ReferralType;
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error fetching data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
