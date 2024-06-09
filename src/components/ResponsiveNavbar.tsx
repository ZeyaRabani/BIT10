"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRightLeft, BriefcaseBusiness, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import Image from 'next/image'

export default function ResponsiveNavbar() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);

    const { isConnected, connectWallet, disconnectWallet } = useWallet();
    const pathname = usePathname();

    const toggleOpen = () => {
        if (isOpen) {
            setIsClosing(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsClosing(false);
            }, 300);
        } else {
            setIsOpen(true);
        }
    };

    useEffect(() => {
        if (isOpen) toggleOpen()
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [pathname])

    const closeOnCurrent = (href: string) => {
        if (pathname === href) {
            toggleOpen()
        }
    }

    const handleWalletSelect = async () => {
        connectWallet();
        setOpen(false);
    }

    const handleDisconnect = async () => {
        disconnectWallet();
    };

    return (
        <div className='md:hidden'>

            <button type='button' onClick={toggleOpen} aria-hidden='false' aria-label='button' className='pt-1'>
                <Menu className='h-7 w-7' aria-hidden='false' />
            </button>

            {isOpen && (
                <div>
                    <div className={`flex overflow-x-hidden mx-2 -mt-2 h-screen overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none md:hidden transition-all duration-200 ${isClosing ? 'animate-fade-out-up' : 'animate-fade-in-down'}`}>
                        <div className='relative my-4 mx-auto w-screen'>
                            <div className='border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none'>
                                <div className='flex items-start justify-between px-5 py-2 border-solid rounded-t'>
                                    <Link href='/' passHref>
                                        <Image src='/logo/logo.png' alt='logo' width={60} height={60} />
                                    </Link>

                                    <button className='absolute top-4 right-6' onClick={toggleOpen} aria-hidden='false' aria-label='button'>
                                        <X className='h-7 w-7' aria-hidden='false' />
                                    </button>
                                </div>

                                <div className='grid justify-center'>
                                    <div className='inline-flex w-64 h-1 bg-indigo-500 rounded-full'></div>
                                </div>

                                <div className='grid place-items-center px-8 text-xl py-2 gap-2 w-full mb-4'>

                                    <div className='pt-2 px-2 cursor-pointer w-full'>
                                        <Link onClick={() => closeOnCurrent('/')} href='/'>
                                            <div className='flex flex-row justify-between items-center'>
                                                Swap
                                                <ArrowRightLeft />
                                            </div>
                                        </Link>
                                    </div>

                                    <div className='border-t-2 pt-2 px-2 cursor-pointer w-full'>
                                        <Link onClick={() => closeOnCurrent('/portfolio')} href='/portfolio'>
                                            <div className='flex flex-row justify-between items-center'>
                                                Portfolio
                                                <BriefcaseBusiness />
                                            </div>
                                        </Link>
                                    </div>

                                    <div className='border-t-2 pt-2 px-2 cursor-pointer w-full'>
                                        <Link onClick={() => closeOnCurrent('/about')} href='/about'>
                                            <div className='flex flex-row justify-between items-center'>
                                                About
                                                <Home />
                                            </div>
                                        </Link>
                                    </div>

                                    {isConnected ? (
                                        <div className='border-y-2 py-2 px-2 cursor-pointer w-full'>
                                            <Button variant='destructive' className='text-md w-full' onClick={handleDisconnect}>
                                                Disconnect Wallet
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className='border-y-2 w-full p-2'>
                                            <Dialog open={open} onOpenChange={setOpen}>
                                                <DialogTrigger asChild>
                                                    <Button className='text-md w-full'>
                                                        Connect Wallet
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className='max-w-[90vw] md:max-w-[400px]'>
                                                    <div className='flex flex-col space-y-4'>
                                                        <p className='text-lg text-center'>Connect your wallet to get started</p>
                                                        <div className='flex flex-col space-y-2'>
                                                            <Button variant='ghost' className='flex flex-row space-x-1 md:space-x-2 w-full justify-start items-center hover:bg-accent' onClick={handleWalletSelect}>
                                                                <Image height='30' width='30' src='/assets/wallet/xverse.svg' alt='Xverse' className='rounded' />
                                                                <div className='text-lg md:text-xl'>
                                                                    Xverse
                                                                </div>
                                                            </Button>
                                                            <Button variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent'>
                                                                <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                                                    <Image height='30' width='30' src='/assets/wallet/unisat.svg' alt='UniSat' className='rounded' />
                                                                    <div className='text-lg md:text-xl'>
                                                                        UniSat
                                                                    </div>
                                                                </div>
                                                                <div className='text-sm text-accent-foreground/80'>
                                                                    Available soon
                                                                </div>
                                                            </Button>
                                                            <Button variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent'>
                                                                <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                                                    <Image height='30' width='30' src='/assets/wallet/phantom.svg' alt='Phantom' className='rounded' />
                                                                    <div className='text-lg md:text-xl'>
                                                                        Phantom
                                                                    </div>
                                                                </div>
                                                                <div className='text-sm text-accent-foreground/80'>
                                                                    Available soon
                                                                </div>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <p className='py-2 text-center'>By connecting a wallet, you agree to Bit10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='opacity-25 fixed inset-0 z-40 h-[200vh] bg-black md:hidden'></div>
                </div>
            )}
        </div>
    )
}
