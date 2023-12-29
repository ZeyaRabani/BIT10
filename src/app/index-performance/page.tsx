"use client"

import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint {
    date: string;
    price: number;
}

const bitcoinData: DataPoint[] = [
    { date: '2009-01-01', price: 25 },
    { date: '2010-01-01', price: 5 },
    { date: '2011-01-01', price: 52 },
    { date: '2012-01-01', price: 48 },
    { date: '2013-01-01', price: 51 },
    { date: '2014-01-01', price: 53 },
    { date: '2015-01-01', price: 49 },
    { date: '2016-01-01', price: 51.5 },
    { date: '2017-01-01', price: 52.5 },
    { date: '2018-01-01', price: 49 },
    { date: '2019-01-01', price: 50 },
    { date: '2020-01-01', price: 30 },
    { date: '2021-01-01', price: 20.6 },
    { date: '2022-01-01', price: 22.5 },
    { date: '2023-01-01', price: 54 }
];

const SP500: DataPoint[] = [
    { date: '2009-01-01', price: 1.2 },
    { date: '2010-01-01', price: 1.5 },
    { date: '2011-01-01', price: 1.8 },
    { date: '2012-01-01', price: 1.7 },
    { date: '2013-01-01', price: 1.6 },
    { date: '2014-01-01', price: 1.9 },
    { date: '2015-01-01', price: 2.1 },
    { date: '2016-01-01', price: 2.0 },
    { date: '2017-01-01', price: 1.8 },
    { date: '2018-01-01', price: 2.2 },
    { date: '2019-01-01', price: 3.2 },
    { date: '2020-01-01', price: 6.2 },
    { date: '2021-01-01', price: 4.2 },
    { date: '2022-01-01', price: 8.2 },
    { date: '2023-01-01', price: 9.2 }
];

const CustomTooltip: React.FC<{ active?: boolean, payload?: any, label?: string }> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded p-4">
                <p className="text-black">Date: {label}</p>
                {payload.map((entry: any) => (
                    <p key={entry.name} style={{ color: entry.color }}>{entry.value} Price</p>
                ))}
            </div>
        );
    }

    return null;
};

export default function Page() {
    return (
        <MaxWidthWrapper>

            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Index Performance</h1>
            </div>

            <div className='flex flex-col space-y-2'>
                <div className='text-xl'>Benchmark Comparison</div>
                <div className='flex flex-col md:grid md:grid-cols-2 md:gap-2 space-y-2 md:space-y-0 py-4 items-center justify-center w-full'>
                    <div className='w-full bg-accent p-4 rounded h-[50vh]'>
                        <div>Bitcoin native assets With our C10 Token</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                width={500}
                                height={300}
                                data={bitcoinData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className='w-full bg-accent p-4 rounded h-[50vh]'>
                        <div>S&P500 for the last 15 years</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                width={500}
                                height={300}
                                data={SP500}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="price" stroke="#82ca9d" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    );
};
