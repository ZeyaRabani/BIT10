import qs from "qs";
import useSWR from "swr";
import { ConnectKitButton } from "connectkit";
import { useState, ChangeEvent } from "react";
import { formatUnits, parseUnits } from "ethers";
import Image from "next/image";
import {
    erc20ABI,
    useContractRead,
    usePrepareContractWrite,
    useContractWrite,
    useWaitForTransaction,
    useBalance,
    type Address,
} from "wagmi";
import {
    POLYGON_TOKENS,
    POLYGON_TOKENS_BY_SYMBOL,
    POLYGON_TOKENS_BY_ADDRESS,
    MAX_ALLOWANCE,
    exchangeProxy,
} from "../../lib/constants";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCw, Settings2, ArrowDown } from 'lucide-react'


interface PriceRequestParams {
    sellToken: string;
    buyToken: string;
    buyAmount?: string;
    sellAmount?: string;
    takerAddress?: string;
}

const AFFILIATE_FEE = 0.01;
const FEE_RECIPIENT = "0x270Bca1889585eF36e546B028D5A9165548519D9";

export const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
    const { sellAmount, buyAmount } = params;
    if (!sellAmount && !buyAmount) return;
    const query = qs.stringify(params);

    return fetch(`${endpoint}?${query}`).then((res) => res.json());
};

export default function PriceView({
    price,
    setPrice,
    setFinalize,
    takerAddress,
}: {
    price: any;
    setPrice: (price: any) => void;
    setFinalize: (finalize: boolean) => void;
    takerAddress: Address | undefined;
}) {
    // fetch price here
    const [sellAmount, setSellAmount] = useState("");
    const [buyAmount, setBuyAmount] = useState("");
    const [tradeDirection, setTradeDirection] = useState("sell");
    const [sellToken, setSellToken] = useState("wmatic");
    const [buyToken, setBuyToken] = useState("dai");

    const handleSellTokenChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSellToken(e.target.value);
    };

    function handleBuyTokenChange(e: ChangeEvent<HTMLSelectElement>) {
        setBuyToken(e.target.value);
    }

    const sellTokenDecimals = POLYGON_TOKENS_BY_SYMBOL[sellToken].decimals;

    console.log(sellAmount, sellTokenDecimals, "<-");
    const parsedSellAmount =
        sellAmount && tradeDirection === "sell"
            ? parseUnits(sellAmount, sellTokenDecimals).toString()
            : undefined;

    const buyTokenDecimals = POLYGON_TOKENS_BY_SYMBOL[buyToken].decimals;

    const parsedBuyAmount =
        buyAmount && tradeDirection === "buy"
            ? parseUnits(buyAmount, buyTokenDecimals).toString()
            : undefined;

    const { isLoading: isLoadingPrice } = useSWR(
        [
            "/api/price",
            {
                sellToken: POLYGON_TOKENS_BY_SYMBOL[sellToken].address,
                buyToken: POLYGON_TOKENS_BY_SYMBOL[buyToken].address,
                sellAmount: parsedSellAmount,
                buyAmount: parsedBuyAmount,
                takerAddress,
                feeRecipient: FEE_RECIPIENT,
                buyTokenPercentageFee: AFFILIATE_FEE,
            },
        ],
        fetcher,
        {
            onSuccess: (data) => {
                setPrice(data);
                if (tradeDirection === "sell") {
                    console.log(formatUnits(data.buyAmount, buyTokenDecimals), data);
                    setBuyAmount(formatUnits(data.buyAmount, buyTokenDecimals));
                } else {
                    setSellAmount(formatUnits(data.sellAmount, sellTokenDecimals));
                }
            },
        }
    );

    const { data, isError, isLoading } = useBalance({
        address: takerAddress,
        token: POLYGON_TOKENS_BY_SYMBOL[sellToken].address,
    });

    console.log(sellAmount);

    const disabled =
        data && sellAmount
            ? parseUnits(sellAmount, sellTokenDecimals) > data.value
            : true;

    console.log(data, isError, isLoading);

    return (
        <form>
            <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-md mb-3">
                <section className="flex mb-6 mt-4 items-start justify-center">
                    <label htmlFor="buy-token" className="sr-only"></label>
                    <Image
                        alt={buyToken}
                        className="h-9 w-9 mr-2 rounded-md"
                        src={POLYGON_TOKENS_BY_SYMBOL[buyToken].logoURI}
                        width={50} height={50}
                    />
                    <select
                        name="buy-token-select"
                        id="buy-token-select"
                        value={buyToken}
                        className="mr-2 w-50 sm:w-full h-9 rounded-md"
                        onChange={(e) => handleBuyTokenChange(e)}
                    >
                        {POLYGON_TOKENS.map((token) => {
                            return (
                                <option key={token.address} value={token.symbol.toLowerCase()}>
                                    {token.symbol}
                                </option>
                            );
                        })}
                    </select>
                    <label htmlFor="buy-amount" className="sr-only"></label>
                    <input
                        id="buy-amount"
                        value={buyAmount}
                        className="h-9 rounded-md bg-white cursor-not-allowed"
                        style={{ border: "1px solid black" }}
                        disabled
                        onChange={(e) => {
                            setTradeDirection("buy");
                            setBuyAmount(e.target.value);
                        }}
                    />
                </section>
                <div className="text-slate-400">
                    {price && price.grossBuyAmount
                        ? "Affiliate Platform Fee: " +
                        Number(
                            formatUnits(
                                BigInt(price.grossBuyAmount),
                                POLYGON_TOKENS_BY_SYMBOL[buyToken].decimals
                            )
                        ) *
                        AFFILIATE_FEE +
                        " " +
                        POLYGON_TOKENS_BY_SYMBOL[buyToken].symbol
                        : null}
                </div>
            </div>

            <Card className="w-[300px] md:w-[480px] py-2 mb-4">
                <CardHeader>
                    <CardTitle className='flex flex-row items-center justify-between'>
                        <div>Buy BIT10</div>
                        <div className='flex flex-row space-x-1'>
                            <RotateCw size={16} />
                            <Settings2 size={16} />
                        </div>
                    </CardTitle>
                    <CardDescription>Decentralized exchange demo</CardDescription>
                </CardHeader>
                <CardContent>
                    <section className='rounded p-2 bg-gray-200 dark:bg-gray-700'>
                        <div className='flex flex-row items-center justify-between text-[0.8rem]'>
                            <div>From</div>
                            <div>Balance BTC 5.5</div>
                        </div>
                        <div className='flex flex-row items-center justify-between space-x-3 py-2'>
                            <Image
                                alt={sellToken}
                                className="h-9 w-9 mr-2 rounded-md"
                                src={POLYGON_TOKENS_BY_SYMBOL[sellToken].logoURI}
                                width={50} height={50}
                            />
                            {/* @ts-ignore */}
                                <Select onValueChange={handleSellTokenChange} value={sellToken}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {POLYGON_TOKENS.map((token) => {
                                            return (
                                                <SelectItem
                                                    key={token.address}
                                                    value={token.symbol.toLowerCase()}
                                                >
                                                    {token.symbol}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            <Input
                                id="sell-amount"
                                value={sellAmount}
                                className="h-9 rounded-md"
                                style={{ border: "1px solid black" }}
                                onChange={(e) => {
                                    setTradeDirection("sell");
                                    setSellAmount(e.target.value);
                                }}
                            />
                        </div>
                    </section>

                    <section className="mt-4 flex items-start justify-center">
                        <label htmlFor="sell-select" className="sr-only"></label>
                        <Image
                            alt={sellToken}
                            className="h-9 w-9 mr-2 rounded-md"
                            src={POLYGON_TOKENS_BY_SYMBOL[sellToken].logoURI}
                            width={50} height={50}
                        />
                        <div className="h-14 sm:w-full sm:mr-2">
                            <select
                                value={sellToken}
                                name="sell-token-select"
                                id="sell-token-select"
                                className="mr-2 w-50 sm:w-full h-9 rounded-md"
                                onChange={handleSellTokenChange}
                            >
                                {POLYGON_TOKENS.map((token) => {
                                    return (
                                        <option
                                            key={token.address}
                                            value={token.symbol.toLowerCase()}
                                        >
                                            {token.symbol}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <label htmlFor="sell-amount" className="sr-only"></label>
                        <input
                            id="sell-amount"
                            value={sellAmount}
                            className="h-9 rounded-md"
                            style={{ border: "1px solid black" }}
                            onChange={(e) => {
                                setTradeDirection("sell");
                                setSellAmount(e.target.value);
                            }}
                        />
                    </section>
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
                                        <SelectItem value="BNB">1 BNB</SelectItem>
                                        <SelectItem value="USDT">1 USDT</SelectItem>
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
                    <Button className='w-full'>Swap</Button>
                </CardFooter>
            </Card>

            {takerAddress ? (
                <ApproveOrReviewButton
                    sellTokenAddress={POLYGON_TOKENS_BY_SYMBOL[sellToken].address}
                    takerAddress={takerAddress}
                    onClick={() => {
                        setFinalize(true);
                    }}
                    disabled={disabled}
                />
            ) : (
                <ConnectKitButton.Custom>
                    {({
                        isConnected,
                        isConnecting,
                        show,
                        hide,
                        address,
                        ensName,
                        chain,
                    }) => {
                        return (
                            <button
                                onClick={show}
                                type="button"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                            >
                                {isConnected ? address : "Connect Wallet"}
                            </button>
                        );
                    }}
                </ConnectKitButton.Custom>
            )}

            {/* {isLoadingPrice && (
                <div className="text-center mt-2">Fetching the best price...</div>
            )} */}
        </form>
    );
}

function ApproveOrReviewButton({
    takerAddress,
    onClick,
    sellTokenAddress,
    disabled,
}: {
    takerAddress: Address;
    onClick: () => void;
    sellTokenAddress: Address;
    disabled?: boolean;
}) {
    // 1. Read from erc20, does spender (0x Exchange Proxy) have allowance?
    const { data: allowance, refetch } = useContractRead({
        address: sellTokenAddress,
        abi: erc20ABI,
        functionName: "allowance",
        args: [takerAddress, exchangeProxy],
    });

    // 2. (only if no allowance): write to erc20, approve 0x Exchange Proxy to spend max integer
    const { config } = usePrepareContractWrite({
        address: sellTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [exchangeProxy, MAX_ALLOWANCE],
    });

    const {
        data: writeContractResult,
        writeAsync: approveAsync,
        error,
    } = useContractWrite(config);

    const { isLoading: isApproving } = useWaitForTransaction({
        hash: writeContractResult ? writeContractResult.hash : undefined,
        onSuccess(data) {
            refetch();
        },
    });

    if (error) {
        return <div>Something went wrong: {error.message}</div>;
    }

    if (allowance === BigInt(0) && approveAsync) {
        return (
            <>
                <button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                    onClick={async () => {
                        const writtenValue = await approveAsync();
                    }}
                >
                    {isApproving ? "Approving…" : "Approve"}
                </button>
            </>
        );
    }

    return (
        <Button
            disabled={disabled}
            onClick={onClick}
            className="text-white font-bold w-full disabled:opacity-25"
        >
            {disabled ? "Insufficient Balance" : "Review Trade"}
        </Button>
    );
}