/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { AllAddressBalanceRes, ExactType, swapApi } from './utils/swapApi'
import { ConfirmSwap } from './ConfirmSwap'
import { useUnisat } from './provider/UnisatProvider'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const tickIn = 'test_sats';
const tickOut = 'test_ordi';
const slippage = '0.005'; // 0.5%
const amountIn = '1256.55';

export default function Swap() {
    const { address, connect } = useUnisat();
    const [swapBalanceMap, setSwapBalanceMap] = useState<AllAddressBalanceRes>({});
    const [amountOut, setAmountOut] = React.useState('');

    const [showConfirm, setShowConfirm] = React.useState(false);

    useEffect(() => {

        if (!address) return;
        if (!amountIn) {
            setAmountOut('');
            return;
        }
        // 500ms delay
        const timer = setTimeout(() => {
            // quote swap out
            swapApi.quoteSwap({
                address,
                tickIn,
                tickOut,
                amount: amountIn,
                exactType: ExactType.exactIn,
            }).then(({ expect }) => {
                setAmountOut(expect);
            }).catch(e => {
                console.log(e)
            })
        }, 500);

        return () => clearTimeout(timer);
    }, [address, amountIn]);

    const refreshBalance = useCallback(() => {
        if (address) {
            swapApi.getAllBalance({ address }).then(setSwapBalanceMap)
        } else {
            setSwapBalanceMap({})
        }
    }, [address]);

    useEffect(() => {
        refreshBalance()
    }, [refreshBalance]);

    return (
        <div className='px-16 py-4 flex flex-col space-y-4'>
            <h1 className='text-2xl text-center'>BRC20 Swap</h1>

            <div className='flex flex-row space-x-2 items-center'>
                <div className='font-semibold'>Address:</div>
                <div>
                    {
                        address ? address : <Button onClick={() => {
                            connect();
                        }}>Connect Unisat Wallet</Button>
                    }
                </div>
            </div>

            <div className='flex flex-col space-y-2'>
                <div className='font-semibold'>Balance</div>
                <div>
                    {tickIn}: {swapBalanceMap[tickIn]?.balance.swap || '0'}
                    {
                        // wait for confirm balance
                        // @ts-ignore
                        (parseFloat(swapBalanceMap[tickIn]?.balance.pendingSwap) || 0) > 0 && <span className='pl-4 font-[#888]'>
                            Wait for confirm balance: (+{swapBalanceMap[tickIn]?.balance.pendingSwap})
                        </span>
                    }
                </div>

                <div>
                    {tickOut}: {swapBalanceMap[tickOut]?.balance.swap || '0'}
                    {
                        // wait for confirm balance
                        // @ts-ignore
                        (parseFloat(swapBalanceMap[tickOut]?.balance.pendingSwap) || 0) > 0 && <span className='pl-4 font-[#888]'>
                            Wait for confirm balance: (+{swapBalanceMap[tickOut]?.balance.pendingSwap})
                        </span>
                    }
                </div>
                <div>
                    <Button onClick={refreshBalance}>Refresh Data</Button>
                </div>
            </div>

            <Accordion type='single' collapsible className='w-full'>
                <AccordionItem value='swap'>
                    <AccordionTrigger className='hover:no-underline'>Swap</AccordionTrigger>
                    <AccordionContent>
                        <div className='py-4'>
                            <div className='flex flex-row space-x-2 py-1'>
                                <div>You Pay:</div>
                                <div>
                                    <input value={amountIn} className='text-white' />
                                </div>
                            </div>
                            <div className='flex flex-row space-x-2 py-1'>
                                <div>You Receive::</div>
                                <div>
                                    <input value={amountOut} disabled className='text-white' />
                                </div>
                            </div>
                            <Button onClick={() => {
                                if (amountIn && amountOut)
                                    setShowConfirm(true);
                            }}>Swap</Button>
                            {
                                showConfirm && <ConfirmSwap
                                    showConfirm={showConfirm}
                                    setShowConfirm={setShowConfirm}
                                    tickIn={tickIn}
                                    tickOut={tickOut}
                                    amountIn={amountIn}
                                    amountOut={amountOut}
                                    slippage={slippage}
                                    address={address}
                                />
                            }
                        </div>
                    </AccordionContent>
                </AccordionItem>
                {/* <AccordionItem value='deposit'>
                    <AccordionTrigger className='hover:no-underline'>Deposit</AccordionTrigger>
                    <AccordionContent>
                        Yes. It adheres to the WAI-ARIA design pattern.
                    </AccordionContent>
                </AccordionItem> */}
            </Accordion>
        </div>
    )
}