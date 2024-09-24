"use client"

import { useState } from 'react'

interface HeaderProps {
    message: string;
}

export default function Header({ message }: HeaderProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <>
            {isVisible && (
                <header className='bg-primary py-2 px-4 flex justify-between items-center'>
                    <p className='text-gray-200 font-medium'>{message}</p>
                    <button
                        type='button'
                        className='text-gray-200 hover:text-gray-400 focus:outline-none'
                        onClick={handleClose}
                    >
                        <svg
                            className='h-5 w-5'
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                        >
                            <path
                                fillRule='evenodd'
                                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                clipRule='evenodd'
                            />
                        </svg>
                    </button>
                </header>
            )}
        </>
    );
};
