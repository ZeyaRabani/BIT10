"use client"

import React, { useState, useEffect } from 'react'
import { ChevronsUp } from 'lucide-react'

export default function ScrollToTopBtn() {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        });

        return () => {
            window.removeEventListener('scroll', () => { });
        };
    }, []);


    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button className={`fixed bottom-4 right-4 md:bottom-8 md:right-14 z-[48] bg-accent border-2 border-primary rounded-full p-2 outline-none ${showButton ? 'transition-opacity duration-200 opacity-100' : 'hidden'}`} onClick={scrollToTop}>
            <ChevronsUp />
        </button>
    )
}
