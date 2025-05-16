/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { DataTable, MarketTableDataType } from '@/components/ui/data-table-custom'
import { Button } from '@/components/ui/button'
import { Label, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

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

const color = ['#ff0066', '#ff8c1a', '#1a1aff', '#ff1aff', '#3385ff', '#ffa366', '#33cc33', '#ffcc00', '#cc33ff', '#00cccc'];

export default function AddFund() {
    const [innerRadius, setInnerRadius] = useState<number>(80);
    const [selectedFunds, setSelectedFunds] = useState<CryptoData[]>([]);

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
        // {
        //     accessorKey: 'price_change_percentage_24h',
        //     header: ({ column }) => (
        //         <DataTableColumnHeader column={column} title='24h Change' />
        //     ),
        // },
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
            header: 'View Transaction',
            cell: ({ row }) => {
                const fund = row.original as CryptoData;
                const isAdded = selectedFunds.some(f => f.id === fund.id);

                return (
                    <Button
                        onClick={() => isAdded ? handleRemoveFund(fund.id) : handleAddFund(fund)}
                        variant={isAdded ? 'secondary' : 'default'}
                    >
                        {isAdded ? 'Added to Index Fund' : 'Add to Index Fund'}
                    </Button>
                );
            },
        }
    ]

    const handleAddFund = (fund: CryptoData) => {
        setSelectedFunds(prev => [...prev, fund]);
    };

    const handleRemoveFund = (fundId: string) => {
        setSelectedFunds(prev => prev.filter(f => f.id !== fundId));
    };

    const fetchTokenPrice = async () => {
        const response = await fetch('token-list');

        if (!response.ok) {
            toast.error('Error fetching toke list. Please try again!');
        }

        const data = await response.json() as CryptoData[];
        return data;
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

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setInnerRadius(90);
            } else if (window.innerWidth >= 768) {
                setInnerRadius(70);
            } else {
                setInnerRadius(50);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div>
            {isLoading ? (
                <Card className='animate-fade-bottom-up-slow'>
                    <CardContent>
                        <div className='flex flex-col h-full space-y-2 pt-8'>
                            {['h-9 md:w-1/3', 'h-10', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12', 'h-12'].map((classes, index) => (
                                <Skeleton key={index} className={classes} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='animate-fade-bottom-up-slow'>
                    <CardHeader>
                        <div className='text-2xl md:text-4xl text-center md:text-start'>Create Custom Index Fund</div>
                    </CardHeader>
                    <CardContent>
                        <div className='grid md:grid-cols-6 w-full gap-2'>
                            <div className='col-span-2'>
                                <h1>Selected Funds</h1>
                                <div className="mt-4 space-y-2">
                                    {selectedFunds.map(fund => (
                                        <div key={fund.id} className="flex justify-between items-center p-2 border rounded">
                                            <div className="flex items-center">
                                                <img src={fund.image} alt={fund.name} className="w-6 h-6 mr-2" />
                                                <span>{fund.name}</span>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveFund(fund.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className='col-span-4'>
                                <DataTable
                                    columns={marketDataTableColumns}
                                    data={tokenPrice ?? []}
                                    userSearchColumn='name'
                                    inputPlaceHolder='Search by name'
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
