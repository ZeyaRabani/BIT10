import React, { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card'
import BuyModule from './buyModule'
import SellModule from './sellModule'

export default function Buy() {
    const [activeTab, setActiveTab] = useState('buy');

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const roleParam = searchParams.get('mode');
        if (roleParam) {
            setActiveTab(roleParam);
        }
    }, [searchParams]);

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label);

            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.set('mode', label.toLowerCase());

            router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
        }
    };

    return (
        <div className='flex flex-col py-4 h-full items-center justify-center'>
            <Card className='border-none w-[300px] md:w-[560px] animate-fade-bottom-up bg-gray-200 dark:bg-[#1c1717]'>
                <CardHeader>
                    <CardTitle>Buy BIT10</CardTitle>
                </CardHeader>
                <CardContent>
                    {activeTab === 'buy' && <BuyModule onSwitchToSell={() => handleTabChange('sell')} />}
                    {activeTab === 'sell' && <SellModule onSwitchToBuy={() => handleTabChange('buy')} />}
                </CardContent>
            </Card>
        </div>
    )
}
