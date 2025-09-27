import React, { useState, useEffect } from 'react'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { whitelistedPrincipalIds } from '@/actions/dbActions'
import { toast } from 'sonner'
import { useQueries } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import AnimatedBackground from '@/components/ui/animated-background'
import BuyModule from './buyModule'
import SellModule from './sellModule'

interface WhitelistedPrincipal {
    userPrincipalId: string;
}

const mode = ['buy', 'sell'];

const ExchangeCard = ({ activeTab, handleTabChange, mode }: { activeTab: string, handleTabChange: (newActiveId: string) => void, mode: string[] }) => (
    <MaxWidthWrapper className='flex flex-col py-4 md:py-8 h-full items-center justify-center'>
        <Card className='w-[300px] md:w-[500px] animate-fade-bottom-up bg-transparent'>
            <CardHeader>
                <CardTitle className='flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-2 items-center justify-between'>
                    <div>BIT10 Exchange</div>
                    <div className='relative flex flex-row space-x-2 items-center justify-center border dark:border-white rounded-md px-2 py-1.5'>
                        <AnimatedBackground
                            defaultValue={activeTab}
                            className='rounded bg-primary'
                            transition={{ ease: 'easeInOut', duration: 0.2 }}
                            onValueChange={(newActiveId) => {
                                if (newActiveId) {
                                    handleTabChange(newActiveId)
                                }
                            }}
                        >
                            {mode.map((label, index) => (
                                <button
                                    key={index}
                                    data-id={label}
                                    type='button'
                                    className={`inline-flex px-2 items-center justify-center text-sm font-normal text-center transition-transform active:scale-[0.98] capitalize ${activeTab === label
                                        ? 'text-zinc-50'
                                        : 'text-zinc-800 dark:text-zinc-50'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </AnimatedBackground>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activeTab === 'buy' && <BuyModule />}
                {activeTab === 'sell' && <SellModule />}
            </CardContent>
        </Card>
    </MaxWidthWrapper>
)

export default function Swap() {
    const [activeTab, setActiveTab] = useState('buy');

    const { chain } = useChain();
    const { icpAddress } = useICPWallet();

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const fetchWhitelistedPrincipalIds = async () => {
        try {
            const result = await whitelistedPrincipalIds();
            return result;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('An error occurred while fetching whitelisted users. Please try again!');
            return [];
        }
    };

    const gatedMainnetAccess = useQueries({
        queries: [
            {
                queryKey: ['whitelistedUserPrincipalIds'],
                queryFn: () => fetchWhitelistedPrincipalIds(),
            }
        ],
    });

    const isLoading = gatedMainnetAccess.some(query => query.isLoading);
    const whitelistedPrincipal = gatedMainnetAccess[0]?.data ?? [];

    const isApproved = (whitelistedPrincipal as WhitelistedPrincipal[]).some(
        (item) => item.userPrincipalId === icpAddress
    );

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
        <div>
            {isLoading ? (
                <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
                    <Card className='w-96 px-2 pt-6 animate-fade-bottom-up bg-transparent'>
                        <CardContent className='flex flex-col space-y-2'>
                            <Skeleton className='h-56' />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <>
                    {chain !== 'icp' ? (
                        <ExchangeCard activeTab={activeTab} handleTabChange={handleTabChange} mode={mode} />
                    ) : isApproved ? (
                        <ExchangeCard activeTab={activeTab} handleTabChange={handleTabChange} mode={mode} />
                    ) : (
                        <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
                            <Card className='w-full md:max-w-96 py-8 bg-transparent'>
                                <CardHeader>
                                    <CardTitle className='text-center tracking-wide'>
                                        Access Restricted
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='text-center flex flex-col space-y-2'>
                                    <p>The Swap page is gated for mainnet access. Your Principal ID needs to be approved first to use the Swap feature.</p>
                                    <p>For access, please contact <a href='https://x.com/bit10startup' className='text-primary underline'>@bit10startup</a> on Twitter/X.</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
