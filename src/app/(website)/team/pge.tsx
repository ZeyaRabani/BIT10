import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'

export default function Page() {
    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-4xl font-semibold leading-tight text-center tracking-wider lg:text-5xl md:whitespace-nowrap'>Our Team</h1>
            </div>

            <div className='flex flex-col md:flex-row md:justify-evenly space-y-16 md:space-y-0 space-x-0 md:space-x-4 py-4'>
                <div className='flex flex-col items-center space-y-2 py-4 px-6 hover:bg-muted hover:rounded hover:shadow-xl'>
                    <Image src='/assets/team/zeya.png' alt='Zeya Rabani' width={200} height={200} className='rounded-full' />
                    <div className='text-2xl'>Hi, I&apos;m <strong>Zeya</strong></div>
                    <div className='text-xl'>Founder and CEO</div>
                    <div className='py-2 text-lg md:max-w-72 text-center'>
                        I am the co-founder and Chief Executive Officer of BIT10, based in the United Kingdom. I have over 5 years of experience as a Full-Stack Developer, including more than 3 years specializing in DeFi.
                    </div>
                    <div className='flex flex-row items-center justify-center py-2 space-x-2 w-full'>
                        <a href='https://www.linkedin.com/in/zeya-rabani' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                            <Image src='/assets/footer/linkedin.svg' alt='LinedIn' width={20} height={20} />
                        </a>
                        <a href='https://x.com/ZeyaTheZeya' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                            <Image src='/assets/footer/x.svg' alt='Twitter' width={20} height={20} />
                        </a>
                    </div>
                </div>

                <div className='flex flex-col items-center space-y-2 py-4 px-6 hover:bg-muted hover:rounded hover:shadow-xl'>
                    <Image src='/assets/team/harshal.jpg' alt='Harshal Raikwar' width={200} height={200} className='rounded-full' />
                    <div className='text-2xl'>Hi, I&apos;m <strong>Harshal</strong></div>
                    <div className='text-xl'>Co-Founder and CTO</div>
                    <div className='py-2 text-lg md:max-w-72 text-center'>
                        I am the co-founder and Chief Technical Officer of BIT10, based in India. I have previously worked at Solana and have over 2 years of experience as a Full-Stack Developer.
                    </div>
                    <div className='flex flex-row items-center justify-center py-2 space-x-2 w-full'>
                        <a href='https://www.linkedin.com/in/harshal0902' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                            <Image src='/assets/footer/linkedin.svg' alt='LinedIn' width={20} height={20} />
                        </a>
                        <a href='https://x.com/Harshal_0902' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                            <Image src='/assets/footer/x.svg' alt='Twitter' width={20} height={20} />
                        </a>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}
