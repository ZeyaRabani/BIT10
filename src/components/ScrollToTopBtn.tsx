"use client"

import React, { useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { ChevronsUp } from 'lucide-react'

export default function ScrollToTopBtn() {
    const [showButton, setShowButton] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (latest) => {
        if (latest > 400) {
            setShowButton(true);
        } else {
            setShowButton(false);
        }
    });

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 40 }
            }
            animate={showButton ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='fixed bottom-20 right-10 md:bottom-24 md:right-[2.5rem] z-[48] bg-accent border-2 border-primary rounded-full p-2 outline-none'
            onClick={scrollToTop}
        >
            <ChevronsUp />
        </motion.button>
    );
}
