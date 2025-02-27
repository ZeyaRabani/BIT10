import React from 'react'
import SwapIdDetails from '@/components/explorer/SwapIdDetails'

export default async function Page({ params }: { params: Promise<{ swapId: string }> }) {
    const swap_id = (await params).swapId

    return (
        <SwapIdDetails swapId={swap_id} />
    )
}
