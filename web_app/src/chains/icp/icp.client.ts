import { Actor, HttpAgent } from '@dfinity/agent';
import { ICP_HOST } from './icp.constants';
import { type IDL } from '@dfinity/candid';

const icpAgent = await HttpAgent.create({ host: ICP_HOST });
export const createICPActor = (idlFactory: IDL.InterfaceFactory, canisterId: string) => Actor.createActor(idlFactory, { agent: icpAgent, canisterId: canisterId });

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const createPlugActor = async (idlFactory: IDL.InterfaceFactory, canisterId: string) => { return await window.ic.plug.createActor({ canisterId: canisterId, interfaceFactory: idlFactory }) };
