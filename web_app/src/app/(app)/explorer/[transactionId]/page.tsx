import React from 'react'
import TransactionDetails from '@/components/explorer/TransactionDetails'

export default async function Page({ params }: { params: Promise<{ transactionId: string }> }) {
    const transaction_id = (await params).transactionId

    return (
        <TransactionDetails transactionId={transaction_id} />
    )
}
