import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function MaxWidthWrapper({ className, children }: { className?: string, children: ReactNode }) {
    return (
        <div className={cn('mx-auto w-full max-w-screen-2xl px-2.5 md:px-16', className)}>
            {children}
        </div>
    )
}