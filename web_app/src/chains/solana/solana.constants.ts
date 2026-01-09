import { type StaticImageData } from 'next/image';
import SOLImg from '@/assets/tokens/sol.svg';
import BIT10Img from '@/assets/tokens/bit10.svg';

export const ICP_HOST = 'https://icp-api.io';
export const BIT10_EXCHANGE_CANISTER_ID = '6phs7-6yaaa-aaaap-qpvoq-cai';
export const BIT10_REWARDS_CANISTER_ID = ' 5fll2-liaaa-aaaap-qqlwa-cai';

export const buyPayTokens = [
    { label: 'SOL', value: 'Solana', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111111', tokenType: 'SPL', gasFee: 0.0001, slug: ['sol', 'solana'] }
]

export const buyReceiveTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', tokenType: 'SPL', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1', tokenType: 'SPL', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'SOL', value: 'Solana', img: SOLImg as StaticImageData, address: 'So11111111111111111111111111111111111111111', tokenType: 'SPL', gasFee: 0.0001, slug: ['sol', 'solana'] }
]
