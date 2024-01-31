import React from 'react'
import MaxWidthWrapper from '../MaxWidthWrapper'
import { Button } from '../ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '../ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PreformanceTableDataType, preformanceTableColumns } from './columns'
import { DataTable } from '@/components/ui/data-table'

interface PreformanceDataType {
  month: string;
  preformance: number;
}

const preformanceData: PreformanceDataType[] = [
  { month: 'Jan', preformance: 30000 },
  { month: 'Feb', preformance: 40050 },
  { month: 'Mar', preformance: 30660 },
  { month: 'Apr', preformance: 40600 },
  { month: 'May', preformance: 58667 },
  { month: 'Jun', preformance: 70009 },
  { month: 'Jul', preformance: 96660 },
];

const preformanceTableData: PreformanceTableDataType[] = [
  {
    settelment: '26 Dec, 2023',
    tradeDate: '25 Dec, 2023',
    symbol: 'BIT10',
    name: 'From Bit10',
    quantity: 4,
    type: 'Fund Recieved',
    price: 1000,
    fees: 0.01,
  },
  {
    settelment: '28 Dec, 2023',
    tradeDate: '27 Dec, 2023',
    symbol: 'BTC',
    name: 'Bitcoin Purchase',
    quantity: 2,
    type: 'Buy',
    price: 3000,
    fees: 0.02,
  },
  {
    settelment: '30 Dec, 2023',
    tradeDate: '29 Dec, 2023',
    symbol: 'BTC',
    name: 'Bitcoin Dividend',
    quantity: 1,
    type: 'Divident',
    price: 50000,
    fees: 0.005,
  },
  {
    settelment: '2 Jan, 2024',
    tradeDate: '1 Jan, 2024',
    symbol: 'BIT10',
    name: 'From Bit10',
    quantity: 5,
    type: 'Reinested',
    price: 150,
    fees: 0.015,
  },
  {
    settelment: '4 Jan, 2024',
    tradeDate: '3 Jan, 2024',
    symbol: 'BIT10-G',
    name: 'From Bit10 Gold',
    quantity: 3,
    type: 'Buy',
    price: 2500,
    fees: 0.025,
  },
  {
    settelment: '6 Jan, 2024',
    tradeDate: '5 Jan, 2024',
    symbol: 'BTC',
    name: 'Bitcoin Purchase',
    quantity: 2,
    type: 'Fund Recieved',
    price: 3500,
    fees: 0.03,
  },
  {
    settelment: '8 Jan, 2024',
    tradeDate: '7 Jan, 2024',
    symbol: 'BTC',
    name: 'Bitcoin Dividend',
    quantity: 3,
    type: 'Divident',
    price: 500,
    fees: 0.015,
  },
  {
    settelment: '10 Jan, 2024',
    tradeDate: '9 Jan, 2024',
    symbol: 'BTC',
    name: 'Bitcoin Purchase',
    quantity: 2,
    type: 'Reinested',
    price: 800,
    fees: 0.02,
  },
];

export default function Portfolio() {

  const CustomTooltip = ({ active, payload, label, payloadTitle }: { active: boolean, payload: any[], label?: string, payloadTitle: string[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white p-2 rounded'>
          <div className='text-gray-800'>{`${label}`}</div>
          <div className='text-[#8884d8]'>{`${payloadTitle[0]}`}: {`${payload[0].value}`}</div>
        </div>
      );
    }

    return null;
  };

  return (
    <MaxWidthWrapper>
      <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 md:justify-between items-center'>
        <h1 className='text-3xl font-bold'>Welcome back</h1>
        <Button className='text-white' asChild>
          <Link href='/dashboard'>Buy & Sell</Link>
        </Button>
      </div>

      <div className='py-4 flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-4 md:justify-between items-center'>
        <div className='w-full'>
          <Card>
            <CardHeader>
              <h1 className='text-3xl font-bold'>Your Current Balance</h1>
            </CardHeader>
            <hr className='w-full h-0.5 bg-accent' />
            <div className='flex flex-row items-center justify-start'>
              <p className='font-display text-4xl font-semibold py-3 px-6'>
                $ 155,666
              </p>
              <Badge className='bg-green-500 text-white'>+ 2.5%</Badge>
            </div>
            <p className='px-6 pb-1'>Total assets</p>
            <hr className='w-full h-0.5 bg-accent' />
            <CardContent className='py-2'>
              <div className='flex flex-row items-center justify-between'>
                <p className='font-display text-xl font-semibold p-3'>
                  BIT 10
                </p>
                <p>$ 6555</p>
              </div>
              <hr className='w-full h-0.5 bg-accent my-2' />
              <div className='flex flex-row items-center justify-between'>
                <p className='font-display text-xl font-semibold p-3'>
                  BIT 10 Gold
                </p>
                <p>$ 96555</p>
              </div>
              <hr className='w-full h-0.5 bg-accent my-2' />
              <div className='flex flex-row items-center justify-between'>
                <p className='font-display text-xl font-semibold p-3'>
                  Outside Investment
                </p>
                <p>$ 555</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className='bg-accent rounded w-full py-6'>
          <h2 className='p-2 md:text-xl'>Your personal preformance</h2>
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={preformanceData} margin={{ top: 5, right: 15, left: 8, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis />
              <Legend className='black' />
              <Tooltip content={<CustomTooltip active={false} payload={[]} payloadTitle={['Token Preformance']} />} />
              <Line type='monotone' dataKey='preformance' name='Token Preformance(in USD)' stroke='#8884d8' />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className='py-4 w-full'>
        <Card className='relative'>
          <CardHeader>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0'>
              <div className='w-full text-2xl md:text-4xl'>Your recent activity</div>
              <div className='flex flex-col justify-center md:justify-end items-center md:items-stretch w-full md:flex-row space-x-0 md:space-x-2 space-y-2 md:space-y-0'>
                <p className='underline'>All transaction history</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={preformanceTableColumns}
              data={preformanceTableData}
              userSearchColumn='name'
              inputPlaceHolder='Search by name'
            />
          </CardContent>
        </Card>
      </div>
    </MaxWidthWrapper>
  )
}
