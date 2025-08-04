import React, { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import AnimatedBackground from '@/components/ui/animated-background'
import Buy from './icp/buy'
import Sell from './icp/sell'

const mode = ['buy', 'sell'];

export default function SwapModule() {
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
    <MaxWidthWrapper className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
      <Card className='w-[300px] md:w-[500px] animate-fade-bottom-up'>
        <CardHeader>
          <CardTitle className='flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-2 items-center justify-between'>
            <div>BIT10 Exchange</div>
            <div className='relative flex flex-row space-x-2 items-center justify-center border dark:border-white rounded-md px-2 py-1.5'>
              <AnimatedBackground
                defaultValue={activeTab}
                className='rounded bg-primary'
                transition={{
                  ease: 'easeInOut',
                  duration: 0.2,
                }}
                onValueChange={(newActiveId) => handleTabChange(newActiveId)}
              >
                {mode.map((label, index) => (
                  <button
                    key={index}
                    data-id={label}
                    type='button'
                    className={`inline-flex px-2 items-center justify-center text-sm font-normal text-center transition-transform active:scale-[0.98] capitalize ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </AnimatedBackground>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'buy' && <Buy />}
          {activeTab === 'sell' && <Sell />}
        </CardContent>
      </Card>
    </MaxWidthWrapper >
  )
}
