"use client"

import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { LoaderCircle, ExternalLink } from 'lucide-react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/oracle.did'

// temp
interface WalletDataType {
    walletAddress: string;
    explorerAddress: string;
    bit10: string[];
    tokenId?: string[];
}

// temp
const bit10Allocation: WalletDataType[] = [
    { walletAddress: 'bc1pkjd3.....aqgc55hy', explorerAddress: 'https://fractal.unisat.io/swap/assets/bc1pkjd3hjwmc20vm3hu7z2xl5rfpxs0fzfp463fdjg7jsn34vn4nsaqgc55hy', bit10: ['BIT10.BRC20'] },
];

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function RebalanceCollateral() {
    const [innerRadius, setInnerRadius] = useState<number>(80);

    const fetchBit10Price = async (tokenPriceAPI: string) => {
        const response = await fetch(tokenPriceAPI);

        if (!response.ok) {
            toast.error('Error fetching BIT10 price. Please try again!');
        }

        let data;
        let returnData;
        if (tokenPriceAPI === 'bit10-latest-price-brc20') {
            data = await response.json() as { timestmpz: string, tokenPrice: number, data: Array<{ id: number, name: string, symbol: string, price: number }> }
            returnData = data.tokenPrice ?? 0;
        }
        return returnData;
    };

    const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
    const canisterId = 'fg5vt-paaaa-aaaap-qhhra-cai';

    const agent = new HttpAgent({ host });
    const actor = Actor.createActor(idlFactory, { agent, canisterId });

    const fetchBit10DEFISupply = async () => {
        const totalSupply = actor.bit10_defi_total_supply_of_token_available ? await actor.bit10_defi_total_supply_of_token_available() : undefined;

        if (!totalSupply) {
            toast.error('Error fetching BIT10 supply. Please try again!');
        }

        if (totalSupply && typeof totalSupply === 'bigint') {
            const scaledTotalSupply = Number(totalSupply) / 100000000;
            return scaledTotalSupply;
        } else {
            return 0;
        }
    }

    return (
        <div>
            RebalanceCollateral
            {/* If tokenId exist then dont check for bit10, Or do like Where bit10 = BIT10 anem and token id = token id */}
        </div>
    )
}
