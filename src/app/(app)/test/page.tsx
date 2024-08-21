"use client"

import { useEffect, useState } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from '@dfinity/principal'
import { idlFactory } from "@/lib/bit10_btc.did";

const canisterId = "hbs3g-xyaaa-aaaap-qhmna-cai";
const host = "https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io";

const agent = new HttpAgent({ host });
const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
});

const principalAddress = "q7xwg-4zws5-ucimy-glczv-nmm6f-lwt3b-mrefz-ewr4l-avwcx-7jkfi-aae";

const BalanceChecker = () => {
    const [balance, setBalance] = useState<bigint | null>(null);

    const fetchBalance = async () => {
        const account = {
            owner: Principal.fromText(principalAddress),
            subaccount: [],
        };

        try {
            const balance = await actor.icrc1_balance_of(account);
            setBalance(balance as bigint);
        } catch (error) {
            console.error("Error fetching balance:", error);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    return (
        <div>
            <h1>ICRC1 Balance Checker</h1>
            <p>Principal Address: {principalAddress}</p>
            <p>Balance: {balance !== null ? balance.toString() : "Loading..."}</p>
        </div>
    );
};

export default BalanceChecker;