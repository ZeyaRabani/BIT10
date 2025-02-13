/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client"

import React, { useTransition } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import type { Locale } from '@/config'
import { setUserLocale } from '@/services/locale'
import { toast } from 'sonner'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Languages, Mail } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { testnetRevenue } from '@/actions/dbActions'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import LinkedinImg from '@/assets/footer/linkedin.svg'
import XImg from '@/assets/footer/x.svg'

interface Language {
    value: string;
    label: string;
}

type TestnetRevenueType = {
    tokenPurchaseAmount: string;
    tokenBoughtAt: string;
};

type GroupDataType = {
    date: string;
    totalTokenPurchaseAmount: number;
};

const languages: Language[] = [
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
    { value: 'es', label: 'Español' },
    { value: 'hi', label: 'हिन्दी' },
];

export default function Page() {
    // const [selection, setSelection] = useState<{ startX: string | null, endX: string | null }>({ startX: null, endX: null });
    // const [data, setData] = useState(volume);
    // const [rotate, setRotate] = useState(false);
    const [isPending, startTransition] = useTransition();

    const t = useTranslations('dataroom');
    const locale = useLocale();

    function handleLanguageChange(value: string) {
        const locale = value as Locale;
        startTransition(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            setUserLocale(locale).catch((error) => {
                toast.error('Failed to set user locale. Please try again!');
            });
        });
    };

    const fetchTestnetRevenue = async () => {
        const response = await testnetRevenue();
        if (response === 'Error fetching testnet revenue') {
            toast.error('An error occurred while fetching Testnet Revenue . Please try again!');
        } else {
            return response as TestnetRevenueType[];
        }
    };

    const testnetRevenueQuery = useQueries({
        queries: [
            {
                queryKey: ['bit10TestnetRevenue'],
                queryFn: () => fetchTestnetRevenue(),
            },
        ]
    })

    const isLoading = testnetRevenueQuery.some(query => query.isLoading);
    const testnetRevenueData = testnetRevenueQuery[0].data;

    const totalTokenPurchaseAmount = testnetRevenueData?.reduce((sum, item) => sum + parseFloat(item.tokenPurchaseAmount), 0) ?? 0;

    const groupDataByDate = (data: TestnetRevenueType[]): GroupDataType[] => {
        const groupedMap = new Map<string, number>();

        if (groupedMap && testnetRevenueData) {
            data.forEach((item) => {
                const date = new Date(item.tokenBoughtAt).toISOString().split("T")[0] ?? '';
                const amount = parseFloat(item.tokenPurchaseAmount);

                if (groupedMap.has(date)) {
                    groupedMap.set(date, groupedMap.get(date)! + amount);
                } else {
                    groupedMap.set(date, amount);
                }
            });

            return Array.from(groupedMap.entries()).map(([date, total]) => ({
                date,
                totalTokenPurchaseAmount: total / 100000000,
            }));
        }

        return [];
    };

    const result = testnetRevenueData ? groupDataByDate(testnetRevenueData) : [];

    const bit10TestnetRevenueChartConfig: ChartConfig = {
        'bit10': {
            label: 'Test BIT10',
        }
    };

    const bit10TestnetRevenueChartData = result?.map((entry) => {
        const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        return {
            day: formattedDate,
            bit10: (entry.totalTokenPurchaseAmount.toFixed(6)).toString(),
        };
    });

    // const handleMouseDown = (e: any) => {
    //     if (e && e.activeLabel) {
    //         setSelection({ startX: e.activeLabel as string, endX: e.activeLabel as string });
    //     }
    // };

    // const handleMouseMove = (e: any) => {
    //     if (selection.startX !== null && e && e.activeLabel) {
    //         setSelection(prev => ({ ...prev, endX: e.activeLabel as string }));
    //     }
    // };

    // const handleMouseUp = () => {
    //     if (selection.startX !== null && selection.endX !== null) {
    //         const startIndex = volume.findIndex(data => data.week === selection.startX);
    //         const endIndex = volume.findIndex(data => data.week === selection.endX);
    //         const zoomedData = volume.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
    //         setData(zoomedData);
    //     }
    //     setSelection({ startX: null, endX: null });
    // };

    // const handleZoomOut = () => {
    //     setData(volume);
    //     setRotate(true);
    //     setTimeout(() => setRotate(false), 1000);
    // };

    return (
        <MaxWidthWrapper className='md:px-[20vw]'>
            <div className='flex flex-col md:flex-row space-y-3 md:space-y-0 items-center justify-between'>
                <div className='flex flex-roe space-x-3 items-center justify-start'>
                    <Image src='/logo/logo-circle.png' height='60' width='60' alt='logo' />
                    <div className='text-5xl font-semibold'>BIT10</div>
                </div>

                <div>
                    <Select defaultValue={locale} onValueChange={handleLanguageChange}>
                        <SelectTrigger className={`w-[180px] dark:border-white ${isPending && 'pointer-events-none opacity-60'}`}>
                            <SelectValue placeholder='Select a language' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel className='flex flex-row'><Languages className='h-4 w-4 mr-2' />{t('language')}</SelectLabel>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Accordion type='multiple' className='pt-4 flex flex-col space-y-2 md:space-y-4' defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7']}>
                <AccordionItem value='item-1' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('bit10Presentation')}
                    </AccordionTrigger>
                    <AccordionContent className='flex w-full h-full md:h-[75vh]'>
                        <iframe loading='lazy'
                            className='w-full h-full border-none p-0 m-0 rounded-md'
                            src='https://www.youtube.com/embed/sYCZpQu8mAE?start=3590'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen>
                        </iframe>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-2' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('presentationDeck')}
                    </AccordionTrigger>
                    <AccordionContent className='flex w-full h-full md:h-[75vh]'>
                        <iframe loading='lazy'
                            className='w-full h-full border-none p-0 m-0 rounded-md'
                            src='https://www.canva.com/design/DAGMauZZJd0/JOHrgFF1a-kMY1BZpw3yrA/view?embed'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen>
                        </iframe>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-3' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('testnetDemo')}
                    </AccordionTrigger>
                    <AccordionContent className='flex w-full h-full md:h-[75vh]'>
                        <iframe loading='lazy'
                            className='w-full h-full border-none p-0 m-0 rounded-md'
                            src='https://www.youtube.com/embed/XBAx1-Py9Oo'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen>
                        </iframe>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-4' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('metrics')}
                    </AccordionTrigger>
                    <AccordionContent className='flex flex-col space-y-2 w-full h-full'>
                        <p>{t('testnetLaunch')}</p>
                        <div>
                            {isLoading ?
                                <Skeleton className='w-full h-56' />
                                : (
                                    <div className='relative flex flex-col w-full h-full'>
                                        <div className='text-xl font-semibold py-2'>{t('revenue')}: {(totalTokenPurchaseAmount / 100000000).toFixed(8)} BTC</div>
                                        <ChartContainer config={bit10TestnetRevenueChartConfig} className='max-h-[300px] w-full'>
                                            <AreaChart accessibilityLayer data={bit10TestnetRevenueChartData}>
                                                <XAxis dataKey='day' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(0, value.indexOf(','))} />
                                                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <defs>
                                                    <linearGradient id='bit10' x1='0' y1='0' x2='0' y2='1'>
                                                        <stop offset='5%' stopColor='#ff8c1a' stopOpacity={0.8} />
                                                        <stop offset='95%' stopColor='#ff8c1a' stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <Area dataKey='bit10' type='natural' fill='#ff8c1a' fillOpacity={0.4} stroke='#ff8c1a' stackId='a' />
                                                <ChartLegend content={<ChartLegendContent />} />
                                            </AreaChart>
                                        </ChartContainer>
                                    </div>
                                )}
                        </div>
                        {/* <div className='relative flex flex-col w-full h-full'>
                            <div className='text-xl font-semibold'>{t('volume')}</div>
                            <RotateCcw className={`absolute top-0 right-0 w-5 h-5 cursor-pointer transition-transform ${rotate ? 'animate-rotate360' : ''}`} onClick={handleZoomOut} />

                            <ChartContainer config={chartConfig} className='max-h-[300px] w-full select-none'>
                                <AreaChart
                                    accessibilityLayer
                                    data={data}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                >
                                    <XAxis dataKey='week' tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <defs>
                                        <linearGradient id='bit10DeFi' x1='0' y1='0' x2='0' y2='1'>
                                            <stop offset='5%' stopColor='#D5520E' stopOpacity={0.8} />
                                            <stop offset='95%' stopColor='#D5520E' stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <Area dataKey='bit10DeFi' type='natural' fill='#D5520E' fillOpacity={0.4} stroke='#D5520E' stackId='a' />
                                    {selection.startX !== null && selection.endX !== null && (
                                        <ReferenceArea x1={selection.startX} x2={selection.endX} strokeOpacity={0.3} />
                                    )}
                                    <ChartLegend content={<ChartLegendContent />} />
                                </AreaChart>
                            </ChartContainer>
                        </div> */}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-5' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('links')}
                    </AccordionTrigger>
                    <AccordionContent className='flex w-full h-full'>
                        <ul>
                            <li className='text-lg'>
                                {t('twitter')} : <a href='https://twitter.com/bit10startup' target='_blank' rel='noreferrer' className='text-primary'>twitter.com/bit10startup</a>
                            </li>
                            <li className='text-lg'>
                                {t('website')} : <a href='https://www.bit10.app' target='_blank' rel='noreferrer' className='text-primary'>bit10.app</a>
                            </li>
                            <li className='text-lg'>
                                {t('gitbook')} : <a href='https://gitbook.bit10.app' target='_blank' rel='noreferrer' className='text-primary'>gitbook.bit10.app</a>
                            </li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-6' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('team')}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul>
                            <li className='text-lg flex flex-1 flex-wrap flex-row items-center justify-start space-x-1 pb-2 md:py-0'>
                                {t('ceo')}
                                <span className='md:pl-2 flex flex-1 flex-wrap flex-row items-center justify-start space-x-1'>
                                    <a href='https://www.linkedin.com/in/zeya-rabani' target='_blank' rel='noreferrer noopener'>
                                        <Image src={LinkedinImg} alt='LinedIn' width={20} height={20} />
                                    </a>
                                    <a href='https://x.com/ZeyaTheZeya' target='_blank' rel='noreferrer noopener'>
                                        <Image src={XImg} alt='Twitter' width={18} height={18} />
                                    </a>
                                    <a href='mailto:zeyarabani@bit10.app' rel='noreferrer noopener'>
                                        <Mail className='h-5 w-5' />
                                    </a>
                                </span>
                            </li>
                            <li className='text-lg flex flex-1 flex-wrap flex-row items-center justify-start space-x-1 pb-2 md:py-0'>
                                {t('cto')}
                                <span className='md:pl-2 flex flex-1 flex-wrap flex-row items-center justify-start space-x-1'>
                                    <a href='https://www.linkedin.com/in/harshal0902' target='_blank' rel='noreferrer noopener'>
                                        <Image src={LinkedinImg} alt='LinedIn' width={20} height={20} />
                                    </a>
                                    <a href='https://x.com/Harshal_0902' target='_blank' rel='noreferrer noopener'>
                                        <Image src={XImg} alt='Twitter' width={18} height={18} />
                                    </a>
                                    <a href='mailto:harshalraikwar@bit10.app' rel='noreferrer noopener'>
                                        <Mail className='h-5 w-5' />
                                    </a>
                                </span>
                            </li>
                        </ul>
                        <p className='text-lg'>{t('scheduleCall')}: <a href='https://calendly.com/zeyarabani' target='_blank' rel='noreferrer' className='text-primary'>calendly.com/zeyarabani</a></p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value='item-7' className='flex flex-col space-y-2 w-full h-full'>
                    <AccordionTrigger className='hover:no-underline text-left text-2xl font-semibold'>
                        {t('fundsRaised')}
                    </AccordionTrigger>
                    <AccordionContent className='flex w-full h-full'>
                        <ul>
                            <li className='text-lg'>{t('icp')}: <span className='text-primary'>{t('icpAmount')}</span></li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </MaxWidthWrapper>
    )
}
