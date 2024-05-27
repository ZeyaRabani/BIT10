"use client"

import React, { useEffect } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'
import { useToast } from './ui/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from './ui/button'
import { LogOut, User } from 'lucide-react'
import { addUserToWaitlist } from '@/lib/supabaseRequests'

interface NavLinkType {
    href: string;
    text: string;
}

const profileLinkData: NavLinkType[] = [
    { href: '/dashboard', text: 'Dashboard' },
    { href: '/portfolio', text: 'Portfolio' }
]

export default function Navbar() {
    const { address, isConnecting } = useAccount();
    const { open } = useWeb3Modal();
    const { disconnect } = useDisconnect();

    const { toast } = useToast();

    useEffect(() => {
        const addUserToWaitlistAsync = async () => {
            if (address) {
                try {
                    await addUserToWaitlist({
                        address: address,
                    });
                } catch (error) {
                    // console.error("Error adding user to waitlist:", error);
                }
            }
        };

        addUserToWaitlistAsync();
    }, [address]);

    const disconnectWallet = () => {
        try {
            disconnect();
            toast({
                title: 'Wallet Disconnected Successfully!',
            })
        } catch (error) {
            toast({
                variant: 'destructive',
                title: `${error}`,
            })
        }
    };

    const renderLinksProfile = (links: any) => {
        return links.map((link: any) => (
            <Link key={link.href} href={link.href} passHref>
                <div className={`pb-[0.4rem] pr-1 hover:text-primary text-[0.95rem] ${link.icon ? 'flex flex-row justify-between items-center' : ''}`}>
                    {link.text}
                </div>
            </Link>
        ));
    };

    return (
        <div className='backdrop-blur-xl fixed z-50 w-full'>
            <nav className='flex items-center py-2 flex-wrap px-2.5 md:px-20 tracking-wider justify-between'>
                <Link href='/' passHref>
                    <div className='inline-flex items-center text-4xl md:text-5xl cursor-pointer font-base'>
                        BIT10
                    </div>
                </Link>

                <div className='hidden top-navbar w-full lg:inline-flex lg:flex-grow lg:w-auto' >
                    <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start flex flex-col lg:h-auto space-x-2' >

                        <Link href='/' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Home</span>
                        </Link>

                        {/* <Link href='/dashboard' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Dashboard</span>
                        </Link>

                        <Link href='/portfolio' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Portfolio</span>
                        </Link> */}

                        <Link href='/regulatory-compliance' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Regulatory Compliance</span>
                        </Link>

                        <Link href='/sign-up' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Sign Up for Early User</span>
                        </Link>

                        <Link href='/contact' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Contact Us</span>
                        </Link>

                        {address ? (
                            <>
                                <Popover>
                                    <PopoverTrigger>
                                        <User className='cursor-pointer hover:text-primary' />
                                    </PopoverTrigger>
                                    <PopoverContent align='end' className='max-w-[12rem] mt-2 hidden lg:block'>
                                        {renderLinksProfile(profileLinkData)}
                                        <div className='flex flex-row justify-between items-center text-destructive cursor-pointer' onClick={() => disconnectWallet()}>
                                            Disconnect Wallet
                                            <div>
                                                <LogOut size={16} />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </>
                        ) : (
                            <>
                                <Button className='text-white px-6' onClick={() => open()}>Connect Wallet</Button>
                            </>
                        )}

                    </div>

                </div>


                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ModeToggle />
                    <ResponsiveNavbar />
                </div>

            </nav>
        </div>
    )
}
