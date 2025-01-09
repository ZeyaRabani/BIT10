/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { unisatUtils } from '../utils/unisatUtils'

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface UnisatContextType {
    isInstalled: boolean;
    isConnected: boolean;
    address: string;
    connect: () => void;
    signMessage: (msg: string) => Promise<string>;
    signPsbt: (psbt: string) => Promise<string>;
}

const UnisatContext = createContext<UnisatContextType>({
    isInstalled: false,
    isConnected: false,
    address: '',
    connect: () => {
    },
    signMessage: (msg: string) => Promise.resolve(''),
    signPsbt: (psbt: string) => Promise.resolve('')
})


export function useUnisat() {
    const context = useContext(UnisatContext);
    if (!context) {
        throw Error('Feature flag hooks can only be used by children of UnisatProvider.');
    } else {
        return context;
    }
}

export default function UnisatProvider({ children }: {
    children: ReactNode
}) {
    const [isInstalled, setIsInstalled] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [address, setAddress] = useState('')


    useEffect(() => {

        async function init() {
            let install = !!window.unisat;
            setIsInstalled(install);

            // Extra checks
            for (let i = 0; i < 10 && !install; i += 1) {
                await sleep(100 + i * 100);
                install = !!window.unisat;
                if (install) {
                    setIsInstalled(install);
                    break;
                }
            }

            if (install) {
                await unisatUtils.switchChain('FRACTAL_BITCOIN_TESTNET')

                const address = await unisatUtils.getAccounts()
                if (address) {
                    //     connected
                    setIsConnected(true)
                    setAddress(address)

                }
            }
        }

        init().then();

    }, []);

    const connect = useCallback(async () => {
        try {
            await unisatUtils.switchChain('FRACTAL_BITCOIN_TESTNET')

            const address = await unisatUtils.requestAccounts();
            if (address) {
                setIsConnected(true)
                setAddress(address)
            }
        } catch (e) {
            // handleError(e)
            console.log(e)
        }

    }, [])

    const signMessage = useCallback((msg: string) => {
        return unisatUtils.signMessage(msg, 'bip322-simple')
    }, [])

    const signPsbt = useCallback((psbt: string) => {
        return unisatUtils.signPsbt(psbt)
    }, []);

    const value = {
        isInstalled,
        isConnected,
        address,
        connect,
        signMessage,
        signPsbt,
    }

    return <UnisatContext.Provider value={value}>
        {children}
    </UnisatContext.Provider>

}