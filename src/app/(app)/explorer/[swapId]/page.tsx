import React from 'react'
import SwapDetails from '@/components/explorer/SwapDetails'

export default async function Page({ params }: { params: Promise<{ swapId: string }> }) {
    const swap_id = (await params).swapId;

    return (
        <SwapDetails swapId={swap_id} />
    )
}
