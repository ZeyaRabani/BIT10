import * as icp from './icp';
import * as base from './evm/base';
import * as solana from './solana';
import * as bsc from './evm/bsc';

export const CHAIN_REGISTRY = { icp, solana, base, bsc } as const;
