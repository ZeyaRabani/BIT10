"use client"

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import WalletBtn from './WalletBtn'
import { Menu, X, ArrowRightLeft, BriefcaseBusiness, Home, BookText, BookCopy, Landmark, HandCoins, Star, Coins, ChevronDown } from 'lucide-react'

const links = {
    web: [
        { title: 'About', link: '/', icon: Home },
        { title: 'Resources', link: '/resources', icon: BookCopy },
        { title: 'Whitepaper', link: '/whitepaper', icon: BookText }
    ],
    app: [
        {
            title: 'Exchange',
            drop: true,
            links: [
                { title: 'Swap', link: '/swap', icon: ArrowRightLeft },
                { title: 'Buy BIT10', link: '/buy', icon: Coins },
            ]
        },
        // { title: 'Custom', link: '/custom', icon: ChartPie },
        { title: 'Portfolio', link: '/portfolio', icon: BriefcaseBusiness },
        { title: 'Collateral', link: '/collateral', icon: Landmark },
        { title: 'Liquidity Hub', link: '/liquidity-hub', icon: HandCoins },
        { title: 'Email wallet', link: '/newbie', icon: Star }
    ]
};

export default function ResponsiveNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);
    const [expandedDropdowns, setExpandedDropdowns] = useState<string[]>([]);

    const pathname = usePathname();

    const appMode = links.app.some(link =>
        (link.link && pathname.startsWith(link.link)) ??
        (link.links?.some(sublink => pathname.startsWith(sublink.link)))
    );

    const toggleMenu = () => {
        if (isOpen) {
            setIsClosing(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsClosing(false);
                setExpandedDropdowns([]);
            }, 300);
        } else {
            setIsOpen(true);
        }
    };

    const toggleDropdown = (title: string) => {
        setExpandedDropdowns(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (isOpen) {
            setExpandedDropdowns([]);
            toggleMenu();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Framer Motion variants
    const dropdownVariants = {
        hidden: {
            opacity: 0,
            height: 0,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        },
        visible: {
            opacity: 1,
            height: 'auto',
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        }
    };

    const chevronVariants = {
        collapsed: {
            rotate: 0,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        },
        expanded: {
            rotate: 180,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            x: -20,
            transition: {
                duration: 0.2,
                ease: 'easeOut'
            }
        },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.2,
                delay: i * 0.1,
                ease: 'easeOut'
            }
        })
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderNavItem = (item: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (item.drop) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            const isExpanded = expandedDropdowns.includes(item.title);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const Icon = item.icon;

            return (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                <div key={item.title} className='border-b-2 py-2 overflow-hidden'>
                    <div
                        className='px-2 cursor-pointer w-full flex flex-row justify-between items-center'
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                        onClick={() => toggleDropdown(item.title)}
                    >
                        <div className='flex items-center gap-2'>
                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                            {item.title}
                        </div>
                        <div className='flex items-center gap-2'>
                            {Icon && <Icon className='h-5 w-5' />}
                            <motion.div
                                variants={chevronVariants}
                                animate={isExpanded ? 'expanded' : 'collapsed'}
                            >
                                <ChevronDown className='h-6 w-6' />
                            </motion.div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                        {isExpanded && item.links && (
                            <motion.div
                                variants={dropdownVariants}
                                initial='hidden'
                                animate='visible'
                                exit='hidden'
                                className='p-2 flex flex-col space-y-1'
                            >
                                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */}
                                {item.links.map((sublink: any, subIndex: number) => {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                    const SubIcon = sublink.icon;
                                    return (
                                        <motion.div
                                            key={subIndex}
                                            variants={itemVariants}
                                            initial='hidden'
                                            animate='visible'
                                            exit='hidden'
                                            custom={subIndex}
                                        >
                                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */}
                                            <Link href={sublink.link} onClick={() => pathname === sublink.link && toggleMenu()}>
                                                <div className='px-2 py-0.5 cursor-pointer w-full flex flex-row justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-base transition-colors duration-200'>
                                                    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                                                    {sublink.title}
                                                    {SubIcon && <SubIcon className='h-4 w-4' />}
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const Icon = item.icon;
            return (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                <Link key={item.title} href={item.link} onClick={() => pathname === item.link && toggleMenu()}>
                    <div className='border-b-2 py-2 px-2 cursor-pointer w-full flex flex-row justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200'>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                        {item.title}
                        {Icon && <Icon className='h-5 w-5' />}
                    </div>
                </Link>
            );
        }
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
                                    {links[appMode ? 'app' : 'web'].map((item) => renderNavItem(item))}

                                    {appMode ? (
                                        <div className='border-b-2 pb-2 px-2 w-full'>
                                            <WalletBtn />
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
