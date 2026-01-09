import { Actor, HttpAgent } from '@dfinity/agent';
import { ICP_HOST } from './base.constants';
import { type IDL } from '@dfinity/candid';

const icpAgent = await HttpAgent.create({ host: ICP_HOST });
export const createICPActor = (idlFactory: IDL.InterfaceFactory, canisterId: string) => Actor.createActor(idlFactory, { agent: icpAgent, canisterId: canisterId });
