/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useChain } from '@/context/ChainContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/ui/animated-background'
import ModeToggle from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import WalletBtn from './WalletBtn'
import { Badge } from '@/components/ui/badge'

const links = {
    web: [
        { title: 'About', link: '/' },
        { title: 'Resources', link: '/resources' },
        { title: 'Whitepaper', link: '/whitepaper' }
    ],
    app: [
        { title: 'Buy BIT10.TOP', link: '/buy' },
        { title: 'DEX', link: '/swap' },
        { title: 'Lend & Borrow', link: '/lend-and-borrow' },
        { title: 'Portfolio', link: '/portfolio' },
        { title: 'Collateral', link: '/collateral' },
        { title: 'Email wallet', link: '/newbie' }
    ],
}

export default function Navbar() {
    const [activeLink, setActiveLink] = useState<string>('/');
    const [hidden, setHidden] = useState(false);

    const { chain } = useChain();
    const { scrollY } = useScroll();
    const pathname = usePathname();
    const router = useRouter();

    const filteredAppLinks = useMemo(() => {
        return links.app.filter((item) => {
            if (item.title === 'Email wallet' && chain !== 'privy') {
                return false
            }
            return true
        })
    }, [chain])

    const appMode = filteredAppLinks.some((link) =>
        pathname.startsWith(link.link)
    );

    useEffect(() => {
        const active = links[appMode ? 'app' : 'web'].find(link => pathname === link.link);
        setActiveLink(active ? active.title : '/');
    }, [pathname, appMode]);

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

                <div className='hidden lg:pl-4 lg:flex space-x-2'>
                    <AnimatedBackground
                        defaultValue={activeLink || '/'}
                        onValueChange={(newActiveLink) => {
                            if (newActiveLink) {
                                handleNavigation(newActiveLink)
                            }
                        }}
                        className='border-b-2 border-gray-900 dark:border-white'
                        transition={{
                            ease: 'easeInOut',
                            duration: 0.2,
                        }}
                    >
                        {appMode
                            ? filteredAppLinks.map((item, index) => (
                                <button
                                    data-id={item.title}
                                    key={index}
                                    type='button'
                                    aria-label={`${item.title} view`}
                                    className='md:w-auto w-full mx-2 px-3 py-2 hover:rounded hover:text-white hover:bg-primary cursor-pointer'
                                >
                                    {item.title}
                                </button>
                            ))
                            : links.web.map((item, index) => (
                                <button
                                    data-id={item.title}
                                    key={index}
                                    type='button'
                                    aria-label={`${item.title} view`}
                                    className='md:w-auto w-full mx-2 px-3 py-2 hover:rounded hover:text-white hover:bg-primary cursor-pointer'
                                >
                                    {item.title}
                                </button>
                            ))}
                    </AnimatedBackground>
                </div>

                <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
                    {appMode ? (
                        <WalletBtn />
                    ) : (
                        <Link href='/buy' passHref>
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
