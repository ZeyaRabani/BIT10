import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'

export default function InformationCard({ message }: { message: string }) {
    return (
        <div className='animate-fade-bottom-up flex items-center justify-center w-full min-h-[60vh]'>
            <Card className='w-full md:max-w-96'>
                <CardHeader className='py-24'>
                    <CardTitle className='text-center tracking-wide'>{message}</CardTitle>
                </CardHeader>
            </Card>
        </div>
    )
}
