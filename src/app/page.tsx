import React from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'
import IndexPreformance from '@/components/home/IndexPreformance'

interface Feature {
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    title: 'Decentralized Index Token',
    description: 'Invest in a token backed by the value of the top cryptocurrencies or specifically curated Bitcoin native assets. Experience the potential benefits of diversification in the fast-evolving world of digital assets.'
  },
  {
    title: 'User-Friendly Dashboard',
    description: 'Navigate through your portfolio effortlessly with our intuitive dashboard. Get real-time updates on token value, individual asset performance, and market trends.'
  },
  {
    title: 'Historical Performance Analysis',
    description: 'Explore the historical performance of your portfolio through interactive charts and graphs. Understand the growth potential by comparing it with traditional benchmarks like the S&P500.'
  },
  {
    title: 'Customizable Portfolios',
    description: 'Tailor your investment strategy with customizable portfolios. Choose specific assets or let our algorithm optimize your holdings for maximum returns.'
  },
  {
    title: 'Transparent Token Details',
    description: 'Gain insights into how our token operates, ensuring transparency and trust. Learn about the technology, methodology, and security measures behind our innovative investment solution.'
  },
  {
    title: 'Market Insights and News',
    description: 'Stay informed with regular market insights, news, and analysis. Access resources that help you make informed decisions in the dynamic cryptocurrency landscape.'
  },
  {
    title: 'User Account Security',
    description: 'Create a secure account with ease, and manage your profile and preferences. Enhance security with two-factor authentication for peace of mind.'
  },
  {
    title: 'Support Center',
    description: 'Find answers to your questions in our comprehensive support center. Reach out to our dedicated customer support for personalized assistance.'
  },
  {
    title: 'Regulatory Compliance Assurance',
    description: 'Learn about our commitment to regulatory compliance and how we ensure a legal and secure investment environment.'
  },
  {
    title: 'Engaging Community Forum',
    description: 'Connect with fellow investors in our community forum or blog. Share insights, discuss market trends, and be part of the growing community shaping the future of finance.'
  }
];

const FeatureCard: React.FC<Feature> = ({ title, description }) => (
  <div className='relative w-64 p-6 my-4 bg-gray-200 shadow-xl rounded-3xl'>
    <div className=' text-gray-800'>
      <p className='text-xl font-semibold'>{title}</p>
      <div className='flex space-x-2 font-medium text-basic'>
        <p>{description}</p>
      </div>
    </div>
  </div>
);

export default function Page() {
  return (
    <MaxWidthWrapper>
      <div className='flex flex-wrap-reverse md:grid md:grid-cols-2 pb-8 md:pb-0 px-0 md:px-12'>

        <div className='md:flex md:flex-col md:justify-center'>
          <h2 className='self-center mb-4 text-2xl font-semibold tracking-wider md:text-4xl'>Empowering Your Portfolio with the Future of Finance</h2>
          <p className='self-center text-xl tracking-wide text-justify py-2'>
            Welcome to BIT10, where innovation meets investment in the world of decentralized finance. Our platform harnesses the power of blockchain technology to bring you a revolutionary token that mirrors the performance of the top cryptocurrencies or Bitcoin native assets. Say goodbye to traditional investment barriers and hello to a new era of seamless, transparent, and efficient financial growth.
          </p>
        </div>

        <div className='lg:p-10'>
          <Image src='/assets/home/hero.svg' height={500} width={500} quality={100} alt='img' />
        </div>

      </div>

      <IndexPreformance />

      <div className='mb-12 text-center'>
        <h1 className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Features</h1>
      </div>

      <div className='flex items-center justify-center pb-8'>
        <div className='grid grid-cols-1 gap-4 md:gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

    </MaxWidthWrapper>
  )
}
