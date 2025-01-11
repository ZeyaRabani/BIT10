/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useState } from 'react'
import { ExactType, PreRes, swapApi, SwapReq } from './utils/swapApi'
import { useUnisat } from './provider/UnisatProvider'

type ConfirmSwapProps = {
    showConfirm: boolean,
    setShowConfirm: (showConfirm: boolean) => void
    tickIn: string,
    tickOut: string,
    amountIn: string,
    amountOut: string,
    slippage: string,
    address: string,
}

export function ConfirmSwap({
    showConfirm, setShowConfirm,
    // tickIn, tickOut, amountIn, amountOut, slippage, address, onSuccess
    tickIn, tickOut, amountIn, amountOut, slippage, address
}: ConfirmSwapProps) {

    const { signMessage } = useUnisat()
    const [swapReqParams, setSwapReqParams] = useState<SwapReq>();
    const [preSwap, setPreSwap] = useState<PreRes>()

    useEffect(() => {
        if (showConfirm) {
            const ts = Math.floor(Date.now() / 1000);
            const params: SwapReq = {
                address,
                tickIn,
                tickOut,
                amountIn,
                amountOut,
                slippage,
                exactType: ExactType.exactIn,
                ts,
                feeTick: 'test_sats',
                payType: 'tick',
            }
            swapApi.preSwap(params).then(res => {
                setSwapReqParams(params);
                setPreSwap(res)
            }).catch((e) => {
                console.log('Preswap error:', e)
            })
        } else {
            setSwapReqParams(undefined);
            setPreSwap(undefined)
        }
    }, [address, amountIn, amountOut, showConfirm, slippage, tickIn, tickOut]);


    async function swap() {
        if (!preSwap || !swapReqParams) return;
        try {
            const { signMsgs } = preSwap;

            //sign message
            let sigs = [];
            for (let i = 0; i < signMsgs.length; i += 1) {
                const signMsg = signMsgs[i];

                // @ts-ignore
                const sig = await signMessage(signMsg);
                sigs.push(sig);
            }

            const params = {
                ...swapReqParams,
                sigs,
                feeAmount: preSwap.feeAmount,
                feeTickPrice: preSwap.feeTickPrice,
            }

            await swapApi.swap(params);
            console.log('Doing Swap');

            setShowConfirm(false);
        } catch (e: any) {
            console.log(e)
        }
    }

    return (
        <div>
            <button onClick={swap}>swap</button>
        </div>
    )
}