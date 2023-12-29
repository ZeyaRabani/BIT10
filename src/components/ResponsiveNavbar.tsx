'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function ResponsiveNavbar() {

    const [isOpen, setOpen] = useState<boolean>(false)

    const toggleOpen = () => setOpen((prev) => !prev)

    const pathname = usePathname()

    useEffect(() => {
        if (isOpen) toggleOpen()
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [pathname])

    const closeOnCurrent = (href: string) => {
        if (pathname === href) {
            toggleOpen()
        }
    }

    return (
        <div className='lg:hidden'>

            <button type='button' onClick={toggleOpen} aria-hidden='false' aria-label='button' className='pt-1'>
                <Menu className='h-7 w-7' aria-hidden='false' />
            </button>

            {isOpen ? (
                <div>
                    <div className='animate-fade-in-down flex overflow-x-hidden mx-2 -mt-2 h-screen overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none lg:hidden'>
                        <div className='relative my-4 mx-auto w-screen'>
                            <div className='border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none'>
                                <div className='flex items-start justify-between p-5 border-solid rounded-t'>
                                    <Link href='/' passHref>
                                        <div className='inline-flex items-center text-3xl font-base tracking-wide cursor-pointer'>
                                            C10
                                        </div>
                                    </Link>

                                    <button className='absolute right-6' onClick={toggleOpen} aria-hidden='false' aria-label='button'>
                                        <X className='h-7 w-7' aria-hidden='false' />
                                    </button>
                                </div>

                                <div className='grid justify-center'>
                                    <div className='inline-flex w-64 h-1 bg-indigo-500 rounded-full'></div>
                                </div>

                                <div className='grid place-items-center text-xl py-2 gap-2 w-full mb-4'>

                                    <Link onClick={() => closeOnCurrent('/')} href='/' className='inline-flex w-auto px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer' passHref>
                                        Home
                                    </Link>

                                    <Link onClick={() => closeOnCurrent('/dashboard')} href='/dashboard' className='inline-flex w-auto px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer' passHref>
                                        Dashboard
                                    </Link>

                                    <Link onClick={() => closeOnCurrent('/index-performance')} href='/index-performance' className='inline-flex w-auto px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer' passHref>
                                        Index Performance
                                    </Link>

                                    <Link onClick={() => closeOnCurrent('/regulatory-compliance')} href='/regulatory-compliance' className='inline-flex w-auto px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer' passHref>
                                        Regulatory Compliance
                                    </Link>

                                    <Link onClick={() => closeOnCurrent('/contact')} href='/contact' className='inline-flex w-auto px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white transition cursor-pointer' passHref>
                                        Contact Us
                                    </Link>

                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='opacity-25 fixed inset-0 z-40 h-screen bg-black md:hidden'></div>
                </div>
            ) : null}

        </div>
    )
}
