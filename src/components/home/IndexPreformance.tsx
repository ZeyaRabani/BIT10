"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useEffect, useState } from 'react';

interface Crypto {
    id: string;
    name: string;
    quote: {
        USD: {
            price: number;
        };
    };
}

interface CryptoData {
    coins: Crypto[];
}

interface DataPoint {
    date: string;
    price: number;
}

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

export default function IndexPreformance() {
    const [data, setData] = useState<CryptoData>({ coins: [] });
    const [loading, setLoading] = useState<boolean>(true);

    const API_KEY = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
    const API_URL = `/api/v1/cryptocurrency/category?start=1&limit=20&id=654a0c87ba37f269c8016129&CMC_PRO_API_KEY=${API_KEY}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                const result = await response.json();
                setData(result.data);
                console.log(result.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Convert API data to an array of DataPoint objects
    const chartData: DataPoint[] = data.coins.map((crypto) => ({
        date: crypto.name, // You can use a different property for the date if needed
        price: crypto.quote.USD.price,
    }));

    return (
        <div>
            <div className='mb-12 text-center'>
                <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Index Performance</h1>
            </div>

            <div className='flex flex-col space-y-2'>
                <div className='text-xl'>Benchmark Comparison</div>
                <div className='flex flex-col md:grid md:grid-cols-2 md:gap-2 space-y-2 md:space-y-0 py-4 items-center justify-center w-full'>
                    <div className='w-full bg-accent p-4 rounded h-[50vh]'>
                        <div>Bitcoin native assets With our BIT10 Token</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                width={500}
                                height={300}
                                data={chartData} // Use the converted API data here
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis label={{ value: 'Price', angle: -90, position: 'insideLeft' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="price" stroke="#82ca9d" activeDot={{ r: 8 }} />
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
                                <YAxis label={{ value: 'Price', angle: -90, position: 'insideLeft' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="price" stroke="#82ca9d" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
