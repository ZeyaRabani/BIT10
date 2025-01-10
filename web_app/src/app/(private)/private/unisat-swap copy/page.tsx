"use client"

import React from 'react'
import UnisatProvider from "./provider/UnisatProvider"
import Swap from './swap'

export default function Page() {
    return (
        <UnisatProvider>
            <Swap />
        </UnisatProvider>
    )
}
