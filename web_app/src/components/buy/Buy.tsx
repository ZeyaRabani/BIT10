import React, { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
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
        <MaxWidthWrapper className='flex flex-col py-4 md:py-12 h-full items-center justify-center'>
            <div className='w-[300px] md:w-[500px] animate-fade-bottom-up bg-transparent'>
                {activeTab === 'buy' && <BuyModule onSwitchToSell={() => handleTabChange('sell')} />}
                {activeTab === 'sell' && <SellModule onSwitchToBuy={() => handleTabChange('buy')} />}
            </div>
        </MaxWidthWrapper>
    )
}
