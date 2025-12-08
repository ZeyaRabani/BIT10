/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState, useEffect } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/ui/animated-background'
import ResponsiveNavbar from './ResponsiveNavbar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import WalletBtn from './WalletBtn'

const links = {
    web: [
        { title: 'About', link: '/' },
        { title: 'Investment Calculator', link: '/investment-calculator' },
        { title: 'GitBook', link: '/gitbook' }
    ],
    app: [
        { title: 'Buy BIT10.TOP', link: '/buy' },
        // { title: 'DEX', link: '/dex' },
        { title: 'Portfolio', link: '/portfolio' },
        { title: 'Collateral', link: '/collateral' },
        { title: 'Rewards', link: '/rewards' }
    ]
};

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const [activeLink, setActiveLink] = useState<string>('/');

    const { scrollY } = useScroll();
    const pathname = usePathname();
    const router = useRouter();

    const appMode = links.app.some(link => pathname.startsWith(link.link));

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
                        <div className='flex flex-row items-center justify-start'>
                            <Image src='/logo/logo-title.png' alt='logo' width={100} height={100} />
                        </div>
                    </Link>
                </div>

                <div className='hidden lg:flex'>
                    <AnimatedBackground
                        defaultValue={activeLink || '/'}
                        onValueChange={(newActiveLink) => {
                            if (newActiveLink) {
                                handleNavigation(newActiveLink)
                            }
                        }}
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
                                    className='md:w-auto w-full mx-2 px-4 py-2.5 hover:rounded-full hover:bg-muted cursor-pointer font-semibold tracking-wide'
                                >
                                    {label.title}
                                </button>
                            );
                        })}
                    </AnimatedBackground>

                    <div>
                        {
                            appMode ? (
                                <WalletBtn />
                            ) : (
                                <Link href='/launch' passHref>
                                    <Button className='rounded-full font-semibold'>Launch App</Button>
                                </Link>
                            )}
                    </div>
                </div>


                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ResponsiveNavbar />
                </div>
            </nav>
        </motion.div>
    )
}
