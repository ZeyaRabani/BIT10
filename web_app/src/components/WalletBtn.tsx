/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { addNewUser, addNewReferral, addNewReferralTasks } from '@/actions/dbActions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import PlugImg from '@/assets/wallet/plug.svg'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariantsRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
};

const icpWallets = [
    { name: 'Plug', img: PlugImg }
];

export default function WalletBtn() {
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const [referralCode] = useLocalStorage('referral');

    const { isConnected, connectWallet, disconnectWallet, principalId } = useWallet();

    useEffect(() => {
        const addUserToDB = async () => {
            if (isConnected && principalId) {
                try {
                    const result = await addNewUser({
                        principalId: principalId.toString(),
                    });
                    if (result === 'Error adding new user') {
                        toast.error('An error occurred while setting up your account. Please try again!.');
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while setting up your account. Please try again!.');
                }
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addUserToDB();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [principalId]);

    useEffect(() => {
        const addReferralTaskToDB = async () => {
            if (isConnected && principalId) {
                try {
                    const result = await addNewReferralTasks({
                        address: principalId.toString(),
                    });
                    if (result === 'Error adding new referral task') {
                        toast.error('An error occurred while adding referral. Please try again!');
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while adding referral. Please try again!');
                }
            }
        }

        const addReferralToDB = async () => {
            if (referralCode) {
                if (isConnected && principalId) {
                    try {
                        const result = await addNewReferral({
                            referralCode: referralCode,
                            userId: principalId
                        });
                        if (result === 'Error adding new referral') {
                            toast.error('An error occurred while adding referral. Please try again!');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        toast.error('An error occurred while adding referral. Please try again!');
                    }
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addReferralToDB();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addReferralTaskToDB();
    }, [referralCode, isConnected, principalId]);

    useEffect(() => {
        const addReferralTaskToDB = async () => {
            if (isConnected && principalId) {
                try {
                    const result = await addNewReferralTasks({
                        address: principalId.toString(),
                    });
                    if (result === 'Error adding new referral task') {
                        toast.error('An error occurred while adding referral. Please try again!');
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while adding referral. Please try again!');
                }
            }
        }

        const addReferralToDB = async () => {
            if (referralCode && principalId && principalId !== referralCode) {
                try {
                    const result = await addNewReferral({
                        referralCode: referralCode,
                        userId: principalId
                    });
                    if (result === 'Error adding new referral') {
                        toast.error('An error occurred while adding referral. Please try again!');
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    toast.error('An error occurred while adding referral. Please try again!');
                }
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addReferralTaskToDB();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        addReferralToDB();
    }, [referralCode, principalId, isConnected]);

    const handleDisconnect = async () => {
        disconnectWallet();
    };

    const renderChainContent = () => {
        const handleICPWalletSelect = async () => {
            setIsConnecting(true);
            setOpen(false);
            await connectWallet();
            setIsConnecting(false);
        };

        return (
            <div className='flex flex-col justify-between space-y-2 h-[22rem] md:h-72'>
                <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='grid gap-2 items-center overflow-x-hidden'>
                    {icpWallets.map(({ name, img }) => (
                        <motion.div variants={cardVariantsRight} key={name}>
                            <Button variant='outline' className='flex flex-row w-full md:py-6 justify-center items-center dark:border-white' onClick={handleICPWalletSelect}>
                                <Image height={30} width={30} src={img} alt={name} className='rounded' />
                                <div className='text-lg md:text-xl overflow-hidden'>{name}</div>
                            </Button>
                        </motion.div>
                    ))}
                </motion.div>
                <p className='text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
            </div>
        );
    };

    return (
        <div>
            {isConnected ? (
                <Button variant='destructive' onClick={handleDisconnect} className='w-full'>Disconnect wallet</Button>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isConnecting} className='w-full'>
                            {isConnecting && <Loader2 className='animate-spin mr-2' size={15} />}
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-[90vw] md:max-w-[380px]'>
                        <DialogHeader>
                            <DialogTitle className='tracking-wide pt-2 md:pt-0'>
                                Connect your wallet to get started
                            </DialogTitle>
                        </DialogHeader>
                        {renderChainContent()}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
