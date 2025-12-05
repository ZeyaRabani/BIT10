/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import BIT10Comparison from './bit10Comparison'
import { TrendingUpIcon, ShieldIcon, ZapIcon, NetworkIcon } from 'lucide-react'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import Image from 'next/image'
import BIT10Img from '@/assets/tokens/bit10.svg'
import BTCImg from '@/assets/tokens/btc.svg'
import ETHImg from '@/assets/tokens/eth.svg'
import XRPImg from '@/assets/tokens/xrp.svg'
import BNBImg from '@/assets/tokens/bnb.svg'
import SOLImg from '@/assets/tokens/sol.svg'
import TRXImg from '@/assets/tokens/trx.svg'
import DogeImg from '@/assets/tokens/doge.svg'
import ADAImg from '@/assets/tokens/cardano.svg'
import BCHImg from '@/assets/tokens/bch.svg'
import AVAXImg from '@/assets/tokens/avax.svg'
import DefinityDevImg from '@/assets/home/DFINITYDev.jpg'
import EasyaAppImg from '@/assets/home/easya_app.jpg'
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

const whyChooseUs = [
  {
    title: 'Low Cost',
    desc: 'Pay 1 transaction fee instead of 10',
    icon: NetworkIcon
  },
  {
    title: 'Auto-Rebalanced',
    desc: 'Weekly rebalancing to stay up-to-date',
    icon: ZapIcon
  },
  {
    title: 'Diversified',
    desc: 'Instant exposure to Top 10 cryptocurrencies',
    icon: TrendingUpIcon
  },
  {
    title: 'Secure',
    desc: '110% over-collateralized for your protection',
    icon: ShieldIcon
  },
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
  {
    name: 'EasyA',
    logo: EasyAImg,
  }
]

export default function Page() {
  return (
    <div>
      <div className='py-8 flex flex-col items-center justify-center'>
        <div className='flex flex-col gap-4 items-center justify-center md:px-4'>
          <div className='p-4 max-w-7xl mx-auto z-10 w-full pt-8 md:pt-0'>
            <motion.h1
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
              className='text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50 pb-2'>
              On-Chain Crypto Index Funds
            </motion.h1>

            <div className='flex flex-col md:flex-row space-x-4 items-center justify-center py-6'>
              <div className='flex flex-col space-y-2 items-center'>
                <div className='flex'>
                  <Image src={BIT10Img} alt='logo' width={85} height={85} className='border-2 w-16 md:w-16 lg:w-20 rounded-full' />
                </div>
                <div className='text-xl font-semibold text-primary'>BIT10.TOP</div>
              </div>
              <div className='text-6xl md:-mt-5'>=</div>
              <div className='flex flex-col space-y-2 items-start justify-center'>
                <div className='flex flex-row items-center justify-center -space-x-3 w-full'>
                  {[BTCImg, ETHImg, XRPImg, BNBImg, SOLImg, TRXImg, DogeImg, ADAImg, BCHImg, AVAXImg].map((imgSrc, index) => (
                    <Image key={index} src={imgSrc} alt='logo' width={85} height={85} className='border-2 rounded-full w-9 md:w-16 lg:w-20 h-full object-cover bg-gray-200' />
                  ))}
                </div>
                <div className='text-xl font-semibold text-center'>
                  Top 10 cryptocurrencies in a single, secure, over-collateralized token.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MaxWidthWrapper className='flex flex-col space-y-4 pb-8 pt-4'>
        <BIT10Comparison />

        <div className='flex flex-col items-center space-y-2'>
          <motion.h1
            initial={{ opacity: 0.0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
            className='text-4xl md:text-6xl font-semibold z-[1]'>
            How BIT10 works?
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

        <div className='flex flex-col items-center space-y-2'>
          <motion.h1
            initial={{ opacity: 0.0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
            className='text-4xl md:text-6xl font-semibold z-[1]'>
            Why Choose BIT10.TOP?
          </motion.h1>

          <motion.div
            initial='hidden'
            whileInView='visible'
            variants={containerVariants}
            className='grid grid-cols-2 md:grid-cols-4 md:gap-6 w-full h-full py-4'
          >
            {whyChooseUs.map((item, index) => (
              <motion.div
                variants={cardVariants}
                key={index}
                className='flex flex-col space-y-2 items-center justify-start py-6 px-2 border-2 bg-card border-muted rounded-2xl w-full min-w-0 h-full'
                style={{ height: '215px', width: '100' }}
              >
                <div className='flex flex-col items-center justify-start h-full w-full'>
                  <div className='mb-2 flex justify-center'>{item.icon && <item.icon className='h-12 w-12 text-primary' />}</div>
                  <div className='text-2xl font-semibold text-center'>{item.title}</div>
                  <div className='text-lg text-center max-w-56'>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className='flex flex-col antialiased items-center justify-center relative overflow-hidden'>
          <div>
            <motion.h1
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
              className='text-4xl md:text-6xl font-semibold'>Our Partners</motion.h1>
          </div>

          <InfiniteMovingCards
            items={testimonials}
            direction='right'
            speed='slow'
          />

          <motion.div
            initial='hidden' whileInView='visible' variants={containerVariants}
            className='flex flex-col md:flex-row items-center justify-evenly w-full space-y-3 md:space-y-0'>
            {parterners.map((partner, index) => (
              <motion.div
                variants={cardVariants}
                key={index} className={`p-2 border-2 border-accent rounded-2xl bg-white`}>
                <Image src={partner.logo} height={50} width={400} quality={100} alt={partner.name} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </MaxWidthWrapper>
    </div>
  )
}
