"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ModeToggle from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function Navbar() {
    const [isHidden, setIsHidden] = useState(false);
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const { isConnected, connectWallet, disconnectWallet, principalId } = useWallet();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.scrollY;
            setIsHidden(currentScrollPos > prevScrollPos && currentScrollPos > 0);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos]);

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
                    // toast.success('Wallet connected successfully!');
                } catch (error) {
                    toast.error('An error occurred while setting up your account. Please try again!.');
                }
            }
        };

        addUserToDB();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [principalId]);

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
        <div className={`backdrop-blur-3xl fixed top-0 z-50 w-full transition-all duration-200 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
            <nav className='flex items-center py-2 flex-wrap px-2.5 md:px-12 tracking-wider justify-between'>
                <Link href='/' passHref>
                    <Image src='/logo/logo-circle.png' alt='logo' width={60} height={60} />
                </Link>

                <div className='hidden w-full md:inline-flex md:flex-grow md:w-auto' >
                    <div className='md:inline-flex md:flex-row md:ml-auto md:w-auto md:pl-16 lg:pl-28 w-full md:items-center items-start flex flex-col md:h-auto space-x-2' >
                        <Link href='/' passHref>
                            <span className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}>
                                About
                            </span>
                        </Link>

                        {
                            pathname === '/swap' || pathname === '/portfolio' ? (
                                <>
                                    <Link href='/swap' passHref>
                                        <span className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/swap' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}>
                                            Swap
                                        </span>
                                    </Link>
                                    <Link href='/portfolio' passHref>
                                        <span className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/portfolio' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}>
                                            Portfolio
                                        </span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href='/team' passHref>
                                        <span className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/team' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}>
                                            Team
                                        </span>
                                    </Link>

                                    <Link href='/resources' passHref>
                                        <span className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/resources' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}>
                                            Resources
                                        </span>
                                    </Link>

                                    <Link href='/sign-up' passHref>
                                        <span className={`relative group md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/sign-up' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}>
                                            Sign Up
                                            {/* <Badge variant='outline' className='border-primary text-primary absolute top-0 -right-16 hover-target group-hover:hidden'>Testnet</Badge> */}
                                            <Badge variant='outline' className='border-primary text-primary absolute top-0 -right-[4.5rem]'>Testnet</Badge>
                                        </span>
                                    </Link>
                                </>
                            )
                        }
                    </div>
                </div>

                <div className='hidden w-full md:inline-flex md:flex-grow md:w-auto'>
                    <div className='md:inline-flex md:flex-row md:ml-auto md:w-auto w-full md:items-center items-start flex flex-col md:h-auto space-x-2' >

                        {
                            pathname === '/swap' || pathname === '/portfolio' ? (
                                <>
                                    {isConnected ? (
                                        <Button variant='destructive' onClick={handleDisconnect}>Disconnect wallet</Button>
                                    ) : (
                                        <Dialog open={open} onOpenChange={setOpen}>
                                            <DialogTrigger asChild>
                                                <Button disabled={isConnecting}>
                                                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className='max-w-[90vw] md:max-w-[400px]'>
                                                <DialogHeader>
                                                    <DialogTitle className='tracking-wide pt-2 md:pt-0'>Connect your wallet to get started</DialogTitle>
                                                </DialogHeader>
                                                <div className='flex flex-col space-y-2'>
                                                    <Button variant='ghost' className='flex flex-row space-x-1 md:space-x-2 w-full justify-start items-center hover:bg-accent' onClick={handleWalletSelect}>
                                                        <Image height='30' width='30' src='/assets/wallet/plug.svg' alt='Plug' className='rounded' />
                                                        <div className='text-lg md:text-xl'>
                                                            Plug
                                                        </div>
                                                    </Button>
                                                    <Button variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent'>
                                                        <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                                            <Image height='30' width='30' src='/assets/wallet/xverse.svg' alt='Xverse' className='rounded' />
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

                                                <p className='py-2 text-center'>By connecting a wallet, you agree to BIT10&apos;s <a href='/tos' target='_blank'><span className='underline'>Terms of Service</span></a>, and consent to its <a href='/privacy' target='_blank'><span className='underline'>Privacy Policy</span></a>.</p>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </>
                            ) : (
                                <Link href='/swap' passHref>
                                    <Button className='rounded-full'>Launch App</Button>
                                </Link>
                            )}
                    </div>

                </div>

                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ModeToggle />
                    <ResponsiveNavbar />
                </div>

            </nav>
        </div>
    );
}
