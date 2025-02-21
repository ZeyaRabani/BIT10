/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useWallet } from '@/context/WalletContext'
import { addNewUser } from '@/actions/dbActions'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ModeToggle from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import PlugImg from '@/assets/wallet/plug.svg'
import XverseImg from '@/assets/wallet/xverse.svg'
import UnisatImg from '@/assets/wallet/unisat.svg'
import PhantomImg from '@/assets/wallet/phantom.svg'
// import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export default function Navbar() {
    const [visible, setVisible] = useState(true);
    const [open, setOpen] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [activeLink, setActiveLink] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [linkPosition, setLinkPosition] = useState<number>(0);
    const linkRefs = useRef<Record<string, HTMLSpanElement | null>>({});

    const { scrollY } = useScroll();
    const { isConnected, connectWallet, disconnectWallet, principalId } = useWallet();
    const pathname = usePathname();

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
        if (linkRefs.current[pathname]) {
            setLinkPosition(linkRefs.current[pathname]?.offsetLeft || 0);
            setActiveLink(pathname);
        }
    }, [pathname]);

    useEffect(() => {
        if (linkRefs.current[activeLink]) {
            setLinkPosition(linkRefs.current[activeLink]?.offsetLeft || 0);
        }
    }, [activeLink]);

    useMotionValueEvent(scrollY, 'change', (latest) => {
        if (latest > 50) {
            const previousScrollY = scrollY.getPrevious();
            if (previousScrollY !== undefined) {
                setVisible(latest < previousScrollY ? true : false);
            }
        }
    });

    const navbarVariants = {
        hidden: { y: '-100%', opacity: 0 },
        visible: { y: '0%', opacity: 1 },
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

    const handleLinkClick = (link: string) => {
        setActiveLink(link);
    };

    return (
        <motion.div
            initial='visible'
            animate={visible ? 'visible' : 'hidden'}
            variants={navbarVariants}
            transition={{ duration: 0.3 }}
            className='backdrop-blur-3xl fixed top-0 z-50 w-full'
        >
            <nav className='relative flex items-center py-2 flex-wrap px-2.5 md:px-12 tracking-wider justify-between'>
                <Link href='/' passHref>
                    <div className='flex flex-row items-center justify-start'>
                        <Image src='/logo/logo-circle.png' alt='logo' width={60} height={60} />
                        {/* <Badge variant='outline' className='ml-2 border-primary'>Mainnet Beta</Badge> */}
                    </div>
                </Link>

                <div className='hidden w-full md:inline-flex md:flex-grow md:w-auto'>
                    <div className='md:inline-flex md:flex-row md:ml-auto md:w-auto md:pl-16 w-full md:items-center items-start flex flex-col md:h-auto space-x-2'>
                        <Link href='/' passHref>
                            <span
                                ref={(el) => {
                                    linkRefs.current['/'] = el;
                                }}
                                onClick={() => handleLinkClick('/')}
                                // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                            >
                                About
                            </span>
                        </Link>

                        {
                            pathname === '/swap' || pathname === '/send' || pathname === '/portfolio' || pathname.startsWith('/explorer') || pathname === '/collateral' || pathname.startsWith('/collateral') ? (
                                <>
                                    <Link href='/swap' passHref>
                                        <span
                                            ref={(el) => {
                                                linkRefs.current['/swap'] = el;
                                            }}
                                            onClick={() => handleLinkClick('/swap')}
                                            // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/swap' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                            className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                                        >
                                            Swap
                                        </span>
                                    </Link>
                                    <Link href='/send' passHref>
                                        <span
                                            ref={(el) => {
                                                linkRefs.current['/send'] = el;
                                            }}
                                            onClick={() => handleLinkClick('/send')}
                                            // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/portfolio' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                            className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                                        >
                                            Send
                                        </span>
                                    </Link>
                                    <Link href='/portfolio' passHref>
                                        <span
                                            ref={(el) => {
                                                linkRefs.current['/portfolio'] = el;
                                            }}
                                            onClick={() => handleLinkClick('/portfolio')}
                                            // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/portfolio' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                            className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                                        >
                                            Portfolio
                                        </span>
                                    </Link>
                                    <Link href='/collateral' passHref>
                                        <span
                                            ref={(el) => {
                                                linkRefs.current['/collateral'] = el;
                                            }}
                                            onClick={() => handleLinkClick('/collateral')}
                                            // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/collateral' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                            className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                                        >
                                            Collateral
                                        </span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href='/faqs' passHref>
                                        <span
                                            ref={(el) => {
                                                linkRefs.current['/faqs'] = el;
                                            }}
                                            onClick={() => handleLinkClick('/faqs')}
                                            // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/faqs' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                            className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                                        >
                                            FAQs
                                        </span>
                                    </Link>

                                    <Link href='/resources' passHref>
                                        <span
                                            ref={(el) => {
                                                linkRefs.current['/resources'] = el;
                                            }}
                                            onClick={() => handleLinkClick('/resources')}
                                            // className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer ${pathname === '/resources' && 'border-b-2 border-gray-800 dark:border-white hover:border-transparent dark:hover:border-transparent'}`}
                                            className={`md:inline-flex md:w-auto w-full px-3 py-2 hover:rounded items-center justify-center hover:text-white hover:bg-primary cursor-pointer`}
                                        >
                                            Resources
                                        </span>
                                    </Link>
                                </>
                            )}
                    </div>
                </div>

                <div className='hidden w-full md:inline-flex md:flex-grow md:w-auto'>
                    <div className='md:inline-flex md:flex-row md:ml-auto md:w-auto w-full md:items-center items-start flex flex-col md:h-auto space-x-2'>
                        {
                            pathname === '/swap' || pathname === '/send' || pathname === '/portfolio' || pathname === '/collateral' ? (
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
                                    )}
                                </>
                            ) : (
                                <Link href='/launch' passHref>
                                    <Button className='rounded-full'>Launch App</Button>
                                </Link>
                            )}
                    </div>
                </div>

                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ModeToggle />
                    <ResponsiveNavbar />
                </div>

                <div
                    className='absolute bottom-4 left-0 h-0.5 bg-gray-800 dark:bg-white transition-all duration-300 rounded'
                    style={{ width: linkRefs.current[activeLink]?.offsetWidth ?? 0, transform: `translateX(${linkRefs.current[activeLink]?.offsetLeft ?? 0}px)` }}
                />
            </nav>
        </motion.div>
    );
}
