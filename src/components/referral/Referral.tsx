import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useICPWallet } from '@/context/ICPWalletContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlarmCheck, Copy } from 'lucide-react'
import AnimatedBackground from '@/components/ui/animated-background'
import Leaderboard from './leaderboard'
import Profile from './profile'

const tabs = ['Leaderboard', 'Profile'];

export default function Referral() {
    const [activeTab, setActiveTab] = useState('Leaderboard');
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const endDate = new Date('May 25, 2025 15:30:00 GMT+0530');

    const { ICPAddress } = useICPWallet();

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = endDate.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCopyReferral = () => {
        if (!ICPAddress) {
            toast.error('Please connect your wallet first');
            return;
        }

        const referralLink =
            // `https://bit10.app?referral=${ICPAddress}`
            `http://localhost:3000?referral=${ICPAddress}`;

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
                            <div>Ends in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</div>
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
