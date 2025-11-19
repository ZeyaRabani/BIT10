/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AuroraBackground } from '@/components/ui/aurora-background'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import BIT10Comparison from './bit10Comparison'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import Image from 'next/image'
import DefinityDevImg from '@/assets/home/DFINITYDev.jpg'
import EasyaAppImg from '@/assets/home/easya_app.jpg'
import ICPChainImg from '@/assets/wallet/icp-logo.svg'
import BaseChainImg from '@/assets/wallet/base-logo.svg'
import SolChainImg from '@/assets/wallet/solana-logo.svg'
import BSCChainImg from '@/assets/wallet/bsc-logo.svg'
import ICPImg from '@/assets/home/ICP.svg'
import EasyAImg from '@/assets/home/EasyA.png'

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

const chains = [
  {
    name: 'Internet Computer',
    logo: ICPChainImg,
  },
  {
    name: 'Base',
    logo: BaseChainImg,
  },
  {
    name: 'Solana',
    logo: SolChainImg,
  },
  {
    name: 'Binance Smart Chain',
    logo: BSCChainImg,
  }
]

const whyChooseUs = [
  {
    title: 'Diversified',
    desc: 'Instant exposure to top 10 cryptocurrencies',
  },
  {
    title: 'Secure',
    desc: '110% over-collateralized for your protection',
  },
  {
    title: 'Automatic',
    desc: 'Weekly rebalancing on Premium plan',
  },
  {
    title: 'Multi-Chain',
    desc: 'Live on ICP, Base, SOL, and more',
  }
]

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
  // {
  //   name: 'BSL',
  //   logo: BSLImg,
  // },
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
              BIT10 <br /> <span className='italic'>On-Chain Crypto Index Funds</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
              className='py-2 text-center dark:text-gray-300 text-xl'>
              Diversified exposure to the top 10 cryptocurrencies with automatic rebalancing
            </motion.div>
          </div>
        </div>
      </AuroraBackground>

      <MaxWidthWrapper className='flex flex-col space-y-8 pb-8 pt-4'>
        <div className='flex flex-col items-center space-y-2 pb-4 md:pb-8'>
          <motion.h1
            initial={{ opacity: 0.0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
            className='text-3xl md:text-5xl text-center font-semibold z-[1]'>
            Live on 4 Chains
          </motion.h1>

          <motion.div
            initial='hidden'
            whileInView='visible'
            variants={containerVariants}
            className='flex flex-col md:flex-row md:space-x-6 items-center justify-evenly w-full space-y-3 md:space-y-0 py-4'>
            {chains.map((chains, index) => (
              <motion.div
                variants={cardVariants}
                key={index}
                className='flex flex-col space-y-2 items-center justify-center py-6 px-2 border-2 border-accent rounded-lg w-full md:w-1/4 min-w-0'>
                <Image src={chains.logo} height={80} width={80} quality={100} alt={chains.name} />
                <div>{chains.name}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className='flex flex-col items-center space-y-2 py-4 md:py-8'>
          <motion.h1
            initial={{ opacity: 0.0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
            className='text-3xl md:text-5xl text-center font-semibold z-[1]'>
            Why Choose BIT10?
          </motion.h1>

          <motion.div
            initial='hidden'
            whileInView='visible'
            variants={containerVariants}
            className='flex flex-col md:flex-row md:space-x-6 items-center justify-evenly w-full space-y-3 md:space-y-0 py-4'
          >
            {whyChooseUs.map((item, index) => (
              <motion.div
                variants={cardVariants}
                key={index}
                className='flex flex-col space-y-2 items-center justify-center py-6 px-2 border-2 border-accent rounded-lg w-full md:w-1/4 min-w-0'
                style={{ height: '150px', width: '100' }}>
                <div className='flex flex-col items-center justify-start h-full w-full'>
                  <div className='text-primary text-2xl font-semibold'>{item.title}</div>
                  <div className='text-lg text-center'>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

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
            src='https://www.youtube.com/embed/uFhg9oJ6w0M'
            // height={1720}
            // width={1400}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            className='mx-auto rounded-2xl object-cover w-full md:w-3/4 h-56 md:h-[36rem] z-[2]'
          ></motion.iframe>
        </div>

        {/* <div className='flex items-center justify-center py-4 md:py-8'>
          <div className='border-2 border-accent bg-accent rounded-lg w-full max-w-4xl py-4 md:py-8 flex flex-col items-center justify-center space-y-4'>
            <div className='text-3xl md:text-4xl font-semibold text-center'>Crypto Index Funds Market</div>
            <div className='text-xl md:text-2xl font-semibold text-center'><span className='text-primary'>$150 billion</span> market cap</div>
            <div className='text-xl md:text-2xl text-center'>Current AUM: <span className='font-semibold'>&lt; $5 billion</span></div>
            <div className='text-2xl md:text-3xl font-semibold text-green-500 text-center'>AIM: 100x Growth Potential</div>
          </div>
        </div> */}

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
      </MaxWidthWrapper>
    </div>
  )
}
