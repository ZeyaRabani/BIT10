"use client"

import React from 'react'
import { useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bit10PreformaceComparisonData } from './action'
import { Skeleton } from '@/components/ui/skeleton'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

export default function Page() {
    const fetchBit10Preformance = async () => {
        const response = await bit10PreformaceComparisonData();
        if (response === 'Error fetching BIT10 Preformace Comparison Data') {
            toast.error('An error occurred while fetching BIT10 Preformace Comparison Data. Please try again!');
        } else {
            return response;
        }
    };

    const bit10Queries = useQueries({
        queries: [
            {
                queryKey: ['bit10TokenPreformance'],
                queryFn: () => fetchBit10Preformance()
            },
        ],
    });

    const isLoading = bit10Queries.some(query => query.isLoading);
    const bit10Preformance = bit10Queries[0].data;

    const chartConfig = {
        bit10Top: {
            label: 'BIT10.TOP',
            color: 'var(--chart-1)',
        },
        btc: {
            label: 'Bitcoin (BTC)',
            color: 'var(--chart-2)',
        },
        sp500: {
            label: 'S&P500',
            color: 'var(--chart-3)',
        },
    } satisfies ChartConfig;

    const investmentChartConfig = {
        bit10TopValue: {
            label: 'BIT10.TOP Investment',
            color: 'purple',
        },
        btcValue: {
            label: 'Bitcoin Investment',
            color: 'orange',
        },
        sp500Value: {
            label: 'S&P500 Investment',
            color: 'blue',
        },
    } satisfies ChartConfig;

    const volatilityChartConfig = {
        bit10TopVolatility: {
            label: 'BIT10.TOP Volatility',
            color: 'purple',
        },
        btcVolatility: {
            label: 'Bitcoin Volatility',
            color: 'orange',
        },
        sp500Volatility: {
            label: 'S&P500 Volatility',
            color: 'blue',
        },
    } satisfies ChartConfig;

    const drawdownChartConfig = {
        bit10TopDrawdown: {
            label: 'BIT10.TOP Drawdown',
            color: 'purple',
        },
        btcDrawdown: {
            label: 'Bitcoin Drawdown',
            color: 'orange',
        },
        sp500Drawdown: {
            label: 'S&P500 Drawdown',
            color: 'blue',
        },
    } satisfies ChartConfig;

    const sharpeChartConfig = {
        bit10TopSharpe: {
            label: 'BIT10.TOP Sharpe',
            color: 'purple',
        },
        btcSharpe: {
            label: 'Bitcoin Sharpe',
            color: 'orange',
        },
        sp500Sharpe: {
            label: 'S&P500 Sharpe',
            color: 'blue',
        },
    } satisfies ChartConfig;

    const totalReturnChartConfig = {
        bit10TopReturn: {
            label: 'BIT10.TOP Total Return',
            color: 'purple',
        },
        btcReturn: {
            label: 'Bitcoin Total Return',
            color: 'orange',
        },
        sp500Return: {
            label: 'S&P500 Total Return',
            color: 'blue',
        },
    } satisfies ChartConfig;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeParseFloat = (value: any): number => {
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
    };

    const calculateDailyReturns = (prices: number[]) => {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
            returns.push(dailyReturn);
        }
        return returns;
    };

    const calculateRollingVolatility = (returns: number[], window = 30) => {
        const volatilities = [];
        for (let i = window - 1; i < returns.length; i++) {
            const windowReturns = returns.slice(i - window + 1, i + 1);
            const mean = windowReturns.reduce((sum, r) => sum + r, 0) / window;
            const variance = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (window - 1);
            const volatility = Math.sqrt(variance) * Math.sqrt(252);
            volatilities.push(volatility);
        }
        return volatilities;
    };

    const calculateRollingDrawdown = (prices: number[]) => {
        const drawdowns = [];
        let peak = prices[0];

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < prices.length; i++) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (prices[i] > peak) {
                peak = prices[i];
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const drawdown = ((prices[i] - peak) / peak) * 100;
            drawdowns.push(drawdown);
        }
        return drawdowns;
    };

    const calculateRollingSharpe = (returns: number[], window = 30) => {
        const sharpeRatios = [];
        for (let i = window - 1; i < returns.length; i++) {
            const windowReturns = returns.slice(i - window + 1, i + 1);
            const mean = windowReturns.reduce((sum, r) => sum + r, 0) / window;
            const variance = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (window - 1);
            const volatility = Math.sqrt(variance);
            const sharpe = volatility !== 0 ? (mean * Math.sqrt(252)) / (volatility * Math.sqrt(252)) : 0;
            sharpeRatios.push(sharpe);
        }
        return sharpeRatios;
    };

    const bit10PreformanceChartData = bit10Preformance?.map((entry) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });

        return {
            day: formatter.format(date),
            bit10Top: parseFloat(safeParseFloat(entry.bit10Top).toFixed(4)),
            btc: parseFloat(safeParseFloat(entry.btc).toFixed(4)),
            sp500: parseFloat(safeParseFloat(entry.sp500).toFixed(4)),
        };
    });

    const investmentPerformanceData = bit10Preformance?.map((entry, _index) => {
        const date = new Date(entry.date);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
        });

        const initialBit10Top = bit10Preformance[0] ? safeParseFloat(bit10Preformance[0].bit10Top) : 1;
        const initialBtc = bit10Preformance[0] ? safeParseFloat(bit10Preformance[0].btc) : 1;
        const initialSp500 = bit10Preformance[0] ? safeParseFloat(bit10Preformance[0].sp500) : 1;

        const currentBit10Top = safeParseFloat(entry.bit10Top);
        const currentBtc = safeParseFloat(entry.btc);
        const currentSp500 = safeParseFloat(entry.sp500);

        const bit10TopValue = parseFloat((100 * (currentBit10Top / initialBit10Top)).toFixed(2));
        const btcValue = parseFloat((100 * (currentBtc / initialBtc)).toFixed(2));
        const sp500Value = parseFloat((100 * (currentSp500 / initialSp500)).toFixed(2));

        return {
            day: formatter.format(date),
            bit10TopValue,
            btcValue,
            sp500Value,
        };
    });

    const volatilityData = bit10Preformance ? (() => {
        const bit10TopPrices = bit10Preformance.map(entry => safeParseFloat(entry.bit10Top));
        const btcPrices = bit10Preformance.map(entry => safeParseFloat(entry.btc));
        const sp500Prices = bit10Preformance.map(entry => safeParseFloat(entry.sp500));

        const bit10TopReturns = calculateDailyReturns(bit10TopPrices);
        const btcReturns = calculateDailyReturns(btcPrices);
        const sp500Returns = calculateDailyReturns(sp500Prices);

        const bit10TopVolatility = calculateRollingVolatility(bit10TopReturns);
        const btcVolatility = calculateRollingVolatility(btcReturns);
        const sp500Volatility = calculateRollingVolatility(sp500Returns);

        return bit10TopVolatility.map((_, index) => {
            const dataIndex = index + 30;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const date = new Date(bit10Preformance[dataIndex].date);
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });

            return {
                day: formatter.format(date),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                bit10TopVolatility: parseFloat((bit10TopVolatility[index] * 100).toFixed(2)),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                btcVolatility: parseFloat((btcVolatility[index] * 100).toFixed(2)),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                sp500Volatility: parseFloat((sp500Volatility[index] * 100).toFixed(2)),
            };
        });
    })() : null;

    const drawdownData = bit10Preformance ? (() => {
        const bit10TopPrices = bit10Preformance.map(entry => safeParseFloat(entry.bit10Top));
        const btcPrices = bit10Preformance.map(entry => safeParseFloat(entry.btc));
        const sp500Prices = bit10Preformance.map(entry => safeParseFloat(entry.sp500));

        const bit10TopDrawdown = calculateRollingDrawdown(bit10TopPrices);
        const btcDrawdown = calculateRollingDrawdown(btcPrices);
        const sp500Drawdown = calculateRollingDrawdown(sp500Prices);

        return bit10Preformance.map((entry, index) => {
            const date = new Date(entry.date);
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });

            return {
                day: formatter.format(date),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                bit10TopDrawdown: parseFloat(bit10TopDrawdown[index].toFixed(2)),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                btcDrawdown: parseFloat(btcDrawdown[index].toFixed(2)),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                sp500Drawdown: parseFloat(sp500Drawdown[index].toFixed(2)),
            };
        });
    })() : null;

    const sharpeData = bit10Preformance ? (() => {
        const bit10TopPrices = bit10Preformance.map(entry => safeParseFloat(entry.bit10Top));
        const btcPrices = bit10Preformance.map(entry => safeParseFloat(entry.btc));
        const sp500Prices = bit10Preformance.map(entry => safeParseFloat(entry.sp500));

        const bit10TopReturns = calculateDailyReturns(bit10TopPrices);
        const btcReturns = calculateDailyReturns(btcPrices);
        const sp500Returns = calculateDailyReturns(sp500Prices);

        const bit10TopSharpe = calculateRollingSharpe(bit10TopReturns);
        const btcSharpe = calculateRollingSharpe(btcReturns);
        const sp500Sharpe = calculateRollingSharpe(sp500Returns);

        return bit10TopSharpe.map((_, index) => {
            const dataIndex = index + 30;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const date = new Date(bit10Preformance[dataIndex].date);
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });

            return {
                day: formatter.format(date),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                bit10TopSharpe: parseFloat(bit10TopSharpe[index].toFixed(3)),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                btcSharpe: parseFloat(btcSharpe[index].toFixed(3)),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                sp500Sharpe: parseFloat(sp500Sharpe[index].toFixed(3)),
            };
        });
    })() : null;

    const totalReturnData = bit10Preformance ? (() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const initialBit10Top = safeParseFloat(bit10Preformance[0].bit10Top);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const initialBtc = safeParseFloat(bit10Preformance[0].btc);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const initialSp500 = safeParseFloat(bit10Preformance[0].sp500);

        return bit10Preformance.map((entry) => {
            const date = new Date(entry.date);
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });

            const currentBit10Top = safeParseFloat(entry.bit10Top);
            const currentBtc = safeParseFloat(entry.btc);
            const currentSp500 = safeParseFloat(entry.sp500);

            const bit10TopReturn = parseFloat((((currentBit10Top - initialBit10Top) / initialBit10Top) * 100).toFixed(2));
            const btcReturn = parseFloat((((currentBtc - initialBtc) / initialBtc) * 100).toFixed(2));
            const sp500Return = parseFloat((((currentSp500 - initialSp500) / initialSp500) * 100).toFixed(2));

            return {
                day: formatter.format(date),
                bit10TopReturn,
                btcReturn,
                sp500Return,
            };
        });
    })() : null;

    return (
        <div className='space-y-8 py-8 px-4 md:px-16'>
            <div>
                <h3 className='text-lg font-semibold mb-4'>Performance Comparison (in USD)</h3>
                {isLoading || !bit10PreformanceChartData ? (
                    <Skeleton className='h-[300px] w-full' />
                ) : (
                    <ChartContainer config={chartConfig} className='max-h-[300px] w-full'>
                        <LineChart accessibilityLayer data={bit10PreformanceChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='day'
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                stroke='#D5520E'
                            />
                            <YAxis
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickCount={3}
                                stroke='#D5520E'
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Line dataKey='bit10Top' type='linear' stroke='purple' name={chartConfig.bit10Top.label} strokeWidth={2} dot={false} />
                            <Line dataKey='btc' type='linear' stroke='orange' name={chartConfig.btc.label} strokeWidth={2} dot={false} />
                            <Line dataKey='sp500' type='linear' stroke='blue' name={chartConfig.sp500.label} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                )}
            </div>

            <div>
                <h3 className='text-lg font-semibold mb-4'>$100 Investment Growth Comparison</h3>
                <p className='text-sm mb-4'>
                    This chart shows how a $100 investment in each asset would have performed from the beginning of the tracking period
                </p>
                {isLoading || !investmentPerformanceData ? (
                    <Skeleton className='h-[300px] w-full' />
                ) : (
                    <ChartContainer config={investmentChartConfig} className='max-h-[300px] w-full'>
                        <LineChart accessibilityLayer data={investmentPerformanceData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='day'
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                stroke='#D5520E'
                            />
                            <YAxis
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickCount={5}
                                stroke='#D5520E'
                                tickFormatter={(value) => `$${value}`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Line dataKey='bit10TopValue' type='linear' stroke='purple' name={investmentChartConfig.bit10TopValue.label} strokeWidth={2} dot={false} />
                            <Line dataKey='btcValue' type='linear' stroke='orange' name={investmentChartConfig.btcValue.label} strokeWidth={2} dot={false} />
                            <Line dataKey='sp500Value' type='linear' stroke='blue' name={investmentChartConfig.sp500Value.label} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                )}
            </div>

            <div>
                <h3 className='text-lg font-semibold mb-4'>Total Return Since Start (%)</h3>
                <p className='text-sm mb-4'>
                    Cumulative percentage gain/loss for each asset since the beginning of the tracking period
                </p>
                {isLoading || !totalReturnData ? (
                    <Skeleton className='h-[300px] w-full' />
                ) : (
                    <ChartContainer config={totalReturnChartConfig} className='max-h-[300px] w-full'>
                        <LineChart accessibilityLayer data={totalReturnData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='day'
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                stroke='#D5520E'
                            />
                            <YAxis
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickCount={5}
                                stroke='#D5520E'
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Line dataKey='bit10TopReturn' type='linear' stroke='purple' name={totalReturnChartConfig.bit10TopReturn.label} strokeWidth={2} dot={false} />
                            <Line dataKey='btcReturn' type='linear' stroke='orange' name={totalReturnChartConfig.btcReturn.label} strokeWidth={2} dot={false} />
                            <Line dataKey='sp500Return' type='linear' stroke='blue' name={totalReturnChartConfig.sp500Return.label} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                )}
            </div>

            <div>
                <h3 className='text-lg font-semibold mb-4'>30-Day Rolling Volatility (%)</h3>
                <p className='text-sm mb-4'>
                    Annualized volatility based on 30-day rolling window. Higher values indicate more price fluctuation.
                </p>
                {isLoading || !volatilityData ? (
                    <Skeleton className='h-[300px] w-full' />
                ) : (
                    <ChartContainer config={volatilityChartConfig} className='max-h-[300px] w-full'>
                        <LineChart accessibilityLayer data={volatilityData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='day'
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                stroke='#D5520E'
                            />
                            <YAxis
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickCount={5}
                                stroke='#D5520E'
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Line dataKey='bit10TopVolatility' type='linear' stroke='purple' name={volatilityChartConfig.bit10TopVolatility.label} strokeWidth={2} dot={false} />
                            <Line dataKey='btcVolatility' type='linear' stroke='orange' name={volatilityChartConfig.btcVolatility.label} strokeWidth={2} dot={false} />
                            <Line dataKey='sp500Volatility' type='linear' stroke='blue' name={volatilityChartConfig.sp500Volatility.label} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                )}
            </div>

            <div>
                <h3 className='text-lg font-semibold mb-4'>Maximum Drawdown (%)</h3>
                <p className='text-sm mb-4'>
                    Shows how far each asset has dropped from its previous peak. More negative values indicate larger drops.
                </p>
                {isLoading || !drawdownData ? (
                    <Skeleton className='h-[300px] w-full' />
                ) : (
                    <ChartContainer config={drawdownChartConfig} className='max-h-[300px] w-full'>
                        <LineChart accessibilityLayer data={drawdownData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='day'
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                stroke='#D5520E'
                            />
                            <YAxis
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickCount={5}
                                stroke='#D5520E'
                                tickFormatter={(value) => `${value}%`}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Line dataKey='bit10TopDrawdown' type='linear' stroke='purple' name={drawdownChartConfig.bit10TopDrawdown.label} strokeWidth={2} dot={false} />
                            <Line dataKey='btcDrawdown' type='linear' stroke='orange' name={drawdownChartConfig.btcDrawdown.label} strokeWidth={2} dot={false} />
                            <Line dataKey='sp500Drawdown' type='linear' stroke='blue' name={drawdownChartConfig.sp500Drawdown.label} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                )}
            </div>

            <div>
                <h3 className='text-lg font-semibold mb-4'>30-Day Rolling Sharpe Ratio</h3>
                <p className='text-sm mb-4'>
                    Risk-adjusted returns over time. Higher values indicate better return per unit of risk taken.
                </p>
                {isLoading || !sharpeData ? (
                    <Skeleton className='h-[300px] w-full' />
                ) : (
                    <ChartContainer config={sharpeChartConfig} className='max-h-[300px] w-full'>
                        <LineChart accessibilityLayer data={sharpeData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey='day'
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickFormatter={(value: string) => value.slice(0, value.indexOf(','))}
                                stroke='#D5520E'
                            />
                            <YAxis
                                tickLine={true}
                                axisLine={true}
                                tickMargin={8}
                                tickCount={5}
                                stroke='#D5520E'
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Line dataKey='bit10TopSharpe' type='linear' stroke='purple' name={sharpeChartConfig.bit10TopSharpe.label} strokeWidth={2} dot={false} />
                            <Line dataKey='btcSharpe' type='linear' stroke='orange' name={sharpeChartConfig.btcSharpe.label} strokeWidth={2} dot={false} />
                            <Line dataKey='sp500Sharpe' type='linear' stroke='blue' name={sharpeChartConfig.sp500Sharpe.label} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                )}
            </div>
        </div>
    )
}
