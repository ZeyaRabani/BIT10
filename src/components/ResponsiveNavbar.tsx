"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useChain } from '@/context/ChainContext'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import WalletBtn from './WalletBtn'
import { Menu, X, Home, BookText, BookCopy, ArrowRightLeft, Coins, HandCoins, BriefcaseBusiness, Landmark, Star } from 'lucide-react'

const links = {
    web: [
        { title: 'About', link: '/', icon: Home },
        { title: 'Resources', link: '/resources', icon: BookCopy },
        { title: 'Whitepaper', link: '/whitepaper', icon: BookText }
    ],
    app: [
        { title: 'DEX', link: '/swap', icon: ArrowRightLeft },
        { title: 'Buy BIT10.TOP', link: '/buy', icon: Coins },
        { title: 'Lend & Borrow', link: '/lend-and-borrow', icon: HandCoins },
        { title: 'Portfolio', link: '/portfolio', icon: BriefcaseBusiness },
        { title: 'Collateral', link: '/collateral', icon: Landmark },
        { title: 'Email wallet', link: '/newbie', icon: Star }
    ],
}

export default function ResponsiveNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);

    const pathname = usePathname();
    const { chain } = useChain();

    const filteredAppLinks = useMemo(() => {
        return links.app.filter((item) => {
            if (item.title === 'Email wallet' && chain !== 'privy') {
                return false
            }
            return true
        })
    }, [chain]);

    const appMode = filteredAppLinks.some((link) =>
        pathname.startsWith(link.link)
    );

    const toggleMenu = () => {
        if (isOpen) {
            setIsClosing(true)
            setTimeout(() => {
                setIsOpen(false)
                setIsClosing(false)
            }, 300)
        } else {
            setIsOpen(true)
        }
    };

    useEffect(() => {
        if (isOpen) {
            toggleMenu();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const renderNavItem = (item: {
        title: string
        link: string
        icon?: React.ElementType
    }) => {
        const Icon = item.icon
        return (
            <Link key={item.title} href={item.link} onClick={() => pathname === item.link && toggleMenu()} >
                <div className='border-b-2 pt-1 pb-3 cursor-pointer w-full flex flex-row justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200'>
                    {item.title}
                    {Icon && <Icon className='h-5 w-5' />}
                </div>
            </Link>
        )
    }

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
                                    {appMode
                                        ? filteredAppLinks.map((item) => renderNavItem(item))
                                        : links.web.map((item) => renderNavItem(item))}

                                    {appMode ? (
                                        <div className='border-b-2 pb-2 w-full'>
                                            <WalletBtn />
                                        </div>
                                    ) : (
                                        <div className='border-b-2 py-2 px-2 cursor-pointer w-full'>
                                            <Link href='/swap' passHref>
                                                <Button className='rounded-full w-full'>
                                                    Launch App
                                                </Button>
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
    )
}
