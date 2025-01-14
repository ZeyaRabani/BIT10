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

                {/* <div className='flex flex-col md:flex-row md:space-x-12 items-center justify-center'>
                    <div className='order-1 md:order-2 flex flex-col justify-center md:justify-end mb-8 md:mb-0'>
                        <div className='flex flex-row items-center justify-center py-2 space-x-2 w-full'>
                            <a href='https://www.linkedin.com/in/zeya-rabani' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                                <Image src='/assets/footer/linkedin.svg' alt='LinedIn' width={24} height={24} />
                            </a>
                            <a href='https://x.com/ZeyaTheZeya' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                                <Image src='/assets/footer/x.svg' alt='Twitter' width={24} height={24} />
                            </a>
                        </div>
                    </div>
                    <div className='order-2 md:order-1 flex flex-col space-y-2 md:w-3/4 md:pr-8'>
                        <h1 className='text-3xl md:text-4xl text-center md:text-start font-semibold'>Zeya Rabani</h1>
                        <h1 className='text-xl md:text-2xl text-center md:text-start font-medium'>Founder and CEO, BIT10</h1>
                        <p className='text-center md:text-left'>I&apos;m the co-founder and Chief Executive Officer of BIT10, based in London, England. I have over five years of experience as a Full-Stack Developer, with a robust foundation in software development, encompassing both front-end and back-end technologies. In the past three years, I&apos;ve been working on Crypto and DeFi-specific projects. The idea for BIT10 came at an EasyA Hackathon, where I wanted to create a single token that held the value of 10 similar to what the S&P 500 ETF does for the 500 largest companies in the United States. We pivoted a couple of times, and now we&apos;re creating Index Funds for the Bitcoin Ecosystem.</p>
                        <p className='text-center md:text-left'>I&apos;m committed to making it easy for new investors entering the Bitcoin Ecosystem and providing a platform for long-term investors to buy a token regularly and forget about it, just like you would with a traditional index fund. I&apos;m extremely bullish on the Bitcoin Ecosystem, and as an ideal angel user myself, I&apos;ll use my extensive background to make BIT10 a success.</p>
                    </div>
                </div>

                <div className='flex flex-col md:flex-row md:space-x-12 items-center justify-center'>
                    <div className='order-1 md:order-2 flex flex-col justify-center md:justify-end mb-8 md:mb-0'>
                        <div>
                            <Image src='/assets/team/harshal.jpg' alt='Harshal Raikwar' width={300} height={300} className='rounded-full' />
                        </div>
                        <div className='flex flex-row items-center justify-center py-2 space-x-2 w-full'>
                            <a href='https://www.linkedin.com/in/harshal0902' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                                <Image src='/assets/footer/linkedin.svg' alt='LinedIn' width={24} height={24} />
                            </a>
                            <a href='https://x.com/HarshalHarshal_0902Raikwar6' target='_blank' rel='noreferrer noopener' className='p-2 flex items-center justify-center rounded-full bg-gray-100 border-2 border-primary'>
                                <Image src='/assets/footer/x.svg' alt='Twitter' width={24} height={24} />
                            </a>
                        </div>
                    </div>
                    <div className='order-2 md:order-1 flex flex-col space-y-2 md:w-3/4 md:pr-8'>
                        <h1 className='text-3xl md:text-4xl text-center md:text-start font-semibold'>Harshal Raikwar</h1>
                        <h1 className='text-xl md:text-2xl text-center md:text-start font-medium'>Co-Founder and CTO, BIT10</h1>
                        <p className='text-center md:text-left'>I&apos;m the co-founder and Chief Technology Officer of BIT10, based in Bangalore, India. My background includes experience at Solana and over two years as a Full-Stack Developer. My skill set spans both front-end and back-end development, and I&apos;ve won well over 60 hackathons, demonstrating my ability to quickly build and fix problems. This expertise is crucial in shaping the technological framework and strategy at BIT10.</p>
                        <p className='text-center md:text-left'>I met Zeya at the Bitcoin Startup Lab pre-accelerator, and we hit it off after one meeting. We pivoted to creating index funds for the Bitcoin ecosystem and now allow users to invest.</p>
                    </div>
                </div> */}
            </div>
        </MaxWidthWrapper>
    )
}
