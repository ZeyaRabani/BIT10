"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { usePathname } from 'next/navigation'
import { Menu, X, ArrowRightLeft, CircleDollarSign, BriefcaseBusiness, Home, MessageCircleQuestion, BookCopy, User, Landmark } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import PlugImg from '@/assets/wallet/plug.svg'
import XverseImg from '@/assets/wallet/xverse.svg'
import UnisatImg from '@/assets/wallet/unisat.svg'
import PhantomImg from '@/assets/wallet/phantom.svg'

export default function ResponsiveNavbar() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);

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
        setIsConnecting(true);
        setOpen(false);
        await connectWallet();
        setIsConnecting(false);
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
                                        <Image src='/logo/logo-circle.png' alt='logo' width={60} height={60} />
                                    </Link>

                                    <button className='absolute top-4 right-6' onClick={toggleOpen} aria-hidden='false' aria-label='button'>
                                        <X className='h-7 w-7' aria-hidden='false' />
                                    </button>
                                </div>

                                <div className='grid justify-center'>
                                    <div className='inline-flex w-64 h-1 bg-indigo-500 rounded-full'></div>
                                </div>

                                <div className='grid place-items-center px-8 text-xl py-2 gap-2 w-full mb-4'>

                                    <div className='border-b-2 py-2 px-2 cursor-pointer w-full'>
                                        <Link onClick={() => closeOnCurrent('/')} href='/'>
                                            <div className='flex flex-row justify-between items-center'>
                                                About
                                                <Home />
                                            </div>
                                        </Link>
                                    </div>

                                    {
                                        pathname === '/swap' || pathname === '/send' || pathname === '/portfolio' || pathname === '/collateral' ? (
                                            <>
                                                <div className='pt-2 px-2 cursor-pointer w-full'>
                                                    <Link onClick={() => closeOnCurrent('/swap')} href='/swap'>
                                                        <div className='flex flex-row justify-between items-center'>
                                                            Swap
                                                            <ArrowRightLeft />
                                                        </div>
                                                    </Link>
                                                </div>

                                                <div className='border-t-2 pt-2 px-2 cursor-pointer w-full'>
                                                    <Link onClick={() => closeOnCurrent('/send')} href='/send'>
                                                        <div className='flex flex-row justify-between items-center'>
                                                            Send
                                                            <CircleDollarSign />
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
                                                    <Link onClick={() => closeOnCurrent('/collateral')} href='/collateral'>
                                                        <div className='flex flex-row justify-between items-center'>
                                                            Collateral
                                                            <Landmark />
                                                        </div>
                                                    </Link>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className='pt-2 px-2 cursor-pointer w-full'>
                                                    <Link onClick={() => closeOnCurrent('/faqs')} href='/faqs'>
                                                        <div className='flex flex-row justify-between items-center'>
                                                            FAQs
                                                            <MessageCircleQuestion />
                                                        </div>
                                                    </Link>
                                                </div>

                                                <div className='border-t-2 pt-2 px-2 cursor-pointer w-full'>
                                                    <Link onClick={() => closeOnCurrent('/resources')} href='/resources'>
                                                        <div className='flex flex-row justify-between items-center'>
                                                            Resources
                                                            <BookCopy />
                                                        </div>
                                                    </Link>
                                                </div>

                                                <div className='border-t-2 pt-2 px-2 cursor-pointer w-full'>
                                                    <Link onClick={() => closeOnCurrent('/sign-up')} href='/sign-up'>
                                                        <div className='flex flex-row justify-between items-center'>
                                                            Sign Up
                                                            <User />
                                                        </div>
                                                    </Link>
                                                </div>
                                            </>
                                        )
                                    }

                                    {
                                        pathname === '/swap' || pathname === '/send' || pathname === '/portfolio' ? (
                                            <>
                                                {isConnected ? (
                                                    <div className='border-y-2 py-2 px-2 cursor-pointer w-full'>
                                                        <Button variant='destructive' className='w-full' onClick={handleDisconnect}>
                                                            Disconnect Wallet
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className='border-y-2 w-full p-2'>
                                                        <Dialog open={open} onOpenChange={setOpen}>
                                                            <DialogTrigger className='w-full'>
                                                                <Button disabled={isConnecting} className='w-full'>
                                                                    {isConnecting && <Loader2 className='animate-spin mr-2' size={15} />}
                                                                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogTitle></DialogTitle>
                                                            <DialogContent className='max-w-[90vw] md:max-w-[400px]'>
                                                                <DialogHeader>
                                                                    <DialogTitle className='tracking-wide pt-2 md:pt-0'>Connect your wallet to get started</DialogTitle>
                                                                </DialogHeader>
                                                                <div className='flex flex-col space-y-2'>
                                                                    <Button variant='ghost' className='flex flex-row space-x-1 md:space-x-2 w-full justify-start items-center hover:bg-accent' onClick={handleWalletSelect}>
                                                                        <Image height='30' width='30' src={PlugImg} alt='Plug' className='rounded' />
                                                                        <div className='text-lg md:text-xl'>
                                                                            Plug
                                                                        </div>
                                                                    </Button>
                                                                    <Button variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent'>
                                                                        <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                                                            <Image height='30' width='30' src={XverseImg} alt='Xverse' className='rounded' />
                                                                            <div className='text-lg md:text-xl'>
                                                                                Xverse
                                                                            </div>
                                                                        </div>
                                                                        <div className='text-sm text-accent-foreground/80'>
                                                                            Available soon
                                                                        </div>
                                                                    </Button>
                                                                    <Button variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent'>
                                                                        <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                                                            <Image height='30' width='30' src={UnisatImg} alt='UniSat' className='rounded' />
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
                                                                            <Image height='30' width='30' src={PhantomImg} alt='Phantom' className='rounded' />
                                                                            <div className='text-lg md:text-xl'>
                                                                                Phantom
                                                                            </div>
                                                                        </div>
                                                                        <div className='text-sm text-accent-foreground/80'>
                                                                            Available soon
                                                                        </div>
                                                                    </Button>
                                                                </div>

                                                                <p className='py-2 text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className='border-y-2 py-2 px-2 cursor-pointer w-full'>
                                                <Link href='/swap' passHref>
                                                    <Button className='rounded-full w-full'>Launch App</Button>
                                                </Link>
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
