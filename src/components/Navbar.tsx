/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useWallet } from '@/context/WalletContext'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/ui/animated-background'
import ModeToggle from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import PlugImg from '@/assets/wallet/plug.svg'
import XverseImg from '@/assets/wallet/xverse.svg'
import UnisatImg from '@/assets/wallet/unisat.svg'
import PhantomImg from '@/assets/wallet/phantom.svg'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const links = {
    web: [
        { title: 'About', link: '/' },
        { title: 'FAQs', link: '/faqs' },
        { title: 'Resources', link: '/resources' }
    ],
    app: [
        { title: 'Swap', link: '/swap' },
        { title: 'Portfolio', link: '/portfolio' },
        { title: 'Collateral', link: '/collateral' },
        { title: 'Liquidity Hub', link: '/liquidity-hub' }
    ]
};

const wallets = [
    { name: 'Plug', img: PlugImg },
    { name: 'Xverse', img: XverseImg, soon: true },
    { name: 'UniSat', img: UnisatImg, soon: true },
    { name: 'Phantom', img: PhantomImg, soon: true }
];

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [activeLink, setActiveLink] = useState<string>('/');

    const { scrollY } = useScroll();
    const { isConnected, connectWallet, disconnectWallet, principalId } = useWallet();
    const pathname = usePathname();
    const router = useRouter();

    const appMode = links.app.some(link => pathname.startsWith(link.link));
    // const appMode = pathname === '/swap' || pathname === '/portfolio' || pathname.startsWith('/explorer') || pathname.startsWith('/collateral') || pathname.startsWith('/liquidity-hub')

    useEffect(() => {
        const active = links[appMode ? 'app' : 'web'].find(link => pathname === link.link);
        setActiveLink(active ? active.title : '/');
    }, [pathname, appMode]);

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

    const handleNavigation = (newActiveLink: string) => {
        const active = links[appMode ? 'app' : 'web'].find(link => link.title === newActiveLink);
        if (active) {
            setActiveLink(active.link);
            router.push(active.link);
        }
    };

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0
        if (latest > previous && latest > 50) {
            setHidden(true)
        } else {
            setHidden(false)
        }
    });

    const navbarVariants = {
        visible: { y: 0 },
        hidden: { y: '-100%' },
    };

    const handleWalletSelect = async () => {
        setIsConnecting(true);
        setOpen(false);
        await connectWallet();
        setIsConnecting(false);
    };

    const handleDisconnect = async () => {
        disconnectWallet();
    };

    return (
        <motion.div
            variants={navbarVariants}
            animate={hidden ? 'hidden' : 'visible'}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='backdrop-blur-3xl fixed top-0 z-50 w-full'>
            <nav className='flex items-center justify-between py-2 px-2.5 md:px-12'>
                <div className='flex lg:flex-1'>
                    <Link href='/' passHref>
                        <div className='flex flex-row space-x-1 items-center justify-center'>
                            <Image src='/logo/logo-circle.png' alt='logo' width={60} height={60} />
                            <Badge variant='outline' className='border-primary text-primary'>Testnet</Badge>
                        </div>
                    </Link>
                </div>

                <div className='hidden lg:pl-16 lg:flex'>
                    <AnimatedBackground
                        defaultValue={activeLink || '/'}
                        onValueChange={(newActiveLink) => {
                            if (newActiveLink) {
                                handleNavigation(newActiveLink)
                            }
                        }}
                        className='border-b-2 border-white'
                        transition={{
                            ease: 'easeInOut',
                            duration: 0.2,
                        }}
                    >
                        {links[appMode ? 'app' : 'web'].map((label, index) => {
                            return (
                                <button
                                    data-id={label.title}
                                    key={index}
                                    type='button'
                                    aria-label={`${label.title} view`}
                                    className='md:w-auto w-full mx-2 px-3 py-2 hover:rounded hover:text-white hover:bg-primary cursor-pointer'
                                >
                                    {label.title}
                                </button>
                            );
                        })}
                    </AnimatedBackground>
                </div>

                <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
                    {
                        appMode ? (
                            <>
                                {isConnected ? (
                                    <Button variant='destructive' onClick={handleDisconnect}>Disconnect wallet</Button>
                                ) : (
                                    <Dialog open={open} onOpenChange={setOpen}>
                                        <DialogTrigger asChild>
                                            <Button disabled={isConnecting}>
                                                {isConnecting && <Loader2 className='animate-spin mr-2' size={15} />}
                                                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className='max-w-[90vw] md:max-w-[400px]'>
                                            <DialogHeader>
                                                <DialogTitle className='tracking-wide pt-2 md:pt-0'>Connect your wallet to get started</DialogTitle>
                                            </DialogHeader>
                                            <div className='flex flex-col space-y-2'>
                                                {wallets.map(({ name, img, soon }) => (
                                                    <Button key={name} variant='ghost' className='flex flex-row w-full justify-between items-center hover:bg-accent' onClick={!soon ? handleWalletSelect : undefined}>
                                                        <div className='flex flex-row space-x-1 md:space-x-2 items-center'>
                                                            <Image height={30} width={30} src={img} alt={name} className='rounded' />
                                                            <span className='text-lg md:text-xl'>{name}</span>
                                                        </div>
                                                        {soon && <span className='text-sm text-accent-foreground/80'>Available soon</span>}
                                                    </Button>
                                                ))}
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

                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ModeToggle />
                    <ResponsiveNavbar />
                </div>
            </nav>
        </motion.div>
    )
}
