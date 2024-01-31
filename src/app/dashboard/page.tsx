"use client"

import { useState, useEffect } from "react"
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCw, Settings2, ArrowDown } from 'lucide-react'


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
                        amountSats: "6180",
                    },
                    // {
                    //   address: "2Mx1h4VWiik8JNosa5nu4Gg96iPNQPJBWGa",
                    //   amountSats: "7000",
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
            throw new Error(e);
        }
    };

    const handleSignMessage = async () => {
        // @ts-ignore
        const address = session.namespaces.stacks.accounts[0].split(":")[2];
        try {
            const message = "loremipsum";
            // @ts-ignore
            const result = await client.request({
                chainId: chain,
                // @ts-ignore
                topic: session.topic,
                request: {
                    method: "stacks_signMessage",
                    params: {
                        pubkey: address, //XXX: This one is required
                        message,
                    },
                },
            });

            const publicKey = result.publicKey;
            const signature = result.signature;
            const valid = verifyMessageSignatureRsv({
                message,
                publicKey,
                signature,
            });

            setResult({
                // @ts-ignore
                method: "stacks_signMessage",
                address,
                valid,
                result,
            });
        } catch (error) {
            // @ts-ignore
            throw new Error(error);
        }
    };

    const handleStructuredMessage = async () => {
        // @ts-ignore
        const address = session.namespaces.stacks.accounts[0].split(":")[2];
        const domain = "0c0000000308636861696e2d69640100000000000000000000000000000001046e616d650d00000011414c4558204232302050726f746f636f6c0776657273696f6e0d00000005302e302e31";
        try {
            const structuredMessage = serializeCV(structuredData);
            // @ts-ignore
            const result = await client.request({
                chainId: chain,
                // @ts-ignore
                topic: session.topic,
                request: {
                    method: "stacks_signMessage",
                    params: {
                        pubkey: address, //XXX: This one is required
                        message: structuredMessage,
                        domain
                    },
                },
            });

            setResult({
                // @ts-ignore
                method: "stacks_signMessage",
                address,
                result,
            });
        } catch (error) {
            // @ts-ignore
            throw new Error(error);
        }
    };

    const handleContractDeploy = async () => {
        // @ts-ignore
        const address = session.namespaces.stacks.accounts[0].split(":")[2];

        try {
            // @ts-ignore
            const result = await client.request({
                chainId: chain,
                // @ts-ignore
                topic: session.topic,
                request: {
                    method: "stacks_contractDeploy",
                    params: {
                        pubkey: address, //XXX: This one is required
                        contractName: "my_contract_name_3", //XXX: CHange the contract name!
                        codeBody: `
;; hello-world
;; <add a description here>
;; constants
;;
;; data maps and vars
;;
;; private functions
;;
(define-read-only (echo-number (val int)) (ok val))
;; public functions
;;
(define-public (say-hi) (ok "hello world"))
                    `,
                        postConditionMode: PostConditionMode.Allow,
                    },
                },
            });

            setResult({
                // @ts-ignore
                method: "stacks_contractDeploy",
                address,
                valid: true,
                result: result,
            });
        } catch (error) {
            // @ts-ignore
            throw new Error(error);
        }
    };

    const handleTransferSTX = async () => {
        // @ts-ignore
        const address = session.namespaces.stacks.accounts[0].split(":")[2];
        const isMainnet = chain == chains[0];
        const recip = isMainnet
            ? "SP34AVN2XCNQKYKR4KB3M1NGD6ECMHFDSWM42517E"
            : "ST34AVN2XCNQKYKR4KB3M1NGD6ECMHFDSWN439CGE";
        try {
            // @ts-ignore
            const result = await client.request({
                chainId: chain,
                // @ts-ignore
                topic: session.topic,
                request: {
                    method: "stacks_stxTransfer",
                    params: {
                        pubkey: address, //XXX: This one is required
                        recipient: recip,
                        amount: BigInt(1000),
                        memo: "example transfer",
                    },
                },
            });

            setResult({
                // @ts-ignore
                method: "stacks_stxTransfer",
                address,
                valid: true,
                result,
            });
        } catch (error) {
            // @ts-ignore
            throw new Error(error);
        }
    };

    const handleContractCall = async () => {
        // @ts-ignore
        const address = session.namespaces.stacks.accounts[0].split(":")[2];

        const isMainnet = chain == chains[0];
        const contract = isMainnet
            ? "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2"
            : "ST24YYAWQ4DK4RKCKK1RP4PX0X5SCSXTWQXFGVCVY.fake-miamicoin-token-V2";
        const [contractAddress, contractName] = contract.split(".");
        const tokenName = "miamicoin"; //XXX: It's hidden in the contract's code but it's not hard to find.

        const orderAmount = 13 * 10 ** 6; //13 miamicoin
        const addressTo = isMainnet
            ? "SP34AVN2XCNQKYKR4KB3M1NGD6ECMHFDSWM42517E"
            : "ST34AVN2XCNQKYKR4KB3M1NGD6ECMHFDSWN439CGE";

        // Define post conditions
        const postConditions = [];
        postConditions.push(
            makeStandardFungiblePostCondition(
                address,
                FungibleConditionCode.Equal,
                orderAmount.toString(),
                createAssetInfo(contractAddress, contractName, tokenName)
            )
        );
        const sponsored = false;

        try {
            // @ts-ignore
            const result = await client.request({
                chainId: chain,
                // @ts-ignore
                topic: session.topic,
                request: {
                    method: "stacks_contractCall",
                    params: {
                        pubkey: address, //XXX: This one is required
                        postConditions,
                        contractAddress: contractAddress,
                        contractName: contractName,
                        functionName: "transfer",
                        functionArgs: [
                            uintCV(orderAmount.toString()),
                            standardPrincipalCV(address),
                            standardPrincipalCV(addressTo),
                            noneCV(),
                        ],
                        postConditionMode: PostConditionMode.Deny,
                        version: "1",
                        sponsored,
                    },
                },
            });

            setResult({
                // @ts-ignore
                method: "stacks_contractCall",
                address,
                valid: true,
                result,
            });
        } catch (error) {
            // @ts-ignore
            throw new Error(error);
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
            <div className='flex items-center justify-center space-x-2 py-4 max-w-[100vw]'>
                <h1 className='text-2xl font-semibold leading-tight text-center tracking-wider lg:text-4xl md:whitespace-nowrap'>Dashboard</h1>
            </div>

            <div className='flex flex-col items-center justify-center space-y-4'>
                <div className='text-xl'>Decentralized exchange</div>

                <div>
                    {!session && (
                        <div className="box">
                            {chains.map((c, idx) => {
                                return (
                                    <div key={`chain-${idx}`}>
                                        {/* {c}{" "} */}
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
                    {session && session.namespaces.bip122 && (
                        <div className="box">
                            {/* <h3>Wallet connected!</h3>
                            <div>
                                <button onClick={async () => await handleBtcTransfer()}>
                                    Transfer btc
                                </button>
                            </div> */}
                            <div>
                                <Button variant={'destructive'} onClick={async () => disconnect()}>Disconnect Wallet</Button>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className="box code">
                            {/* @ts-ignore */}
                            <pre>{JSON.stringify(result, "  ", "  ")}</pre>
                        </div>
                    )}

                </div>

                <div className='pb-4'>
                    <Card className="w-[300px] md:w-[380px]">
                        <CardHeader>
                            <CardTitle className='flex flex-row items-center justify-between'>
                                <div>Swap</div>
                                <div className='flex flex-row space-x-1'>
                                    <RotateCw size={16} />
                                    <Settings2 size={16} />
                                </div>
                            </CardTitle>
                            <CardDescription>Decentralized exchange demo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='rounded p-2 bg-gray-200 dark:bg-gray-700'>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>From</div>
                                    <div>Balance BTC 5.5</div>
                                </div>
                                <div className='flex flex-row items-center justify-between py-2'>
                                    <div className="w-[160px]">
                                        <Select>
                                            <SelectTrigger id="framework">
                                                <SelectValue placeholder="Select Token" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="BTC">BTC</SelectItem>
                                                <SelectItem value="STX">STX</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        1
                                    </div>
                                </div>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>1 BIT10 token</div>
                                    <div>~ 2,310.78 $</div>
                                </div>
                            </div>
                            <div className='flex items-center justify-center -mt-2'>
                                <div className='p-2 rounded-full bg-accent w-8'><ArrowDown size={16} /></div>
                            </div>
                            <div className='border-2 rounded p-2 -mt-2'>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>To(estimated)</div>
                                    <div>Balance 0</div>
                                </div>
                                <div className='flex flex-row items-center justify-between py-2'>
                                    <div className="w-[160px]">
                                        <Select>
                                            <SelectTrigger id="framework">
                                                <SelectValue placeholder="Select Token" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem value="BNB">BIT10</SelectItem>
                                                <SelectItem value="USDT">BIT10-Gold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        1
                                    </div>
                                </div>
                                <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                                    <div>Tx cost ~0.0015</div>
                                    <div>~ 2,310.7785 $</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-row space-x-2 w-full items-center">
                            <Button className='w-full' variant="outline">Cancel</Button>
                            <Button
                                className='w-full'
                                onClick={async () => {
                                    // @ts-ignore
                                    if (session && session.namespaces && session.namespaces.bip122) {
                                        await handleBtcTransfer();
                                    } else {
                                        console.error('Session or bip122 namespace not available');
                                    }
                                }}
                                // @ts-ignore
                                disabled={!session || !session.namespaces || !session.namespaces.bip122}
                            >
                                Swap
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}
