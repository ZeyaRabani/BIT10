/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ModeToggle from './ModeToggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown } from 'lucide-react'
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
        {
            title: 'Exchange',
            drop: true,
            links: [
                { title: 'Swap', link: '/swap' },
                { title: 'Buy BIT10', link: '/buy' },
            ]
        },
        { title: 'Portfolio', link: '/portfolio' },
        { title: 'Collateral', link: '/collateral' },
        { title: 'Liquidity Hub', link: '/liquidity-hub' },
        { title: 'Email wallet', link: '/newbie' }
    ]
};

export default function Navbar() {
    const [hidden, setHidden] = useState(false);

    const { scrollY } = useScroll();
    const pathname = usePathname();

    const appMode = links.app.some(link =>
        (link.link && pathname.startsWith(link.link)) ??
        link.links?.some(sublink => pathname.startsWith(sublink.link))
    );

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

                <div className='hidden lg:pl-16 lg:flex space-x-2'>
                    {appMode ? (
                        links.app.map((item, index) => (
                            <div key={index} className='relative'>
                                <TooltipProvider>
                                    {item.drop ? (
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger asChild>
                                                <div className='mx-2 px-3 py-2 flex flex-row space-x-2 items-center cursor-pointer'>
                                                    {item.title}
                                                    {item.drop && <ChevronDown className='ml-1 h-4 w-4' />}
                                                </div>
                                            </TooltipTrigger>
                                            {item.drop && item.links && (
                                                <TooltipContent side='bottom' align='end' className='mr-3 -mt-1 w-fit text-right'>
                                                    <div className='flex flex-col space-y-2 items-start'>
                                                        {item.links.map((sublink, subIndex) => (
                                                            <Link key={subIndex} href={sublink.link} className='hover:text-primary block text-sm'>
                                                                {sublink.title}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    ) : (
                                        <Link key={item.link} href={item.link ?? '/'} className='mx-2 px-3 py-2 flex flex-row space-x-2 items-center cursor-pointer hover:rounded hover:text-white hover:bg-primary'>
                                            {item.title}
                                        </Link>
                                    )}
                                </TooltipProvider>
                            </div>
                        ))
                    ) : (
                        links.web.map((label, index) => (
                            <Link key={index} href={label.link} className='mx-2 px-3 py-2 hover:rounded hover:text-white hover:bg-primary cursor-pointer'>
                                {label.title}
                            </Link>
                        ))
                    )}
                </div>

                <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
                    {
                        appMode ? (
                            <WalletBtn />
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
