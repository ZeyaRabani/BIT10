/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/context/WalletContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Menu, X, Loader2, ArrowRightLeft, BriefcaseBusiness, Home, MessageCircleQuestion, BookCopy, Landmark, HandCoins, Tickets } from 'lucide-react'
import PlugImg from '@/assets/wallet/plug.svg'
// import XverseImg from '@/assets/wallet/xverse.svg'
// import UnisatImg from '@/assets/wallet/unisat.svg'
// import PhantomImg from '@/assets/wallet/phantom.svg'

const links = {
    web: [
        { title: 'About', link: '/', icon: Home },
        { title: 'FAQs', link: '/faqs', icon: MessageCircleQuestion },
        { title: 'Resources', link: '/resources', icon: BookCopy },
        // { title: 'Referral', link: '/referral', icon: Tickets }
    ],
    app: [
        { title: 'Swap', link: '/swap', icon: ArrowRightLeft },
        { title: 'Portfolio', link: '/portfolio', icon: BriefcaseBusiness },
        { title: 'Collateral', link: '/collateral', icon: Landmark },
        { title: 'Liquidity Hub', link: '/liquidity-hub', icon: HandCoins },
        // { title: 'Referral', link: '/referral', icon: Tickets }
    ]
};

const wallets = [
    { name: 'Plug', img: PlugImg },
    // { name: 'Xverse', img: XverseImg, soon: true },
    // { name: 'UniSat', img: UnisatImg, soon: true },
    // { name: 'Phantom', img: PhantomImg, soon: true }
];

export default function ResponsiveNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [open, setOpen] = useState(false);

    const { isConnected, connectWallet, disconnectWallet } = useWallet();
    const pathname = usePathname();
    const appMode = links.app.some(link => pathname.startsWith(link.link));

    const toggleMenu = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (isOpen) toggleMenu(); }, [pathname]);

    const handleWalletSelect = async () => {
        setIsConnecting(true);
        setOpen(false);
        await connectWallet();
        setIsConnecting(false);
    };

    return (
        <div className='lg:hidden'>
            <button onClick={toggleMenu} className='pt-1'>
                <Menu className='h-7 w-7' />
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

                                    <button className='absolute top-4 right-6' onClick={toggleMenu} aria-hidden='false' aria-label='button'>
                                        <X className='h-7 w-7' aria-hidden='false' />
                                    </button>
                                </div>

                                <div className='grid justify-center'>
                                    <div className='inline-flex w-64 h-1 bg-indigo-500 rounded-full'></div>
                                </div>

                                <div className='grid px-8 text-xl py-2 gap-2 w-full mb-4'>
                                    {links[appMode ? 'app' : 'web'].map(({ title, link, icon: Icon }) => (
                                        <Link key={link} href={link} onClick={() => pathname === link && toggleMenu()}>
                                            <div className='border-b-2 py-2 px-2 cursor-pointer w-full flex flex-row justify-between items-center'>
                                                {title}
                                                <Icon />
                                            </div>
                                        </Link>
                                    ))}
                                    {appMode ? (
                                        <div>
                                            {isConnected ? (
                                                <div className='border-b-2 pb-2 px-2 cursor-pointer w-full'>
                                                    <Button variant='destructive' className='w-full' onClick={disconnectWallet}>
                                                        Disconnect Wallet
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Dialog open={open} onOpenChange={setOpen}>
                                                    <div className='border-b-2 pb-2 px-2 cursor-pointer w-full'>
                                                        <DialogTrigger className='w-full'>
                                                            <Button disabled={isConnecting} className='w-full'>
                                                                {isConnecting ? <Loader2 className='animate-spin mr-2' size={15} /> : 'Connect Wallet'}
                                                            </Button>
                                                        </DialogTrigger>
                                                    </div>
                                                    <DialogContent className='max-w-[90vw] md:max-w-[400px]'>
                                                        <DialogHeader>
                                                            <DialogTitle>Connect your wallet to get started</DialogTitle>
                                                        </DialogHeader>
                                                        <div className='flex flex-col space-y-2'>
                                                            {/* {wallets.map(({ name, img, soon }) => ( */}
                                                            {wallets.map(({ name, img }) => (
                                                                // <Button key={name} variant='ghost' className='flex justify-between items-center w-full hover:bg-accent' onClick={!soon ? handleWalletSelect : undefined}>
                                                                <Button key={name} variant='ghost' className='flex justify-between items-center w-full hover:bg-accent' onClick={handleWalletSelect}>
                                                                    <div className='flex items-center space-x-2'>
                                                                        <Image height={30} width={30} src={img} alt={name} className='rounded' />
                                                                        <span className='text-lg md:text-xl'>{name}</span>
                                                                    </div>
                                                                    {/* {soon && <span className='text-sm text-accent-foreground/80'>Available soon</span>} */}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='border-b-2 py-2 px-2 cursor-pointer w-full'>
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
    );
}
