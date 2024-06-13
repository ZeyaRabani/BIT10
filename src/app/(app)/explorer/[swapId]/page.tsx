import React from 'react'
import SwapIdDetails from '@/components/explorer/swapIdDetails'

export default async function Page({ params }: { params: { swapId: string } }) {
    const swap_id = params.swapId

    return (
        <SwapIdDetails swapId={swap_id} />
    )
}
