"use client"

import React from 'react'
import { useChain } from '@/context/ChainContext'
import ICPChatbotModule from './icp/ICPChatbotModule'

export default function Chatbot() {
    const { chain } = useChain();

    return (
        <>
            {chain === 'icp' && <ICPChatbotModule />}
        </>
    )
}
