import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, Loader2, Circle, CircleX } from 'lucide-react'

export type TransactionStep = {
    title: string;
    description: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
};

interface TransactionProgressDialogProps {
    open: boolean;
    steps: TransactionStep[];
    onClose: () => void;
}

export const TransactionProgressDialog: React.FC<TransactionProgressDialogProps> = ({ open, steps, onClose }) => {
    const allCompleted = steps.every((step) => step.status === 'completed');
    const hasError = steps.some((step) => step.status === 'error');
    const canClose = allCompleted || hasError;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen && canClose) {
                    onClose();
                }
            }}
        >
            <DialogContent
                className='sm:max-w-lg max-w-[90vw]'
                onPointerDownOutside={(e) => {
                    if (!canClose) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (!canClose) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Transaction Progress</DialogTitle>
                </DialogHeader>

                <div className='flex flex-col space-y-4 py-4'>
                    {steps.map((step, index) => (
                        <div key={index} className='flex items-start space-x-3'>
                            <div className='flex-shrink-0 mt-1'>
                                {step.status === 'completed' && (
                                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                                )}
                                {step.status === 'loading' && (
                                    <Loader2 className='h-5 w-5 text-blue-500 animate-spin' />
                                )}
                                {step.status === 'pending' && (
                                    <Circle className='h-5 w-5 text-gray-400' />
                                )}
                                {step.status === 'error' && (
                                    <CircleX className='h-5 w-5 text-red-500 ' />
                                )}
                            </div>
                            <div className='flex-1'>
                                <p
                                    className={`font-medium ${step.status === 'completed'
                                        ? 'text-green-600 dark:text-green-400'
                                        : step.status === 'loading'
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : step.status === 'error'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-gray-500'
                                        }`}
                                >
                                    {step.title}
                                </p>
                                <p className='text-sm text-muted-foreground mt-1'>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* {allCompleted && (
                    <div className='text-center text-sm text-green-600 dark:text-green-400 font-medium'>
                        All steps completed successfully!
                    </div>
                )}

                {hasError && (
                    <div className='text-center text-sm text-red-600 dark:text-red-400 font-medium'>
                        Transaction failed. Please try again.
                    </div>
                )} */}
            </DialogContent>
        </Dialog>
    );
};
