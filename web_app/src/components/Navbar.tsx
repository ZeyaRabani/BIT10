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

interface NavLink {
    title: string;
    link: string;
    isRewards?: boolean;
}

const links = {
    web: [
        { title: 'Investment Calculator', link: '/investment-calculator' },
        { title: 'GitBook', link: '/gitbook' }
    ] as NavLink[],

    app: [
        { title: 'Buy BIT10.TOP', link: '/buy' },
        { title: 'Portfolio', link: '/portfolio' },
        { title: 'Collateral', link: '/collateral' },
        { title: 'Rewards ✨', link: '/rewards', isRewards: true }
    ] as NavLink[],
};

const externalRoutes = {
    appMode: ['/explorer'],
    webMode: ['/', '/launch', '/contact'],
};

export default function Navbar() {
    const [hidden, setHidden] = useState(false);
    const [activeLink, setActiveLink] = useState<string>('/');

    const { scrollY } = useScroll();
    const pathname = usePathname();
    const router = useRouter();

    const isAppMode = () => {
        if (externalRoutes.appMode.includes(pathname)) return true;
        if (externalRoutes.webMode.includes(pathname)) return false;
        return links.app.some((link) => pathname.startsWith(link.link));
    };

    const appMode = isAppMode();

    useEffect(() => {
        const active = links[appMode ? 'app' : 'web'].find((link) => pathname === link.link);
        setActiveLink(active ? active.title : '/');
    }, [pathname, appMode]);

    const handleNavigation = (newActiveLink: string) => {
        const active = links[appMode ? 'app' : 'web'].find((link) => link.title === newActiveLink);
        if (active) {
            setActiveLink(active.link);
            router.push(active.link);
        }
    };

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 50) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    const navbarVariants = {
        visible: { y: 0 },
        hidden: { y: '-100%' },
    };

    return (
        <motion.div variants={navbarVariants} animate={hidden ? 'hidden' : 'visible'} transition={{ duration: 0.3, ease: 'easeInOut' }} className='backdrop-blur-3xl fixed top-0 z-50 w-full'>
            <nav className='flex items-center justify-between py-2 px-2.5 md:px-12'>
                <div className='flex lg:flex-1'>
                    <Link href='/' passHref>
                        <div className='flex flex-row items-center justify-start cursor-pointer'>
                            <Image src='/logo/logo-title.png' alt='logo' width={100} height={100} />
                        </div>
                    </Link>
                </div>

                <div className='hidden lg:flex lg:items-center'>
                    <AnimatedBackground defaultValue={activeLink || '/'} onValueChange={(newActiveLink: string | null) => { if (typeof newActiveLink === 'string' && newActiveLink !== '') { handleNavigation(newActiveLink); } }} transition={{ ease: 'easeInOut', duration: 0.2 }}>
                        {links[appMode ? 'app' : 'web'].map((label, index) => {
                            const isRewards = !!label.isRewards;

                            return (
                                <motion.button key={index} data-id={label.title} type='button' aria-label={`${label.title} view`} className={`mx-2 px-4 py-2.5 font-semibold tracking-wide cursor-pointer transition-all duration-200 ${isRewards ? 'relative rounded-full text-transparent' : 'hover:rounded-full hover:bg-muted'}`}>
                                    {isRewards ? (
                                        <>
                                            <span className='absolute inset-0 rounded-full p-[1.5px]' style={{ background: 'linear-gradient(90deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 100%', animation: 'moveGradientX 4s ease infinite', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: ('destination-out'), maskComposite: 'exclude', display: 'block' }} />
                                            <span
                                                style={{ background: 'linear-gradient(90deg, #FFEA00, #FFFFFF, #FFEA00)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'moveGradientX 4s ease infinite' }} className='relative whitespace-nowrap'>
                                                {label.title}
                                            </span>
                                        </>
                                    ) : (
                                        label.title
                                    )}
                                </motion.button>
                            );
                        })}
                    </AnimatedBackground>

                    <div>
                        {appMode ? (
                            <WalletBtn />
                        ) : (
                            <Link href='/launch' passHref>
                                <Button className='font-semibold'>Launch App</Button>
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
