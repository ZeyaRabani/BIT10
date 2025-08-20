import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable, type MarketTableDataType } from '@/components/ui/data-table-custom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash } from 'lucide-react'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import Image from 'next/image'
import { Input } from '@/components/ui/input'

interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number | null;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: {
        times: number;
        currency: string;
        percentage: number;
    } | null;
    last_updated: string;
};

export default function AddFund() {
    const [addedTokens, setAddedTokens] = useState<CryptoData[]>([]);
    const [innerRadius, setInnerRadius] = useState<number>(80);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(40);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchTokenPrice = async () => {
        // ToDo: Remove stablecoins from the list
        const response = await fetch('token-list');

        if (!response.ok) {
            toast.error('Error fetching toke list. Please try again!');
        }

        const data = await response.json() as CryptoData[];
        return data;
    };

    const handleAddToken = (token: CryptoData) => {
        setAddedTokens([...addedTokens, token]);
    };

    const handleRemoveToken = (tokenId: string) => {
        setAddedTokens(addedTokens.filter(token => token.id !== tokenId));
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['customTokenPrice'],
                queryFn: () => fetchTokenPrice()
            },
        ]
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const tokenPrice = bit10Queries[0].data;

    const marketDataTableColumns: ColumnDef<MarketTableDataType>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Name' />
            ),
        },
        {
            accessorKey: 'current_price',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Price (in USD)' />
            ),
        },
        {
            accessorKey: 'market_cap',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Market Cap (in USD)' />
            ),
        },
        {
            accessorKey: 'total_volume',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title='Total Volume (in USD)' />
            ),
        },
        {
            id: 'view_transaction',
            header: '',
            cell: ({ row }) => {
                const token = row.original as CryptoData;
                const isAdded = addedTokens.some(addedToken => addedToken.id === token.id);

                return (
                    <div className="flex items-center justify-between w-full space-x-2">
                        {isAdded ? (
                            <>
                                <span>Added</span>
                                <Button variant="destructive" onClick={() => handleRemoveToken(token.id)}>
                                    <Trash className='text-white' />
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => handleAddToken(token)}>Add to Index Fund</Button>
                        )}
                    </div>
                );
            },
        }
    ];

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const bit10CustomChartConfig: ChartConfig = {
        ...Object.fromEntries(
            addedTokens.map((token) => [
                token.name,
                {
                    label: token.name,
                    color: getRandomColor(),
                }
            ]) ?? []
        )
    };

    const bit10CustomPieChartData =
        addedTokens.length == 0 ?
            [{ name: 'No Data', value: 1, fill: '#ebebe0' }]
            :
            addedTokens.map((token) => ({
                name: token.name,
                value: 100 / addedTokens.length,
                fill: getRandomColor(),
            }));

    return (
        <div className='flex flex-col items-center justify-center'>
            <Card className='animate-fade-bottom-up w-full'>
                <CardHeader>
                    <CardTitle className='flex flex-row items-center justify-between'>
                        <div>Create Custom Index</div>
                    </CardTitle>
                    <CardDescription>Create your own custom index fund and set the desired percentage for each token.</CardDescription>
                </CardHeader>
                <CardContent className='grid md:grid-cols-6 w-full gap-2'>
                    <div className='col-span-2 items-center justify-center w-full hidden md:block'>
                        <div className='flex-1 w-full'>
                            <ChartContainer
                                config={bit10CustomChartConfig}
                                className='aspect-square max-h-[300px]'
                            >
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={bit10CustomPieChartData}
                                        dataKey='value'
                                        nameKey='name'
                                        innerRadius={innerRadius}
                                        strokeWidth={5}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                    return (
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor='middle'
                                                            dominantBaseline='middle'
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className='fill-foreground text-xl font-bold'
                                                            >
                                                                BIT10.Custom
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy ?? 0) + 24}
                                                                className='fill-muted-foreground'
                                                            >
                                                                Allocations
                                                            </tspan>
                                                        </text>
                                                    )
                                                }
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </div>
                    </div>
                    <div className='col-span-4 flex flex-col space-y-2'>
                        <div>
                            <Label>Name for Index</Label>
                            <Input className='w-full dark:border-white' placeholder='Name for Index Fund' />
                        </div>

                        <div className='flex flex-col space-y-2'>
                            {addedTokens.map(token => (
                                <div key={token.id} className='flex items-center justify-between'>
                                    <div className='flex flex-row space-x-2 items-center'>
                                        <div>
                                            <Image src={token.image} alt={token.name} width={40} height={40} />
                                        </div>
                                        <div className='flex flex-col justify-start'>
                                            <div>{token.name}</div>
                                            <div className='uppercase text-secondary-foreground'>({token.symbol})</div>
                                        </div>
                                    </div>
                                    <Button variant='destructive' onClick={() => handleRemoveToken(token.id)}>Remove</Button>
                                </div>
                            ))}
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant='outline' className='w-full dark:border-white'>Add Token</Button>
                            </DialogTrigger>
                            <DialogContent className='max-w-[90vw] md:max-w-[65vw] h-[80vh]'>
                                <DialogHeader>
                                    <DialogTitle>Add Token</DialogTitle>
                                    <DialogDescription>
                                        Add tokens for a custom index fund. All selected tokens are allocated equally.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className='flex flex-col h-[calc(70vh-150px)] overflow-y-scroll p-2'>
                                    {isLoading ? (
                                        <div className='flex flex-col h-full space-y-2 pt-8'>
                                            {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                                <Skeleton key={index} className={classes} />
                                            ))}
                                        </div>
                                    ) : (
                                        <DataTable
                                            columns={marketDataTableColumns}
                                            data={tokenPrice ?? []}
                                            userSearchColumn='name'
                                            inputPlaceHolder='Search by name'
                                        />
                                    )}
                                </div>
                                <DialogFooter className='sm:justify-start'>
                                    <DialogClose asChild>
                                        <Button variant='outline' type='button' className='dark:border-white'>
                                            Close
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button variant='outline' className='dark:border-white'>
                            Add Index Fund
                        </Button>

                        <div>
                            I agree to provide liquidity for this Custom Index Fund
                        </div>

                        <Button className='w-full'>
                            Propose Index Fund
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
