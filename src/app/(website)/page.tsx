"use client"

import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Spotlight } from '@/components/ui/spotlight'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import Image from 'next/image'

interface Feature {
    logo: string;
    title: string;
    description: string;
}

const testimonials = [
    {
        x_link: 'https://x.com/DFINITYDev/status/1808724918177312925',
        tweet: '@bit10startup is bringing the #Bitcoin ecosystem together for a pool party this #ChainFusionSummer⛱️ BIT10 is a #DeFi asset manager built using #ICP that offers an index tracking major #tokens, #ordinals, and #BRC20s on:🟧 ICP @dfinity, 🟧 @Stacks, 🟧 @MapProtocol, 🟧 @SovrynBTC, 🟧 @BadgerDAO, 🟧 @ALEXLabBTC, and more!',
        profile_pic: 'DFINITYDev.jpg',
        name: 'DFINITY Developers',
        username: 'DFINITYDev'
    },
    {
        x_link: 'https://x.com/easya_app/status/1803087458663383383',
        tweet: 'Congrats to the gigabrains at BIT 10 Smart Assets! 👏 First started building at our EasyA x @Stacks hackathon in London, accepted into @btcstartuplab and now gearing up to launch their testnet! 🚀',
        profile_pic: 'easya_app.jpg',
        name: 'EasyA',
        username: 'easya_app'
    }
];

const parterners = [
    {
        name: 'ICP',
        logo: '/assets/home/ICP.svg',
    },
    {
        name: 'BSL',
        logo: '/assets/home/bsl.png',
    },
    {
        name: 'EasyA',
        logo: '/assets/home/easy_a.svg',
    }
]

const features: Feature[] = [
    {
        logo: 'decentralized_index_token',
        title: 'Decentralized Index Token',
        description: 'Invest in a token backed by the value of the top cryptocurrencies or specifically curated Bitcoin native assets. Experience the potential benefits of diversification in the fast-evolving world of digital assets.'
    },
    // {
    //     logo: 'user_friendly_dashboard',
    //     title: 'User-Friendly Dashboard',
    //     description: 'Navigate through your portfolio effortlessly with our intuitive dashboard. Get real-time updates on token value, individual asset performance, and market trends.'
    // },
    {
        logo: 'historical_performance_analysis',
        title: 'Historical Performance Analysis',
        description: 'Explore the historical performance of your portfolio through interactive charts and graphs. Understand the growth potential by comparing it with traditional benchmarks like the S&P500.'
    },
    // {
    //     logo: 'customizable_portfolios',
    //     title: 'Customizable Portfolios',
    //     description: 'Tailor your investment strategy with customizable portfolios. Choose specific assets or let our algorithm optimize your holdings for maximum returns.'
    // },
    {
        logo: 'transparent_token_details',
        title: 'Transparent Token Details',
        description: 'Gain insights into how our token operates, ensuring transparency and trust. Learn about the technology, methodology, and security measures behind our innovative investment solution.'
    },
    // {
    //     logo: 'market_insights_and_news',
    //     title: 'Market Insights and News',
    //     description: 'Stay informed with regular market insights, news, and analysis. Access resources that help you make informed decisions in the dynamic cryptocurrency landscape.'
    // },
    {
        logo: 'user_account_security',
        title: 'User Account Security',
        description: 'Create a secure account with ease, and manage your profile and preferences. Enhance security with two-factor authentication for peace of mind.'
    },
    // {
    //     logo: 'regulatory_compliance_assurance',
    //     title: 'Regulatory Compliance Assurance',
    //     description: 'Learn about our commitment to regulatory compliance and how we ensure a legal and secure investment environment.'
    // },
];

const FeatureCard: React.FC<Feature> = ({ logo, title, description }) => (
    <div className='relative w-64 p-6 my-4 bg-gray-200 shadow-xl rounded-3xl'>
        <div className='absolute flex items-center p-3 rounded-full shadow-xl bg-gradient-to-r from-[#FF8C00] to-[#FF4500] left-4 -top-8'>
            <Image src={`/assets/home/${logo}.svg`} height={50} width={50} quality={100} alt='img' className='p-1' />
        </div>
        <div className='mt-8 text-gray-800'>
            <p className='my-2 text-xl font-semibold'>{title}</p>
            <div className='flex space-x-2 font-medium text-basic'>
                <p>{description}</p>
            </div>
        </div>
    </div>
);

export default function Page() {
    return (
        <div>
            <div className='md:h-[30rem] w-full flex md:items-center md:justify-center antialiased bg-grid-white/[0.02] relative overflow-hidden'>
                <Spotlight
                    className='-top-40 -left-10 md:-left-32 md:-top-20 h-screen'
                    fill='white'
                />
                <Spotlight
                    className='h-[80vh] w-[50vw] top-10 left-full'
                    fill='purple'
                />
                <Spotlight className='left-80 top-28 h-[80vh] w-[50vw]' fill='blue' />
                <div className=' p-4 max-w-7xl  mx-auto relative z-10  w-full pt-8 md:pt-0'>
                    <h1 className='text-4xl md:text-6xl font-bold text-center bg-clip-text dark:text-transparent dark:bg-gradient-to-b dark:from-neutral-50 dark:to-neutral-400 bg-opacity-50'>
                        BIT10 <br /> <span className='italic'>S&P500 of Bitcoin DeFi</span>
                    </h1>
                    <p className='mt-4 font-normal text-lg dark:text-neutral-300 max-w-4xl text-center mx-auto'>
                        For investors, researching the right investment in Bitcoin DeFi can be time-consuming. <br /> Buying individual tokens involves high risks and fees. <br />
                        We simplify the process by offering investors a single diversified token in Bitcoin DeFi. <br />
                    </p>
                    <div className='flex flex-row space-x-2 py-2 items-center justify-center'>
                        <Button className='px-10' asChild>
                            <Link href='/swap'>
                                Launch App
                            </Link>
                        </Button>
                        <a href='https://gitbook.bit10.app' target='_blank' rel='noreferrer noopener'>
                            <Button variant='outline' className='tracking-wider dark:border-white'>
                                Read GitBook <ExternalLink className='ml-2 h-4 w-4' />
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            <MaxWidthWrapper>
                <div className='flex flex-col items-center space-y-2 pt-2 pb-8'>
                    <h1 className='text-3xl md:text-4xl text-center font-semibold text-black dark:text-white'>
                        Discover how<br />
                        <span className='text-4xl md:text-[5rem] font-bold mt-1 leading-none'>
                            BIT10 works
                        </span>
                    </h1>
                    <iframe
                        src='https://www.youtube.com/embed/XBAx1-Py9Oo'
                        // height={1720}
                        // width={1400}
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                        className='mx-auto rounded-2xl object-cover w-full md:w-3/4 h-56 md:h-[36rem]'
                    ></iframe>
                </div>

                <div className='flex flex-col antialiased items-center justify-center relative overflow-hidden'>
                    <div className='mb-12 text-center'>
                        <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Our Partners</h1>
                    </div>
                    <InfiniteMovingCards
                        items={testimonials}
                        direction='right'
                        speed='slow'
                    />
                    <div className='flex flex-col md:flex-row items-center justify-evenly w-full space-y-3 md:space-y-0'>
                        {parterners.map((partner, index) => (
                            <div key={index} className={`p-2 border-2 border-accent rounded-lg ${partner.name === 'BSL' ? 'bg-black' : 'bg-white dark:bg-gray-100'}`}>
                                <Image src={partner.logo} height={50} width={400} quality={100} alt={partner.name} />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className='my-12 text-center'>
                        <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Features</h1>
                    </div>

                    <div className='flex items-center justify-center pb-8 w-full'>
                        <div className='grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                            {features.map((feature, index) => (
                                <FeatureCard key={index} {...feature} />
                            ))}
                        </div>
                    </div>
                </div>
            </MaxWidthWrapper>
        </div>
    )
}
