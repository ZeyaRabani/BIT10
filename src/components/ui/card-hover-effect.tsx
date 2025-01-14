import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image, { type StaticImageData } from 'next/image'

type Project = {
    image_url: StaticImageData;
    title: string;
    description: string;
    link: string;
};

export const HoverEffect = ({
    items,
    className,
}: {
    items: Project[];
    className?: string;
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <motion.div layout className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3', className)}>
            {items.map((item, idx) => (
                <Link
                    href={item?.link}
                    key={item?.link}
                    className='relative group block p-2 h-full w-full'
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <AnimatePresence>
                        {hoveredIndex === idx && (
                            <motion.span
                                className='absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-2xl'
                                layoutId='hoverBackground'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                            />
                        )}
                    </AnimatePresence>
                    <Card>
                        <div className='flex flex-col items-center justify-center'>
                            <Image src={item.image_url} alt={item.title} height='200' width='400' className='rounded-xl' />
                            <CardTitle>{item.title}</CardTitle>
                        </div>
                    </Card>
                </Link>
            ))}
        </motion.div>
    );
};

export const Card = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        // <div className={cn('rounded-xl h-full w-full p-2 overflow-hidden bg-gray-200 border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 relative z-20', className)}>
        <div className={cn('rounded-xl h-full w-full p-2 overflow-hidden border dark:border-white/[0.2] group-hover:border-slate-700 relative z-20', className)}>
            <div className='relative z-30'>
                <div className='p-4'>{children}</div>
            </div>
        </div>
    );
};

export const CardTitle = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        // <h4 className={cn('text-gray-800 font-bold tracking-wide mt-4', className)}>
        <h4 className={cn('font-bold tracking-wide mt-4', className)}>
            {children}
        </h4>
    );
};

export const CardDescription = ({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) => {
    return (
        <p className={cn('mt-1 text-gray-800 tracking-wide leading-relaxed text-sm', className)}>
            {children}
        </p>
    );
};
