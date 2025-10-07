"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Actor, HttpAgent } from '@dfinity/agent'
import { idlFactory } from '@/lib/ai_portfolio_manager'
import { useChain } from '@/context/ChainContext'
import { useICPWallet } from '@/context/ICPWalletContext'
import { Bot, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

type Message = {
    id: number
    text: string
    isUser: boolean
    isTyping?: boolean
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: 'Welcome to BIT10 AI Portfolio Manager. I am here to help you with managing your portfolio and answer your questions.',
            isUser: false,
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const toggleChat = () => setIsOpen(!isOpen);
    const { icpAddress } = useICPWallet();
    const { chain } = useChain();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: messages.length + 1,
            text: inputValue,
            isUser: true,
        };

        const placeholderId = newUserMessage.id + 1;
        const placeholderMessage: Message = {
            id: placeholderId,
            text: '',
            isUser: false,
            isTyping: true,
        };

        setMessages((prev) => [...prev, newUserMessage, placeholderMessage]);
        setInputValue('');

        const response = await getChatMessage(inputValue);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === placeholderId
                    ? { ...msg, text: response, isTyping: false }
                    : msg
            )
        );
    }

    const getChatMessage = async (inputValue: string) => {
        const host = 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io';
        const canisterId = 'anic3-viaaa-aaaap-qqcaq-cai';

        const agent = new HttpAgent({ host });
        const actor = Actor.createActor(idlFactory, {
            agent,
            canisterId,
        });

        let walletAddress: string;

        if (chain === 'icp') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            walletAddress = icpAddress;
        } else {
            walletAddress = 'none';
        }

        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const response = await actor.chat([
                {
                    user: {
                        content: `${inputValue}? My address is ${walletAddress}`,
                    },
                },
            ]);
            return response;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return '⚠️ Failed to get response. Try again!';
        }
    }

    return (
        <>
            {chain && (
                <div className='fixed bottom-4 md:bottom-8 right-8 md:right-8 z-[49]'>
                    <AnimatePresence>
                        {isOpen ? (
                            <motion.div
                                key='chatbox'
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{ duration: 0.3 }}
                                className='absolute bottom-0 right-0 bg-white rounded-lg shadow-xl 
                 w-[90vw] md:w-96 h-[70vh] md:h-[500px] flex flex-col border border-gray-200'
                            >
                                <div className='bg-gradient-to-r bg-primary text-white px-2 rounded-t-lg flex justify-between items-center py-1'>
                                    <h2 className='font-bold text-lg'>
                                        BIT10 AI Portfolio Manager
                                    </h2>
                                    <div
                                        className='text-white hover:bg-white/20 rounded-full cursor-pointer p-1'
                                        onClick={toggleChat}
                                    >
                                        <X size={20} />
                                    </div>
                                </div>

                                <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 text-sm'>
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.isUser
                                                    ? 'bg-primary text-white rounded-br-none'
                                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                                    }`}
                                            >
                                                {message.isTyping ? (
                                                    <div className='flex space-x-1'>
                                                        <span className='animate-bounce'>•</span>
                                                        <span className='animate-bounce delay-150'>•</span>
                                                        <span className='animate-bounce delay-300'>•</span>
                                                    </div>
                                                ) : (
                                                    message.text
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    <div ref={messagesEndRef} />
                                </div>

                                <div className='p-4 border-t border-gray-200 text-sm'>
                                    <div className='flex gap-2'>
                                        <input
                                            type='text'
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder='Ask me anything...'
                                            className='flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary'
                                            disabled={messages.some((m) => m.isTyping)}
                                        />
                                        <Button
                                            size='icon'
                                            className='rounded-full bg-primary hover:bg-orange-600'
                                            onClick={handleSend}
                                            disabled={
                                                messages.some((m) => m.isTyping) || !inputValue.trim()
                                            }
                                        >
                                            <Send size={18} className='text-white' />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key='chatbutton'
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                className='absolute bottom-0 right-0'
                            >
                                <Button
                                    size='icon'
                                    className='rounded-full bg-primary hover:bg-orange-500 w-14 h-14 [&_svg]:size-6'
                                    onClick={toggleChat}
                                >
                                    <Bot className='text-white cursor-pointer' />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </>
    )
}
