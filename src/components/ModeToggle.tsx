"use client"

import * as React from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function ModeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();

    const raysVariants = {
        hidden: {
            strokeOpacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1,
            },
        },
        visible: {
            strokeOpacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const rayVariant = {
        hidden: {
            pathLength: 0,
            opacity: 0,
            scale: 0
        },
        visible: {
            pathLength: 1,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
                pathLength: { duration: 0.3 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 }
            }
        },
    };

    const circleVariant = {
        hidden: {
            cx: 22,
            cy: 2,
            scale: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 10
            }
        },
        visible: {
            cx: 12,
            cy: 12,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 10
            }
        }
    };

    const moonVariant = {
        hidden: {
            rotate: -360,
            scale: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 10
            }
        },
        visible: {
            rotate: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 10,
                duration: 0.8
            }
        }
    };

    return (
        <Button
            variant='outline'
            onClick={() =>
                theme === 'dark' ? setTheme('light') : setTheme('dark')
            }
        >
            {resolvedTheme === 'dark' ?
                <motion.svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='stroke-[#0099cc]'
                    initial='hidden'
                    animate='visible'
                    variants={moonVariant}
                    key='moon'
                >
                    <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' fill='none' />
                </motion.svg>
                :
                <motion.svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    initial='hidden'
                    animate='visible'
                    className='stroke-yellow-600'
                >
                    <motion.g variants={raysVariants}>
                        <motion.path d='M12 2v2' variants={rayVariant} />
                        <motion.path d='M12 20v2' variants={rayVariant} />
                        <motion.path d='m4.93 4.93 1.41 1.41' variants={rayVariant} />
                        <motion.path d='m17.66 17.66 1.41 1.41' variants={rayVariant} />
                        <motion.path d='M2 12h2' variants={rayVariant} />
                        <motion.path d='M20 12h2' variants={rayVariant} />
                        <motion.path d='m6.34 17.66-1.41 1.41' variants={rayVariant} />
                        <motion.path d='m19.07 4.93-1.41 1.41' variants={rayVariant} />
                    </motion.g>
                    <motion.circle
                        r='4'
                        fill='none'
                        variants={circleVariant}
                    />
                </motion.svg>
            }
        </Button>
    )
}
