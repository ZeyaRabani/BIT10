import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { Actor, HttpAgent } from '@dfinity/agent';
import { ICP_HOST } from './bsc.constants';
import { type IDL } from '@dfinity/candid';

export const bscClient = createPublicClient({
    chain: bsc,
    transport: http(),
});

const icpAgent = await HttpAgent.create({ host: ICP_HOST });
export const createICPActor = (idlFactory: IDL.InterfaceFactory, canisterId: string) => Actor.createActor(idlFactory, { agent: icpAgent, canisterId: canisterId });
