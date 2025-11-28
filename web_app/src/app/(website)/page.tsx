/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
// import { AuroraBackground } from '@/components/ui/aurora-background'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import BIT10Comparison from './bit10Comparison'
import AnimatedBackground from '@/components/ui/animated-background'
import { CheckIcon, TrendingUpIcon, ShieldIcon, ZapIcon, NetworkIcon } from 'lucide-react'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import Image from 'next/image'
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
    title: 'Diversified',
    desc: 'Instant exposure to top 10 cryptocurrencies',
    icon: TrendingUpIcon
  },
  {
    title: 'Secure',
    desc: '110% over-collateralized for your protection',
    icon: ShieldIcon
  },
  {
    title: 'Automatic',
    desc: 'Weekly rebalancing to stay up-to-date',
    icon: ZapIcon
  },
  {
    title: 'Multi-Chain',
    desc: 'Live on ICP, Base, SOL, and more',
    icon: NetworkIcon
  }
]

const tabs = ['Today', 'Tomorrow'];

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
  const [activeTab, setActiveTab] = useState('Today');

  const handleTabChange = (label: string | null) => {
    if (label) {
      setActiveTab(label)
    }
  }

  return (
    <div>
      {/* <AuroraBackground className='md:max-h-[60vh]'> */}
      <div className='md:min-h-[60vh] flex flex-col items-center justify-center'>
        <div className='relative flex flex-col gap-4 items-center justify-center md:px-4'>
          <div className='hidden dark:block'>
            <Image src='/logo/logo.png' alt='logo' width={80} height={80} />
          </div>
          <div className='block dark:hidden'>
            <Image src='/logo/logo-circle.png' alt='logo' width={90} height={90} />
          </div>
          <div className='p-4 max-w-7xl mx-auto relative z-10 w-full pt-8 md:pt-0'>
            <motion.h1
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
              className='text-4xl md:text-6xl font-bold text-center bg-clip-text dark:text-transparent dark:bg-gradient-to-b dark:from-neutral-50 dark:to-neutral-400 bg-opacity-50 pb-2'>
              BIT10 <br /> <span>On-Chain Crypto Index Funds</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0.0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
              className='py-2 text-center dark:text-gray-300 text-xl max-w-4xl'>
              Our flagship crypto index fund, BIT10.TOP, offers instant and diversified exposure to the top 10 cryptocurrencies via a single, secure, over-collateralized token.
            </motion.div>
          </div>
        </div>
      </div>
      {/* </AuroraBackground> */}

      <MaxWidthWrapper className='flex flex-col space-y-8 pb-8 pt-4'>
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

        <div className='flex flex-col items-center space-y-2'>
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
                className='flex flex-col space-y-2 items-center justify-center py-6 px-2 border-2 border-accent rounded-2xl w-full md:w-1/4 min-w-0'
                style={{ height: '200px', width: '100' }}>
                <div className='flex flex-col items-center justify-start h-full w-full'>
                  <div className='mb-2 flex justify-center'>{item.icon && <item.icon className='h-12 w-12 text-primary' />}</div>
                  <div className='text-2xl font-semibold'>{item.title}</div>
                  <div className='text-lg text-center max-w-56'>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className='flex flex-col items-center space-y-4'>
          <motion.div initial={{ opacity: 0.0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: 'easeInOut' }} className='text-3xl md:text-5xl text-center font-semibold z-[1]'>
            BIT10&apos;s Vision
          </motion.div>
          <motion.div initial='hidden' whileInView='visible' variants={cardVariants} className='flex flex-col space-y-4 md:space-y-8 items-center'>
            <div className='relative grid grid-cols-2 gap-2 md:gap-8 items-center justify-between border border-muted rounded-md px-2 py-1.5 w-full md:w-[50vw]'>
              <AnimatedBackground defaultValue='Today' className='rounded bg-primary' transition={{ ease: 'easeInOut', duration: 0.2 }} onValueChange={(newActiveId) => handleTabChange(newActiveId)}>
                {tabs.map((label, index) => (
                  <button key={index} data-id={label} type='button' className={`inline-flex px-6 items-center justify-center text-xl text-center transition-transform active:scale-[0.98] ${activeTab === label ? 'text-zinc-50' : 'text-zinc-800 dark:text-zinc-50'} flex-grow`}>
                    {label}
                  </button>
                ))}
              </AnimatedBackground>
            </div>
            {
              activeTab === 'Today' ?
                <div className='border-2 border-accent bg-accent rounded-2xl w-full md:w-[60vw] p-4 md:p-8 flex flex-col items-center justify-center space-y-4'>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>Weekly auto-rebalancing</div>
                  </div>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>Live on 4 major blockchain networks</div>
                  </div>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>110% over-collateralized security model</div>
                  </div>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>Instant exposure to top 10 cryptocurrencies in one token</div>
                  </div>
                </div> :
                <div className='border-2 border-accent bg-accent rounded-2xl w-full md:w-[60vw] p-4 md:p-8 flex flex-col items-center justify-center space-y-4'>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>AI-driven smart portfolio management</div>
                  </div>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>Regulated licensing framework for institutions</div>
                  </div>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>Create custom index funds tailored to any strategy</div>
                  </div>
                  <div className='flex flex-row w-full space-x-2 items-center justify-start'>
                    <div><CheckIcon className='text-green-500' /></div>
                    <div className='text-xl'>Automated yield-generating vaults for enhanced returns</div>
                  </div>
                </div>
            }

          </motion.div>
        </div>

        <div className='flex flex-col antialiased items-center justify-center relative overflow-hidden'>
          <div>
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
              <motion.div variants={cardVariants} key={index} className={`p-2 border-2 border-accent rounded-2xl ${partner.name === 'BSL' ? 'bg-black' : 'bg-white dark:bg-gray-100'}`}>
                <Image src={partner.logo} height={50} width={400} quality={100} alt={partner.name} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </MaxWidthWrapper>
    </div>
  )
}
