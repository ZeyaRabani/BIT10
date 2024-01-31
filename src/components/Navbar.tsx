import React from 'react'
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'

export default function Navbar() {
    return (
        <div className='backdrop-blur-xl fixed z-50 w-full'>
            <nav className='flex items-center py-2 flex-wrap px-2.5 md:px-20 tracking-wider justify-between'>
                <Link href='/' passHref>
                    <div className='inline-flex items-center text-4xl md:text-5xl cursor-pointer font-base'>
                        BIT10
                    </div>
                </Link>

                <div className='hidden top-navbar w-full lg:inline-flex lg:flex-grow lg:w-auto' >
                    <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start flex flex-col lg:h-auto space-x-2' >

                        <Link href='/' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Home</span>
                        </Link>

                        <Link href='/dashboard' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Dashboard</span>
                        </Link>

                        <Link href='/portfolio' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Portfolio</span>
                        </Link>

                        <Link href='/regulatory-compliance' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Regulatory Compliance</span>
                        </Link>

                        <Link href='/contact' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Contact Us</span>
                        </Link>

                    </div>

                </div>


                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ModeToggle />
                    <ResponsiveNavbar />
                </div>

            </nav>
        </div>
    )
}
