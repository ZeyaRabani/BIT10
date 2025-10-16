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
import BuyModule from './buyModule'
import SellModule from './sellModule'

interface WhitelistedPrincipal {
    userPrincipalId: string;
}

const ExchangeCard = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
    <MaxWidthWrapper className='flex flex-col py-4 md:py-12 h-full items-center justify-center'>
        <div className='w-[300px] md:w-[500px] animate-fade-bottom-up bg-transparent'>
            {activeTab === 'buy' && <BuyModule onSwitchToSell={() => onTabChange('sell')} />}
            {activeTab === 'sell' && <SellModule onSwitchToBuy={() => onTabChange('buy')} />}
        </div>
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
                    <Card className='border-muted w-96 px-2 pt-6 animate-fade-bottom-up bg-transparent'>
                        <CardContent className='flex flex-col space-y-2'>
                            <Skeleton className='h-56' />
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <>
                    {chain !== 'icp' ? (
                        <ExchangeCard activeTab={activeTab} onTabChange={handleTabChange} />
                    ) : isApproved ? (
                        <ExchangeCard activeTab={activeTab} onTabChange={handleTabChange} />
                    ) : (
                        <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
                            <Card className='border-muted w-full md:max-w-96 py-8 bg-transparent'>
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
