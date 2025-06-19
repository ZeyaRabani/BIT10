import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useWallet } from '@/context/WalletContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlarmCheck, Copy } from 'lucide-react'
import Timer from './timer'
import AnimatedBackground from '@/components/ui/animated-background'
import Profile from './profile'
import Leaderboard from './leaderboard'

const tabs = ['Profile', 'Leaderboard'];

export default function Referral() {
    const [activeTab, setActiveTab] = useState('Profile');

    const { principalId } = useWallet();

    const handleCopyMainnetReferral = () => {
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

    const handleCopyTestnetReferral = () => {
        if (!principalId) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            `https://testnet.bit10.app?referral=${principalId}`
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
            <Card className='dark:border-white animate-fade-bottom-up-slow'>
                <CardHeader className='flex flex-col md:flex-row items-center justify-center md:justify-between space-y-2 md:space-y-0'>
                    <div className='text-2xl md:text-4xl text-center md:text-start'>Referral</div>
                    <div>
                        <Popover>
                            <PopoverTrigger className='bg-primary px-4 py-2 rounded text-white'>Copy your referral link</PopoverTrigger>
                            <PopoverContent className='flex flex-col items-start space-y-2' align='end'>
                                <Button onClick={handleCopyMainnetReferral}>
                                    <Copy />
                                    Copy your Mainnet referral link
                                </Button>

                                <Button onClick={handleCopyTestnetReferral}>
                                    <Copy />
                                    Copy your Testnet referral link
                                </Button>
                            </PopoverContent>
                            {/* <PopoverContent>Place content for the popover here.</PopoverContent> */}
                        </Popover>
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
                                defaultValue='Profile'
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
                            activeTab === 'Profile' &&
                            <Profile />
                        }
                        {
                            activeTab === 'Leaderboard' &&
                            <Leaderboard />
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
