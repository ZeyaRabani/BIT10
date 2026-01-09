import { Card } from '@/components/ui/card';
import TrxDetails from '@/components/explorer/TrxDetails';

export default async function Page({ params }: { params: Promise<{ transactionId: string }> }) {
    const transaction_id = (await params).transactionId

    return (
        <div className='flex flex-col py-4 h-full items-center justify-center'>
            <Card className='w-full md:w-3/4'>
                <TrxDetails swapId={transaction_id} />
            </Card>
        </div>
    )
}
