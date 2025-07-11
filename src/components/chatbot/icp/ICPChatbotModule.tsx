"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ICPChatbotModule() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<{ from: 'user' | 'bot', text: string }[]>([]);
    const [input, setInput] = useState('');
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { from: 'user', text: input }]);
        setInput('');
        setTimeout(() => {
            setMessages(msgs => [...msgs, { from: 'bot', text: `I'm your BIT10 AI Portfolio Manager!` }]);
        }, 500);
    };

    return (
        <>
            <Button
                className='fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all'
                onClick={() => setOpen(o => !o)}
                aria-label='Open Chatbot'
            >
                <svg className='w-16 h-16' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                </svg>
            </Button>

            {open && (
                <div
                    ref={popupRef}
                    className='fixed bottom-24 right-6 z-50 w-80 max-w-[90vw] rounded-xl shadow-2xl flex flex-col overflow-hidden border-2'
                >
                    <div className='bg-primary text-white px-4 py-3 flex justify-between items-center'>
                        <span className='font-semibold'>BIT10 AI Portfolio Manager</span>
                        <button
                            className='text-white hover:text-gray-200'
                            onClick={() => setOpen(false)}
                            aria-label='Close Chatbot'
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>
                    </div>
                    <div className='flex-1 px-4 py-2 overflow-y-auto bg-gray-50 space-y-2 max-h-[50vh]'>
                        {messages.length === 0 && (
                            <div className='text-gray-400 text-sm text-center mt-8'>Say hi to the chatbot!</div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`px-3 py-2 rounded-lg text-sm max-w-[70%] ${msg.from === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-800'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form
                        className='flex items-center border-t border-gray-200 px-2 py-2'
                        onSubmit={e => {
                            e.preventDefault();
                            handleSend();
                        }}
                    >
                        <input
                            className='flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm'
                            type='text'
                            placeholder='Type your message...'
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <button
                            type='submit'
                            className='ml-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm'
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
