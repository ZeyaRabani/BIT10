import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useWallet } from '@/context/WalletContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlarmCheck, Copy } from 'lucide-react'
import Timer from './timer'
import AnimatedBackground from '@/components/ui/animated-background'
import Leaderboard from './leaderboard'
import Profile from './profile'

const tabs = ['Leaderboard', 'Profile'];

export default function Referral() {
    const [activeTab, setActiveTab] = useState('Leaderboard');

    const { principalId } = useWallet();

    const handleCopyReferral = () => {
        if (!principalId) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            `https://bit10.app?referral=${principalId}`
        // `http://localhost:3000?referral=${principalId}`;

        navigator.clipboard.writeText(referralLink)
            .then(() => {
                toast.success('Referral link copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy referral link');
            });
    };

    const handleTabChange = (label: string | null) => {
        if (label) {
            setActiveTab(label)
        }
    }

    return (
        <div>
            {/* Update this */}
            <header className='bg-primary py-2 px-4 flex justify-between items-center mb-4 rounded'>
                <p className='text-gray-200 font-medium'>⚠️ Note: This referral program is part of the testing phase. Top 3 users will get a chance to be interviewed and receive incentives for their participation.</p>
            </header>
            <Card className='dark:border-white animate-fade-bottom-up-slow'>
                <CardHeader className='flex flex-col md:flex-row items-center justify-center md:justify-between space-y-2 md:space-y-0'>
                    <div className='text-2xl md:text-4xl text-center md:text-start'>Referral</div>
                    <div>
                        <Button onClick={handleCopyReferral}>
                            <Copy />
                            Copy your referral link
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col md:flex-row space-y-2 md:space-y-0 items-center justify-center md:justify-between'>
                        <div className='flex flex-row space-x-1'>
                            <AlarmCheck className='h-6 w-6' />
                            <Timer />
                        </div>
                        <div className='relative flex flex-row space-x-2 items-center justify-center border dark:border-white rounded-md px-2 py-1.5'>
                            <AnimatedBackground
                                defaultValue='Leaderboard'
                                className='rounded bg-primary'
                                transition={{
                                    ease: 'easeInOut',
                                    duration: 0.2,
                                }}
                                onValueChange={(newActiveId) => handleTabChange(newActiveId)}
                            >
                                {tabs.map((label, index) => (
                                    <button
                                        key={index}
                                        data-id={label}
                                        type='button'
                                        className={`inline-flex px-2 items-center justify-center text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </AnimatedBackground>
                        </div>
                    </div>

                    <div className='flex flex-col'>
                        {
                            activeTab === 'Leaderboard' &&
                            <Leaderboard />
                        }
                        {
                            activeTab === 'Profile' &&
                            <Profile />
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
