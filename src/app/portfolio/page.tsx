"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import InformationCard from '@/components/InformationCard'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import Client from "@walletconnect/sign-client"
import { loadFromLocalStorage } from "@/lib/sendBTC"
import Portfolio from '@/components/portfolio/Portfolio'

export default function Page() {
  const [session, setSession] = useState(undefined);
  const [client, setClient] = useState(undefined);
  const [chain, setChain] = useState(undefined);

  const { address, isConnecting } = useAccount();
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  const WALL_CONNECT_API = process.env.NEXT_PUBLIC_PROJECT_ID

  useEffect(() => {
    const f = async () => {
        const c = await Client.init({
            logger: "debug",
            relayUrl: "wss://relay.walletconnect.com",
            projectId: WALL_CONNECT_API,
            metadata: {
                name: "BIT10",
                description: "Empowering Your Portfolio with the Future of Finance",
                url: "https://bit10.vercel.app",
                icons: ["https://avatars.githubusercontent.com/u/37784886"],
            },
        });

        // @ts-ignore
        setClient(c);
    };

    if (client === undefined) {
        f();
    }
    if (loadFromLocalStorage("session")) {
        setSession(loadFromLocalStorage("session"));
    }
    if (loadFromLocalStorage("chain")) {
        setChain(loadFromLocalStorage("chain"));
    }
}, [client]);

  return (
    <div>
      {/* {session ? ( */}
      {/* Uncomment the code below */}
        {/* <Portfolio /> */}
      {/* ) : (
        <Suspense fallback={<>Loading...</>}>
          <div className='grid place-items-center'>
            <Button className='text-white px-6' onClick={() => open()}>Connect Wallet</Button>
          </div>
          <InformationCard message='Connect your wallet to view your portfolio' />
        </Suspense>
      )} */}
    </div>
  )
}
