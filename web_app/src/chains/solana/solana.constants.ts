import { type StaticImageData } from 'next/image';
import USDCImg from '@/assets/tokens/usdc.svg'
import BIT10Img from '@/assets/tokens/bit10.svg';

export const ICP_HOST = 'https://icp-api.io';
export const BIT10_EXCHANGE_CANISTER_ID = '6phs7-6yaaa-aaaap-qpvoq-cai';
export const BIT10_REWARDS_CANISTER_ID = ' 5fll2-liaaa-aaaap-qqlwa-cai';

export const buyPayTokens = [
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', tokenType: 'SPL', gasFee: 0, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] }
]

export const buyReceiveTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'bitPZfP3vC9YKH1F2wfqD6kckPE95hq8QQEAKpACVw9', tokenType: 'SPL', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'bitPZfP3vC9YKH1F2wfqD6kckPE95hq8QQEAKpACVw9', tokenType: 'SPL', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', tokenType: 'SPL', gasFee: 0, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] }
]

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
