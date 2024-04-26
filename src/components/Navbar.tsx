"use client"

import React, { useState, useEffect } from 'react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import Client from '@walletconnect/sign-client'
import QRCodeModal from "@walletconnect/qrcode-modal"
import { useAccount, useDisconnect } from 'wagmi'
import Link from 'next/link'
import { ModeToggle } from './ModeToggle'
import ResponsiveNavbar from './ResponsiveNavbar'
import { useToast } from './ui/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from './ui/button'
import { LogOut, User } from 'lucide-react'
import { addUserToWaitlist } from '@/lib/supabaseRequests'

interface NavLinkType {
    href: string;
    text: string;
}

const profileLinkData: NavLinkType[] = [
    { href: '/dashboard', text: 'Dashboard' },
    { href: '/portfolio', text: 'Portfolio' }
]

export default function Navbar() {
    const [client, setClient] = useState(undefined);
    const [chain, setChain] = useState(undefined);
    const [session, setSession] = useState(undefined);

    const { address, isConnecting } = useAccount();
    const { open } = useWeb3Modal();
    const { disconnect } = useDisconnect();

    const { toast } = useToast();

    const wallet_api = process.env.NEXT_PUBLIC_PROJECT_ID;

    const chains = [
        // "stacks:1",
        // "stacks:2147483648",
        // "bip122:000000000019d6689c085ae165831e93",
        // "bip122:000000000933ea01ad0ee984209779ba",
    ];

    useEffect(() => {
        const f = async () => {
            const c = await Client.init({
                logger: 'debug',
                relayUrl: 'wss://relay.walletconnect.com',
                projectId: wallet_api,
                metadata: {
                    name: "Bit10",
                    description: "Awesome application",
                    url: "https://your_app_url.com/",
                    icons: ["https://avatars.githubusercontent.com/u/37784886"],
                },
            });

            // @ts-ignore
            setClient(c);
        }

        if (client === undefined) {
            f();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client]);

    useEffect(() => {
        const addUserToWaitlistAsync = async () => {
            if (address) {
                try {
                    await addUserToWaitlist({
                        address: address,
                    });
                } catch (error) {
                    // console.error('Error adding user to waitlist:', error);
                }
            }
        };

        addUserToWaitlistAsync();
    }, [address]);

    // @ts-ignore
    const handleConnect = async (chain: any) => {
        setChain(undefined);
        if (chain.includes("stacks")) {
            // @ts-ignore
            const { uri, approval } = await client.connect({
                pairingTopic: undefined,
                requiredNamespaces: {
                    stacks: {
                        methods: [
                            "stacks_signMessage",
                            "stacks_stxTransfer",
                            "stacks_contractCall",
                            "stacks_contractDeploy",
                        ],
                        chains: [chain],
                        events: [],
                    },
                },
            });

            if (uri) {
                QRCodeModal.open(uri, () => {
                    console.log("QR Code Modal closed");
                });
            }

            const sessn = await approval();
            setSession(sessn);
            setChain(chain);
            // @ts-ignore
            saveToLocalStorage("session", sessn);
            // @ts-ignore
            saveToLocalStorage("chain", chain);
            QRCodeModal.close();
        } else {
            // @ts-ignore
            const { uri, approval } = await client.connect({
                pairingTopic: undefined,
                requiredNamespaces: {
                    bip122: {
                        methods: ["bitcoin_btcTransfer"],
                        chains: [chain],
                        events: [],
                    },
                },
            });

            if (uri) {
                QRCodeModal.open(uri, () => {
                    console.log("QR Code Modal closed");
                });
            }

            const sessn = await approval();
            setSession(sessn);
            setChain(chain);
            // @ts-ignore
            saveToLocalStorage("session", sessn);
            // @ts-ignore
            saveToLocalStorage("chain", chain);
            QRCodeModal.close();
            console.log("Session", sessn);
        }
    };

    const disconnectWallet = () => {
        try {
            disconnect();
            toast({
                title: 'Wallet Disconnected Successfully!',
            })
        } catch (error) {
            toast({
                variant: 'destructive',
                title: `${error}`,
            })
        }
    };

    const renderLinksProfile = (links: any) => {
        return links.map((link: any) => (
            <Link key={link.href} href={link.href} passHref>
                <div className={`pb-[0.4rem] pr-1 hover:text-primary text-[0.95rem] ${link.icon ? 'flex flex-row justify-between items-center' : ''}`}>
                    {link.text}
                </div>
            </Link>
        ));
    };

    return (
        <div className='backdrop-blur-xl fixed z-50 w-full'>
            <nav className='flex items-center py-2 flex-wrap px-2.5 md:px-20 tracking-wider justify-between'>
                <Link href='/' passHref>
                    <div className='inline-flex items-center text-4xl md:text-5xl cursor-pointer font-base'>
                        BIT10
                    </div>
                </Link>

                <div className='hidden top-navbar w-full lg:inline-flex lg:flex-grow lg:w-auto' >
                    <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start flex flex-col lg:h-auto space-x-2' >

                        <Link href='/' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Home</span>
                        </Link>

                        {/* <Link href='/dashboard' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Dashboard</span>
                        </Link>

                        <Link href='/portfolio' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Portfolio</span>
                        </Link> */}

                        <Link href='/regulatory-compliance' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Regulatory Compliance</span>
                        </Link>

                        <Link href='/sign-up' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Sign Up for Early User</span>
                        </Link>

                        <Link href='/contact' passHref>
                            <span className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded items-center justify-center hover:bg-primary hover:text-white cursor-pointer'>Contact Us</span>
                        </Link>

                        {/* {session ? ( */}
                        {address ? (
                            <>
                                <Popover>
                                    <PopoverTrigger>
                                        <User className='cursor-pointer hover:text-primary' />
                                    </PopoverTrigger>
                                    <PopoverContent align='end' className='max-w-[12rem] mt-2 hidden lg:block'>
                                        {renderLinksProfile(profileLinkData)}
                                        <div className='flex flex-row justify-between items-center text-destructive cursor-pointer' onClick={() => disconnectWallet()}>
                                            Disconnect Wallet
                                            <div>
                                                <LogOut size={16} />
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </>
                        ) : (
                            <>
                                {/* <Button className='text-white px-6' onClick={async () => await handleConnect('bip122:000000000933ea01ad0ee984209779ba')}>Connect Wallet</Button> */}
                                <Button className='text-white px-6' onClick={() => open()}>Connect Wallet</Button>
                                {/* {
                                    !session && (
                                        <div className="box">
                                            <h3>Select chain:</h3>
                                            {chains.map((c, idx) => {
                                                return (<div key={`chain-${idx}`}>{c} <button disabled={!client} onClick={async () => await handleConnect(c)}>connect</button></div>);
                                            })}
                                        </div>
                                    )
                                } */}
                            </>
                        )}

                    </div>

                </div>


                <div className='flex space-x-2 justify-between items-center ml-2'>
                    <ModeToggle />
                    <ResponsiveNavbar />
                </div>

            </nav>
        </div>
    )
}
