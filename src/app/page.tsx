"use client"

import { useState, useEffect } from "react"
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCw, Settings2, ArrowDown } from 'lucide-react'
import Image from "next/image"

import Client from "@walletconnect/sign-client"
import QRCodeModal from "@walletconnect/qrcode-modal"
import { makeStandardFungiblePostCondition, bufferCVFromString, contractPrincipalCV, falseCV, intCV, listCV, noneCV, responseErrorCV, responseOkCV, someCV, standardPrincipalCV, stringAsciiCV, stringUtf8CV, trueCV, tupleCV, uintCV, PostConditionMode, FungibleConditionCode, createAssetInfo, serializeCV, deserializeCV } from "@stacks/transactions"
import { verifyMessageSignature, verifyMessageSignatureRsv } from "@stacks/encryption"
import { clearLocalStorage, loadFromLocalStorage, saveToLocalStorage } from "@/lib/sendBTC"

const WALL_CONNECT_API = process.env.NEXT_PUBLIC_PROJECT_ID


// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

const ADDRESS = "SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02B";
const structuredData = tupleCV({
    a: intCV(-1),
    b: uintCV(1),
    c: bufferCVFromString("test"),
    d: trueCV(),
    e: someCV(trueCV()),
    f: noneCV(),
    g: standardPrincipalCV(ADDRESS),
    h: contractPrincipalCV(ADDRESS, "test"),
    i: responseOkCV(trueCV()),
    j: responseErrorCV(falseCV()),
    k: listCV([trueCV(), falseCV()]),
    l: tupleCV({
        a: trueCV(),
        b: falseCV(),
    }),
    m: stringAsciiCV("hello world"),
    another: tupleCV({
        a: trueCV(),
        b: falseCV(),
        deep: tupleCV({
            a: trueCV(),
            b: falseCV(),
            c: tupleCV({
                deeper: tupleCV({
                    a: trueCV(),
                    b: falseCV(),
                    c: tupleCV({
                        deeper: tupleCV({
                            a: trueCV(),
                            b: falseCV(),
                            c: tupleCV({
                                deeper: tupleCV({
                                    a: trueCV(),
                                    b: falseCV(),
                                }),
                            }),
                        }),
                    }),
                }),
            }),
        }),
    }),
    n: stringUtf8CV("hello \u{1234}"),
    o: listCV([]),
});

const chains = [
    // "stacks:1",
    // "stacks:2147483648",
    // "bip122:000000000019d6689c085ae165831e93",
    "bip122:000000000933ea01ad0ee984209779ba",
];

export default function Page() {
    const [client, setClient] = useState(undefined);
    const [chain, setChain] = useState(undefined);
    const [session, setSession] = useState(undefined);
    const [result, setResult] = useState(undefined);

    useEffect(() => {
        const f = async () => {
            const c = await Client.init({
                logger: "debug",
                relayUrl: "wss://relay.walletconnect.com",
                projectId: WALL_CONNECT_API,
                metadata: {
                    name: "BIT10",
                    description: "Empowering Your Portfolio with the Future of Finance",
                    url: "bit10.app",
                    icons: ["https://www.bit10.app/logo/logo.png"],
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

    // @ts-ignore
    const handleConnect = async (chain) => {
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
            saveToLocalStorage("session", sessn);
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
            saveToLocalStorage("session", sessn);
            saveToLocalStorage("chain", chain);
            QRCodeModal.close();
        }
    };

    /**
     * send a BTC transaction request with multiple recipients support
     * recipients are passed as an array of objects containing address and amount in sats
     */
    const handleBtcTransfer = async () => {
        try {
            // @ts-ignore
            const address = session.namespaces.bip122.accounts[0].split(":")[2];
            const isMainnet = chain == chains[2];
            // pass the recipients in an array
            const recipients = isMainnet
                ? [
                    {
                        address: "3DP8pe2zJUcBezD35cLyZJGdbDwNYwBNtb",
                        amountSats: "6000",
                    },
                    {
                        address: "3Codr66EYyhkhWy1o2RLmrER7TaaHmtrZe",
                        amountSats: "7000",
                    },
                ]
                : [
                    {
                        address: "2MxGR4RG2HKpQSg9t8K5n2tHMJjidMqfvYw",
                        amountSats: "3955", // 2.67
                    },
                    // {
                    //     address: "2Mx1h4VWiik8JNosa5nu4Gg96iPNQPJBWGa",
                    //     amountSats: "7000",
                    // },
                ];

            // @ts-ignore
            const result = await client.request({
                chainId: chain,
                // @ts-ignore
                topic: session.topic,
                request: {
                    method: "bitcoin_btcTransfer",
                    params: {
                        pubkey: address, //XXX: This one is required
                        recipients,
                    },
                },
            });

            setResult({
                // @ts-ignore
                method: "bitcoin_btcTransfer",
                address,
                valid: true,
                result: result,
            });
        } catch (e) {
            // @ts-ignore
            // throw new Error(e);
        }
    };

    const disconnect = async () => {
        clearLocalStorage();
        // @ts-ignore
        await client.pairing.delete(session.topic, {
            code: 100,
            message: "deleting",
        });
        setSession(undefined);
        setChain(undefined);
    };

    // @ts-ignore
    const connect = async (c) => {
        try {
            await handleConnect(c);
        } catch (error) {
            // @ts-ignore
            if (error.code == 5002) {
                // Code for user rejected methods.
                QRCodeModal.close();
            }
        }
    };

    return (
        <MaxWidthWrapper>
            <div className='flex items-center justify-center space-x-2 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Swap</h1>
            </div>

            <div className='flex flex-col items-center justify-center space-y-4'>
                <div>
                    {!session && (
                        <div className="box">
                            {chains.map((c, idx) => {
                                return (
                                    <div key={`chain-${idx}`}>
                                        <Button
                                            disabled={!client}
                                            onClick={async () => {
                                                connect(c);
                                            }}
                                        >
                                            Connect wallet
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* @ts-ignore */}
                    {/* {session && session.namespaces.bip122 && (
                        <div className="box">
                            <div>
                                <Button variant={'destructive'} onClick={async () => disconnect()}>Disconnect Wallet</Button>
                            </div>
                        </div>
                    )} */}

                    {/* {result && (
                        <div className="box code">
                            Transaction Successfull! View <a href={`https://mempool.space/testnet/tx/${result}`} target="_blank" className="text-primary underline">transaction details</a>.
                            <pre>{JSON.stringify(result, "  ", "  ")}</pre>
                        </div>
                    )} */}

                </div>

                <div className='pb-4'>
                    <Card className="w-[300px] md:w-[450px] border-white">
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div className='flex flex-row space-x-1'>
                                    <RotateCw size={16} />
                                    <Settings2 size={16} />
                                </div>
                            </CardTitle>
                            <CardDescription>Bit10 exchange</CardDescription>
                            <div className="text-center">
                                Current Bit10.DeFi token price is $ 2.6681146
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className='rounded-lg border-2 py-2 px-6 border-white'>
                                <p>Pay with</p>
                                <div className="flex flex-col md:flex-row items-center justify-between py-2 space-y-2 space-x-0 md:space-y-0 md:space-x-2">
                                    <div>
                                        <Input type="number" defaultValue={0.000039} placeholder="Amount in BTC" className="w-[80%] text-xl border-white" />
                                    </div>
                                    <div className="relative">
                                        <div className="py-2 pr-[5.75rem] pl-4 border-2 border-white rounded-l-full mr-4 z-10">
                                            BTC
                                        </div>
                                        <div className="absolute -top-1.5 right-0">
                                            <Image src="/assets/swap/btc.svg" alt="btc" width={55} height={55} className="z-20" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row items-center justify-between py-2 space-y-2 space-x-0 md:space-y-0 md:space-x-2 text-sm">
                                    <div className="">$ 2.67</div>
                                    <div className="mr-1">Balance: 0.00045128</div>
                                </div>
                            </div>
                            <div className='rounded-lg border-2 py-2 px-6 border-white mt-4'>
                                <p>Receive</p>
                                <div className="flex flex-row items-center justify-between py-2">
                                    <div className="text-3xl">1</div>
                                    <div className="relative">
                                        <div className="py-2 pr-12 pl-4 border-2 border-white rounded-l-full mr-4 z-10">
                                            Bit10.DeFi
                                        </div>
                                        <div className="absolute -top-1.5 right-0">
                                            <Image src="/assets/swap/bit10.svg" alt="bit10" width={55} height={55} className="z-20" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row items-center justify-between py-2 text-sm">
                                    <div className="">$ 2.67</div>
                                    <div className="mr-1">Balance: 1</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-row space-x-2 w-full items-center">
                            <Button
                                className='w-full'
                                onClick={async () => {
                                    // @ts-ignore
                                    if (session && session.namespaces && session.namespaces.bip122) {
                                        await handleBtcTransfer();
                                    } else {
                                        // console.error('Session or bip122 namespace not available');
                                    }
                                }}
                                // @ts-ignore
                                disabled={!session || !session.namespaces || !session.namespaces.bip122}
                            >
                                Trade
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                {result && (
                    <div className="text-center text-green-500">
                        {/* Transaction Successfull! View <a href={`https://mempool.space/testnet/tx/${result}`} target="_blank" className="underline">transaction details</a>. */}
                        Transaction Successfull! View <a href={`https://mempool.space/testnet/address/2N47aLXezNX2wsKEHQAwpSiGRrVrMgrfo2W`} target="_blank" className="underline">transaction details</a>.
                    </div>
                )}
            </div>
        </MaxWidthWrapper>
    )
}
