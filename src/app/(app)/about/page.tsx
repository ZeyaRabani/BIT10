"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'

interface Feature {
    logo: string;
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        logo: 'decentralized_index_token',
        title: 'Decentralized Index Token',
        description: 'Invest in a token backed by the value of the top cryptocurrencies or specifically curated Bitcoin native assets. Experience the potential benefits of diversification in the fast-evolving world of digital assets.'
    },
    {
        logo: 'user_friendly_dashboard',
        title: 'User-Friendly Dashboard',
        description: 'Navigate through your portfolio effortlessly with our intuitive dashboard. Get real-time updates on token value, individual asset performance, and market trends.'
    },
    {
        logo: 'historical_performance_analysis',
        title: 'Historical Performance Analysis',
        description: 'Explore the historical performance of your portfolio through interactive charts and graphs. Understand the growth potential by comparing it with traditional benchmarks like the S&P500.'
    },
    {
        logo: 'customizable_portfolios',
        title: 'Customizable Portfolios',
        description: 'Tailor your investment strategy with customizable portfolios. Choose specific assets or let our algorithm optimize your holdings for maximum returns.'
    },
    {
        logo: 'transparent_token_details',
        title: 'Transparent Token Details',
        description: 'Gain insights into how our token operates, ensuring transparency and trust. Learn about the technology, methodology, and security measures behind our innovative investment solution.'
    },
    {
        logo: 'market_insights_and_news',
        title: 'Market Insights and News',
        description: 'Stay informed with regular market insights, news, and analysis. Access resources that help you make informed decisions in the dynamic cryptocurrency landscape.'
    },
    {
        logo: 'user_account_security',
        title: 'User Account Security',
        description: 'Create a secure account with ease, and manage your profile and preferences. Enhance security with two-factor authentication for peace of mind.'
    },
    {
        logo: 'regulatory_compliance_assurance',
        title: 'Regulatory Compliance Assurance',
        description: 'Learn about our commitment to regulatory compliance and how we ensure a legal and secure investment environment.'
    },
];

const FeatureCard: React.FC<Feature> = ({ logo, title, description }) => (
    <div className='relative w-64 p-6 my-4 bg-gray-200 shadow-xl rounded-3xl'>
        <div className='absolute flex items-center p-3 rounded-full shadow-xl bg-gradient-to-r from-[#016795] to-[#1E488F] left-4 -top-8'>
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
    const [coinbaseData, setCoinbaseData] = useState<number[]>([]);
    const [coinMarketCapData, setCoinMarketCapData] = useState<number[]>([]);
    const [totalSum, setTotalSum] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchCoinbaseData = async () => {
            const assets = ['STX', 'MAPO', 'ICP', 'RIF'];
            try {
                const coinbaseRequests = assets.map(async (asset) => {
                    const response = await fetch(`https://api.coinbase.com/v2/prices/${asset}-USD/buy`);
                    const data = await response.json();
                    return parseFloat(data.data.amount);
                });
                const result = await Promise.all(coinbaseRequests);
                setCoinbaseData(result);
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        const fetchCoinMarketCapData = async () => {
            try {
                const response = await fetch('/coinmarketcap')
                const data = await response.json();

                const prices = [
                    data.data.CFX[0].quote.USD.price,
                    data.data.SOV[0].quote.USD.price
                ];

                setCoinMarketCapData(prices);
            } catch (error) {
                toast.error('Error fetching BIT10 price. Please try again!');
            }
        };

        fetchCoinbaseData();
        fetchCoinMarketCapData();
    }, []);

    useEffect(() => {
        if (coinbaseData.length > 0 && coinMarketCapData.length > 0) {
            const sum = coinbaseData.reduce((acc, curr) => acc + curr, 0) + coinMarketCapData.reduce((acc, curr) => acc + curr, 0);
            const bit10DeFi = sum / 6;
            setTotalSum(bit10DeFi);
        } else {
            const sum = coinbaseData.reduce((acc, curr) => acc + curr, 0);
            const bit10DeFi = sum / 4;
            setTotalSum(bit10DeFi);
        }
        setLoading(false);
    }, [coinbaseData, coinMarketCapData]);

    return (
        <MaxWidthWrapper className='py-4'>
            <div className='flex flex-wrap-reverse items-center justify-center lg:grid lg:grid-cols-2 pb-12 lg:px-24 px-4'>

                <div className='lg:flex lg:flex-col lg:justify-center'>
                    <h2 className='self-center mb-4 text-2xl font-semibold tracking-wider md:text-4xl'>Empowering Your Portfolio with the Future of Finance</h2>
                    <p className='self-center text-lg lg:text-xl tracking-wide text-left lg:text-justify py-2'>
                        Welcome to BIT10, where innovation meets investment in the world of decentralized finance. Our platform harnesses the power of blockchain technology to bring you a revolutionary token that mirrors the performance of the top cryptocurrencies or Bitcoin native assets. Say goodbye to traditional investment barriers and hello to a new era of seamless, transparent, and efficient financial growth.
                    </p>
                    <a href='https://gitbook.bit10.app' target='_blank' rel='noreferrer noopener'>
                        <Button className='tracking-wider'>
                            Read GitBook <ExternalLink className='ml-2 h-4 w-4' />
                        </Button>
                    </a>
                </div>

                <div className='lg:flex justify-center w-full pb-8 lg:pb-0 hidden'>
                    <Image src='/assets/home/hero.svg' height={400} width={400} quality={100} alt='Hero Image' priority={true} />
                </div>

            </div>

            <div className='mb-12 text-center'>
                <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Formula Used</h1>
            </div>

            <div className='flex flex-col items-center justify-center pb-8'>
                <h1 className='text-xl'>
                    Formula = (Sum of Current Price of token) / (Number of tokens) $
                </h1>
                {loading ? (
                    <Loader2 className='w-8 h-8 animate-spin' />
                ) : (
                    <p className='text-2xl flex flex-row items-center space-x-2'>According the above formula our current token price is&nbsp;<span className='font-bold'>$ {totalSum.toFixed(6)}</span></p>
                )}
            </div>

            <div className='mb-12 text-center'>
                <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Features</h1>
            </div>

            <div className='flex items-center justify-center pb-8'>
                <div className='grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </div>
            </div>

        </MaxWidthWrapper>
    )
}
