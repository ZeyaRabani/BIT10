import { env } from '@/env';
import { Connection } from '@solana/web3.js';
import { Actor, HttpAgent } from '@dfinity/agent';
import { ICP_HOST } from './solana.constants';
import { type IDL } from '@dfinity/candid';

export const getCustomConnection = (): Connection => {
    const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
    });
};

const icpAgent = await HttpAgent.create({ host: ICP_HOST });
export const createICPActor = (idlFactory: IDL.InterfaceFactory, canisterId: string) => Actor.createActor(idlFactory, { agent: icpAgent, canisterId: canisterId });
