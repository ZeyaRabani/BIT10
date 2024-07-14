"use client"

import React, { useRef } from 'react'
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion'

export const ContainerScroll = ({
    titleComponent,
    children,
}: {
    titleComponent: string | React.ReactNode;
    children: React.ReactNode;
}) => {
    const containerRef = useRef<any>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
    });
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const scaleDimensions = () => {
        return isMobile ? [0.7, 0.9] : [1.05, 1];
    };

    const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
    const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

    return (
        <div
            className='h-[45rem] md:h-auto flex items-center justify-center relative p-2 md:pb-4'
            ref={containerRef}
        >
            <div
                className='py-10 md:py-20 w-full relative'
                style={{
                    perspective: '1000px',
                }}
            >
                <Header translate={translate} titleComponent={titleComponent} />
                <Card rotate={rotate} translate={translate} scale={scale}>
                    {children}
                </Card>
            </div>
        </div>
    );
};

export const Header = ({ translate, titleComponent }: any) => {
    return (
        <motion.div
            style={{
                translateY: translate,
            }}
            className='div max-w-5xl mx-auto text-center'
        >
            {titleComponent}
        </motion.div>
    );
};

export const Card = ({
    rotate,
    scale,
    children,
}: {
    rotate: MotionValue<number>;
    scale: MotionValue<number>;
    translate: MotionValue<number>;
    children: React.ReactNode;
}) => {
    return (
        <motion.div
            style={{
                rotateX: rotate,
                scale,
                // boxShadow:
                    // '0 0 10px rgba(0, 0, 0, 0.3), 0 9px 20px rgba(0, 0, 0, 0.3), 0 37px 37px rgba(0, 0, 0, 0.2), 0 84px 50px rgba(0, 0, 0, 0.15), 0 149px 60px rgba(0, 0, 0, 0.1), 0 233px 65px rgba(0, 0, 0, 0.03)'
            }}
            className='max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[35rem] w-full border-4 border-[#6C6C6C] p-2 bg-[#222222] rounded-[30px] shadow-2xl'
        >
            <div className=' h-full w-full  overflow-hidden rounded-2xl md:rounded-2xl md:p-4 '>
                {children}
            </div>
        </motion.div>
    );
};
