/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import BIT10Comparison from './bit10Comparison'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import Image from 'next/image'
import DefinityDevImg from '@/assets/home/DFINITYDev.jpg'
import EasyaAppImg from '@/assets/home/easya_app.jpg'
import ICPImg from '@/assets/home/ICP.svg'
import BSLImg from '@/assets/home/bsl.png'
import EasyAImg from '@/assets/home/EasyA.png'
// import { WobbleCard } from '@/components/ui/wobble-card'
// import { CircleDot } from 'lucide-react'
// import DashboardImg from '@/assets/home/dashboard.svg'

const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeInOut' } },
};

// const cardMotionFadeLeftProps = {
//   initial: { opacity: 0.0, x: 40 },
//   whileInView: { opacity: 1, x: 0 },
//   transition: { delay: 0.2, duration: 1, ease: 'easeInOut' }
// };

// const cardMotionFadeRightProps = {
//   initial: { opacity: 0.0, x: -40 },
//   whileInView: { opacity: 1, x: 0 },
//   transition: { delay: 0.2, duration: 1, ease: 'easeInOut' }
// };

// const sectionMotionProps = {
//   initial: { opacity: 0.0, x: -40 },
//   whileInView: { opacity: 1, x: 0 },
//   transition: { delay: 0.2, duration: 0.8, ease: 'easeInOut' }
// };

const testimonials = [
  {
    x_link: 'https://x.com/DFINITYDev/status/1808724918177312925',
    tweet: '@bit10startup is bringing the #Bitcoin ecosystem together for a pool party this #ChainFusionSummer⛱️ BIT10 is a #DeFi asset manager built using #ICP that offers an index tracking major #tokens, #ordinals, and #BRC20s on:🟧 ICP @dfinity, 🟧 @Stacks, 🟧 @MapProtocol, 🟧 @SovrynBTC, 🟧 @BadgerDAO, 🟧 @ALEXLabBTC, and more!',
    profile_pic: DefinityDevImg,
    name: 'DFINITY Developers',
    username: 'DFINITYDev'
  },
  {
    x_link: 'https://x.com/easya_app/status/1803087458663383383',
    tweet: 'Congrats to the gigabrains at BIT 10 Smart Assets! 👏 First started building at our EasyA x @Stacks hackathon in London, accepted into @btcstartuplab and now gearing up to launch their testnet! 🚀',
    profile_pic: EasyaAppImg,
    name: 'EasyA',
    username: 'easya_app'
  }
];

const parterners = [
  {
    name: 'ICP',
    logo: ICPImg,
  },
  {
    name: 'BSL',
    logo: BSLImg,
  },
  {
    name: 'EasyA',
    logo: EasyAImg,
  }
]

export default function Page() {
  return (
    <div>
      <AuroraBackground className='md:max-h-[60vh]'>
        <div className='relative flex flex-col gap-4 items-center justify-center md:px-4'>
          <div className='p-4 max-w-7xl mx-auto relative z-10 w-full pt-8 md:pt-0'>
            <motion.h1
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
              className='text-4xl md:text-6xl font-bold text-center bg-clip-text dark:text-transparent dark:bg-gradient-to-b dark:from-neutral-50 dark:to-neutral-400 bg-opacity-50 pb-2'>
              BIT10 <br /> <span className='italic'>Crypto Index Funds</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
              className='flex flex-row space-x-2 py-2 items-center justify-center'>
              <Button className='px-6 md:px-10' asChild>
                <Link href='/swap'>
                  Launch App
                </Link>
              </Button>
              <a href='https://gitbook.bit10.app' target='_blank' rel='noreferrer noopener'>
                <Button variant='outline' className='tracking-wider dark:border-white dark:text-white'>
                  Read GitBook <ExternalLink className='h-4 w-4' />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </AuroraBackground>

      <MaxWidthWrapper className='flex flex-col space-y-8 py-8'>
        <BIT10Comparison />
        <div className='flex flex-col items-center space-y-2'>
          <motion.h1
            initial={{ opacity: 0.0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
            className='text-3xl md:text-3xl text-center font-semibold z-[1]'>
            Discover how<br />
            <span className='text-4xl md:text-[5rem] font-bold mt-1 leading-none'>
              BIT10 works
            </span>
          </motion.h1>

          <motion.iframe
            initial={{ opacity: 0.0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
            src='https://www.youtube.com/embed/XBAx1-Py9Oo'
            // height={1720}
            // width={1400}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            className='mx-auto rounded-2xl object-cover w-full md:w-3/4 h-56 md:h-[36rem] z-[2]'
          ></motion.iframe>
        </div>

        <div className='flex flex-col antialiased items-center justify-center relative overflow-hidden'>
          <div className='my-8 text-center'>
            <motion.h1
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
              className='text-4xl font-bold leading-10 sm:text-5xl sm:leading-none md:text-6xl'>Our Partners</motion.h1>
          </div>

          <InfiniteMovingCards
            items={testimonials}
            direction='right'
            speed='slow'
          />

          <motion.div initial='hidden' whileInView='visible' variants={containerVariants} className='flex flex-col md:flex-row items-center justify-evenly w-full space-y-3 md:space-y-0'>
            {parterners.map((partner, index) => (
              <motion.div variants={cardVariants} key={index} className={`p-2 border-2 border-accent rounded-lg ${partner.name === 'BSL' ? 'bg-black' : 'bg-white dark:bg-gray-100'}`}>
                <Image src={partner.logo} height={50} width={400} quality={100} alt={partner.name} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* <div>
          <motion.div
            {...sectionMotionProps}
            id='home-page-features'
            className='text-3xl md:text-6xl font-bold py-4'>
            Simplify your DeFi <br /> Investments with BIT10
          </motion.div>

          <motion.p
            {...sectionMotionProps}
            className='md:max-w-3xl'>
            Discover BIT10, your gateway to a diversified, auto-rebalancing index of top crypto tokens, BRC-20s, and more. Simplify investing, reduce costs, and maximize returns across Bitcoin and beyond.</motion.p>
          <div className='py-2 md:py-4 grid gap-6 overflow-hidden lg:overflow-visible'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <motion.div
                {...cardMotionFadeRightProps}
                className='md:col-span-2 flex flex-col'>
                <WobbleCard containerClassName='text-gray-200 flex-1 flex flex-col'>
                  <div className='max-w-md flex-1'>
                    <div className='text-2xl md:text-3xl font-semibold tracking-wide'>Decentralized Index Token</div>
                    <div className='text-xl mt-2'>
                      Invest in a token backed by the value of the top cryptocurrencies or specifically curated assets. Experience the potential benefits of diversification in the fast-evolving world of digital assets.
                    </div>
                  </div>
                  <div className='absolute -right-[10%] -bottom-[80%] lg:-bottom-[40%]'>
                    <Image src={DashboardImg} width={500} height={500} alt='Dashboard' />
                  </div>
                </WobbleCard>
              </motion.div>

              <motion.div
                {...cardMotionFadeLeftProps}
                className='md:col-span-1 flex flex-col'>
                <WobbleCard containerClassName='md:col-span-1 bg-primary/50 text-[#030712] flex-1' className='flex flex-col items-start justify-center'>
                  <div className='text-2xl md:text-3xl font-semibold tracking-wide'>Historical Performance Analysis</div>
                  <div className='text-xl mt-2'>
                    Explore the historical performance of your portfolio through interactive charts and graphs. Understand the growth potential by comparing it with traditional benchmarks like the S&P500.
                  </div>
                </WobbleCard>
              </motion.div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <motion.div
                {...cardMotionFadeRightProps}
                className='md:col-span-1 flex flex-col'>
                <WobbleCard containerClassName='md:col-span-1 text-gray-200 flex-1' className='flex flex-col items-start justify-center'>
                  <div className='text-2xl md:text-3xl font-semibold tracking-wide'>Customizable Portfolios</div>
                  <div className='text-xl mt-2'>
                    Tailor your investment strategy with customizable portfolios. Choose specific assets or let our algorithm optimize your holdings for maximum returns.
                  </div>
                </WobbleCard>
              </motion.div>

              <motion.div
                {...cardMotionFadeLeftProps}
                initial={{ ...cardMotionFadeLeftProps.initial, y: 40 }}
                whileInView={{ ...cardMotionFadeLeftProps.whileInView, y: 0 }}
                className='md:col-span-1 relative flex flex-col'>
                <WobbleCard containerClassName='md:col-span-1 bg-primary/50 text-[#030712] flex-1' className='flex flex-col space-y-3 items-center justify-center'>
                  <div className='absolute top-3 right-6'>
                    <CircleDot className='h-6 w-6 font-semibold' />
                  </div>
                  <div className='text-2xl md:text-3xl font-semibold tracking-wide text-center'>Index Insight</div>
                  <div className='text-xl text-center'>Simplify crypto investing with diversified, auto-rebalancing asset baskets.</div>
                </WobbleCard>
              </motion.div>

              <motion.div
                {...cardMotionFadeLeftProps}
                className='md:col-span-1 flex flex-col'>
                <WobbleCard containerClassName='md:col-span-1 text-gray-200 flex-1' className='flex flex-col items-start justify-center'>
                  <div className='text-2xl md:text-3xl font-semibold tracking-wide'>User Account Security</div>
                  <div className='text-xl mt-2'>
                    Create a secure account with ease, and manage your profile and preferences. Enhance security with two-factor authentication for peace of mind.
                  </div>
                </WobbleCard>
              </motion.div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <motion.div
                {...cardMotionFadeRightProps}
                className='md:col-span-1 flex flex-col'>
                <WobbleCard containerClassName='md:col-span-1 bg-primary/50 text-[#030712] flex-1 flex flex-col'>
                  <div className='text-2xl md:text-3xl font-semibold tracking-wide'>Transparent Token Details</div>
                  <div className='text-xl mt-2'>
                    Gain insights into how our token operates, ensuring transparency and trust. Learn about the technology, methodology, and security measures behind our innovative investment solution.
                  </div>
                </WobbleCard>
              </motion.div>

              <motion.div
                {...cardMotionFadeLeftProps}
                className='md:col-span-2 flex flex-col'>
                <WobbleCard containerClassName='text-gray-200 flex-1 flex flex-col'>
                  <div className='max-w-md flex-1'>
                    <div className='text-2xl md:text-3xl font-semibold tracking-wide'>Market Insights and News</div>
                    <div className='text-xl mt-2'>
                      Stay informed with regular market insights, news, and analysis. Access resources that help you make informed decisions in the dynamic cryptocurrency landscape.
                    </div>
                  </div>
                  <div className='absolute -right-[10%] -bottom-[80%] lg:-bottom-[40%]'>
                    <Image src={DashboardImg} width={500} height={500} alt='Dashboard' />
                  </div>
                </WobbleCard>
              </motion.div>
            </div>
          </div>
        </div> */}
      </MaxWidthWrapper>
    </div>
  )
}
